<?php
// fetchRejectedInvites.php
// Returns all invites that the session user has explicitly rejected
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

    // Fetch all invites where user is a group member and in rejected_email
    $sql = "SELECT i.*, g.group_name, g.group_description, g.group_img, g.group_members
            FROM invites i
            JOIN groups g ON i.group_id = g.group_id
            ORDER BY i.created_at DESC";
    $result = $conn->query($sql);

    $rejected = [];

    while ($row = $result->fetch_assoc()) {
        // Check if user is a group member
        $group_members = json_decode($row['group_members'], true);
        $is_member = is_array($group_members) && in_array($user_email, $group_members);

        // Check if user is in rejected_email
        $rejected_emails = [];
        if (isset($row['rejected_email'])) {
            $rejected_emails = json_decode($row['rejected_email'], true);
            if (!is_array($rejected_emails)) {
                $rejected_emails = array_map('trim', explode(',', $row['rejected_email']));
            }
        }
        $has_rejected = is_array($rejected_emails) && in_array($user_email, $rejected_emails);

        if ($is_member && $has_rejected) {
            $rejected[] = $row;
        }
    }

    $response = ["status" => "success", "invites" => $rejected];
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
