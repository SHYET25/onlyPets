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
    // After inserting the comment, add notification for the post owner if not self
    if ($stmt->execute()) {
        $comment_id = $stmt->insert_id;
        // Fetch post owner
        $owner_stmt = $conn->prepare("SELECT poster_email FROM post WHERE post_id = ? LIMIT 1");
        $owner_stmt->bind_param('i', $post_id);
        $owner_stmt->execute();
        $owner_stmt->bind_result($poster_email);
        $owner_stmt->fetch();
        $owner_stmt->close();
        if ($poster_email && $poster_email !== $user_email) {
            // Fetch commenter info
            $user_stmt = $conn->prepare("SELECT user_fname, user_lname, user_img FROM user WHERE user_email = ? LIMIT 1");
            $user_stmt->bind_param('s', $user_email);
            $user_stmt->execute();
            $user_stmt->bind_result($fname, $lname, $user_img);
            $user_stmt->fetch();
            $user_stmt->close();
            $commenter_name = trim($fname . ' ' . $lname);
            $commenter_img = $user_img;
            // Store notification message as JSON for richer frontend rendering
            $notif_data = json_encode([
                'commenter_name' => $commenter_name,
                'commenter_img' => $commenter_img,
                'comment_id' => $comment_id, // Add the comment id here
                'message' => $commenter_name . ' commented on your post.'
            ]);
            $notif_stmt = $conn->prepare("INSERT INTO notifications (user_email, type, ref_id, message, created_at, is_read) VALUES (?, 'comment', ?, ?, NOW(), 0)");
            $notif_stmt->bind_param('sis', $poster_email, $post_id, $notif_data);
            $notif_stmt->execute();
            $notif_stmt->close();
        }
        echo json_encode(['status' => 'success', 'message' => 'Comment posted successfully.', 'comment_id' => $comment_id]);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'Failed to post comment.']);
    }
    $stmt->close();
} catch (Exception $e) {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $e->getMessage()]);
}
$conn->close();
