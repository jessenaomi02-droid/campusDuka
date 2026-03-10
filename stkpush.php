<?php

include('config.php');

/* STEP 1: GENERATE ACCESS TOKEN */

$credentials = base64_encode($consumerKey . ":" . $consumerSecret);

$tokenUrl = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

$curl = curl_init();

curl_setopt($curl, CURLOPT_URL, $tokenUrl);
curl_setopt($curl, CURLOPT_HTTPHEADER, array(
    "Authorization: Basic $credentials"
));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($curl);

if ($response === false) {
    die("Failed to connect to Safaricom for token.");
}

$result = json_decode($response);

if (!isset($result->access_token)) {
    die("Access token not generated.");
}

$access_token = $result->access_token;


/* STEP 2: PREPARE STK PUSH */

$timestamp = date("YmdHis");

$password = base64_encode($shortcode . $passkey . $timestamp);


/* STEP 3: STK PUSH REQUEST */

$stkUrl = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

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

curl_setopt($curl, CURLOPT_URL, $stkUrl);
curl_setopt($curl, CURLOPT_HTTPHEADER, array(
    "Content-Type: application/json",
    "Authorization: Bearer $access_token"
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

   
