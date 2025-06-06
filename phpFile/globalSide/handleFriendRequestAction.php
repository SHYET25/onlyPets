<?php
// handleFriendRequestAction.php
session_start();
include '../connection/connection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$receiver_email = $_SESSION['userEmail'];
$sender_email = $_POST['sender_email'] ?? null;
$action = $_POST['action'] ?? null;

if (!$sender_email || !$action) {
    echo json_encode(['status' => 'error', 'message' => 'Missing parameters.']);
    exit;
}

if ($action === 'accept') {
    // 1. Update friend_requests status to accepted
    $stmt = $conn->prepare("UPDATE friend_requests SET status = 'accepted' WHERE sender_email = ? AND receiver_email = ? AND status = 'pending'");
    $stmt->bind_param('ss', $sender_email, $receiver_email);
    $stmt->execute();
    $updated = $stmt->affected_rows > 0;
    $stmt->close();

    if ($updated) {
        $now = date('Y-m-d H:i:s');
        // 2. Update user_friends for receiver
        $stmt = $conn->prepare("SELECT friend_list FROM user_friends WHERE user_email = ?");
        $stmt->bind_param('s', $receiver_email);
        $stmt->execute();
        $stmt->bind_result($friend_json);
        $exists = $stmt->fetch();
        $stmt->close();
        $friend_list = $exists && $friend_json ? json_decode($friend_json, true) : [];
        if (!in_array($sender_email, $friend_list)) {
            $friend_list[] = $sender_email;
        }
        $friend_json = json_encode($friend_list);
        if ($exists) {
            $stmt = $conn->prepare("UPDATE user_friends SET friend_list = ?, updated_at = ? WHERE user_email = ?");
            $stmt->bind_param('sss', $friend_json, $now, $receiver_email);
            $stmt->execute();
            $stmt->close();
        } else {
            $stmt = $conn->prepare("INSERT INTO user_friends (user_email, friend_list, updated_at) VALUES (?, ?, ?)");
            $stmt->bind_param('sss', $receiver_email, $friend_json, $now);
            $stmt->execute();
            $stmt->close();
        }
        // 3. Update user_friends for sender
        $stmt = $conn->prepare("SELECT friend_list FROM user_friends WHERE user_email = ?");
        $stmt->bind_param('s', $sender_email);
        $stmt->execute();
        $stmt->bind_result($friend_json);
        $exists = $stmt->fetch();
        $stmt->close();
        $friend_list = $exists && $friend_json ? json_decode($friend_json, true) : [];
        if (!in_array($receiver_email, $friend_list)) {
            $friend_list[] = $receiver_email;
        }
        $friend_json = json_encode($friend_list);
        if ($exists) {
            $stmt = $conn->prepare("UPDATE user_friends SET friend_list = ?, updated_at = ? WHERE user_email = ?");
            $stmt->bind_param('sss', $friend_json, $now, $sender_email);
            $stmt->execute();
            $stmt->close();
        } else {
            $stmt = $conn->prepare("INSERT INTO user_friends (user_email, friend_list, updated_at) VALUES (?, ?, ?)");
            $stmt->bind_param('sss', $sender_email, $friend_json, $now);
            $stmt->execute();
            $stmt->close();
        }
        echo json_encode(['status' => 'success', 'message' => 'Friend request accepted.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No pending request found.']);
    }
} elseif ($action === 'reject') {
    $stmt = $conn->prepare("DELETE FROM friend_requests WHERE sender_email = ? AND receiver_email = ? AND status = 'pending'");
    $stmt->bind_param('ss', $sender_email, $receiver_email);
    $stmt->execute();
    if ($stmt->affected_rows > 0) {
        echo json_encode(['status' => 'success', 'message' => 'Friend request rejected.']);
    } else {
        echo json_encode(['status' => 'error', 'message' => 'No pending request found.']);
    }
    $stmt->close();
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid action.']);
}
