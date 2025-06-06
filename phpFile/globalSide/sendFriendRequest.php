<?php
session_start();
date_default_timezone_set('Asia/Manila');
include '../connection/connection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$sender_email = $_SESSION['userEmail'];
$receiver_email = $_POST['receiver_email'] ?? null;
$check_status = isset($_POST['check_status']) ? $_POST['check_status'] : 0;
$cancel = isset($_POST['cancel']) ? $_POST['cancel'] : 0;

if (!$receiver_email) {
    echo json_encode(['status' => 'error', 'message' => 'Missing receiver email.']);
    exit;
}

if ($sender_email === $receiver_email) {
    echo json_encode(['status' => 'error', 'message' => 'Cannot send friend request to yourself.']);
    exit;
}

if ($check_status) {
    // Check for accepted or pending status (BIDIRECTIONAL)
    $stmt = $conn->prepare("SELECT status FROM friend_requests WHERE ((sender_email = ? AND receiver_email = ?) OR (sender_email = ? AND receiver_email = ?)) ORDER BY created_at DESC LIMIT 1");
    $stmt->bind_param('ssss', $sender_email, $receiver_email, $receiver_email, $sender_email);
    $stmt->execute();
    $stmt->bind_result($status);
    if ($stmt->fetch()) {
        if ($status === 'accepted') {
            echo json_encode(['status' => 'accepted']);
        } else if ($status === 'pending') {
            echo json_encode(['status' => 'pending']);
        } else {
            echo json_encode(['status' => 'none']);
        }
    } else {
        echo json_encode(['status' => 'none']);
    }
    $stmt->close();
    exit;
}

if ($cancel) {
    // Delete the friend request row if pending or accepted
    $del = $conn->prepare("DELETE FROM friend_requests WHERE sender_email = ? AND receiver_email = ? AND (status = 'pending' OR status = 'accepted')");
    $del->bind_param('ss', $sender_email, $receiver_email);
    $del->execute();
    if ($del->affected_rows > 0) {
        echo json_encode(['status' => 'none', 'message' => 'Friend request cancelled or unfriended.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No request to cancel.']);
    }
    $del->close();
    exit;
}

// Check if a request already exists
$stmt = $conn->prepare("SELECT id FROM friend_requests WHERE sender_email = ? AND receiver_email = ? AND status = 'pending'");
$stmt->bind_param('ss', $sender_email, $receiver_email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    echo json_encode(['status' => 'pending', 'message' => 'Friend request already pending.']);
    $stmt->close();
    exit;
}
$stmt->close();

// Insert new friend request
$status = 'pending';
$created_at = date('Y-m-d H:i:s');
$insert = $conn->prepare("INSERT INTO friend_requests (sender_email, receiver_email, status, created_at) VALUES (?, ?, ?, ?)");
$insert->bind_param('ssss', $sender_email, $receiver_email, $status, $created_at);
if ($insert->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Friend request sent.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to send friend request.']);
}
$insert->close();
