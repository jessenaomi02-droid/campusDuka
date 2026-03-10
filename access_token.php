<?php

include('config.php');

$consumerKey = $consumerKey;
$consumerSecret = $consumerSecret;

$credentials = base64_encode($consumerKey.":".$consumerSecret);

$url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

$curl = curl_init($url);

curl_setopt($curl, CURLOPT_HTTPHEADER, [
    "Authorization: Basic ".$credentials
]);

curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($curl);

if(curl_errno($curl)){
    echo "Curl error: ".curl_error($curl);
    exit;
}

curl_close($curl);

echo $response;

?>
