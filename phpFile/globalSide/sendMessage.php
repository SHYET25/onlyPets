<?php

session_start();
include '../connection/connection.php';

$email = $_SESSION['userEmail'] ?? null;
$role = $_SESSION['role'] ?? null;

if (!$email || !$role) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in']);
    exit;
}

// Get user_id from DB if not set in session
if ($role === 'user') {
    $stmt = $conn->prepare("SELECT user_id FROM user WHERE user_email = ?");
} elseif ($role === 'veterinarian') {
    $stmt = $conn->prepare("SELECT vet_id AS user_id FROM veterinarian WHERE vet_email = ?");
} else {
    echo json_encode(['status' => 'error', 'message' => 'Invalid role']);
    exit;
}
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result();
if ($row = $res->fetch_assoc()) {
    $currentUser = $row['user_id'];
} else {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
    exit;
}

$receiverId = intval($_POST['receiver_id']);
$message = $_POST['message'];

$sql = "INSERT INTO messages (sender_id, receiver_id, message) VALUES (?, ?, ?)";
$stmt = $conn->prepare($sql);
$stmt->bind_param("iis", $currentUser, $receiverId, $message);
$stmt->execute();

echo json_encode(['status' => 'success']);
exit;