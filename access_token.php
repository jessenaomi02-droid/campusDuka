<?php

error_reporting(E_ALL);
ini_set('display_errors', 1);

include('config.php');

$credentials = base64_encode($consumerKey . ":" . $consumerSecret);

$url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

$curl = curl_init();

curl_setopt($curl, CURLOPT_URL, $url);
curl_setopt($curl, CURLOPT_HTTPHEADER, array(
    "Authorization: Basic ".$credentials
));
curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
curl_setopt($curl, CURLOPT_SSL_VERIFYPEER, false);

$response = curl_exec($curl);

if ($response === false) {
    echo "Curl Error: " . curl_error($curl);
    exit;
}

$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);

echo "HTTP Status Code: " . $httpCode . "<br><br>";
echo "Response:<br>";
echo $response;

curl_close($curl);

?>
