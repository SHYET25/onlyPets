<?php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

date_default_timezone_set('Asia/Manila');

function generateRandomName($length = 7) {
    return substr(str_shuffle("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, $length);
}

function saveBase64File($base64String, $uploadDir) {
    $parts = explode(";base64,", $base64String);
    if (count($parts) !== 2) return false;

    $mimeType = explode("/", $parts[0])[1];
    $data = base64_decode($parts[1]);
    $filename = generateRandomName() . "." . $mimeType;
    $filePath = $uploadDir . $filename;

    if (file_put_contents($filePath, $data)) {
        return $filename;
    }
    return false;
}

if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'Session expired. Please log in again.']);
    exit;
}

$poster_email = $_SESSION['userEmail'];

// Check if user is banned
$stateStmt = $conn->prepare("SELECT state FROM user WHERE user_email = ?");
$stateStmt->bind_param("s", $poster_email);
$stateStmt->execute();
$stateResult = $stateStmt->get_result();
$userState = $stateResult->fetch_assoc();

if ($userState && $userState['state'] === 'banned') {
    echo json_encode(['status' => 'error', 'message' => 'Your account is banned. You cannot post.']);
    exit;
}

$caption = $_POST['caption'] ?? '';
$scope = $_POST['scope'] ?? 'public';
$tagged = $_POST['tagged'] ?? '';
$taggedPets = $_POST['taggedPets'] ?? '';
$date_posted = date('Y-m-d H:i:s');

$uploadDir = '../../media/images/posts/';
if (!is_dir($uploadDir)) {
    mkdir($uploadDir, 0777, true);
}

$media = json_decode($_POST['media'] ?? '[]', true);
$mediaFiles = [];

foreach ($media as $base64String) {
    $savedFile = saveBase64File($base64String, $uploadDir);
    if ($savedFile) {
        $mediaFiles[] = $savedFile;
    }
}

$mediaJson = json_encode($mediaFiles);

$stmt = $conn->prepare("INSERT INTO post (poster_email, post_caption, post_scope, post_tagged, post_images, tagged_pets, date_posted) VALUES (?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("sssssss", $poster_email, $caption, $scope, $tagged, $mediaJson, $taggedPets, $date_posted);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Post uploaded successfully.']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Database error: ' . $conn->error]);
}
?>
