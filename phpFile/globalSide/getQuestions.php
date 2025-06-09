<?php
session_start();
header('Content-Type: application/json');
include '../connection/connection.php';


// Fetch all questions, newest first
$sql = "SELECT q.*, u.user_fname, u.user_lname, u.user_img
        FROM posted_question q
        LEFT JOIN user u ON q.asker_email = u.user_email
        ORDER BY q.date_posted DESC";
$result = $conn->query($sql);

$questions = [];
while ($row = $result->fetch_assoc()) {
    $row['media'] = json_decode($row['media'], true);
    $row['tagged_users'] = json_decode($row['tagged_users'], true);
    $row['tagged_pets'] = json_decode($row['tagged_pets'], true);

    // Attach vet info if exclusive
    if ($row['scope'] === 'exclusive' && !empty($row['exclusive_vet_id'])) {
        $vetStmt = $conn->prepare("SELECT vet_fname, vet_lname, vet_img, vet_license FROM veterinarian WHERE vet_id = ?");
        $vetStmt->bind_param("i", $row['exclusive_vet_id']);
        $vetStmt->execute();
        $vetResult = $vetStmt->get_result();
        $row['exclusive_vet'] = $vetResult->fetch_assoc();
    }

    $questions[] = $row;
}
echo json_encode(['status' => 'success', 'questions' => $questions]);
?>