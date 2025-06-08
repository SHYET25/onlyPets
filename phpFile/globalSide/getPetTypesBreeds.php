<?php
include '../connection/connection.php';

$result = $conn->query("SELECT id, pet_type, pet_breeds FROM pet_type_breeds ORDER BY pet_type");
$types = [];
while ($row = $result->fetch_assoc()) {
    $row['pet_breeds'] = json_decode($row['pet_breeds']); // decode breeds array
    $types[] = $row;
}
echo json_encode($types);
?>