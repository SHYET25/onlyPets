<?php
require_once __DIR__ . '/../connection/connection.php';
session_start();
header('Content-Type: application/json');

$response = ["status" => "error", "message" => "Unknown error."];

try {
    // Get the user's email from the session
    $user_email = $_SESSION['userEmail'] ?? $_SESSION['data']['userEmail'] ?? null;

    if (!$user_email) {
        echo json_encode(["status" => "error", "message" => "User session not found."]);
        exit;
    }

    // Get the invite ID from POST
    if (!isset($_POST['invite_id'])) {
        echo json_encode(["status" => "error", "message" => "Invite ID not provided."]);
        exit;
    }

    $invite_id = intval($_POST['invite_id']);

    // Fetch the current invite
    $stmt = $conn->prepare("SELECT participants_email, rejected_email FROM invites WHERE id = ?");
    $stmt->bind_param("i", $invite_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $invite = $result->fetch_assoc();

    if (!$invite) {
        echo json_encode(["status" => "error", "message" => "Invite not found."]);
        exit;
    }

    // Decode the JSON columns
    $participants = json_decode($invite['participants_email'], true);
    $rejected = json_decode($invite['rejected_email'], true);

    // Ensure arrays are valid
    if (!is_array($participants)) $participants = [];
    if (!is_array($rejected)) $rejected = [];

    // Remove user from rejected
    $rejected = array_filter($rejected, function ($email) use ($user_email) {
        return trim($email) !== trim($user_email);
    });

    // Add user to participants (if not already)
    if (!in_array($user_email, $participants)) {
        $participants[] = $user_email;
    }

    // Update the database
    $updatedParticipants = json_encode(array_values($participants));
    $updatedRejected = json_encode(array_values($rejected));

    $updateStmt = $conn->prepare("UPDATE invites SET participants_email = ?, rejected_email = ? WHERE id = ?");
    $updateStmt->bind_param("ssi", $updatedParticipants, $updatedRejected, $invite_id);
    $updateStmt->execute();

    $response = ["status" => "success"];
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
