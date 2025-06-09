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

$vet_email = trim($_POST['vet_email'] ?? '');

if (!$vet_email) {
    respond('error', 'Email is required.');
}

// Check if vet exists
$stmt = $conn->prepare("SELECT vet_id, vet_fname, vet_lname FROM veterinarian WHERE vet_email = ?");
$stmt->bind_param("s", $vet_email);
$stmt->execute();
$stmt->store_result();
$stmt->bind_result($vet_id, $vet_fname, $vet_lname);

if ($stmt->num_rows !== 1) {
    respond('error', 'Email not found.');
}
$stmt->fetch();
$stmt->close();

// Generate new OTP
$otp_code = str_pad(random_int(0, 999999), 6, '0', STR_PAD_LEFT);
$otp_created_at = date('Y-m-d H:i:s');

// Update OTP in database
$update = $conn->prepare("UPDATE veterinarian SET otp_code=?, otp_created_at=? WHERE vet_id=?");
$update->bind_param("ssi", $otp_code, $otp_created_at, $vet_id);
if (!$update->execute()) {
    respond('error', 'Failed to update OTP.');
}
$update->close();

// Send OTP email
$mail = new PHPMailer(true);
try {
    $mail->isSMTP();
    $mail->Host = 'smtp.gmail.com';
    $mail->SMTPAuth = true;
    $mail->Username = 'josephmirasol25@gmail.com'; // your email
    $mail->Password = 'mmgt emyv rgtm fcbr'; // your app password
    $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    $mail->Port = 587;

    $mail->setFrom('josephmirasol25@gmail.com', 'OnlyPets');
    $mail->addAddress($vet_email, $vet_fname . ' ' . $vet_lname);

    $mail->isHTML(true);
    $mail->Subject = 'OnlyPets Vet Email Verification (Resend)';
    $mail->Body    = "Hello <b>{$vet_fname}</b>,<br>Your new verification code is: <b>{$otp_code}</b><br><br>Please enter this code to verify your account.";

    $mail->send();
    respond('success', 'OTP resent to your email.');
} catch (Exception $e) {
    respond('error', 'Could not send OTP. Mailer Error: ' . $mail->ErrorInfo);
}

$conn->close();