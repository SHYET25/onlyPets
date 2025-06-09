<?php
// c:/xampp/htdocs/pullHCI2/phpFile/globalSide/createGroup.php
session_start();
header('Content-Type: application/json');
require_once __DIR__ . '/../connection/connection.php';

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'error', 'message' => 'Invalid request method.']);
    exit;
}

// Get POST data
$group_name = $_POST['group_name'] ?? '';
$group_description = $_POST['group_description'] ?? '';
$created_by = $_POST['created_by'] ?? '';
$member_count = $_POST['member_count'] ?? 1;
$group_members = $_POST['group_members'] ?? '';
$created_at = $_POST['created_at'] ?? date('Y-m-d H:i:s');
$updated_at = $_POST['updated_at'] ?? date('Y-m-d H:i:s');
$group_img = $_POST['group_img'] ?? '';
$group_img_filename = 'default_group.png';

if (!$group_name || !$group_description || !$created_by || !$group_members) {
    echo json_encode(['status' => 'error', 'message' => 'Missing required fields.']);
    exit;
}

if ($group_img && strpos($group_img, 'data:image/') === 0) {
    $img_parts = explode(';base64,', $group_img);
    if (count($img_parts) === 2) {
        $img_type = explode('/', substr($img_parts[0], 5))[1]; // e.g. jpeg, png
        $img_base64 = base64_decode($img_parts[1]);
        $unique_name = bin2hex(random_bytes(8));
        $group_img_filename = $unique_name . '.' . $img_type;
        $img_path = __DIR__ . '/../../media/images/groups/';
        if (!is_dir($img_path)) {
            mkdir($img_path, 0777, true);
        }
        file_put_contents($img_path . $group_img_filename, $img_base64);
    }
}

// Insert group
$stmt = $conn->prepare("INSERT INTO groups (group_name, group_description, group_img, created_by, member_count, group_members, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
$stmt->bind_param('ssssisss', $group_name, $group_description, $group_img_filename, $created_by, $member_count, $group_members, $created_at, $updated_at);

if ($stmt->execute()) {
    echo json_encode(['status' => 'success']);
} else {
    echo json_encode(['status' => 'error', 'message' => $conn->error]);
}
