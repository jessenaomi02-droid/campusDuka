<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

include('config.php');

/* GET ACCESS TOKEN */

$response = file_get_contents("https://campusduka.onrender.com/access_token.php");
$result = json_decode($response);

$access_token = $result->access_token;


/* GENERATE PASSWORD */

$timestamp = date("YmdHis");

$password = base64_encode($shortcode.$passkey.$timestamp);


/* STK PUSH REQUEST */

$url = "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest";

$data = array(
    "BusinessShortCode"=>$shortcode,
    "Password"=>$password,
    "Timestamp"=>$timestamp,
    "TransactionType"=>"CustomerPayBillOnline",
    "Amount"=>"1",
    "PartyA"=>"254708374149",
    "PartyB"=>$shortcode,
    "PhoneNumber"=>"254708374149",
    "CallBackURL"=>$callbackUrl,
    "AccountReference"=>"CampusDuka",
    "TransactionDesc"=>"Test Payment"
);

$payload = json_encode($data);

$curl = curl_init($url);

curl_setopt($curl, CURLOPT_HTTPHEADER, array(
    "Content-Type: application/json",
    "Authorization: Bearer ".$access_token
));

curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_POST, true);
curl_setopt($curl, CURLOPT_POSTFIELDS, $payload);

$response = curl_exec($curl);

echo $response;

curl_close($curl);

?>

