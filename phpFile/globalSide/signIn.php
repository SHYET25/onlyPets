<?php
session_start();
date_default_timezone_set('Asia/Manila');
include '../connection/connection.php';
include 'otpSender.php';

header('Content-Type: application/json');

$userEmail = $_POST['userEmail'];
$userPass = $_POST['userPass'];
$recaptchaResponse = $_POST['recaptcha'] ?? '';
$loginDevice = $_POST['loginDevice'] ?? '';

$response = [];

// Step 1: reCAPTCHA Verification
$recaptchaSecret = '6LcC0DErAAAAABgkVWGeA5TkmXTvqxbacSb-avdf'; // Replace with your real secret key
$verifyResponse = file_get_contents("https://www.google.com/recaptcha/api/siteverify?secret={$recaptchaSecret}&response={$recaptchaResponse}");
$responseData = json_decode($verifyResponse);

if (!$responseData->success) {
    echo json_encode(["status" => "error", "message" => "reCAPTCHA verification failed."]);
    exit;
}

// Step 2: Check user table
$stmt = $conn->prepare("SELECT * FROM user WHERE user_email = ?");
$stmt->bind_param("s", $userEmail);
$stmt->execute();
$result = $stmt->get_result();

$role = '';
$user = null;

if ($result->num_rows === 1) {
    $user = $result->fetch_assoc();
    $role = 'user';
} else {
    // Step 3: Check veterinarian table
    $stmt = $conn->prepare("SELECT * FROM veterinarian WHERE vet_email = ?");
    $stmt->bind_param("s", $userEmail);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $user = $result->fetch_assoc();
        $role = 'veterinarian';
    } else {
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit;
    }
}

// Step 4: Verify Password
$passwordMatch = password_verify($userPass, $user[$role === 'user' ? 'user_pass' : 'vet_pass']);

if (!$passwordMatch) {
    echo json_encode(["status" => "error", "message" => "Incorrect password."]);
    exit;
}

// Step 5: Check if account is verified
if ($user['status'] != 1) {
    // OTP generation and sending
    $otp = rand(100000, 999999);
    $otpCreatedAt = date('Y-m-d H:i:s');

    $update = $conn->prepare(
        $role === 'user' ? 
        "UPDATE user SET otp_code = ?, otp_created_at = ? WHERE user_email = ?" :
        "UPDATE veterinarian SET otp_code = ?, otp_created_at = ? WHERE vet_email = ?"
    );
    $update->bind_param("iss", $otp, $otpCreatedAt, $userEmail);
    $update->execute();

    $fname = $user[$role === 'user' ? 'user_fname' : 'vet_fname'];
    $lname = $user[$role === 'user' ? 'user_lname' : 'vet_lname'];

    if (otpSender($userEmail, $otp, $fname, $lname)) {
        // Store user session and device in session
        $_SESSION['userEmail'] = $userEmail;
        $_SESSION['role'] = $role;
        $_SESSION['pendingDevice'] = $loginDevice; // Store device info in session

        echo json_encode([
            "status" => "unverified",
            "message" => "Account not verified. OTP sent to $userEmail."
        ]);
        exit;
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to send OTP."]);
        exit;
    }
}

// Step 6: Check if the device is already verified
$logQuery = $role === 'user' ? 
    "SELECT * FROM user_login_logs WHERE user_email = ? AND login_device = ?" :
    "SELECT * FROM veterinarian_login_logs WHERE vet_email = ? AND login_device = ?";

$checkDevice = $conn->prepare($logQuery);
$checkDevice->bind_param("ss", $userEmail, $loginDevice);
$checkDevice->execute();
$deviceResult = $checkDevice->get_result();

if ($deviceResult->num_rows === 0) {
    // Device not found in logs, send OTP for device verification
    $otp = rand(100000, 999999);
    $otpCreatedAt = date('Y-m-d H:i:s');

    // Update OTP in the database for verification
    $update = $conn->prepare(
        $role === 'user' ?
        "UPDATE user SET otp_code = ?, otp_created_at = ? WHERE user_email = ?" :
        "UPDATE veterinarian SET otp_code = ?, otp_created_at = ? WHERE vet_email = ?"
    );
    $update->bind_param("iss", $otp, $otpCreatedAt, $userEmail);
    $update->execute();

    $fname = $user[$role === 'user' ? 'user_fname' : 'vet_fname'];
    $lname = $user[$role === 'user' ? 'user_lname' : 'vet_lname'];

    if (otpSender($userEmail, $otp, $fname, $lname)) {
        // Store device info in session
        $_SESSION['userEmail'] = $userEmail;
        $_SESSION['role'] = $role;
        $_SESSION['pendingDevice'] = $loginDevice; // Set device info in session

        echo json_encode([
            "status" => "device_unverified",
            "message" => "This device is not yet verified. OTP sent to $userEmail."
        ]);
        exit;
    } else {
        echo json_encode(["status" => "error", "message" => "Failed to send OTP."]);
        exit;
    }
}

// Step 7: Successful login and device already verified
$_SESSION['userEmail'] = $userEmail;
$_SESSION['role'] = $role;
$_SESSION['pendingDevice'] = $loginDevice; // Clear pending device once device is verified

$response = ["status" => "success", "role" => $role];
echo json_encode($response);
?>
