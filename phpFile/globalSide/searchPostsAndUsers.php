<?php
// searchPostsAndUsers.php
// Search posts by caption and users by fname/lname
header('Content-Type: application/json');
require_once '../connection/connection.php';

$query = isset($_POST['query']) ? trim($_POST['query']) : '';
if ($query === '') {
    echo json_encode(['posts' => [], 'users' => []]);
    exit;
}

// Search posts by caption
$posts = [];
$stmt = $conn->prepare("SELECT p.*, u.user_fname, u.user_lname, u.user_img FROM post p JOIN user u ON p.poster_email = u.user_email WHERE p.post_caption LIKE ? ORDER BY p.date_posted DESC LIMIT 20");
$like = "%$query%";
$stmt->bind_param('s', $like);
$stmt->execute();
$res = $stmt->get_result();
while ($row = $res->fetch_assoc()) {
    $posts[] = $row;
}
$stmt->close();

// Search users by fname or lname
$users = [];
$stmt = $conn->prepare("SELECT user_fname, user_lname, user_email, user_img FROM user WHERE user_fname LIKE ? OR user_lname LIKE ? LIMIT 20");
$stmt->bind_param('ss', $like, $like);
$stmt->execute();
$res = $stmt->get_result();
while ($row = $res->fetch_assoc()) {
    $users[] = $row;
}
$stmt->close();

echo json_encode(['posts' => $posts, 'users' => $users]);
$conn->close();
