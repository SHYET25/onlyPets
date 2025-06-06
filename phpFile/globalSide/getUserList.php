<?php
include '../connection/connection.php';

$sql = "SELECT user_fname, user_email, state FROM user";
$result = $conn->query($sql);

$users = [];
while ($row = $result->fetch_assoc()) {
    $users[] = $row;
}

header('Content-Type: application/json');
echo json_encode($users);
?>