<?php
// filepath: phpFile/globalSide/fetchAllOtherNonFriendPublicPosts.php
session_start();
include '../connection/connection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$user_email = $_SESSION['userEmail'];

// Get friend_list from user_friends
$stmt = $conn->prepare("SELECT friend_list FROM user_friends WHERE user_email = ?");
$stmt->bind_param('s', $user_email);
$stmt->execute();
$stmt->bind_result($friend_json);
$stmt->fetch();
$stmt->close();

$friend_emails = $friend_json ? json_decode($friend_json, true) : [];

// Build exclusion list: self + friends
$exclude_emails = $friend_emails;
$exclude_emails[] = $user_email;

if (count($exclude_emails) > 0) {
    $placeholders = implode(',', array_fill(0, count($exclude_emails), '?'));
    $types = str_repeat('s', count($exclude_emails));
    $sql = "SELECT post_id, poster_email, post_caption, post_tagged, post_images, tagged_pets, post_scope, post_likes, date_posted FROM post WHERE post_scope = 'public' AND poster_email NOT IN ($placeholders) ORDER BY date_posted DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$exclude_emails);
    $stmt->execute();
    $result = $stmt->get_result();
    $posts = [];
    while ($row = $result->fetch_assoc()) {
        $posts[] = $row;
    }
    $stmt->close();
} else {
    // If no friends, just exclude self
    $sql = "SELECT post_id, poster_email, post_caption, post_tagged, post_images, tagged_pets, post_scope, post_likes, date_posted FROM post WHERE post_scope = 'public' AND poster_email != ? ORDER BY date_posted DESC";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param('s', $user_email);
    $stmt->execute();
    $result = $stmt->get_result();
    $posts = [];
    while ($row = $result->fetch_assoc()) {
        $posts[] = $row;
    }
    $stmt->close();
}

// Optionally fetch user info for each poster
$userEmails = array_unique(array_column($posts, 'poster_email'));
$friends = [];
if (count($userEmails) > 0) {
    $placeholders = implode(',', array_fill(0, count($userEmails), '?'));
    $types = str_repeat('s', count($userEmails));
    $sql2 = "SELECT user_fname, user_lname, user_email, user_img FROM user WHERE user_email IN ($placeholders)";
    $stmt2 = $conn->prepare($sql2);
    $stmt2->bind_param($types, ...$userEmails);
    $stmt2->execute();
    $result2 = $stmt2->get_result();
    while ($row = $result2->fetch_assoc()) {
        $friends[] = $row;
    }
    $stmt2->close();
}

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
?>
