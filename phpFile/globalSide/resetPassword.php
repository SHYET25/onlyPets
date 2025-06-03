<?php
session_start();
date_default_timezone_set('Asia/Manila');

include '../connection/connection.php';

header('Content-Type: application/json');

$email = $_POST['email'] ?? '';
$token = $_POST['token'] ?? '';
$newPassword = $_POST['newPassword'] ?? '';

$response = [];

// Validate inputs
if (!filter_var($email, FILTER_VALIDATE_EMAIL) || empty($token) || empty($newPassword)) {
    echo json_encode(["status" => "error", "message" => "Invalid input."]);
    exit;
}

// Hash new password
$hashedPass = password_hash($newPassword, PASSWORD_DEFAULT);

// Step 1: Check if token and email match
$stmt = $conn->prepare("SELECT id FROM password_resets WHERE email = ? AND token = ? AND created_at >= NOW() - INTERVAL 15 MINUTE");
$stmt->bind_param("ss", $email, $token);
$stmt->execute();
$stmt->store_result();

if ($stmt->num_rows === 0) {
    $response = ["status" => "error", "message" => "Invalid or expired token."];
    $stmt->close();
    echo json_encode($response);
    exit;
}
$stmt->close();

// Step 2: Update the password
$updateStmt = $conn->prepare("UPDATE user SET user_pass = ? WHERE user_email = ?");
$updateStmt->bind_param("ss", $hashedPass, $email);

if ($updateStmt->execute()) {
    // Step 3: Invalidate the token
    $deleteStmt = $conn->prepare("DELETE FROM password_resets WHERE email = ?");
    $deleteStmt->bind_param("s", $email);
    $deleteStmt->execute();
    $deleteStmt->close();

    $response = ["status" => "success", "message" => "Password reset successfully."];
} else {
    $response = ["status" => "error", "message" => "Failed to update password."];
}

$updateStmt->close();
$conn->close();

echo json_encode($response);
?>
