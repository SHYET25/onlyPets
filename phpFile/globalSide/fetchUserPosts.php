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
        post.post_likes,
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
    // Like count and liked status
    $likeArr = [];
    if (!empty($row['post_likes'])) {
        $likeArr = json_decode($row['post_likes'], true);
        if (!is_array($likeArr)) $likeArr = [];
    }
    $row['like_count'] = count($likeArr);
    $row['liked'] = in_array($userEmail, $likeArr);
    // Decode post_tagged and tagged_pets as arrays
    $row['post_tagged'] = !empty($row['post_tagged']) ? json_decode($row['post_tagged'], true) : [];
    if (!is_array($row['post_tagged'])) $row['post_tagged'] = [];
    $row['tagged_pets'] = !empty($row['tagged_pets']) ? json_decode($row['tagged_pets'], true) : [];
    if (!is_array($row['tagged_pets'])) $row['tagged_pets'] = [];
    $posts[] = $row;
}

echo json_encode(['status' => 'success', 'posts' => $posts]);
?>
