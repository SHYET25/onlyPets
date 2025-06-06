<?php
// filepath: phpFile/globalSide/fetchOtherProfile.php
header('Content-Type: application/json');
require_once '../connection/connection.php';

if (!isset($_GET['email']) || empty($_GET['email'])) {
    echo json_encode(['status' => 'error', 'message' => 'No email provided.']);
    exit;
}

$email = mysqli_real_escape_string($conn, $_GET['email']);

// Fetch user info
$userSql = "SELECT user_id, user_fname, user_lname, user_email, user_contact, user_country, user_province, user_city, user_baranggay, user_img, status FROM user WHERE user_email = '$email' LIMIT 1";
$userRes = mysqli_query($conn, $userSql);

if (!$userRes || mysqli_num_rows($userRes) === 0) {
    echo json_encode(['status' => 'error', 'message' => 'User not found.']);
    exit;
}

$user = mysqli_fetch_assoc($userRes);

// Fetch pets for this user
$petsSql = "SELECT pet_id, pet_custom_id, pet_name, pet_type, pet_breed, pet_birthdate, pet_gender, pet_color, pet_eye_color, pet_allergies, pet_medical_conditions, pet_weight, pet_size, pet_img, pet_vaccine_img, pet_owner_email, pet_created_at FROM pet_info WHERE pet_owner_email = '$email'";
$petsRes = mysqli_query($conn, $petsSql);
$pets = [];
if ($petsRes) {
    while ($row = mysqli_fetch_assoc($petsRes)) {
        $pets[] = $row;
    }
}

// Optionally, you can fetch posts here as well if needed

$response = [
    'status' => 'success',
    'user' => $user,
    'pets' => $pets
];
echo json_encode($response);
