<?php
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $phone = $_POST['phone'];
    $cart = json_decode($_POST['cart'], true);
    $total = $_POST['total'];

    // 1. Save order to DB as pending
    $conn = new mysqli("localhost", "root", "", "login");
    $stmt = $conn->prepare("INSERT INTO orders (cart_data, total_amount, phone, status) VALUES (?, ?, ?, 'pending')");
    $cart_json = json_encode($cart);
    $stmt->bind_param("sis", $cart_json, $total, $phone);
    $stmt->execute();
    $order_id = $stmt->insert_id;

    // 2. M-Pesa STK Push - Sandbox
    $consumerKey = 'NfWoIqq8et4Gs9oKyY8CXWNr6NmbcuQG51AAoCv1po09DDdW';
    $consumerSecret = 'WAqUxTyYp2BeLcuq2aUlCMKpVeaCG39CBlr2hbN3Dfphmi0K7M3ydgavpUvJWk5i';
    $BusinessShortCode = '174379';
    $Passkey = 'bfb279f9aa9bdbcf158e97dd71a467cd2e0c893059b10f78e6b72ada1ed2c919';
    $Timestamp = date('YmdHis');
    $Password = base64_encode($BusinessShortCode.$Passkey.$Timestamp);

    // Access token
    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials');
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Basic '.base64_encode($consumerKey.':'.$consumerSecret)]);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $response = json_decode(curl_exec($ch));
    curl_close($ch);
    $access_token = $response->access_token;

    // STK Push request
    $stk_data = [
        'BusinessShortCode' => $BusinessShortCode,
        'Password' => $Password,
        'Timestamp' => $Timestamp,
        'TransactionType' => 'CustomerPayBillOnline',
        'Amount' => $total,
        'PartyA' => $phone,
        'PartyB' => $BusinessShortCode,
        'PhoneNumber' => $phone,
        'CallBackURL' => ' order_id='.$order_id,
        'AccountReference' => 'UniBazaar',
        'TransactionDesc' => 'Order Payment'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, 'https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest');
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json','Authorization: Bearer '.$access_token]);
    curl_setopt($ch, CURLOPT_POST, 1);
    curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($stk_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
    $response = curl_exec($ch);
    curl_close($ch);

    echo "STK Push sent to your phone. Complete payment to proceed.";
}
?>