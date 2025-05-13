<?php
session_start();
require '../connection/connection.php'; // Adjust path as needed

header("Content-Type: application/json");

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in']);
    exit;
}

$userEmail = $_SESSION['userEmail'];

$sql = "SELECT 
            pi.*, 
            pv.id AS vaccination_id, 
            pv.pet_id AS vaccination_pet_id, 
            pv.vaccine_name, 
            pv.vaccination_date, 
            pv.remarks
        FROM pet_info pi
        LEFT JOIN pet_vaccination pv ON pi.pet_id = pv.pet_id
        WHERE pi.pet_owner_email = ?";

$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $userEmail);
$stmt->execute();
$result = $stmt->get_result();

$pets = [];
while ($row = $result->fetch_assoc()) {
    $pets[] = $row;
}

echo json_encode(['status' => 'success', 'pets' => $pets]);
?>
