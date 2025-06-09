<?php
// Returns group suggestions for the current user (not already joined)
require_once __DIR__ . '/../connection/connection.php';
session_start();
header('Content-Type: application/json');

$userEmail = null;
if (isset($_SESSION['userEmail'])) {
    $userEmail = $_SESSION['userEmail'];
} elseif (isset($_SESSION['data']['userEmail'])) {
    $userEmail = $_SESSION['data']['userEmail'];
}
if (!$userEmail) {
    echo json_encode(['status' => 'error', 'message' => 'Not logged in.']);
    exit;
}

// Suggest groups the user is not a member of, order by member count desc, limit 6
$sql = "SELECT group_id, group_name, group_description, group_img, group_members, member_count FROM groups ORDER BY member_count DESC LIMIT 30";
$result = $conn->query($sql);
$suggestions = [];
if ($result) {
    while ($row = $result->fetch_assoc()) {
        $group_members = [];
        if (isset($row['group_members'])) {
            $group_members = json_decode($row['group_members'], true);
            if (!is_array($group_members)) {
                $group_members = array_map('trim', explode(',', $row['group_members']));
            }
        }
        if (!in_array($userEmail, $group_members)) {
            $suggestions[] = [
                'group_id' => $row['group_id'],
                'group_name' => $row['group_name'],
                'group_description' => $row['group_description'],
                'group_img' => $row['group_img']
            ];
            if (count($suggestions) >= 6) break;
        }
    }
}
echo json_encode(['status' => 'success', 'groups' => $suggestions]);
