<?php
// filepath: c:\xampp\htdocs\onlyPets\phpFile\userSide\vetVerify.php
include '../connection/connection.php';
header('Content-Type: application/json');

function respond($status, $message = '') {
    echo json_encode(['status' => $status, 'message' => $message]);
    exit;
}

$vet_email = trim($_POST['vet_email'] ?? '');
$otp_code = trim($_POST['otp_code'] ?? '');

if (!$vet_email || !$otp_code) {
    respond('error', 'Email and code are required.');
}

// Check OTP
$stmt = $conn->prepare("SELECT vet_id, otp_code, otp_created_at FROM veterinarian WHERE vet_email = ?");
$stmt->bind_param("s", $vet_email);
$stmt->execute();
$stmt->store_result();
$stmt->bind_result($vet_id, $db_otp, $otp_created_at);

if ($stmt->num_rows === 1) {
    $stmt->fetch();
    // Optional: check if OTP expired (e.g., 15 min)
    $expired = false;
    if ($otp_created_at) {
        $created = strtotime($otp_created_at);
        if (time() - $created > 900) $expired = true; // 900s = 15min
    }
    if ($expired) {
        respond('error', 'Verification code expired. Please request a new one.');
    }
    if ($otp_code === $db_otp) {
        // Mark as verified (e.g., set status=1, clear otp_code)
        $update = $conn->prepare("UPDATE veterinarian SET status=1, otp_code=NULL, otp_created_at=NULL WHERE vet_id=?");
        $update->bind_param("i", $vet_id);
        $update->execute();
        respond('success', 'Email verified!');
    } else {
        respond('error', 'Incorrect verification code.');
    }
} else {
    respond('error', 'Email not found.');
}
$stmt->close();
$conn->close();