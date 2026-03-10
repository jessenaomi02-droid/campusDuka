<?php

include('config.php');

/* GET ACCESS TOKEN */

$response = file_get_contents("https://YOUR-RENDER-DOMAIN.onrender.com/access_token.php");
$result = json_decode($response);

$access_token = $result->access_token;

/* GENERATE PASSWORD */

$timestamp = date("YmdHis");
$password = base64_encode($shortcode.$passkey.$timestamp);

/* STK PUSH REQUEST */

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
    "Authorization: Bearer ".$access_token
));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, json_encode($data));

$response = curl_exec($curl);

echo $response;

?>
   

