<?php

include '../connection/connection.php';
session_start();

$email = $_SESSION['userEmail'] ?? null;
$role = $_SESSION['role'] ?? null;

if (!$email || !$role) exit;

// Get current user ID
if ($role === 'user') {
    $stmt = $conn->prepare("SELECT user_id FROM user WHERE user_email = ?");
} elseif ($role === 'veterinarian') {
    $stmt = $conn->prepare("SELECT vet_id AS user_id FROM veterinarian WHERE vet_email = ?");
} else {
    exit;
}
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result();
if ($row = $res->fetch_assoc()) {
    $currentUser = $row['user_id'];
} else {
    exit;
}

$otherUserId = intval($_POST['other_user_id'] ?? 0);

$stmt = $conn->prepare("UPDATE messages SET is_read = 1 WHERE sender_id = ? AND receiver_id = ? AND is_read = 0");
$stmt->bind_param("ii", $otherUserId, $currentUser);
$stmt->execute();

echo json_encode(['status' => 'success']);
exit;
?>