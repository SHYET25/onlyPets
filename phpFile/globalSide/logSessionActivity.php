<?php
// filepath: phpFile/globalSide/logSessionActivity.php

date_default_timezone_set('Asia/Manila');
require_once '../connection/connection.php';
header('Content-Type: application/json');

$user_email = isset($_POST['user_email']) ? trim(strtolower($_POST['user_email'])) : '';
$activity_type = isset($_POST['activity_type']) ? $_POST['activity_type'] : '';
$activity = isset($_POST['activity']) ? $_POST['activity'] : '';
$activity_description = isset($_POST['activity_description']) ? $_POST['activity_description'] : '';
$act_id = isset($_POST['act_id']) ? $_POST['act_id'] : '';
$post_id = isset($_POST['post_id']) ? $_POST['post_id'] : '';
$created_at = date('Y-m-d H:i:s');

// If activity_type is 'like', set act_id to 0 but keep post_id as the real post id
if ($activity_type === 'like') {
    $act_id = 0;
    // If post_id is empty or not set, set to 0 (to avoid missing required fields)
    if ($post_id === '') {
        $post_id = 0;
    }
}

// Accept 0 as valid for act_id and post_id
if ($user_email && $activity_type && $activity && $activity_description && $act_id !== '' && $post_id !== '') {
    $stmt = $conn->prepare("INSERT INTO session_activity_logs (user_email, activity_type, activity, activity_description, act_id, post_id, created_at) VALUES (?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param('sssssis', $user_email, $activity_type, $activity, $activity_description, $act_id, $post_id, $created_at);
    if ($stmt->execute()) {
        echo json_encode(['status' => 'success']);
    } else {
        echo json_encode(['status' => 'error', 'message' => $stmt->error]);
    }
    $stmt->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields', 'debug' => compact('user_email','activity_type','activity','activity_description','act_id','post_id')]);
}
$conn->close();
?>
