<?php
use PHPMailer\PHPMailer\PHPMailer;
use PHPMailer\PHPMailer\Exception;

require '../../vendor/autoload.php';

function otpSender($email, $otp, $fname, $lname) {
    $mail = new PHPMailer(true);
    try {
        $mail->isSMTP();
        $mail->Host = 'smtp.gmail.com';
        $mail->SMTPAuth = true;
        $mail->Username = 'josephmirasol25@gmail.com';
        $mail->Password = 'afvl lgqm cqxb afqs';
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
        $mail->Port = 587;

        $mail->setFrom('no-reply@yourdomain.com', 'Only Pets');
        $mail->addAddress($email);
        $mail->isHTML(true);
        $mail->Subject = 'Your OnlyPets OTP Code';
        $mail->Body = "Hi $fname $lname,<br><br>Your OTP is: <b>$otp</b><br>This expires in 10 minutes.";

        $mail->send();
        return true;
    } catch (Exception $e) {
        error_log("Mailer error: {$mail->ErrorInfo}");
        return false;
    }
}
?>