<?php

session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

$id = $_POST['id'] ?? null;
$status = $_POST['status'] ?? null;

if (!$id || !$status) {
    echo json_encode(['status' => 'error', 'message' => 'Missing data.']);
    exit;
}

// Get vet_id from session email if role is veterinarian
$email = $_SESSION['userEmail'] ?? null;
$role = $_SESSION['role'] ?? null;
$vet_id = null;

if ($email && $role === 'veterinarian') {
    $stmt = $conn->prepare("SELECT vet_id FROM veterinarian WHERE vet_email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    if ($row = $result->fetch_assoc()) {
        $vet_id = $row['vet_id'];
    }
}

if (!$vet_id) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in as vet.']);
    exit;
}

$stmt = $conn->prepare("UPDATE appointments SET status = ? WHERE id = ? AND vet_id = ?");
$stmt->bind_param("sii", $status, $id, $vet_id);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to update.']);
}
?>