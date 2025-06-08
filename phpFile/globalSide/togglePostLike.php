<?php
// togglePostLike.php
header('Content-Type: application/json');
require_once __DIR__ . '/../connection/connection.php';
session_start();

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

$user_email = $_SESSION['userEmail'];
$post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
if ($post_id <= 0) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid post id']);
    exit;
}

// Fetch current likes
$stmt = $conn->prepare('SELECT post_likes FROM post WHERE post_id = ?');
$stmt->bind_param('i', $post_id);
$stmt->execute();
$stmt->bind_result($post_likes_json);
if (!$stmt->fetch()) {
    echo json_encode(['status' => 'error', 'message' => 'Post not found']);
    exit;
}
$stmt->close();

$likes = [];
if ($post_likes_json) {
    $likes = json_decode($post_likes_json, true);
    if (!is_array($likes)) $likes = [];
}

$liked = false;
$key = array_search($user_email, $likes);
if ($key !== false) {
    // Unlike
    unset($likes[$key]);
    $liked = false;
} else {
    // Like
    $likes[] = $user_email;
    $liked = true;
}
// Reindex array
$likes = array_values($likes);
$new_likes_json = json_encode($likes);

// Update DB
$update = $conn->prepare('UPDATE post SET post_likes = ? WHERE post_id = ?');
$update->bind_param('si', $new_likes_json, $post_id);
$update->execute();
$update->close();

// Return new like count
echo json_encode([
    'status' => 'success',
    'liked' => $liked,
    'like_count' => count($likes)
]);
