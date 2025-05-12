<?php
session_start();
date_default_timezone_set('Asia/Manila'); // ✅ Ensures correct time is used

include '../connection/connection.php';
include '../globalSide/otpSender.php';

// use PHPMailer\PHPMailer\PHPMailer;
// use PHPMailer\PHPMailer\Exception;

// require '../../vendor/autoload.php';

header('Content-Type: application/json');

$userFname = $_POST['userFname'];
$userLname = $_POST['userLname'];
$userEmail = $_POST['userEmail'];
$userContact = $_POST['userContact'];
$userPass = $_POST['userPass'];
$userImg = 'default.png';

$hashedPass = password_hash($userPass, PASSWORD_DEFAULT);
$otp = rand(100000, 999999);
$otpCreatedAt = date('Y-m-d H:i:s'); // ✅ This now uses correct timezone


// Store email in session
$_SESSION['userEmail'] = $userEmail;

$stmt = $conn->prepare("INSERT INTO user (user_fname, user_lname, user_email, user_pass, user_contact, user_img, status, otp_code, otp_created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)");
$stmt->bind_param("ssssssis", $userFname, $userLname, $userEmail, $hashedPass, $userContact, $userImg, $otp, $otpCreatedAt);

$response = [];

if ($stmt->execute()) {
    if (otpSender($userEmail, $otp, $userFname, $userLname)) {
        $response = ["status" => "success", "message" => "Account created. OTP sent."];
    } else {
        $response = ["status" => "error", "message" => "OTP failed to send."];
    }
} else {
    $response = ["status" => "error", "message" => "DB error: " . $stmt->error];
}

$stmt->close();
$conn->close();

echo json_encode($response);
?>
