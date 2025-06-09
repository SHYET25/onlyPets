<?php
// Search for groups by name or description
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
$q = isset($_GET['q']) ? trim($_GET['q']) : '';
if ($q === '') {
    echo json_encode(['status' => 'success', 'groups' => []]);
    exit;
}
$sql = "SELECT group_id, group_name, group_description, group_img, group_members FROM groups WHERE (group_name LIKE '%" . $conn->real_escape_string($q) . "%' OR group_description LIKE '%" . $conn->real_escape_string($q) . "%') ORDER BY group_name ASC LIMIT 30";
$result = $conn->query($sql);
$groups = [];
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
            $groups[] = [
                'group_id' => $row['group_id'],
                'group_name' => $row['group_name'],
                'group_description' => $row['group_description'],
                'group_img' => $row['group_img']
            ];
            if (count($groups) >= 12) break;
        }
    }
}
echo json_encode(['status' => 'success', 'groups' => $groups]);
