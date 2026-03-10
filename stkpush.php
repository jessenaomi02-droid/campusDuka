<?php

include('config.php');

// Generate access token
$credentials = base64_encode($consumerKey . ":" . $consumerSecret);

$tokenUrl = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

$curl = curl_init();
curl_setopt($curl, CURLOPT_URL, $tokenUrl);
curl_setopt($curl, CURLOPT_HTTPHEADER, array("Authorization: Basic $credentials"));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($curl);
$result = json_decode($response);
$access_token = $result->access_token;


// STK PUSH

$timestamp = date("YmdHis");
$password = base64_encode($shortcode . $passkey . $timestamp);

$curl = curl_init();

curl_setopt_array($curl, array(
  CURLOPT_URL => "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
  CURLOPT_HTTPHEADER => array(
    "Content-Type: application/json",
    "Authorization: Bearer $access_token"
  ),
  CURLOPT_RETURNTRANSFER => true,
  CURLOPT_POST => true,
  CURLOPT_POSTFIELDS => json_encode(array(
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
    "TransactionDesc" => "Payment for item"
  ))
));

$response = curl_exec($curl);
echo $response;

?>
