<?php
session_start();
header('Content-Type: application/json');

require_once __DIR__ . '/../connection/connection.php';

$response = [
    'in_group' => false,
    'groups' => [],
    'user_email' => null
];

// Get the user's email from session
if (!isset($_SESSION['userEmail'])) {
    http_response_code(401);
    echo json_encode(['error' => 'User not logged in']);
    exit;
}

$user_email = $_SESSION['userEmail'];
$response['user_email'] = $user_email;

$sql = "SELECT group_id, group_img, group_name, group_description, created_by, member_count, group_members, created_at, updated_at FROM groups";
$result = $conn->query($sql);

if ($result && $result->num_rows > 0) {
    while ($row = $result->fetch_assoc()) {
        // group_members is assumed to be a JSON array of user emails
        $members = json_decode($row['group_members'], true);
        if (is_array($members) && in_array($user_email, $members)) {
            $response['in_group'] = true;
        }
        $row['group_members'] = $members;
        $response['groups'][] = $row;
    }
}

echo json_encode($response);
