<?php
// filepath: phpFile/globalSide/fetchComments.php
header('Content-Type: application/json');
require_once '../connection/connection.php';

if (!isset($_GET['post_id'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing post_id.']);
    exit;
}

$post_id = $_GET['post_id'];

$sql = "SELECT c.*, u.user_fname, u.user_lname, u.user_email, u.user_img FROM comments c LEFT JOIN user u ON c.user_email = u.user_email WHERE c.post_id = ? ORDER BY c.created_at ASC";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $post_id);
$stmt->execute();
$result = $stmt->get_result();
$comments = [];
while ($row = $result->fetch_assoc()) {
    $comments[] = $row;
}
$stmt->close();
$conn->close();
echo json_encode(['status' => 'success', 'comments' => $comments]);
