<?php
// filepath: phpFile/globalSide/searchSuggestions.php
header('Content-Type: application/json');
include '../connection/connection.php';

$search = isset($_POST['query']) ? $_POST['query'] : '';
$suggestions = [];

if ($search !== '') {
    $stmt = $conn->prepare("SELECT user_email, user_fname, user_lname, user_img, user_country, user_province, user_city, user_baranggay FROM user WHERE CONCAT(user_fname, ' ', user_lname) LIKE ? LIMIT 5");
    $like = "%$search%";
    $stmt->bind_param("s", $like);
    $stmt->execute();
    $result = $stmt->get_result();
    while ($row = $result->fetch_assoc()) {
        $location = [];
        if (!empty($row['user_baranggay'])) $location[] = $row['user_baranggay'];
        if (!empty($row['user_city'])) $location[] = $row['user_city'];
        if (!empty($row['user_province'])) $location[] = $row['user_province'];
        if (!empty($row['user_country'])) $location[] = $row['user_country'];
        $suggestions[] = [
            'name' => $row['user_fname'] . ' ' . $row['user_lname'],
            'img' => $row['user_img'],
            'location' => implode(', ', $location),
            'email' => $row['user_email'],
            'fname' => $row['user_fname'],
            'lname' => $row['user_lname'],
            'country' => $row['user_country'],
            'province' => $row['user_province'],
            'city' => $row['user_city'],
            'baranggay' => $row['user_baranggay']
        ];
    }
    $stmt->close();
}
$conn->close();
echo json_encode($suggestions);
?>
