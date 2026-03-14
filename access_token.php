<?php
// access_token.php - sandbox version that prints the token

include('config.php');

$credentials = base64_encode($consumerKey . ":" . $consumerSecret);

$url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

$curl = curl_init($url);
curl_setopt($curl, CURLOPT_HTTPHEADER, [
    "Authorization: Basic ".$credentials
]);
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($curl);

if($response === false){
    die("Curl Error: ".curl_error($curl));
}

// Decode JSON
$token_data = json_decode($response);

// Check if access_token exists
if(isset($token_data->access_token)){
    echo "Access Token: " . $token_data->access_token;
} else {
    echo "Failed to get token. Raw response: " . $response;
}

curl_close($curl);
