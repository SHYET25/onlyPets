<?php
// filepath: phpFile/globalSide/insertComment.php
header('Content-Type: application/json');
require_once '../connection/connection.php';

// Validate POST data
if (!isset($_POST['post_id'], $_POST['user_email'], $_POST['comment'])) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
    exit;
}

$post_id = $_POST['post_id'];
$user_email = $_POST['user_email'];
$comment = trim($_POST['comment']);
$created_at = date('Y-m-d H:i:s');

if ($comment === '') {
    echo json_encode(['status' => 'error', 'message' => 'Comment cannot be empty.']);
    exit;
}

try {
    $stmt = $conn->prepare("INSERT INTO comments (post_id, user_email, comment, created_at) VALUES (?, ?, ?, ?)");
    $stmt->bind_param('isss', $post_id, $user_email, $comment, $created_at);
    if ($stmt->execute()) {
        $comment_id = $stmt->insert_id;
        echo json_encode(['status' => 'success', 'message' => 'Comment posted successfully.', 'comment_id' => $comment_id]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to post comment.']);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
$conn->close();
