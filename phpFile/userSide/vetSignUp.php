<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../../vendor/autoload.php';
include '../connection/connection.php';
header('Content-Type: application/json');

function respond($status, $message = '') {
    echo json_encode(['status' => $status, 'message' => $message]);
    exit;
}

$vet_fname    = trim($_POST['vet_fname'] ?? '');
$vet_lname    = trim($_POST['vet_lname'] ?? '');
$vet_email    = trim($_POST['vet_email'] ?? '');
$vet_pass     = $_POST['vet_password'] ?? '';
$vet_contact  = trim($_POST['vet_contact'] ?? '');
$vet_license  = trim($_POST['vet_license'] ?? '');

if (!$vet_fname || !$vet_lname || !$vet_email || !$vet_pass || !$vet_contact || !$vet_license) {
    respond('error', 'All fields are required.');
}

// Check if email already exists
$stmt = $conn->prepare("SELECT vet_id FROM veterinarian WHERE vet_email = ?");
$stmt->bind_param("s", $vet_email);
$stmt->execute();
$stmt->store_result();
if ($stmt->num_rows > 0) {
    respond('error', 'Email already registered.');
}
$stmt->close();

// Hash password
$hashed_pass = password_hash($vet_pass, PASSWORD_DEFAULT);

// Generate OTP
$otp_code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$otp_created_at = date('Y-m-d H:i:s');

// Insert new vet with OTP
$stmt = $conn->prepare("INSERT INTO veterinarian (vet_email, vet_pass, vet_fname, vet_lname, vet_license, vet_contact, otp_code, otp_created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param("ssssssss", $vet_email, $hashed_pass, $vet_fname, $vet_lname, $vet_license, $vet_contact, $otp_code, $otp_created_at);

if ($stmt->execute()) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'josephmirasol25@gmail.com';
        $mail->Password = 'mmgt emyv rgtm fcbr';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('your_gmail@gmail.com', 'OnlyPets');
        $mail->addAddress($vet_email, $vet_fname . ' ' . $vet_lname);

        $mail->isHTML(true);
        $mail->Subject = 'OnlyPets Vet Email Verification';
        $mail->Body    = "Hello <b>{$vet_fname}</b>,<br>Your verification code is: <b>{$otp_code}</b><br><br>Please enter this code to verify your account.";

        $mail->send();
        respond('success', 'Vet registered successfully. Please check your email for the verification code.');
    } catch (Exception $e) {
        respond('error', 'Registration successful, but email could not be sent. Mailer Error: ' . $mail->ErrorInfo);
    }
} else {
    respond('error', 'Registration failed. Please try again.');
}
$stmt->close();
$conn->close();