<?php
session_start();
session_unset();
session_destroy();
http_response_code(200); // optional, just makes response cleaner
?>
