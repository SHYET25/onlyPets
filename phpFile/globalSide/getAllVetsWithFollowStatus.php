<?php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

$user_email = $_SESSION['userEmail'] ?? '';

$sql = "SELECT v.vet_id, v.vet_fname, v.vet_lname, v.vet_img, v.vet_license,
        (SELECT COUNT(*) FROM vet_followers f WHERE f.user_email = ? AND f.vet_id = v.vet_id) AS is_followed
        FROM veterinarian v";
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
        'license' => $row['vet_license'],
        'is_followed' => $row['is_followed'] > 0
    ];
}
echo json_encode(['status' => 'success', 'vets' => $vets]);
?>