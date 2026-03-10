<?php

error_reporting(E_ALL);
ini_set('display_errors',1);

include('config.php');

/* GET ACCESS TOKEN */

$credentials = base64_encode($consumerKey.":".$consumerSecret);

$token_url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

$ch = curl_init($token_url);

curl_setopt($ch, CURLOPT_HTTPHEADER, [
    "Authorization: Basic ".$credentials
]);

curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);

$token_response = curl_exec($ch);

$token_data = json_decode($token_response);

$access_token = $token_data->access_token;

curl_close($ch);


/* GENERATE PASSWORD */

$timestamp = date("YmdHis");

$password = base64_encode($shortcode.$passkey.$timestamp);


/* STK PUSH */

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

$payload=json_encode($data);

$curl=curl_init($url);

curl_setopt($curl, CURLOPT_HTTPHEADER, array(
"Content-Type: application/json",
"Authorization: Bearer ".$access_token
));

curl_setopt($curl, CURLOPT_RETURNTRANSFER,true);
curl_setopt($curl, CURLOPT_POST,true);
curl_setopt($curl, CURLOPT_POSTFIELDS,$payload);

$response=curl_exec($curl);

echo $response;

curl_close($curl);

?>
