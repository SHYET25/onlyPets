<?php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

$email = $_SESSION['userEmail'] ?? null;
$role = $_SESSION['role'] ?? null;

if (!$email || !$role) {
    echo json_encode(["status" => "error", "message" => "Session not set or incomplete."]);
    exit;
}

if ($role === 'user') {
    $stmt = $conn->prepare("SELECT user_id, user_fname, user_lname, user_email, user_pass, user_contact, user_img, user_location FROM user WHERE user_email = ?");
} elseif ($role === 'veterinarian') {
    $stmt = $conn->prepare("SELECT vet_id, vet_email, vet_pass, vet_fname, vet_lname, vet_contact, vet_img FROM veterinarian WHERE vet_email = ?");
} else {
    echo json_encode(["status" => "error", "message" => "Invalid role."]);
    exit;
}

$stmt->bind_param("s", $email);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows === 1) {
    $data = $result->fetch_assoc();
    echo json_encode([
        "status" => "success",
        "role" => $role,
        "data" => $data
    ]);
} else {
    echo json_encode(["status" => "error", "message" => "Account not found."]);
}
?>
