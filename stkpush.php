<?php

include('config.php');

/* STEP 1: GET ACCESS TOKEN FROM access_token.php */

$access_token = file_get_contents("https://your-render-url.onrender.com/access_token.php");

if (!$access_token) {
    die("Failed to retrieve access token.");
}


/* STEP 2: PREPARE PASSWORD */

$timestamp = date("YmdHis");

$password = base64_encode($shortcode . $passkey . $timestamp);


/* STEP 3: STK PUSH REQUEST */

$url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

$data = array(
    "BusinessShortCode" => $shortcode,
    "Password" => $password,
    "Timestamp" => $timestamp,
    "TransactionType" => "CustomerPayBillOnline",
    "Amount" => "1",
    "PartyA" => "254708374149",
    "PartyB" => $shortcode,
    "PhoneNumber" => "254708374149",
    "CallBackURL" => $callbackUrl,
    "AccountReference" => "CampusDuka",
    "TransactionDesc" => "Test Payment"
);

$curl = curl_init();

curl_setopt($curl, CURLOPT_URL, $url);
curl_setopt($curl, CURLOPT_HTTPHEADER, array(
    "Content-Type: application/json",
    "Authorization: Bearer " . $access_token
));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($curl);

if ($response === false) {
    die("STK Push failed.");
}

echo $response;

?>
   
