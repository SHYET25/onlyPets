<?php
session_start();
header('Content-Type: application/json');

// Prepare the response data
$response = [
    "email" => $_SESSION['userEmail'] ?? null,
    "device" => $_SESSION['pendingDevice'] ?? null,
    "role" => $_SESSION['role'] ?? null

];

// Return the data as JSON
echo json_encode($response);
?>
