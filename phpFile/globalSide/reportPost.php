<?php
// phpFile/globalSide/reportPost.php
require_once '../connection/connection.php';
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

$post_id = isset($_POST['post_id']) ? intval($_POST['post_id']) : 0;
$reason = isset($_POST['reason']) ? trim($_POST['reason']) : '';

// Get session user (reporter)
session_start();
$reporter_email = isset($_SESSION['userEmail']) ? $_SESSION['userEmail'] : '';
if (!$reporter_email) {
    echo json_encode(['status' => 'error', 'message' => 'Session expired. Please log in again.']);
    exit;
}

if (!$post_id) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid post ID.']);
    exit;
}

// Fetch the post to get the owner (poster_email)
$stmt = $conn->prepare('SELECT poster_email FROM post WHERE post_id = ?');
$stmt->bind_param('i', $post_id);
$stmt->execute();
$result = $stmt->get_result();
if ($row = $result->fetch_assoc()) {
    $poster_email = $row['poster_email'];
} else {
    echo json_encode(['status' => 'error', 'message' => 'Post not found.']);
    exit;
}
$stmt->close();

// Get the user id of the poster from user table
$stmt = $conn->prepare('SELECT user_id FROM user WHERE user_email = ?');
$stmt->bind_param('s', $poster_email);
$stmt->execute();
$result = $stmt->get_result();
if ($row = $result->fetch_assoc()) {
    $reported_user_id = $row['user_id'];
} else {
    echo json_encode(['status' => 'error', 'message' => 'Poster user not found.']);
    exit;
}
$stmt->close();

// Insert into reports table
$reason = $reason ?: 'Inappropriate or offensive content';
$date = date('Y-m-d H:i:s');
$status = 'pending';
$type = 'post';

$stmt = $conn->prepare('INSERT INTO reports (reported_user_id, post_id, reason, date, status, type) VALUES (?, ?, ?, ?, ?, ?)');
$stmt->bind_param('sissss', $reported_user_id, $post_id, $reason, $date, $status, $type);
$success = $stmt->execute();
if ($success) {
    echo json_encode(['status' => 'success', 'message' => 'Post reported successfully.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to report post.']);
}
$stmt->close();
$conn->close();
