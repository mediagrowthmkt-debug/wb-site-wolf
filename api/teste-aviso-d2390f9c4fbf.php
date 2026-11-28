<?php
// teste único do aviso por e-mail da reserva (28-11-26), removido logo após o teste
header('Content-Type: text/plain');
$h = "From: Wolf Carpenters Website <no-reply@wolfcarpenters.com>\r\nMIME-Version: 1.0\r\nContent-Type: text/plain; charset=UTF-8\r\n";
$ok = @mail('wolfspf015e6346@euploading.com', 'Teste aviso reserva', "Teste tecnico MediaGrowth, sem lead.", $h, '-fno-reply@wolfcarpenters.com');
echo $ok ? 'ok' : 'falhou';
