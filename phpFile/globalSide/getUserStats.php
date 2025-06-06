<?php
include '../connection/connection.php';

// Get user count
$sqlUser = "SELECT COUNT(*) AS total_users FROM user";
$resultUser = $conn->query($sqlUser);
$stats = $resultUser->fetch_assoc();

// Get post count
$sqlPost = "SELECT COUNT(*) AS total_posts FROM post";
$resultPost = $conn->query($sqlPost);
$postStats = $resultPost->fetch_assoc();
$stats['total_posts'] = $postStats['total_posts'];

// Get active users
$sqlActive = "SELECT COUNT(*) AS active_users FROM user WHERE state = 'active'";
$resultActive = $conn->query($sqlActive);
$activeStats = $resultActive->fetch_assoc();
$stats['active_users'] = $activeStats['active_users'];

// Get banned users
$sqlBanned = "SELECT COUNT(*) AS banned_users FROM user WHERE state = 'banned'";
$resultBanned = $conn->query($sqlBanned);
$bannedStats = $resultBanned->fetch_assoc();
$stats['banned_users'] = $bannedStats['banned_users'];

// Get suspended users
$sqlSuspended = "SELECT COUNT(*) AS suspended_users FROM user WHERE state = 'suspended'";
$resultSuspended = $conn->query($sqlSuspended);
$suspendedStats = $resultSuspended->fetch_assoc();
$stats['suspended_users'] = $suspendedStats['suspended_users'];

// Get new users this month (requires created_at column)
// $sqlNewMonth = "SELECT COUNT(*) AS new_users_this_month FROM user WHERE MONTH(created_at) = MONTH(CURRENT_DATE()) AND YEAR(created_at) = YEAR(CURRENT_DATE())";
// $resultNewMonth = $conn->query($sqlNewMonth);
// $newMonthStats = $resultNewMonth->fetch_assoc();
// $stats['new_users_this_month'] = $newMonthStats['new_users_this_month'];

header('Content-Type: application/json');
echo json_encode($stats);
?>