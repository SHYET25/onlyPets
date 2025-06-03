<?php
// filepath: phpFile/globalSide/updateRecentSearches.php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

$user_email = $_SESSION['userEmail'];
$searched_user = isset($_POST['searched_user']) ? $_POST['searched_user'] : null;

if (!$searched_user) {
    echo json_encode(['status' => 'error', 'message' => 'No searched user provided.']);
    exit;
}

// searched_user should be an array with keys: name, img, location
$searched_user = json_decode($searched_user, true);
if (!is_array($searched_user)) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid searched user data.']);
    exit;
}

// Fetch current recent searches
$stmt = $conn->prepare("SELECT recent_searches FROM recent_searches WHERE user_email = ?");
$stmt->bind_param("s", $user_email);
$stmt->execute();
$stmt->bind_result($recent_json);
$exists = $stmt->fetch();
$stmt->close();

$recent = $exists && $recent_json ? json_decode($recent_json, true) : [];
if (!is_array($recent)) $recent = [];

// Remove duplicate if exists
$recent = array_filter($recent, function($item) use ($searched_user) {
    return $item['name'] !== $searched_user['name'] || $item['img'] !== $searched_user['img'];
});
// Add to front
array_unshift($recent, $searched_user);
// Limit to 6
$recent = array_slice($recent, 0, 6);

if ($exists) {
    $stmt = $conn->prepare("UPDATE recent_searches SET recent_searches = ? WHERE user_email = ?");
    $json = json_encode($recent);
    $stmt->bind_param("ss", $json, $user_email);
    $stmt->execute();
    $stmt->close();
} else {
    $stmt = $conn->prepare("INSERT INTO recent_searches (user_email, recent_searches) VALUES (?, ?)");
    $json = json_encode($recent);
    $stmt->bind_param("ss", $user_email, $json);
    $stmt->execute();
    $stmt->close();
}

$conn->close();
echo json_encode(['status' => 'success', 'recent' => $recent]);
?>
