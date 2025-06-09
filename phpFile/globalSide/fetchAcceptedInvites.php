<?php
// fetchAcceptedInvites.php
// Returns all invites that the session user has accepted (is in participants_email)
require_once __DIR__ . '/../connection/connection.php';
session_start();
header('Content-Type: application/json');

$response = ["status" => "error", "message" => "Unknown error."];

try {
    // Get session user email
    $user_email = null;
    if (isset($_SESSION['userEmail'])) {
        $user_email = $_SESSION['userEmail'];
    } elseif (isset($_SESSION['data']['userEmail'])) {
        $user_email = $_SESSION['data']['userEmail'];
    }
    if (!$user_email) {
        echo json_encode(["status" => "error", "message" => "Session not found."]);
        exit;
    }

    // Fetch all invites where user is a participant and a group member
    $sql = "SELECT i.*, g.group_name, g.group_description, g.group_img, g.group_members
            FROM invites i
            JOIN groups g ON i.group_id = g.group_id
            ORDER BY i.created_at DESC";
    $result = $conn->query($sql);
    $accepted = [];
    while ($row = $result->fetch_assoc()) {
        $group_members = json_decode($row['group_members'], true);
        $is_member = is_array($group_members) && in_array($user_email, $group_members);
        $participants = [];
        if (isset($row['participants_email'])) {
            $participants = json_decode($row['participants_email'], true);
            if (!is_array($participants)) {
                $participants = array_map('trim', explode(',', $row['participants_email']));
            }
        }
        $is_participant = is_array($participants) && in_array($user_email, $participants);
        if ($is_member && $is_participant) {
            $accepted[] = $row;
        }
    }
    $response = ["status" => "success", "invites" => $accepted];
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}
echo json_encode($response);
