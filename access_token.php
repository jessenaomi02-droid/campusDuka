<?php

include('config.php');

$credentials = base64_encode($consumerKey . ":" . $consumerSecret);

$url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

$curl = curl_init();

curl_setopt($curl, CURLOPT_URL, $url);
curl_setopt($curl, CURLOPT_HTTPHEADER, array(
    "Authorization: Basic $credentials"
));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($curl);

$result = json_decode($response);

echo $result->access_token;

?>
