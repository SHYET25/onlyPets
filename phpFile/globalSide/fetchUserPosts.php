<?php
session_start();
include '../connection/connection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

$userEmail = $_SESSION['userEmail'];

$sql = "SELECT post_id, poster_email, post_caption, post_tagged, post_images, tagged_pets, post_scope, date_posted 
        FROM post 
        WHERE poster_email = ? 
        ORDER BY date_posted DESC";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $userEmail);
$stmt->execute();
$result = $stmt->get_result();

$posts = [];
while ($row = $result->fetch_assoc()) {
    $posts[] = $row;
}

echo json_encode(['status' => 'success', 'posts' => $posts]);
?>
