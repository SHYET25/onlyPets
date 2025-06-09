<?php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';

$post_id = intval($_GET['post_id'] ?? 0);
if (!$post_id) {
    echo json_encode(['status' => 'error', 'message' => 'Missing post_id']);
    exit;
}

$sql = "SELECT r.reply_text, r.created_at, r.user_email, r.vet_id,
               v.vet_fname, v.vet_lname
        FROM posted_replies r
        LEFT JOIN veterinarian v ON r.vet_id = v.vet_id
        WHERE r.post_id = ?
        ORDER BY r.created_at ASC";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $post_id);
$stmt->execute();
$result = $stmt->get_result();

$replies = [];
while ($row = $result->fetch_assoc()) {
    if ($row['vet_id']) {
        $row['author'] = "Dr. " . $row['vet_fname'] . " " . $row['vet_lname'];
    } else {
        $row['author'] = $row['user_email'];
    }
    $replies[] = $row;
}
echo json_encode(['status' => 'success', 'replies' => $replies]);
?>