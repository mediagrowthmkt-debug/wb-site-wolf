<?php
/**
 * submit-form.php — Wolf Carpenters
 * PHP proxy para GHL no Hostinger.
 * Recebe JSON do frontend e cria/atualiza contato no GHL com source = "site".
 *
 * ⚠️ Troque GHL_API_KEY pelo token real da location Wolf no GHL.
 */

define('GHL_API_KEY',   'SEU_TOKEN_GHL_WOLF_AQUI');  // trocar
define('GHL_LOCATION',  'xZgZbZ25TgMXr6HsImkO');
define('GHL_API_BASE',  'https://services.leadconnectorhq.com');

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['error' => 'Method not allowed']);
    exit;
}

$raw  = file_get_contents('php://input');
$data = json_decode($raw, true);

if (!$data) {
    http_response_code(400);
    echo json_encode(['error' => 'Invalid JSON']);
    exit;
}

$name    = trim($data['name']    ?? '');
$email   = trim($data['email']   ?? '');
$phone   = trim($data['phone']   ?? '');
$service = trim($data['service'] ?? '');
$message = trim($data['message'] ?? '');
$address = trim($data['address'] ?? '');

// Dividir nome
$parts     = explode(' ', $name, 2);
$firstName = $parts[0] ?? $name;
$lastName  = $parts[1] ?? '';

$contactPayload = [
    'firstName'  => $firstName,
    'lastName'   => $lastName,
    'email'      => $email,
    'phone'      => $phone,
    'address1'   => $address,
    'locationId' => GHL_LOCATION,
    'source'     => 'site',
    'tags'       => ['site-form'],
];

$ch = curl_init(GHL_API_BASE . '/contacts/upsert');
curl_setopt_array($ch, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST           => true,
    CURLOPT_POSTFIELDS     => json_encode($contactPayload),
    CURLOPT_HTTPHEADER     => [
        'Authorization: Bearer ' . GHL_API_KEY,
        'Version: 2021-07-28',
        'Content-Type: application/json',
    ],
]);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
curl_close($ch);

if ($httpCode >= 200 && $httpCode < 300) {
    $ghlData   = json_decode($response, true);
    $contactId = $ghlData['contact']['id'] ?? $ghlData['id'] ?? null;

    // Adicionar nota com serviço + mensagem
    if ($contactId && ($service || $message)) {
        $noteText = '';
        if ($service) $noteText .= "Service: {$service}\n";
        if ($message) $noteText .= "Message: {$message}";

        $noteCh = curl_init(GHL_API_BASE . '/contacts/' . $contactId . '/notes');
        curl_setopt_array($noteCh, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST           => true,
            CURLOPT_POSTFIELDS     => json_encode(['body' => trim($noteText), 'userId' => '']),
            CURLOPT_HTTPHEADER     => [
                'Authorization: Bearer ' . GHL_API_KEY,
                'Version: 2021-07-28',
                'Content-Type: application/json',
            ],
        ]);
        curl_exec($noteCh);
        curl_close($noteCh);
    }

    http_response_code(200);
    echo json_encode(['ok' => true]);
} else {
    http_response_code(500);
    echo json_encode(['error' => 'GHL error', 'status' => $httpCode]);
}
