<?php
// removeAcceptedInvite.php
// Removes the session user from participants_email and adds to rejected_email for a given invite

require_once __DIR__ . '/../connection/connection.php';
session_start();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

$invite_id = isset($_POST['invite_id']) ? intval($_POST['invite_id']) : 0;
if (!$invite_id) {
    echo json_encode(['status' => 'error', 'message' => 'No invite ID provided.']);
    exit;
}

// Get session user email
$user_email = null;
if (isset($_SESSION['userEmail'])) {
    $user_email = $_SESSION['userEmail'];
} elseif (isset($_SESSION['data']['userEmail'])) {
    $user_email = $_SESSION['data']['userEmail'];
}
if (!$user_email) {
    echo json_encode(['status' => 'error', 'message' => 'Session not found.']);
    exit;
}

// Fetch current participants and rejected emails
$sql = "SELECT participants_email, rejected_email FROM invites WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param('i', $invite_id);
$stmt->execute();
$stmt->bind_result($participants_json, $rejected_json);
if (!$stmt->fetch()) {
    echo json_encode(['status' => 'error', 'message' => 'Invite not found.']);
    $stmt->close();
    exit;
}
$stmt->close();

// Decode participants and rejected arrays
$participants = [];
if ($participants_json) {
    $participants = json_decode($participants_json, true);
    if (!is_array($participants)) {
        $participants = array_map('trim', explode(',', $participants_json));
    }
}
$rejected = [];
if ($rejected_json) {
    $rejected = json_decode($rejected_json, true);
    if (!is_array($rejected)) {
        $rejected = array_map('trim', explode(',', $rejected_json));
    }
}

// Remove user from participants, add to rejected if not already present
$participants = array_filter($participants, function($email) use ($user_email) {
    return $email !== $user_email;
});
if (!in_array($user_email, $rejected)) {
    $rejected[] = $user_email;
}

// Update the invite
$sql = "UPDATE invites SET participants_email = ?, rejected_email = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$new_participants_json = json_encode(array_values($participants));
$new_rejected_json = json_encode(array_values($rejected));
$stmt->bind_param('ssi', $new_participants_json, $new_rejected_json, $invite_id);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => 'Failed to update invite.']);
}
$stmt->close();