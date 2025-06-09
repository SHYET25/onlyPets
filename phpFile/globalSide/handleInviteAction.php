<?php
// handleInviteAction.php
// Accepts or declines an invite by updating participants_email or rejected_email
require_once __DIR__ . '/../connection/connection.php';
session_start();
header('Content-Type: application/json');

$response = ["status" => "error", "message" => "Unknown error."];

try {
    $invite_id = $_POST['invite_id'] ?? null;
    $action = $_POST['action'] ?? '';
    $user_email = null;
    if (isset($_SESSION['userEmail'])) {
        $user_email = $_SESSION['userEmail'];
    } elseif (isset($_SESSION['data']['userEmail'])) {
        $user_email = $_SESSION['data']['userEmail'];
    }
    if (!$invite_id || !$user_email) {
        echo json_encode(["status" => "error", "message" => "Missing invite ID or session."]);
        exit;
    }
    // Fetch current participants and rejected emails
    $sql = "SELECT participants_email, rejected_email FROM invites WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $invite_id);
    $stmt->execute();
    $stmt->bind_result($participants_json, $rejected_json);
    if (!$stmt->fetch()) {
        echo json_encode(["status" => "error", "message" => "Invite not found."]);
        exit;
    }
    $stmt->close();
    $participants = $participants_json ? json_decode($participants_json, true) : [];
    $rejected = $rejected_json ? json_decode($rejected_json, true) : [];
    if (!is_array($participants)) $participants = [];
    if (!is_array($rejected)) $rejected = [];
    if ($action === 'accept') {
        if (!in_array($user_email, $participants)) {
            $participants[] = $user_email;
        }
        // Remove from rejected if present
        $rejected = array_diff($rejected, [$user_email]);
    } elseif ($action === 'decline') {
        if (!in_array($user_email, $rejected)) {
            $rejected[] = $user_email;
        }
        // Remove from participants if present
        $participants = array_diff($participants, [$user_email]);
    } else {
        echo json_encode(["status" => "error", "message" => "Invalid action."]);
        exit;
    }
    // Update the invite
    $sql = "UPDATE invites SET participants_email = ?, rejected_email = ? WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $participants_json = json_encode(array_values($participants));
    $rejected_json = json_encode(array_values($rejected));
    $stmt->bind_param("ssi", $participants_json, $rejected_json, $invite_id);
    if ($stmt->execute()) {
        $response = ["status" => "success"];
    } else {
        $response['message'] = "Database error: " . $stmt->error;
    }
    $stmt->close();
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}
echo json_encode($response);
