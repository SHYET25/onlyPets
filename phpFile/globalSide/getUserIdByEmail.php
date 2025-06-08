<?php
include '../connection/connection.php';

$email = $_GET['email'] ?? null;
if (!$email) {
    echo json_encode(['status' => 'error', 'message' => 'No email provided']);
    exit;
}

$stmt = $conn->prepare("SELECT user_id FROM user WHERE user_email = ?");
$stmt->bind_param("s", $email);
$stmt->execute();
$res = $stmt->get_result();
$row = $res->fetch_assoc();

if ($row) {
    echo json_encode(['status' => 'success', 'user_id' => $row['user_id']]);
} else {
    echo json_encode(['status' => 'error', 'message' => 'User not found']);
}
?>