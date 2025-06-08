<?php
// phpFile/globalSide/fetchCommentById.php
// Fetch a single comment (with user info) by comment_id
header('Content-Type: application/json');
require_once '../connection/connection.php';

$comment_id = isset($_GET['comment_id']) ? intval($_GET['comment_id']) : (isset($_POST['comment_id']) ? intval($_POST['comment_id']) : 0);
if (!$comment_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing comment_id.']);
    exit;
}

$sql = "SELECT c.*, u.user_fname, u.user_lname, u.user_email, u.user_img FROM comments c LEFT JOIN user u ON c.user_email = u.user_email WHERE c.id = ? LIMIT 1";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $comment_id);
$stmt->execute();
$result = $stmt->get_result();
if ($row = $result->fetch_assoc()) {
    echo json_encode(['status' => 'success', 'comment' => $row]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Comment not found.']);
}
$stmt->close();
$conn->close();
