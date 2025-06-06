<?php
include '../connection/connection.php';

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

// Get recent reports with user email
$recentReports = [];
$res = $conn->query("
    SELECT u.user_email AS reported_user, r.reason, r.date, r.status
    FROM reports r
    LEFT JOIN user u ON r.reported_user_id = u.user_id
    ORDER BY r.date DESC
");
while ($row = $res->fetch_assoc()) {
    $recentReports[] = $row;
}

echo json_encode([
    'totalReports' => $totalReports,
    'unresolvedReports' => $unresolvedReports,
    'mostReportedUser' => $mostReportedUser,
    'recentReports' => $recentReports
]);
?>