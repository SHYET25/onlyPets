<?php
session_start();
date_default_timezone_set('Asia/Manila');
include '../connection/connection.php';
header('Content-Type: application/json');

$userEmail = $_SESSION['userEmail'] ?? null;
$device = $_SESSION['pendingDevice'] ?? null;

if (!$userEmail || !$device) {
    echo json_encode(["status" => "error", "message" => "Session or device not set."]);
    exit;
}

$cutoffDate = date('Y-m-d H:i:s', strtotime('-5 days'));

$isVet = false;

// Check if user exists in user table
$stmt = $conn->prepare("SELECT 1 FROM user WHERE user_email = ?");
$stmt->bind_param("s", $userEmail);
$stmt->execute();
$result = $stmt->get_result();
$isVet = ($result->num_rows === 0);
$stmt->close();

if ($isVet) {
    $checkStmt = $conn->prepare("SELECT login_time FROM veterinarian_login_logs WHERE vet_email = ? AND login_device = ? ORDER BY login_time DESC LIMIT 1");
} else {
    $checkStmt = $conn->prepare("SELECT login_time FROM user_login_logs WHERE user_email = ? AND login_device = ? ORDER BY login_time DESC LIMIT 1");
}

$checkStmt->bind_param("ss", $userEmail, $device);
$checkStmt->execute();
$log = $checkStmt->get_result()->fetch_assoc();
$checkStmt->close();

if (!$log) {
    echo json_encode(["status" => "error", "message" => "No login record found."]);
    exit;
}

$lastLogin = strtotime($log['login_time']);
if ($lastLogin < strtotime('-5 days')) {
    // Delete old record
    if ($isVet) {
        $delStmt = $conn->prepare("DELETE FROM veterinarian_login_logs WHERE vet_email = ? AND login_device = ?");
    } else {
        $delStmt = $conn->prepare("DELETE FROM user_login_logs WHERE user_email = ? AND login_device = ?");
    }
    $delStmt->bind_param("ss", $userEmail, $device);
    $delStmt->execute();
    $delStmt->close();

    echo json_encode(["status" => "expired", "message" => "Login expired."]);
    exit;
}

echo json_encode(["status" => "valid", "message" => "Login is still valid."]);
