<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../../vendor/autoload.php';
require '../connection/connection.php'; // ✅ Include your DB connection

function sendForgotPasswordLink($email, $fname, $lname) {
    global $conn; // ✅ Use the global $conn inside the function

    $mail = new PHPMailer(true);

    try {
        $token = bin2hex(random_bytes(16));
        $link = "http://localhost/pullHCI2/forgotPass.html?email=" . urlencode($email) . "&token=" . $token;

        // ✅ Save the token to the database
        $stmt = $conn->prepare("INSERT INTO password_resets (email, token, created_at) VALUES (?, ?, NOW())");
        $stmt->bind_param("ss", $email, $token);
        $stmt->execute();
        $stmt->close();

        // ✅ Configure and send the email
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'josephmirasol25@gmail.com';
        $mail->Password = 'mmgt emyv rgtm fcbr';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('no-reply@yourdomain.com', 'Only Pets');
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = 'OnlyPets Password Reset Request';
        $mail->Body = "Hi $fname $lname,<br><br>Click below to reset your password:<br><a href='$link'>$link</a><br><br>This link will expire in 15 minutes.";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Mailer Error: {$mail->ErrorInfo}");
        return false;
    }
}
?>
