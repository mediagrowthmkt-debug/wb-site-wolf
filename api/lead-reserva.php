<?php
/**
 * Wolf Carpenters · envio reserva do formulário do site (MediaGrowth · Frank · 2026-11-24)
 *
 * Só é chamado pelo js/lead-reserva.js quando o webhook principal do n8n (wolf-site-lead) falha, dá erro ou passa de 8 s.
 * Ordem: 1) tenta o n8n de novo pelo servidor; 2) se o n8n continuar fora: cria o lead direto no GHL (se o arquivo de
 * configuração com o token existir FORA da pasta pública) e manda e-mail pra equipe; 3) sempre grava o lead num registro.
 * Nenhum segredo neste arquivo (o repositório é público): token do GHL só em ../wolf-lead-config.php no servidor.
 */

declare(strict_types=1);

const N8N_URL      = 'https://mediagrowth-n8n.63kuy3.easypanel.host/webhook/wolf-site-lead';
const GHL_API      = 'https://services.leadconnectorhq.com';
const GHL_LOCATION = 'xZgZbZ25TgMXr6HsImkO';
const GHL_PIPELINE = 'TocqOL1wNKEHv2442s9M';
const GHL_STAGE    = '19333bab-7137-4dea-a871-1c49e322ce96';
const GHL_MONIQUE  = 'rAvC8ZLRSnJb1YR8LxRL';
const EMAILS       = ['info@wolfcarpenters.com', 'monique@wolfcarpenters.com'];
const TAG_SPAM     = 'possível spam';
const TAG_RESERVA  = 'envio-reserva';
const MAX_BODY     = 20000;
const RATE_MAX     = 6;      // envios por IP
const RATE_JANELA  = 600;    // em 10 min

$TESTE = getenv('WOLF_RESERVA_TESTE') === '1';   // teste local: não manda e-mail nem chama GHL/n8n de verdade

function responde(int $code, array $out): void {
    http_response_code($code);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($out);
}

function s($v): string { return is_scalar($v) ? trim((string)$v) : ''; }

/* ── CORS: só o próprio domínio e subdomínios ── */
$origin = $_SERVER['HTTP_ORIGIN'] ?? '';
$hostOrigin = $origin ? (parse_url($origin, PHP_URL_HOST) ?: '') : '';
$origemOk = $hostOrigin === '' || $hostOrigin === 'wolfcarpenters.com' || substr($hostOrigin, -19) === '.wolfcarpenters.com';
if ($origin && $origemOk) {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
    header('Access-Control-Allow-Headers: Content-Type');
}
$metodo = $_SERVER['REQUEST_METHOD'] ?? 'GET';
if ($metodo === 'OPTIONS') { http_response_code(204); return; }
if ($metodo !== 'POST') { responde(405, ['ok' => false]); return; }
if (!$origemOk) { responde(403, ['ok' => false]); return; }

$raw = $TESTE ? (string)getenv('WOLF_RESERVA_BODY') : (string)file_get_contents('php://input', false, null, 0, MAX_BODY + 1);
if ($raw === '' || strlen($raw) > MAX_BODY) { responde(400, ['ok' => false]); return; }
$b = json_decode($raw, true);
if (!is_array($b)) { responde(400, ['ok' => false]); return; }

/* ── pasta de registro: fora da pasta pública quando possível ── */
$docRoot = rtrim((string)($_SERVER['DOCUMENT_ROOT'] ?? ''), '/');
$dirs = [];
if ($TESTE && getenv('WOLF_RESERVA_DIR')) $dirs[] = (string)getenv('WOLF_RESERVA_DIR');
if ($docRoot) $dirs[] = dirname($docRoot) . '/wolf-leads-reserva';
$dirs[] = __DIR__ . '/_dados';
$dir = '';
foreach ($dirs as $d) {
    if ((is_dir($d) || @mkdir($d, 0750, true)) && is_writable($d)) { $dir = $d; break; }
}
if ($dir === __DIR__ . '/_dados' && !is_file($dir . '/.htaccess')) {
    @file_put_contents($dir . '/.htaccess', "Require all denied\nDeny from all\n");
}

/* ── limite por IP ── */
$ip = s($_SERVER['HTTP_X_FORWARDED_FOR'] ?? '') ?: s($_SERVER['REMOTE_ADDR'] ?? '');
$ip = trim(explode(',', $ip)[0]);
if ($dir) {
    $rf = $dir . '/rate-' . substr(hash('sha256', $ip . 'wolf'), 0, 16) . '.json';
    $hist = is_file($rf) ? (json_decode((string)@file_get_contents($rf), true) ?: []) : [];
    $agora = time();
    $hist = array_values(array_filter($hist, fn($t) => is_int($t) && $t > $agora - RATE_JANELA));
    if (count($hist) >= RATE_MAX) { responde(429, ['ok' => false]); return; }
    $hist[] = $agora;
    @file_put_contents($rf, json_encode($hist), LOCK_EX);
}

/* ── dados do lead ── */
$nome  = s($b['name'] ?? '') ?: trim(s($b['first_name'] ?? '') . ' ' . s($b['last_name'] ?? ''));
$email = strtolower(s($b['email'] ?? ''));
if (!preg_match('/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i', $email)) $email = '';
$dig = preg_replace('/\D/', '', s($b['phone'] ?? ''));
$phone = '';
if (str_starts_with(s($b['phone'] ?? ''), '+') && strlen($dig) >= 10) $phone = '+' . $dig;
elseif (strlen($dig) === 10) $phone = '+1' . $dig;
elseif (strlen($dig) === 11 && $dig[0] === '1') $phone = '+' . $dig;
$msg = s($b['message'] ?? ($b['brief_description_of_your_situation'] ?? ''));
if ($nome === '' || ($email === '' && $phone === '')) { responde(422, ['ok' => false, 'error' => 'empty']); return; }

/* ── sinais de spam: não descarta, marca pra revisão ── */
$spam = [];
if (s($b['mg_hp'] ?? '') !== '' || s($b['company'] ?? '') !== '') $spam[] = 'campo escondido preenchido';
if (isset($b['mg_fill_s']) && is_numeric($b['mg_fill_s']) && (int)$b['mg_fill_s'] < 4) $spam[] = 'preenchido em ' . (int)$b['mg_fill_s'] . ' s';
if (preg_match_all('#https?://#i', $msg) >= 2 || preg_match('#https?://|www\.#i', $nome)) $spam[] = 'links no texto';
if (preg_match('/[\x{0400}-\x{04FF}\x{4E00}-\x{9FFF}]/u', $nome . ' ' . $msg)) $spam[] = 'alfabeto estrangeiro';

/* ── canal (mesmo mapa do n8n "Prepara lead") ── */
$pageUrl = s($b['page_url'] ?? '') ?: (preg_match('/Page:\s*(\S+)/', $msg, $m) ? $m[1] : '');
$path = strtolower(preg_replace('#^https?://[^/]+#', '', explode('?', explode('#', $pageUrl)[0])[0]));
$qs = [];
foreach ([s($b['landing_page'] ?? ''), $pageUrl] as $u) { $q = []; parse_str((string)parse_url($u, PHP_URL_QUERY), $q); $qs[] = $q; }
$p = function (string $k) use ($b, $qs): string { $v = s($b[$k] ?? ''); if ($v !== '') return $v; foreach ($qs as $q) if (!empty($q[$k]) && is_string($q[$k])) return trim($q[$k]); return ''; };
$us = strtolower($p('utm_source')); $um = strtolower($p('utm_medium')); $org = strtolower(s($b['mg_origin'] ?? ''));
$validos = ['google-ads', 'meta-ads', 'pinterest-ads', 'gbp', 'seo', 'site'];
if ($p('gclid') || $p('gbraid') || $p('wbraid')) $canal = 'google-ads';
elseif ($p('fbclid') || preg_match('/^(facebook|instagram|fb|ig|meta)$/', $us)) $canal = 'meta-ads';
elseif (str_starts_with($us, 'pinterest')) $canal = 'pinterest-ads';
elseif ($us === 'gbp') $canal = 'gbp';
elseif (preg_match('/^(cpc|ppc)$/', $um)) $canal = 'google-ads';
elseif (in_array($org, $validos, true)) $canal = $org;
elseif ($org === 'organic') $canal = 'seo';
else $canal = (s($b['source'] ?? '') === 'blog/artigo' || preg_match('#^/(blog|service-areas)/|^/services/[^/]+/[^/]+#', $path)) ? 'seo' : 'site';
$tagCanal = ['site' => 'site-wolf', 'seo' => 'seo-wolf', 'gbp' => 'gbp-wolf', 'google-ads' => 'google-wolf', 'meta-ads' => 'meta-wolf', 'pinterest-ads' => 'pinterest-wolf'][$canal];
$prefixo  = ['gbp' => 'GBP', 'seo' => 'SEO', 'site' => 'SITE', 'google-ads' => 'GOOGLE', 'meta-ads' => 'META', 'pinterest-ads' => 'PINTEREST'][$canal];

/* ── registro (antes de tudo: é a garantia de que o lead não se perde) ── */
$envioId = preg_replace('/[^a-z0-9]/i', '', s($b['mg_envio_id'] ?? '')) ?: bin2hex(random_bytes(6));
$registro = function (array $extra) use ($dir, $b, $envioId, $canal, $spam, $ip) {
    if (!$dir) return false;
    $linha = json_encode(array_merge(['quando' => date('c'), 'envio' => $envioId, 'canal' => $canal, 'spam' => $spam,
        'ip' => substr(hash('sha256', $ip), 0, 12), 'lead' => $b], $extra), JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    return (bool)@file_put_contents($dir . '/leads-' . date('Y-m') . '.jsonl', $linha . "\n", FILE_APPEND | LOCK_EX);
};
if ($dir && is_file($dir . '/envio-' . $envioId)) { responde(200, ['ok' => true, 'dup' => true]); return; }
if ($dir) @touch($dir . '/envio-' . $envioId);

function http_json(string $metodo, string $url, ?array $corpo, array $hdr, int $timeout): array {
    $ch = curl_init($url);
    curl_setopt_array($ch, [CURLOPT_CUSTOMREQUEST => $metodo, CURLOPT_RETURNTRANSFER => true, CURLOPT_TIMEOUT => $timeout,
        CURLOPT_CONNECTTIMEOUT => min(5, $timeout), CURLOPT_USERAGENT => 'WolfSiteReserva/1.0',
        CURLOPT_HTTPHEADER => array_merge(['Content-Type: application/json', 'Accept: application/json'], $hdr)]);
    if ($corpo !== null) curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($corpo));
    $resp = curl_exec($ch);
    $code = (int)curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);
    return [$code, is_string($resp) ? (json_decode($resp, true) ?: []) : []];
}

/* ── 1) n8n de novo, pelo servidor ── */
$fwd = $b; $fwd['mg_reserva'] = 'servidor';
[$c8n] = $TESTE ? [(int)(getenv('WOLF_RESERVA_N8N') ?: 0), []] : http_json('POST', N8N_URL, $fwd, [], 6);
if ($c8n >= 200 && $c8n < 300) {
    $registro(['destino' => 'n8n (pelo servidor)']);
    responde(200, ['ok' => true, 'via' => 'n8n']);
    return;
}

/* ── 2) n8n fora: GHL direto (se houver token no servidor) ── */
$cfg = [];
$cfgFile = $docRoot ? dirname($docRoot) . '/wolf-lead-config.php' : '';
if ($cfgFile && is_file($cfgFile)) { $tmp = include $cfgFile; if (is_array($tmp)) $cfg = $tmp; }
$token = s($cfg['ghl_token'] ?? '');
$ghl = ['feito' => false];
$tags = [$tagCanal, 'lead-wolf', TAG_RESERVA];
if ($spam) $tags[] = TAG_SPAM;
$partes = preg_split('/\s+/', $nome);
$oppName = ($spam ? 'REVISAR SPAM - ' : '') . $prefixo . ' - ' . $nome . (s($b['service'] ?? '') ? ' · ' . s($b['service'] ?? '') : '');
$linhasNota = ['New lead from the website (BACKUP PATH: n8n was down, motivo ' . s($b['mg_reserva_motivo'] ?? '?') . ', channel: ' . $canal . ')'];
if ($spam) $linhasNota[] = 'POSSIBLE SPAM, please review: ' . implode(', ', $spam);
if ($pageUrl) $linhasNota[] = 'Page: ' . $pageUrl;
$linhasNota[] = '';
foreach ($b as $k => $v) {
    if (in_array($k, ['recaptcha_token', 'g-recaptcha-response', 'company', 'manual_human_check', 'human_validation_method', 'mg_envio_id'], true)) continue;
    if ($v === '' || $v === null) continue;
    $linhasNota[] = $k . ': ' . (is_scalar($v) ? (string)$v : json_encode($v));
}
$nota = implode("\n", $linhasNota);
$novoContato = false; $oppId = ''; $contatoId = '';
if ($token && !$TESTE) {
    $H = ['Authorization: Bearer ' . $token, 'Version: 2021-07-28'];
    $up = ['locationId' => GHL_LOCATION, 'firstName' => $partes[0]];   // etiquetas vão à parte (upsert com tags apagaria as antigas)
    if (count($partes) > 1) $up['lastName'] = implode(' ', array_slice($partes, 1));
    if ($email) $up['email'] = $email;
    if ($phone) $up['phone'] = $phone;
    if (s($b['address'] ?? '')) $up['address1'] = s($b['address'] ?? '');
    $cf = [];
    if ($msg) $cf[] = ['key' => 'brief_description_of_your_situation', 'field_value' => $msg];
    if (s($b['service'] ?? '')) $cf[] = ['key' => 'service', 'field_value' => s($b['service'] ?? '')];
    $clid = ['gclid' => 'hM7sKanKzFDAgtqmpZw2', 'gbraid' => 'aZkvHQMuo2CIc59o5pQt', 'wbraid' => 'l9zKvjSyHadd6mqfSCKy', 'fbclid' => 'QA5J9Ubv994E1AZiNQNO'];
    foreach ($clid as $k => $id) if ($p($k)) $cf[] = ['id' => $id, 'field_value' => $p($k)];
    if ($cf) $up['customFields'] = $cf;
    [$cu, $ju] = http_json('POST', GHL_API . '/contacts/upsert', $up, $H, 12);
    $contatoId = s($ju['contact']['id'] ?? '');
    $novoContato = ($ju['new'] ?? false) === true;
    if ($contatoId) {
        http_json('POST', GHL_API . '/contacts/' . $contatoId . '/tags', ['tags' => $tags], $H, 10);
        http_json('POST', GHL_API . '/contacts/' . $contatoId . '/notes', ['body' => $nota], $H, 10);
        [, $jb] = http_json('GET', GHL_API . '/opportunities/search?location_id=' . GHL_LOCATION . '&pipeline_id=' . GHL_PIPELINE . '&status=open&contact_id=' . $contatoId, null, $H, 10);
        if (empty($jb['opportunities'])) {
            [, $jo] = http_json('POST', GHL_API . '/opportunities/', ['pipelineId' => GHL_PIPELINE, 'pipelineStageId' => GHL_STAGE,
                'locationId' => GHL_LOCATION, 'status' => 'open', 'assignedTo' => GHL_MONIQUE, 'contactId' => $contatoId,
                'name' => $oppName, 'source' => $canal], $H, 12);
            $oppId = s($jo['opportunity']['id'] ?? '');
        }
        $ghl = ['feito' => true, 'contato' => $contatoId, 'card' => $oppId, 'novo' => $novoContato, 'http' => $cu];
    } else {
        $ghl = ['feito' => false, 'http' => $cu];
    }
}

/* ── 3) e-mail pra equipe (n8n fora = sempre avisa) ── */
$assunto = ($spam ? '[REVIEW: possible spam] ' : '') . 'New website lead (backup): ' . $nome;
$corpoEmail = "A new lead came in through the website backup path (the main form system was offline).\n"
    . ($ghl['feito'] ? "It was also created in the CRM (contact " . $ghl['contato'] . ").\n" : "It is NOT in the CRM yet: please add it manually.\n")
    . "\n" . $nota . "\n";
$enviou = false;
if (!$TESTE) {
    $headers = "From: Wolf Carpenters Website <no-reply@wolfcarpenters.com>\r\n"
        . ($email ? "Reply-To: " . $email . "\r\n" : '')
        . "Content-Type: text/plain; charset=UTF-8\r\n";
    $enviou = @mail(implode(',', EMAILS), '=?UTF-8?B?' . base64_encode($assunto) . '?=', $corpoEmail, $headers, '-fno-reply@wolfcarpenters.com');
}
$gravou = $registro(['destino' => 'reserva', 'n8n_http' => $c8n, 'ghl' => $ghl, 'email' => $enviou, 'assunto' => $assunto]);

if (!$gravou && !$enviou && !$ghl['feito']) { responde(500, ['ok' => false]); return; }
responde(200, ['ok' => true, 'via' => 'reserva', 'crm' => $ghl['feito'], 'spam' => (bool)$spam]);

/* ── depois de responder: trava o source do contato novo (a automação do GHL troca ~2 s depois, igual ao n8n) ── */
if ($token && !$TESTE && $novoContato && $contatoId) {
    ignore_user_abort(true);
    if (function_exists('litespeed_finish_request')) litespeed_finish_request();
    elseif (function_exists('fastcgi_finish_request')) fastcgi_finish_request();
    sleep(8);
    $H = ['Authorization: Bearer ' . $token, 'Version: 2021-07-28'];
    http_json('PUT', GHL_API . '/contacts/' . $contatoId, ['source' => $canal], $H, 10);
    if ($oppId) http_json('PUT', GHL_API . '/opportunities/' . $oppId, ['pipelineId' => GHL_PIPELINE, 'source' => $canal, 'name' => $oppName], $H, 10);
}
