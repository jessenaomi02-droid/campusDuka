<?php

// Receive the POST from Safaricom
$mpesaResponse = file_get_contents('php://input');

// Save raw response to a log file for testing
file_put_contents("mpesa_log.txt", $mpesaResponse . PHP_EOL, FILE_APPEND);

// Optional: decode JSON to use fields
$data = json_decode($mpesaResponse, true);

// Example: extract key details
if(isset($data['Body']['stkCallback'])) {
    $checkoutID = $data['Body']['stkCallback']['CheckoutRequestID'] ?? '';
    $resultCode = $data['Body']['stkCallback']['ResultCode'] ?? '';
    $resultDesc = $data['Body']['stkCallback']['ResultDesc'] ?? '';

    // Log a simple readable line
    $logLine = date('Y-m-d H:i:s') . " | CheckoutID: $checkoutID | ResultCode: $resultCode | ResultDesc: $resultDesc" . PHP_EOL;
    file_put_contents("mpesa_log.txt", $logLine, FILE_APPEND);
}

// Respond to Safaricom immediately
echo json_encode(["ResultCode" => 0, "ResultDesc" => "Callback received successfully"]);

?>
