<?php
// togglePostLike.php
date_default_timezone_set('Asia/Manila');
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

// Log like/unlike activity in session_activity_logs (direct DB insert)
$activity = $liked ? 'post_like' : 'post_unlike';
$activity_description = $liked ? 'Liked a post' : 'Unliked a post';
$created_at = date('Y-m-d H:i:s');
$activity_type = 'like';
$act_id = 0;
$stmt = $conn->prepare("INSERT INTO session_activity_logs (user_email, activity_type, activity, activity_description, act_id, post_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param('sssssis', $user_email, $activity_type, $activity, $activity_description, $act_id, $post_id, $created_at);
$stmt->execute();
$stmt->close();

// Send notification if liked and not liking own post
if ($liked) {
    // Get post owner (correct column: poster_email)
    $stmt = $conn->prepare('SELECT poster_email FROM post WHERE post_id = ?');
    $stmt->bind_param('i', $post_id);
    $stmt->execute();
    $stmt->bind_result($post_owner_email);
    $stmt->fetch();
    $stmt->close();
    if ($post_owner_email && $post_owner_email !== $user_email) {
        // Get liker name and image
        $stmt = $conn->prepare('SELECT user_fname, user_lname, user_img FROM user WHERE user_email = ?');
        $stmt->bind_param('s', $user_email);
        $stmt->execute();
        $stmt->bind_result($liker_fname, $liker_lname, $liker_img);
        $stmt->fetch();
        $stmt->close();
        $liker_name = trim($liker_fname . ' ' . $liker_lname);
        $messageArr = [
            'liker_name' => $liker_name,
            'liker_img' => $liker_img,
            'message' => 'liked your post.'
        ];
        $messageJson = json_encode($messageArr);
        $now = date('Y-m-d H:i:s');
        // Insert notification for post owner
        $stmt = $conn->prepare('INSERT INTO notifications (user_email, type, message, ref_id, created_at) VALUES (?, "like", ?, ?, ?)');
        $stmt->bind_param('ssis', $post_owner_email, $messageJson, $post_id, $now);
        $stmt->execute();
        $stmt->close();
    }
}

// Return new like count
echo json_encode([
    'status' => 'success',
    'liked' => $liked,
    'like_count' => count($likes)
]);
