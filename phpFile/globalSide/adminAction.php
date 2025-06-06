<?php
include '../connection/connection.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $email = $_POST['email'] ?? '';
    $action = $_POST['action'] ?? '';

    if (!$email || !$action) {
        echo json_encode(['success' => false, 'error' => 'Missing parameters']);
        exit;
    }

    // Get user_id from email
    $user_id = null;
    $getIdStmt = $conn->prepare("SELECT user_id FROM user WHERE user_email = ?");
    $getIdStmt->bind_param("s", $email);
    $getIdStmt->execute();
    $getIdStmt->bind_result($user_id);
    $getIdStmt->fetch();
    $getIdStmt->close();

    if (!$user_id) {
        echo json_encode(['success' => false, 'error' => 'User not found']);
        exit;
    }

    if ($action === 'delete') {
        $stmt = $conn->prepare("DELETE FROM user WHERE user_email = ?");
        $stmt->bind_param("s", $email);
    } elseif ($action === 'ban') {
        $days = isset($_POST['days']) ? intval($_POST['days']) : 7;
        $expires = date('Y-m-d H:i:s', strtotime("+$days days"));
        $stmt = $conn->prepare("UPDATE user SET state = 'banned', state_expires_at = ? WHERE user_email = ?");
        $stmt->bind_param("ss", $expires, $email);
    } elseif ($action === 'suspend') {
        $days = isset($_POST['days']) ? intval($_POST['days']) : 3;
        $expires = date('Y-m-d H:i:s', strtotime("+$days days"));
        $stmt = $conn->prepare("UPDATE user SET state = 'suspended', state_expires_at = ? WHERE user_email = ?");
        $stmt->bind_param("ss", $expires, $email);
    } elseif ($action === 'activate') {
        $stmt = $conn->prepare("UPDATE user SET state = 'active', state_expires_at = NULL WHERE user_email = ?");
        $stmt->bind_param("s", $email);
    } else {
        echo json_encode(['success' => false, 'error' => 'Invalid action']);
        exit;
    }

    if ($stmt->execute()) {
        if (in_array($action, ['ban', 'suspend', 'activate'])) {
            // Use user_id to resolve reports
            $updateReports = $conn->prepare("UPDATE reports SET status = 'resolved' WHERE reported_user_id = ? AND status = 'pending'");
            $updateReports->bind_param("i", $user_id);
            $updateReports->execute();
            $updateReports->close();
        }
        echo json_encode(['success' => true]);
    } else {
        echo json_encode(['success' => false, 'error' => $conn->error]);
    }
    $stmt->close();
} else {
    echo json_encode(['success' => false, 'error' => 'Invalid request']);
}
?>