<?php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$user_email = $_SESSION['userEmail'];
$vet_id = intval($_POST['vet_id'] ?? 0);
$pet_name = $_POST['pet_name'] ?? '';
$appointment_date = $_POST['appointment_date'] ?? '';
$appointment_time = $_POST['appointment_time'] ?? '';
$reason = $_POST['reason'] ?? '';

if (!$vet_id || !$pet_name || !$appointment_date || !$appointment_time) {
    echo json_encode(['status' => 'error', 'message' => 'All fields are required.']);
    exit;
}

$stmt = $conn->prepare("INSERT INTO appointments (user_email, vet_id, pet_name, appointment_date, appointment_time, reason) VALUES (?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sissss", $user_email, $vet_id, $pet_name, $appointment_date, $appointment_time, $reason);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Appointment booked!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
}
?>