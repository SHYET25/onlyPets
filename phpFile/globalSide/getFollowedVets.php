<?php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}
$user_email = $_SESSION['userEmail'];

$sql = "SELECT v.vet_id, v.vet_fname, v.vet_lname, v.vet_img, v.vet_license
        FROM vet_followers f
        JOIN veterinarian v ON f.vet_id = v.vet_id
        WHERE f.user_email = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $user_email);
$stmt->execute();
$result = $stmt->get_result();

$vets = [];
while ($row = $result->fetch_assoc()) {
    $vets[] = [
        'id' => $row['vet_id'],
        'name' => $row['vet_fname'] . ' ' . $row['vet_lname'],
        'img' => $row['vet_img'],
        'license' => $row['vet_license']
    ];
}
echo json_encode(['status' => 'success', 'vets' => $vets]);
?>