<?php
// fetchFriendsPosts.php
session_start();
include '../connection/connection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

// Get friend emails from POST (JSON array)
$friend_emails = isset($_POST['emails']) ? json_decode($_POST['emails'], true) : [];
if (!is_array($friend_emails) || empty($friend_emails)) {
    echo json_encode(['status' => 'error', 'message' => 'No friend emails provided.']);
    exit;
}

$placeholders = implode(',', array_fill(0, count($friend_emails), '?'));
$types = str_repeat('s', count($friend_emails));

// Fetch posts
$sql = "SELECT post_id, poster_email, post_caption, post_tagged, post_images, tagged_pets, post_scope, post_likes, date_posted FROM post WHERE poster_email IN ($placeholders) ORDER BY date_posted DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$friend_emails);
$stmt->execute();
$result = $stmt->get_result();
$posts = [];
while ($row = $result->fetch_assoc()) {
    $posts[] = $row;
}
$stmt->close();

// Fetch friend details from user table
$sql2 = "SELECT user_fname, user_lname, user_email, user_pass, user_contact, user_country, user_province, user_city, user_baranggay, user_img, status, otp_code, otp_created_at FROM user WHERE user_email IN ($placeholders)";
$stmt2 = $conn->prepare($sql2);
$stmt2->bind_param($types, ...$friend_emails);
$stmt2->execute();
$result2 = $stmt2->get_result();
$friends = [];
while ($row = $result2->fetch_assoc()) {
    $friends[] = $row;
}
$stmt2->close();

// Fetch comment counts for all posts in one query
$postIds = array_column($posts, 'post_id');
$commentCounts = [];
if (count($postIds) > 0) {
    $placeholders = implode(',', array_fill(0, count($postIds), '?'));
    $types = str_repeat('i', count($postIds));
    $sql = "SELECT post_id, COUNT(*) AS comment_count FROM comments WHERE post_id IN ($placeholders) GROUP BY post_id";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$postIds);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $commentCounts[$row['post_id']] = (int)$row['comment_count'];
    }
    $stmt->close();
}
// Attach comment_count to each post
foreach ($posts as &$post) {
    $pid = $post['post_id'];
    $post['comment_count'] = isset($commentCounts[$pid]) ? $commentCounts[$pid] : 0;
}

echo json_encode(['status' => 'success', 'posts' => $posts, 'friends' => $friends]);
