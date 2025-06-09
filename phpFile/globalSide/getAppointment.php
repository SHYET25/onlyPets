<?php

session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$user_email = $_SESSION['userEmail'];

// Join pet_info to get pet_img
$sql = "SELECT a.*, v.vet_fname, v.vet_lname, v.vet_img, p.pet_img, p.pet_name AS pet_real_name
        FROM appointments a
        JOIN veterinarian v ON a.vet_id = v.vet_id
        JOIN pet_info p ON a.pet_name = p.pet_id
        WHERE a.user_email = ? AND a.status = 'approved'
        ORDER BY a.appointment_date DESC, a.appointment_time DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param('s', $user_email);
$stmt->execute();
$result = $stmt->get_result();

$appointments = [];
while ($row = $result->fetch_assoc()) {
    $appointments[] = $row;
}
echo json_encode(['status' => 'success', 'appointments' => $appointments]);
?>