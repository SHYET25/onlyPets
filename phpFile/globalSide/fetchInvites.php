<?php
// fetchInvites.php
// Returns all invites with group details, and checks if the session user is a member of the group
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

    // Fetch all invites and join group details
    $sql = "SELECT i.*, g.group_name, g.group_description, g.group_img, g.group_members
            FROM invites i
            JOIN groups g ON i.group_id = g.group_id
            ORDER BY i.created_at DESC";
    $result = $conn->query($sql);
    $invites = [];
    while ($row = $result->fetch_assoc()) {
        // Check if session user is a member of the group
        $group_members = json_decode($row['group_members'], true);
        $is_member = is_array($group_members) && in_array($user_email, $group_members);
        $row['is_member'] = $is_member;

        // Check if session user is already a participant
        $participants = [];
        if (isset($row['participants_email'])) {
            $participants = json_decode($row['participants_email'], true);
            if (!is_array($participants)) {
                // fallback for comma-separated string
                $participants = array_map('trim', explode(',', $row['participants_email']));
            }
        }
        $is_participant = is_array($participants) && in_array($user_email, $participants);
        $row['is_participant'] = $is_participant;

        // Check if session user is already a rejector
        $rejected = [];
        if (isset($row['rejected_email'])) {
            $rejected = json_decode($row['rejected_email'], true);
            if (!is_array($rejected)) {
                $rejected = array_map('trim', explode(',', $row['rejected_email']));
            }
        }
        $is_rejected = is_array($rejected) && in_array($user_email, $rejected);
        $row['is_rejected'] = $is_rejected;

        // Only include if user is a member and not yet a participant or rejector
        if ($is_member && !$is_participant && !$is_rejected) {
            $invites[] = $row;
        }
    }
    $response = ["status" => "success", "invites" => $invites];
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
