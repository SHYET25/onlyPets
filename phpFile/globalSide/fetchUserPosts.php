<?php 
session_start();
include '../connection/connection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

$userEmail = $_SESSION['userEmail'];

$sql = "
    SELECT 
        post.post_id,
        post.poster_email,
        post.post_caption,
        post.post_tagged,
        post.post_images,
        post.tagged_pets,
        post.post_scope,
        post.date_posted,
        user.user_fname,
        user.user_lname,
        user.user_img
    FROM post 
    JOIN user ON post.poster_email = user.user_email
    WHERE post.poster_email = ?
    ORDER BY post.date_posted DESC
";

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
