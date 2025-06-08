<?php
include '../connection/connection.php';
session_start();

$user_id = $_SESSION['user_id'] ?? null; // The reporter
$reported_user_id = $_POST['reported_user_id'] ?? null;
$reason = $_POST['reason'] ?? null;

if (!$user_id || !$reported_user_id || !$reason) {
    echo json_encode(['status' => 'error', 'message' => 'Missing data']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO reports (id, reported_user_id, reason, date, status, type) VALUES (NULL, ?, ?, NOW(), 'pending', 'account')");
$stmt->bind_param("is", $reported_user_id, $reason);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'DB error']);
}
?>