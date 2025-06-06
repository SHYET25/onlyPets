<?php
include '../connection/connection.php';

$email = $_GET['email'] ?? '';
$history = [];
$post_count = 0;

if ($email) {
    // Fetch login history
    $stmt = $conn->prepare("SELECT login_time FROM user_login_logs WHERE user_email = ? ORDER BY login_time DESC LIMIT 10");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $history[] = $row;
    }
    $stmt->close();

    // Fetch post count
    $stmt2 = $conn->prepare("SELECT COUNT(*) as cnt FROM post WHERE poster_email = ?");
    $stmt2->bind_param("s", $email);
    $stmt2->execute();
    $stmt2->bind_result($post_count);
    $stmt2->fetch();
    $stmt2->close();
}

header('Content-Type: application/json');
echo json_encode([
    'login_history' => $history,
    'post_count' => $post_count
]);
?>