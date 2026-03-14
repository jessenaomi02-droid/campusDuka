<?php
// access_token.php
include('config.php');

$credentials = base64_encode($consumerKey . ":" . $consumerSecret);

$url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

$curl = curl_init($url);

curl_setopt($curl, CURLOPT_HTTPHEADER, [
    "Authorization: Basic ".$credentials
]);

curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($curl);

curl_close($curl);

// Check for errors
if($response === false){
    die("Curl Error: ".curl_error($curl));
}

$token_data = json_decode($response);

if(!isset($token_data->access_token)){
    die("Token Error: ".$response);
}

// Return only the access token
return $token_data->access_token;
