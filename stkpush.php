<?php
error_reporting(E_ALL);
ini_set('display_errors', 1);

include('config.php');

/* =========================
   1️⃣ GET ACCESS TOKEN
   ========================= */
$credentials = base64_encode($consumerKey . ":" . $consumerSecret);
$token_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

$ch = curl_init($token_url);
curl_setopt($ch, CURLOPT_HTTPHEADER, ["Authorization: Basic ".$credentials]);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);

$token_response = curl_exec($ch);

if ($token_response === false) {
    die("Curl Error: " . curl_error($ch));
}

$token_data = json_decode($token_response);

if (!isset($token_data->access_token)) {
    die("Failed to get token. Raw response: " . $token_response);
}

$access_token = $token_data->access_token;
echo "<strong>Access Token:</strong> " . $access_token . "<br>";

/* =========================
   2️⃣ GENERATE TIMESTAMP & PASSWORD
   ========================= */
$timestamp = date("YmdHis");
$password = base64_encode($shortcode . $passkey . $timestamp);

echo "<strong>Timestamp:</strong> " . $timestamp . "<br>";
echo "<strong>STK Password:</strong> " . $password . "<br>";

/* =========================
   3️⃣ PREPARE STK PUSH PAYLOAD
   ========================= */
$data = [
    "BusinessShortCode" => $shortcode,
    "Password" => $password,
    "Timestamp" => $timestamp,
    "TransactionType" => "CustomerPayBillOnline",
    "Amount" => "1",               // Sandbox test amount
    "PartyA" => "254708374149",    // Sandbox test phone
    "PartyB" => $shortcode,
    "PhoneNumber" => "254708374149",
    "CallBackURL" => $callbackUrl,
    "AccountReference" => "CampusDuka",
    "TransactionDesc" => "Test Payment"
];

$payload = json_encode($data, JSON_PRETTY_PRINT);

echo "<strong>Payload:</strong><br><pre>" . $payload . "</pre>";

/* =========================
   4️⃣ SEND STK PUSH
   ========================= */
$url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

$curl = curl_init($url);
curl_setopt($curl, CURLOPT_HTTPHEADER, [
    "Content-Type: application/json",
    "Authorization: Bearer " . $access_token
]);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, $payload);

$response = curl_exec($curl);

if ($response === false) {
    echo "Curl Error: " . curl_error($curl);
} else {
    echo "<br><strong>STK Push Response:</strong><br><pre>" . $response . "</pre>";
}

curl_close($curl);




