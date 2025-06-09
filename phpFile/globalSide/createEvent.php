<?php
// createEvent.php
// Handles creation of an event/invite with participants_email
// Expects POST data: group_id, caption, event_date, event_time, location_lat, location_lng, participants_email, created_by, media[]

require_once __DIR__ . '/../connection/connection.php';
header('Content-Type: application/json');

$response = ["status" => "error", "message" => "Unknown error."];

try {
    $group_id = $_POST['group_id'] ?? null;
    $caption = $_POST['caption'] ?? '';
    $event_date = $_POST['event_date'] ?? null;
    $event_time = $_POST['event_time'] ?? null;
    $location_lat = $_POST['location_lat'] ?? null;
    $location_lng = $_POST['location_lng'] ?? null;
    $participants_email = $_POST['participants_email'] ?? null; // Should be a JSON array or comma-separated string
    $created_by = $_POST['created_by'] ?? null;
    $created_at = date('Y-m-d H:i:s');
    $updated_at = $created_at;
    $event_title = $_POST['event_title'] ?? '';

    // Handle media upload (optional, expects files in post_images[])
    $mediaFiles = [];
    if (!empty($_FILES['post_images']['name'][0])) {
        $uploadDir = '../../media/images/posts/';
        foreach ($_FILES['post_images']['tmp_name'] as $idx => $tmpName) {
            $fileName = uniqid() . '_' . basename($_FILES['post_images']['name'][$idx]);
            $targetPath = $uploadDir . $fileName;
            if (move_uploaded_file($tmpName, $targetPath)) {
                $mediaFiles[] = $fileName;
            }
        }
    }
    $mediaJson = json_encode($mediaFiles);

    // Insert into invites table
    $stmt = $conn->prepare("INSERT INTO invites (group_id, title, caption, event_date, event_time, location_lat, location_lng, participants_email, media, created_by, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    $stmt->bind_param(
        "ssssddssssss",
        $group_id,
        $event_title,
        $caption,
        $event_date,
        $event_time,
        $location_lat,
        $location_lng,
        $participants_email,
        $mediaJson,
        $created_by,
        $created_at,
        $updated_at
    );
    if ($stmt->execute()) {
        $response = ["status" => "success", "message" => "Event/Invite created successfully."];
    } else {
        $response['message'] = "Database error: " . $stmt->error;
    }
    $stmt->close();
} catch (Exception $e) {
    $response['message'] = $e->getMessage();
}

echo json_encode($response);
