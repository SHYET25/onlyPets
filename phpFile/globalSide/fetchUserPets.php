<?php
// Fetch pets for autocomplete (for the logged-in user)
header('Content-Type: application/json');
require_once __DIR__ . '/../connection/connection.php';
session_start();

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$user_email = $_SESSION['userEmail'];

// Fetch pets from pet_info where pet_owner_email = session email
$stmt = $conn->prepare('SELECT pet_id, pet_name, pet_breed, pet_img FROM pet_info WHERE pet_owner_email = ?');
$stmt->bind_param('s', $user_email);
$stmt->execute();
$res = $stmt->get_result();
$pets = [];
while ($pet = $res->fetch_assoc()) {
    $pets[] = $pet;
}
$stmt->close();

// Return pets as JSON
echo json_encode(['status' => 'success', 'pets' => $pets]);
exit;
