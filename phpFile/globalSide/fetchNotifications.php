<?php
// fetchNotifications.php
// Returns notifications for the logged-in user (for bell dropdown)
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}
$user_email = $_SESSION['userEmail'];
$sql = "SELECT id, type, ref_id, message, created_at, is_read FROM notifications WHERE user_email = ? AND is_read = 0 ORDER BY created_at DESC LIMIT 30";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $user_email);
$stmt->execute();
$result = $stmt->get_result();
$notifications = [];
while ($row = $result->fetch_assoc()) {
    // If this is a comment notification, decode the message JSON
    if ($row['type'] === 'comment') {
        $msgData = json_decode($row['message'], true);
        if (is_array($msgData)) {
            $row['commenter_name'] = $msgData['commenter_name'] ?? null;
            $row['commenter_img'] = $msgData['commenter_img'] ?? null;
            $row['message'] = $msgData['message'] ?? $row['message'];
            $row['comment_id'] = $msgData['comment_id'] ?? null; // Expose comment_id for frontend
        }
    }
    // If this is a like notification, decode the message JSON
    if ($row['type'] === 'like') {
        $msgData = json_decode($row['message'], true);
        if (is_array($msgData)) {
            $row['liker_name'] = $msgData['liker_name'] ?? null;
            $row['liker_img'] = $msgData['liker_img'] ?? null;
            $row['message'] = $msgData['message'] ?? $row['message'];
        }
    }
    $notifications[] = $row;
}
$stmt->close();
echo json_encode(['status' => 'success', 'notifications' => $notifications]);
