<?php
// phpFile/globalSide/fetchPostById.php
// Fetch a post (with user and pet info) by post_id for notification modal
session_start();
require_once '../connection/connection.php';
header('Content-Type: application/json');

$post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
if (!$post_id) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid post id']);
    exit;
}

// Fetch post and user info
$sql = "SELECT p.*, u.user_fname, u.user_lname, u.user_img, u.user_email FROM post p LEFT JOIN user u ON p.poster_email = u.user_email WHERE p.post_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $post_id);
$stmt->execute();
$res = $stmt->get_result();
if (!$row = $res->fetch_assoc()) {
    echo json_encode(['status' => 'error', 'message' => 'Post not found']);
    exit;
}
$post = $row;
$user = [
    'user_fname' => $row['user_fname'],
    'user_lname' => $row['user_lname'],
    'user_img' => $row['user_img'],
    'user_email' => $row['user_email']
];

// Fetch pet info for tagged pets (if any)
$petMap = [];
if (!empty($post['tagged_pets'])) {
    $petIds = json_decode($post['tagged_pets'], true);
    if (is_array($petIds) && count($petIds) > 0) {
        $in = implode(',', array_fill(0, count($petIds), '?'));
        $types = str_repeat('i', count($petIds));
        $sql2 = "SELECT * FROM pet_info WHERE pet_id IN ($in)";
        $stmt2 = $conn->prepare($sql2);
        $stmt2->bind_param($types, ...$petIds);
        $stmt2->execute();
        $res2 = $stmt2->get_result();
        while ($pet = $res2->fetch_assoc()) {
            $petMap[$pet['pet_id']] = $pet;
        }
        $stmt2->close();
    }
}
$stmt->close();

// Return post, user, and petMap
echo json_encode([
    'status' => 'success',
    'post' => $post,
    'user' => $user,
    'petMap' => $petMap
]);
