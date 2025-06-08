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

$sql = "
SELECT 
    u.user_id AS id,
    CONCAT(u.user_fname, ' ', u.user_lname) AS name,
    u.user_img AS profile_img,
    m.message AS last_message,
    DATE_FORMAT(m.sent_at, '%h:%i %p') AS sent_at,
    (
        SELECT COUNT(*) FROM messages 
        WHERE sender_id = u.user_id 
          AND receiver_id = ? 
          AND is_read = 0
    ) AS unread_count
FROM messages m
JOIN (
    SELECT 
        LEAST(sender_id, receiver_id) AS user1,
        GREATEST(sender_id, receiver_id) AS user2,
        MAX(id) AS max_id
    FROM messages
    WHERE sender_id = ? OR receiver_id = ?
    GROUP BY user1, user2
) lm ON (
    LEAST(m.sender_id, m.receiver_id) = lm.user1
    AND GREATEST(m.sender_id, m.receiver_id) = lm.user2
    AND m.id = lm.max_id
)
JOIN user u ON u.user_id = IF(m.sender_id = ?, m.receiver_id, m.sender_id)
WHERE u.user_id != ?
ORDER BY m.sent_at DESC
";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iiiii", $currentUser, $currentUser, $currentUser, $currentUser, $currentUser);
$stmt->execute();
$result = $stmt->get_result();

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}
header('Content-Type: application/json');
echo json_encode($users);
exit;
?>