<?php
session_start();
date_default_timezone_set('Asia/Manila');

include '../connection/connection.php';
include '../globalSide/otpSender.php';

header('Content-Type: application/json');

$userFname = $_POST['userFname'];
$userLname = $_POST['userLname'];
$userEmail = $_POST['userEmail'];
$userContact = $_POST['userContact'];
$userPass = $_POST['userPass'];
$userImg = 'default.png';

$hashedPass = password_hash($userPass, PASSWORD_DEFAULT);
$otp = rand(100000, 999999);
$otpCreatedAt = date('Y-m-d H:i:s');

$_SESSION['userEmail'] = $userEmail;

$response = [];

// Send OTP first
if (otpSender($userEmail, $otp, $userFname, $userLname)) {
    // If OTP sent successfully, then insert into DB
    $stmt = $conn->prepare("INSERT INTO user (user_fname, user_lname, user_email, user_pass, user_contact, user_img, status, otp_code, otp_created_at) VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?)");
    $stmt->bind_param("ssssssis", $userFname, $userLname, $userEmail, $hashedPass, $userContact, $userImg, $otp, $otpCreatedAt);

    if ($stmt->execute()) {
        $response = ["status" => "success", "message" => "Account created. OTP sent."];
    } else {
        $response = ["status" => "error", "message" => "DB error: " . $stmt->error];
    }
    $stmt->close();
} else {
    // If OTP failed to send, do NOT insert into DB
    $response = ["status" => "error", "message" => "OTP failed to send. Registration aborted."];
}

$conn->close();
echo json_encode($response);
?>
