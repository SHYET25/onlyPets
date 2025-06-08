<?php

include '../connection/connection.php';
session_start();

$email = $_SESSION['userEmail'] ?? null;
$role = $_SESSION['role'] ?? null;

if (!$email || !$role) {
    echo json_encode([]);
    exit;
}

// Get user_id from DB if not set in session
if ($role === 'user') {
    $stmt = $conn->prepare("SELECT user_id FROM user WHERE user_email = ?");
} elseif ($role === 'veterinarian') {
    $stmt = $conn->prepare("SELECT vet_id AS user_id FROM veterinarian WHERE vet_email = ?");
} else {
    echo json_encode([]);
    exit;
}
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result();
if ($row = $res->fetch_assoc()) {
    $currentUser = $row['user_id'];
} else {
    echo json_encode([]);
    exit;
}

$otherUser = intval($_GET['user_id'] ?? 0);

$sql = "
SELECT 
    m.*,
    u.user_fname,
    u.user_lname,
    u.user_img
FROM messages m
JOIN user u ON u.user_id = m.sender_id
WHERE (m.sender_id = ? AND m.receiver_id = ?)
   OR (m.sender_id = ? AND m.receiver_id = ?)
ORDER BY m.sent_at ASC
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iiii", $currentUser, $otherUser, $otherUser, $currentUser);
$stmt->execute();
$result = $stmt->get_result();

$messages = [];
while ($row = $result->fetch_assoc()) {
    $messages[] = $row;
}
header('Content-Type: application/json');
echo json_encode($messages);
exit;