<?php
// filepath: phpFile/globalSide/fetchRecentSearches.php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$user_email = $_SESSION['userEmail'];
$stmt = $conn->prepare("SELECT recent_searches FROM recent_searches WHERE user_email = ?");
$stmt->bind_param("s", $user_email);
$stmt->execute();
$stmt->bind_result($recent_json);
$exists = $stmt->fetch();
$stmt->close();
$conn->close();

$recent = $exists && $recent_json ? json_decode($recent_json, true) : [];
if (!is_array($recent)) $recent = [];
echo json_encode(['status' => 'success', 'recent' => $recent]);
?>
