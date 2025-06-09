<?php

session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

$reply_text = trim($_POST['reply_text'] ?? '');
$post_id = intval($_POST['post_id'] ?? 0);

if (!$reply_text || !$post_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing data.']);
    exit;
}

$user_email = $_SESSION['userEmail'] ?? null;
$role = $_SESSION['role'] ?? null;
$vet_id = null;

if ($role === 'veterinarian') {
    // Get vet_id from email
    $stmt = $conn->prepare("SELECT vet_id FROM veterinarian WHERE vet_email = ?");
    $stmt->bind_param("s", $user_email);
    $stmt->execute();
    $res = $stmt->get_result();
    $row = $res->fetch_assoc();
    $vet_id = $row ? $row['vet_id'] : null;
}

if (!$user_email) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

// Save reply (either user_email or vet_id will be set)
$stmt = $conn->prepare("INSERT INTO posted_replies (post_id, user_email, vet_id, reply_text) VALUES (?, ?, ?, ?)");
$stmt->bind_param("isis", $post_id, $user_email, $vet_id, $reply_text);
if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to save reply.']);
}
?>