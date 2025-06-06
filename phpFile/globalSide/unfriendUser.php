<?php
// filepath: c:/xampp/htdocs/pullHCI2/phpFile/globalSide/unfriendUser.php
require_once '../connection/connection.php';
session_start();

header('Content-Type: application/json');

// Use $conn as in other files
$pdo = $conn;

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$session_email = $_SESSION['userEmail'];
$friend_email = $_POST['other_email'] ?? ($_GET['other_email'] ?? ($_GET['receiver_email'] ?? ($_GET['friend_email'] ?? null)));

if (!$friend_email) {
    echo json_encode(['status' => 'error', 'message' => 'Missing friend email.']);
    exit;
}


// Remove friend_email from session user's friend_list
$stmt1 = $conn->prepare("UPDATE user_friends SET friend_list = JSON_REMOVE(friend_list, JSON_UNQUOTE(JSON_SEARCH(friend_list, 'one', ?))) WHERE user_email = ?");
$stmt1->bind_param('ss', $friend_email, $session_email);
$stmt1->execute();
$stmt1->close();

// Remove session_email from friend's friend_list
$stmt2 = $conn->prepare("UPDATE user_friends SET friend_list = JSON_REMOVE(friend_list, JSON_UNQUOTE(JSON_SEARCH(friend_list, 'one', ?))) WHERE user_email = ?");
$stmt2->bind_param('ss', $session_email, $friend_email);
$stmt2->execute();
$stmt2->close();

// Delete the friend request row (bidirectional)
$stmt3 = $conn->prepare("DELETE FROM friend_requests WHERE (sender_email = ? AND receiver_email = ?) OR (sender_email = ? AND receiver_email = ?)");
$stmt3->bind_param('ssss', $session_email, $friend_email, $friend_email, $session_email);
$stmt3->execute();
$stmt3->close();

echo json_encode(['status' => 'success']);
