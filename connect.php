<?php
error_reporting(E_ALL);
ini_set('display_errors', 1); // Show PHP errors

$host = "localhost";
$user = "root";
$pass = "";
$db = "login";

$conn = new mysqli($host, $user, $pass, $db);

if ($conn->connect_error) {
    die("❌ Failed to connect to database: " . $conn->connect_error);
} else {
    // echo "✅ Connected successfully";
}
?>