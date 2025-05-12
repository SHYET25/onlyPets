<?php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';
include '../globalSide/otpSender.php';
require '../../vendor/autoload.php';

date_default_timezone_set('Asia/Manila');

$email = $_SESSION['userEmail'] ?? $_SESSION['vetEmail'] ?? null;
$response = ['status' => 'error', 'message' => 'Session expired'];

if ($email) {
    $otp = rand(100000, 999999);
    $created = date('Y-m-d H:i:s');
    $userData = null;
    $role = null;

    // Check in user table
    $stmt = $conn->prepare("SELECT user_fname AS fname, user_lname AS lname FROM user WHERE user_email = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 1) {
        $userData = $result->fetch_assoc();
        $role = 'user';
    } else {
        // Check in veterinarian table
        $stmt = $conn->prepare("SELECT vet_fname AS fname, vet_lname AS lname FROM veterinarian WHERE vet_email = ?");
        $stmt->bind_param("s", $email);
        $stmt->execute();
        $result = $stmt->get_result();

        if ($result->num_rows === 1) {
            $userData = $result->fetch_assoc();
            $role = 'veterinarian';
        }
    }
    $stmt->close();

    if ($role && $userData) {
        if ($role === 'user') {
            $update = $conn->prepare("UPDATE user SET otp_code = ?, otp_created_at = ? WHERE user_email = ?");
        } else {
            $update = $conn->prepare("UPDATE veterinarian SET otp_code = ?, otp_created_at = ? WHERE vet_email = ?");
        }

        $update->bind_param("sss", $otp, $created, $email);

        if ($update->execute()) {
            $update->close();

            if (otpSender($email, $otp, $userData['fname'], $userData['lname'])) {
                $response = ['status' => 'success', 'message' => 'OTP resent successfully!'];
            } else {
                $response['message'] = 'Failed to send OTP.';
            }
        } else {
            $response['message'] = 'Failed to update OTP.';
        }
    } else {
        $response['message'] = 'Email not found.';
    }
}

echo json_encode($response);
?>
