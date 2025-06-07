<?php
// fetchFriendList.php
session_start();
include '../connection/connection.php';
header('Content-Type: application/json');

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$user_email = $_SESSION['userEmail'];

// 1. Get friend_list from user_friends
$stmt = $conn->prepare("SELECT friend_list FROM user_friends WHERE user_email = ?");
$stmt->bind_param('s', $user_email);
$stmt->execute();
$stmt->bind_result($friend_json);
$stmt->fetch();
$stmt->close();

$friend_emails = $friend_json ? json_decode($friend_json, true) : [];
$friends = [];

if (!empty($friend_emails)) {
    // 2. Fetch info for each friend from user table
    $placeholders = implode(',', array_fill(0, count($friend_emails), '?'));
    $types = str_repeat('s', count($friend_emails));
    $sql = "SELECT user_fname, user_lname, user_email, user_contact, user_country, user_province, user_city, user_baranggay, user_img FROM user WHERE user_email IN ($placeholders)";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param($types, ...$friend_emails);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $friends[] = $row;
    }
    $stmt->close();
}

echo json_encode(['status' => 'success', 'friends' => $friends]);
