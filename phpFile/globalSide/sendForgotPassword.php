<?php
session_start();
date_default_timezone_set('Asia/Manila');

include '../connection/connection.php';
include '../globalSide/sendForgotPasswordLink.php'; // This contains the mailer function

header('Content-Type: application/json');

$userEmail = $_POST['userEmail'];

$response = [];

if (filter_var($userEmail, FILTER_VALIDATE_EMAIL)) {
    // Check if user exists
    $stmt = $conn->prepare("SELECT user_fname, user_lname FROM user WHERE user_email = ?");
    $stmt->bind_param("s", $userEmail);
    $stmt->execute();
    $stmt->store_result();

    if ($stmt->num_rows > 0) {
        $stmt->bind_result($fname, $lname);
        $stmt->fetch();

        if (sendForgotPasswordLink($userEmail, $fname, $lname)) {
            $_SESSION['forgotEmail'] = $userEmail;
            $response = ["status" => "success", "message" => "Reset link sent to your email."];
        } else {
            $response = ["status" => "error", "message" => "Failed to send reset email. Please try again."];
        }
    } else {
        $response = ["status" => "error", "message" => "Email not found in our records."];
    }

    $stmt->close();
} else {
    $response = ["status" => "error", "message" => "Invalid email address."];
}

$conn->close();
echo json_encode($response);
?>
