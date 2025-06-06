<?php
session_start();
include '../connection/connection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$receiver_email = $_SESSION['userEmail'];

$stmt = $conn->prepare("SELECT sender_email, created_at FROM friend_requests WHERE receiver_email = ? AND status = 'pending' ORDER BY created_at DESC");
$stmt->bind_param('s', $receiver_email);
$stmt->execute();
$stmt->store_result(); // ✅ buffer the result
$stmt->bind_result($sender_email, $created_at);

$requests = [];

while ($stmt->fetch()) {
    // Safe to execute another query now
    $user_stmt = $conn->prepare("SELECT user_id, user_fname, user_lname, user_email, user_img FROM user WHERE user_email = ? LIMIT 1");
    $user_stmt->bind_param('s', $sender_email);
    $user_stmt->execute();
    $user_stmt->bind_result($user_id, $user_fname, $user_lname, $user_email, $user_img);

    if ($user_stmt->fetch()) {
        $requests[] = [
            'sender_email' => $sender_email,
            'created_at' => $created_at,
            'user_id' => $user_id,
            'name' => $user_fname . ' ' . $user_lname,
            'user_email' => $user_email,
            'user_img' => $user_img
        ];
    }

    $user_stmt->close();
}

$stmt->close();

if (count($requests) > 0) {
    echo json_encode(['status' => 'success', 'requests' => $requests]);
} else {
    echo json_encode(['status' => 'none', 'requests' => []]);
}
?>
