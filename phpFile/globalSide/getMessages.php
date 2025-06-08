<?php
session_start();
include '../connection/connection.php';

$currentUser = $_SESSION['userId'];
$otherUser = intval($_GET['user_id']);

$sql = "SELECT * FROM messages
        WHERE (sender_id = ? AND receiver_id = ?)
           OR (sender_id = ? AND receiver_id = ?)
        ORDER BY sent_at ASC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iiii", $currentUser, $otherUser, $otherUser, $currentUser);
$stmt->execute();
$result = $stmt->get_result();

$messages = [];
while ($row = $result->fetch_assoc()) {
    $messages[] = $row;
}
echo json_encode($messages);
?>