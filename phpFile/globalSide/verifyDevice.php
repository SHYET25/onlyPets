<?php
session_start();
date_default_timezone_set('Asia/Manila');
include '../connection/connection.php';
header('Content-Type: application/json');

$userEmail = $_SESSION['userEmail'] ?? null;
$device = $_SESSION['pendingDevice'] ?? null;
$otpInput = $_POST['otp'] ?? '';

if (!$userEmail || !$device) {
    echo json_encode(["status" => "error", "message" => "Session expired or invalid."]);
    exit;
}

$role = null;
$data = null;

// Check user table
$stmt = $conn->prepare("SELECT otp_code, otp_created_at FROM user WHERE user_email = ?");
$stmt->bind_param("s", $userEmail);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $data = $result->fetch_assoc();
    $role = 'user';
} else {
    // Check vet table
    $stmt = $conn->prepare("SELECT otp_code, otp_created_at FROM veterinarian WHERE vet_email = ?");
    $stmt->bind_param("s", $userEmail);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $data = $result->fetch_assoc();
        $role = 'veterinarian';
    } else {
        echo json_encode(["status" => "error", "message" => "User not found."]);
        exit;
    }
}

// Check OTP validity
$dbOtp = $data['otp_code'];
$createdAt = strtotime($data['otp_created_at']);
$now = time();

if ($otpInput == $dbOtp && ($now - $createdAt) <= 300) {
    $cutoffDate = date('Y-m-d H:i:s', strtotime('-5 days'));

    // Delete old logins from BOTH tables regardless of who is logging in
    $delUserStmt = $conn->prepare("DELETE FROM user_login_logs WHERE user_email = ? AND login_device = ? AND login_time < ?");
    $delUserStmt->bind_param("sss", $userEmail, $device, $cutoffDate);
    $delUserStmt->execute();
    $delUserStmt->close();

    $delVetStmt = $conn->prepare("DELETE FROM veterinarian_login_logs WHERE vet_email = ? AND login_device = ? AND login_time < ?");
    $delVetStmt->bind_param("sss", $userEmail, $device, $cutoffDate);
    $delVetStmt->execute();
    $delVetStmt->close();

    // Insert new login
    if ($role === 'user') {
        $logStmt = $conn->prepare("INSERT INTO user_login_logs (user_email, login_device, login_time) VALUES (?, ?, NOW())");
    } else {
        $logStmt = $conn->prepare("INSERT INTO veterinarian_login_logs (vet_email, login_device, login_time) VALUES (?, ?, NOW())");
    }

    $logStmt->bind_param("ss", $userEmail, $device);
    $logStmt->execute();
    $logStmt->close();

    
    echo json_encode([
        "status" => "success",
        "message" => "Device verified and registered.",
        "role" => $role
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Invalid or expired OTP."]);
}
