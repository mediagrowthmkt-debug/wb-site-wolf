<?php
/**
 * submit-form.php — Wolf Carpenters
 * PHP proxy para GHL no Hostinger.
 * Recebe JSON do frontend → cria/atualiza contato + cria oportunidade no pipeline.
 * Source sempre = "site".
 */

define('GHL_API_KEY',      'pit-86b46923-7969-4f13-8673-c37c35689c21');
define('GHL_LOCATION',     'xZgZbZ25TgMXr6HsImkO');
define('GHL_API_BASE',     'https://services.leadconnectorhq.com');
define('GHL_PIPELINE_ID',  'TocqOL1wNKEHv2442s9M');     // NOVOS LEADS
define('GHL_STAGE_ID',     '19333bab-7137-4dea-a871-1c49e322ce96'); // NOVO LEAD / LIGAR / MARCAR REUNIAO

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

/* ── Helper: chamada cURL para GHL ────────────────────────────────── */
function ghlPost(string $endpoint, array $payload): array {
    $ch = curl_init(GHL_API_BASE . $endpoint);
    curl_setopt_array($ch, [
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POST           => true,
        CURLOPT_POSTFIELDS     => json_encode($payload),
        CURLOPT_HTTPHEADER     => [
            'Authorization: Bearer ' . GHL_API_KEY,
            'Version: 2021-07-28',
            'Content-Type: application/json',
        ],
    ]);
    $body     = curl_exec($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return ['code' => $httpCode, 'body' => json_decode($body, true) ?? []];
}

/* ── 1. Criar / atualizar contato ─────────────────────────────────── */
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

$contactRes = ghlPost('/contacts/upsert', $contactPayload);

if ($contactRes['code'] < 200 || $contactRes['code'] >= 300) {
    http_response_code(500);
    echo json_encode(['error' => 'GHL contact error', 'status' => $contactRes['code']]);
    exit;
}

$contactId = $contactRes['body']['contact']['id']
          ?? $contactRes['body']['id']
          ?? null;

/* ── 2. Criar oportunidade no pipeline NOVOS LEADS ────────────────── */
if ($contactId) {
    $oppTitle = $service
        ? "Lead Site — {$service} — {$name}"
        : "Lead Site — {$name}";

    ghlPost('/opportunities/', [
        'title'       => $oppTitle,
        'pipelineId'  => GHL_PIPELINE_ID,
        'stageId'     => GHL_STAGE_ID,
        'status'      => 'open',
        'contactId'   => $contactId,
        'locationId'  => GHL_LOCATION,
        'source'      => 'site',
    ]);
}

/* ── 3. Adicionar nota com serviço + mensagem ─────────────────────── */
if ($contactId && ($service || $message)) {
    $noteLines = [];
    if ($service) $noteLines[] = "Service: {$service}";
    if ($address) $noteLines[] = "Address: {$address}";
    if ($message) $noteLines[] = "Message: {$message}";

    ghlPost('/contacts/' . $contactId . '/notes', [
        'body'   => implode("\n", $noteLines),
        'userId' => '',
    ]);
}

http_response_code(200);
echo json_encode(['ok' => true]);
