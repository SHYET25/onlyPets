<?php
// fetchPetsByIds.php
// Fetch all pet details for a list of pet IDs (POST: pet_ids[])
header('Content-Type: application/json');
include '../connection/connection.php';

if (!isset($_POST['pet_ids']) || !is_array($_POST['pet_ids'])) {
    echo json_encode(['status' => 'error', 'message' => 'No pet IDs provided.']);
    exit;
}
$pet_ids = $_POST['pet_ids'];
$pet_ids = array_filter($pet_ids, function($id) { return preg_match('/^[0-9]+$/', $id); });
if (empty($pet_ids)) {
    echo json_encode(['status' => 'error', 'message' => 'No valid pet IDs.']);
    exit;
}
$placeholders = implode(',', array_fill(0, count($pet_ids), '?'));
$types = str_repeat('i', count($pet_ids));
$sql = "SELECT pet_id, pet_custom_id, pet_name, pet_type, pet_breed, pet_birthdate, pet_gender, pet_color, pet_eye_color, pet_allergies, pet_medical_conditions, pet_weight, pet_size, pet_img, pet_vaccine_img, pet_owner_email, pet_created_at FROM pet_info WHERE pet_id IN ($placeholders)";
$stmt = $conn->prepare($sql);
$stmt->bind_param($types, ...$pet_ids);
$stmt->execute();
$result = $stmt->get_result();
$pets = [];
while ($row = $result->fetch_assoc()) {
    $pets[] = $row;
}
$stmt->close();
echo json_encode(['status' => 'success', 'pets' => $pets]);
