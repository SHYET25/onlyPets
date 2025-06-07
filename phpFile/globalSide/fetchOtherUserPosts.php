<?php
// filepath: c:/xampp/htdocs/pullHCI2/phpFile/globalSide/fetchOtherUserPosts.php
session_start();
include '../connection/connection.php';
header('Content-Type: application/json');

// Get the email from the query param (?email=...)
$email = isset($_GET['email']) ? $_GET['email'] : null;

if (!$email) {
    echo json_encode(['status' => 'error', 'message' => 'Missing user email.']);
    exit;
}

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
$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

$posts = [];
while ($row = $result->fetch_assoc()) {
    $posts[] = $row;
}

echo json_encode(['status' => 'success', 'posts' => $posts]);
