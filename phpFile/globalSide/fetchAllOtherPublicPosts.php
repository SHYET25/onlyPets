<?php
// filepath: phpFile/globalSide/fetchAllOtherPublicPosts.php
session_start();
include '../connection/connection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$session_email = $_SESSION['userEmail'];

$sql = "SELECT post_id, poster_email, post_caption, post_tagged, post_images, tagged_pets, post_scope, post_likes, date_posted FROM post WHERE post_scope = 'public' AND poster_email != ? ORDER BY date_posted DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $session_email);
$stmt->execute();
$result = $stmt->get_result();
$posts = [];
while ($row = $result->fetch_assoc()) {
    $posts[] = $row;
}
$stmt->close();

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

echo json_encode(['status' => 'success', 'posts' => $posts, 'friends' => $friends]);
?>
