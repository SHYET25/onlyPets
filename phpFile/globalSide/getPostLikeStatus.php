<?php
// phpFile/globalSide/getPostLikeStatus.php
header('Content-Type: application/json');
require_once __DIR__ . '/../connection/connection.php';
session_start();

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

if (!isset($_POST['post_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing post_id.']);
    exit;
}

$post_id = $_POST['post_id'];

// Get session user email
$user_email = null;
if (isset($_SESSION['userEmail'])) {
    $user_email = $_SESSION['userEmail'];
} elseif (isset($_SESSION['email'])) { // fallback
    $user_email = $_SESSION['email'];
}

if (!$user_email) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

// Fetch likes JSON from posts table
$stmt = $conn->prepare('SELECT post_likes FROM post WHERE post_id = ? LIMIT 1');
$stmt->bind_param('i', $post_id);
$stmt->execute();
$stmt->bind_result($likesJson);
if (!$stmt->fetch()) {
    echo json_encode(['status' => 'error', 'message' => 'Post not found.']);
    $stmt->close();
    exit;
}
$stmt->close();

$likesArr = [];
if ($likesJson) {
    $likesArr = json_decode($likesJson, true);
    if (!is_array($likesArr)) $likesArr = [];
}
$like_count = count($likesArr);
$liked = false;
if ($user_email) {
    foreach ($likesArr as $likeEmail) {
        if (trim(strtolower($likeEmail)) === trim(strtolower($user_email))) {
            $liked = true;
            break;
        }
    }
}
echo json_encode([
    'status' => 'success',
    'like_count' => $like_count,
    'liked' => $liked
]);
exit;
