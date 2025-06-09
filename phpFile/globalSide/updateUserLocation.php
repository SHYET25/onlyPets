<?php
// phpFile/globalSide/updateUserLocation.php
header('Content-Type: application/json');
require_once __DIR__ . '/../connection/connection.php';
session_start();

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$user_email = $_SESSION['userEmail'];
$lat = isset($_POST['lat']) ? floatval($_POST['lat']) : null;
$lng = isset($_POST['lng']) ? floatval($_POST['lng']) : null;

if ($lat === null || $lng === null) {
    echo json_encode(['status' => 'error', 'message' => 'Missing coordinates.']);
    exit;
}

// Store as JSON string (or adjust if your DB expects a different format)
$user_location = json_encode(['lat' => $lat, 'lng' => $lng]);

$sql = "UPDATE user SET user_location = ? WHERE user_email = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'DB prepare failed.']);
    exit;
}
$stmt->bind_param('ss', $user_location, $user_email);
if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'DB update failed.']);
}
$stmt->close();
$conn->close();
