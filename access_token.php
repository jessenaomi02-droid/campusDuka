<?php

include('config.php');

$credentials = base64_encode($consumerKey . ":" . $consumerSecret);

$url = "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials";

$curl = curl_init($url);

curl_setopt($curl, CURLOPT_HTTPHEADER, [
    "Authorization: Basic ".$credentials
]);

curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

$response = curl_exec($curl);

if($response === false){
    die("Curl Error: ".curl_error($curl));
}

$data = json_decode($response);

if(!isset($data->access_token)){
    die("Token Error: ".$response);
}

$access_token = $data->access_token;

curl_close($curl);

return $access_token;

?>
