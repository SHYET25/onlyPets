<?php

session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

$vet_id = $_GET['vet_id'] ?? ($_SESSION['vet_id'] ?? null);
if (!$vet_id) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in as vet.']);
    exit;
}

// Join pet_info to get pet details
$sql = "SELECT a.*, p.pet_name, p.pet_img, p.pet_breed, a.user_email
        FROM appointments a
        JOIN pet_info p ON a.pet_name = p.pet_id
        WHERE a.vet_id = ?
        ORDER BY a.appointment_date DESC, a.appointment_time DESC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $vet_id);
$stmt->execute();
$result = $stmt->get_result();

$appointments = [];
while ($row = $result->fetch_assoc()) {
    $appointments[] = $row;
}
echo json_encode(['status' => 'success', 'appointments' => $appointments]);
?>