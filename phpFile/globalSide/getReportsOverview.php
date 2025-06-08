<?php
include '../connection/connection.php';

$type = $_GET['type'] ?? '';
$user_id = $_GET['user_id'] ?? '';
$post_id = $_GET['post_id'] ?? '';

if ($type && ($user_id || $post_id)) {
    // --- DETAILS MODE ---
    $data = [];
    if ($type === 'account' && $user_id) {
        $stmt = $conn->prepare("SELECT user_fname, user_lname, user_email, user_contact, user_img, state FROM user WHERE user_id = ?");
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        $stmt->close();
    } elseif ($type === 'post' && $post_id) {
        $stmt = $conn->prepare("SELECT p.post_caption, p.post_images, p.date_posted, u.user_fname, u.user_lname, u.user_email FROM post p LEFT JOIN user u ON p.poster_email = u.user_email WHERE p.post_id = ?");
        $stmt->bind_param("i", $post_id);
        $stmt->execute();
        $result = $stmt->get_result();
        $data = $result->fetch_assoc();
        $stmt->close();
    }
    header('Content-Type: application/json');
    echo json_encode($data ?: ['error' => 'No details found.']);
    exit;
}

// --- OVERVIEW MODE ---
$totalReports = $conn->query("SELECT COUNT(*) as cnt FROM reports")->fetch_assoc()['cnt'];
$unresolvedReports = $conn->query("SELECT COUNT(*) as cnt FROM reports WHERE status='pending'")->fetch_assoc()['cnt'];

// Get most reported user (by email)
$mostReported = $conn->query("
    SELECT u.user_email, COUNT(*) as cnt
    FROM reports r
    LEFT JOIN user u ON r.reported_user_id = u.user_id
    GROUP BY r.reported_user_id
    ORDER BY cnt DESC LIMIT 1
")->fetch_assoc();
$mostReportedUser = $mostReported ? $mostReported['user_email'] . " (" . $mostReported['cnt'] . " reports)" : null;

// Get recent reports with user id, type, and post_id
$recentReports = [];
$res = $conn->query("
    SELECT 
        u.user_email AS reported_user, 
        u.user_id AS reported_user_id, 
        r.reason, 
        r.date, 
        r.status, 
        r.type, 
        r.post_id
    FROM reports r
    LEFT JOIN user u ON r.reported_user_id = u.user_id
    ORDER BY r.date DESC
");
while ($row = $res->fetch_assoc()) {
    $recentReports[] = $row;
}

header('Content-Type: application/json');
echo json_encode([
    'totalReports' => $totalReports,
    'unresolvedReports' => $unresolvedReports,
    'mostReportedUser' => $mostReportedUser,
    'recentReports' => $recentReports
]);
?>