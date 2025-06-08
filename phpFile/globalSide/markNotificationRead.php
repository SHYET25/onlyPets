<?php
// markNotificationRead.php
// Sets is_read = 1 for a notification by id
session_start();
header('Content-Type: application/json');
require_once '../connection/connection.php';

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$notification_id = isset($_POST['notification_id']) ? intval($_POST['notification_id']) : 0;
if ($notification_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid notification id.']);
    exit;
}

// Only allow updating notifications belonging to the logged-in user
$user_email = $_SESSION['userEmail'];
$stmt = $conn->prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_email = ?');
$stmt->bind_param('is', $notification_id, $user_email);
$stmt->execute();
$stmt->close();

if ($conn->affected_rows > 0) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Notification not found or already read.']);
}
$conn->close();
