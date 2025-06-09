<?php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$user_email = $_SESSION['userEmail'];
$vet_id = intval($_POST['vet_id'] ?? 0);
$action = $_POST['action'] ?? 'follow'; // 'follow' or 'unfollow'

if (!$vet_id) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid vet.']);
    exit;
}

if ($action === 'follow') {
    $stmt = $conn->prepare("INSERT IGNORE INTO vet_followers (user_email, vet_id) VALUES (?, ?)");
    $stmt->bind_param("si", $user_email, $vet_id);
    $stmt->execute();
    $stmt->close();
    echo json_encode(['status' => 'success', 'message' => 'Followed vet.']);
} else if ($action === 'unfollow') {
    $stmt = $conn->prepare("DELETE FROM vet_followers WHERE user_email = ? AND vet_id = ?");
    $stmt->bind_param("si", $user_email, $vet_id);
    $stmt->execute();
    $stmt->close();
    echo json_encode(['status' => 'success', 'message' => 'Unfollowed vet.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
}
$conn->close();
?>