<?php
// Add the user to the group_members of the selected group
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
$groupId = isset($_POST['group_id']) ? intval($_POST['group_id']) : 0;
if (!$groupId) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid group ID.']);
    exit;
}
$sql = "SELECT group_members, member_count FROM groups WHERE group_id = $groupId";
$result = $conn->query($sql);
if (!$result || $result->num_rows === 0) {
    echo json_encode(['status' => 'error', 'message' => 'Group not found.']);
    exit;
}
$row = $result->fetch_assoc();
$members = [];
if (isset($row['group_members'])) {
    $members = json_decode($row['group_members'], true);
    if (!is_array($members)) {
        $members = array_map('trim', explode(',', $row['group_members']));
    }
}
if (in_array($userEmail, $members)) {
    echo json_encode(['status' => 'error', 'message' => 'Already a member.']);
    exit;
}
$members[] = $userEmail;
$newCount = count($members);
$membersStr = json_encode($members);
$sqlUpdate = "UPDATE groups SET group_members = '" . $conn->real_escape_string($membersStr) . "', member_count = $newCount WHERE group_id = $groupId";
$conn->query($sqlUpdate);
echo json_encode(['status' => 'success']);
