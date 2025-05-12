<?php
session_start();
date_default_timezone_set('Asia/Manila');
include '../connection/connection.php';
header('Content-Type: application/json');

$userEmail = $_SESSION['userEmail'] ?? $_SESSION['vetEmail'] ?? null;
$otpInput = $_POST['otp'] ?? '';

if (!$userEmail || !$otpInput) {
    echo json_encode(["status" => "error", "message" => "Session expired or missing OTP."]);
    exit;
}

$role = null;
$data = null;

// Check in 'user' table first
$stmt = $conn->prepare("SELECT otp_code, otp_created_at FROM user WHERE user_email = ?");
$stmt->bind_param("s", $userEmail);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $data = $result->fetch_assoc();
    $role = 'user';
} else {
    // Check in 'veterinarian' table
    $stmt = $conn->prepare("SELECT otp_code, otp_created_at FROM veterinarian WHERE vet_email = ?");
    $stmt->bind_param("s", $userEmail);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $data = $result->fetch_assoc();
        $role = 'veterinarian';
    } else {
        echo json_encode(["status" => "error", "message" => "Email not found."]);
        exit;
    }
}

// Validate OTP
$dbOtp = $data['otp_code'];
$createdAt = strtotime($data['otp_created_at']);
$now = time();

if ($otpInput == $dbOtp && ($now - $createdAt) <= 600) { // 10-minute window
    if ($role === 'user') {
        $update = $conn->prepare("UPDATE user SET otp_code = NULL, otp_created_at = NULL, status = 1 WHERE user_email = ?");
    } else {
        $update = $conn->prepare("UPDATE veterinarian SET otp_code = NULL, otp_created_at = NULL, status = 1 WHERE vet_email = ?");
    }

    $update->bind_param("s", $userEmail);
    $update->execute();

    echo json_encode([
        "status" => "success",
        "message" => ucfirst($role) . " email verified successfully.",
        "role" => $role
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid or expired OTP."]);
}
?>
