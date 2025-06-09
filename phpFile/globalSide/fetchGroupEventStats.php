<?php
// Returns group info and event stats for a group (accepted/rejected counts per event)
require_once __DIR__ . '/../connection/connection.php';
header('Content-Type: application/json');
session_start();

$group_id = isset($_GET['group_id']) ? intval($_GET['group_id']) : 0;
if (!$group_id) {
    echo json_encode(['status' => 'error', 'message' => 'Invalid group id.']);
    exit;
}

// Fetch group info
$group = null;
$sql = "SELECT * FROM groups WHERE group_id = $group_id";
$res = $conn->query($sql);
if ($res && $res->num_rows > 0) {
    $group = $res->fetch_assoc();
}
if (!$group) {
    echo json_encode(['status' => 'error', 'message' => 'Group not found.']);
    exit;
}

// Fetch events for this group
$sql = "SELECT * FROM invites WHERE group_id = $group_id ORDER BY created_at DESC";
$res = $conn->query($sql);
$events = [];
if ($res) {
    while ($row = $res->fetch_assoc()) {
        // Count accepted
        $accepted = [];
        if (isset($row['participants_email'])) {
            $accepted = json_decode($row['participants_email'], true);
            if (!is_array($accepted)) {
                $accepted = array_map('trim', explode(',', $row['participants_email']));
            }
        }
        // Count rejected
        $rejected = [];
        if (isset($row['rejected_email'])) {
            $rejected = json_decode($row['rejected_email'], true);
            if (!is_array($rejected)) {
                $rejected = array_map('trim', explode(',', $row['rejected_email']));
            }
        }
        $row['accepted_count'] = count(array_filter($accepted));
        $row['rejected_count'] = count(array_filter($rejected));
        $events[] = $row;
    }
}
echo json_encode(['status' => 'success', 'group' => $group, 'events' => $events]);
