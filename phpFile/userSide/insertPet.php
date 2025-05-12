<?php
session_start();
include '../connection/connection.php';

function generateRandomName($length = 7) {
    return substr(str_shuffle("0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ"), 0, $length);
}

function uploadImage($base64String, $uploadDir) {
    $imgData = explode(';base64,', $base64String);
    if (count($imgData) < 2) return false;

    $mimeType = explode('/', $imgData[0])[1];
    $base64 = base64_decode($imgData[1]);

    $filename = generateRandomName() . '.' . $mimeType;
    $filePath = $uploadDir . $filename;

    if (file_put_contents($filePath, $base64)) {
        return $filename;
    } else {
        return false;
    }
}

$yearPrefix = date('Y');
$randomSuffix = str_pad(mt_rand(0, 99), 5, '0', STR_PAD_LEFT);
$pet_custom_id = $yearPrefix . $randomSuffix;

// Check session
if (!isset($_SESSION['userEmail'])) {
    echo json_encode(['status' => 'error', 'message' => 'User not logged in.']);
    exit;
}
$owner_email = $_SESSION['userEmail'];

// Get inputs
$pet_name = $_POST['pet_name'];
$pet_type = $_POST['pet_type'];
$pet_breed = $_POST['pet_breed'];
$pet_birthdate = $_POST['pet_birthdate'];
$pet_gender = $_POST['pet_gender'];
$pet_color = $_POST['pet_color'];
$pet_eye_color = $_POST['pet_eye_color'];
$pet_allergies = $_POST['pet_allergies'];
$pet_medical_conditions = $_POST['pet_medical_conditions'];
$pet_weight = $_POST['pet_weight'];
$pet_size = $_POST['pet_size'];

$pet_img_base64 = $_POST['pet_img'];
$vac_img_base64 = $_POST['pet_vaccine_img'];

$pet_img = uploadImage($pet_img_base64, '../../media/images/petPics/');
$vac_img = uploadImage($vac_img_base64, '../../media/images/vacPics/');

if (!$pet_img || !$vac_img) {
    echo json_encode(['status' => 'error', 'message' => 'Image upload failed.']);
    exit;
}

$sql = "INSERT INTO pet_info (
    pet_custom_id, pet_owner_email, pet_name, pet_type, pet_breed, pet_birthdate, pet_gender,
    pet_color, pet_eye_color, pet_allergies, pet_medical_conditions,
    pet_weight, pet_size, pet_img, pet_vaccine_img
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";


$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(['status' => 'error', 'message' => 'Prepare failed: ' . $conn->error]);
    exit;
}

$stmt->bind_param(
    "ssssssssssdssss",
    $pet_custom_id, $owner_email, $pet_name, $pet_type, $pet_breed, $pet_birthdate, $pet_gender,
    $pet_color, $pet_eye_color, $pet_allergies, $pet_medical_conditions,
    $pet_weight, $pet_size, $pet_img, $vac_img
);


if ($stmt->execute()) {
    echo json_encode(['status' => 'success', 'message' => 'Pet added successfully!']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Insert failed: ' . $stmt->error]);
}

$stmt->close();
$conn->close();
