# Script para configurar credenciais do Supabase
# Uso: .\configure-supabase.ps1

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  Configurador de Credenciais Supabase" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Solicitar credenciais
$supabaseUrl = Read-Host "Digite a URL do Supabase (ex: https://seu-projeto.supabase.co)"
$supabaseKey = Read-Host "Digite a service_role key do Supabase" -AsSecureString

# Converter SecureString para string
$supabaseKeyPlain = [System.Runtime.InteropServices.Marshal]::PtrToStringAuto([System.Runtime.InteropServices.Marshal]::SecureStringToCoTaskMemUnicode($supabaseKey))

# Validar entrada
if ([string]::IsNullOrWhiteSpace($supabaseUrl) -or [string]::IsNullOrWhiteSpace($supabaseKeyPlain)) {
    Write-Host "Erro: URL e chave são obrigatórias!" -ForegroundColor Red
    exit 1
}

# Atualizar backend/.env
$backendEnvPath = ".\backend\.env"
$backendEnvContent = @"
# ============================================================
# ParkingWash Backend — Variáveis de Ambiente
# ============================================================

# URL do projeto Supabase (obrigatório)
SUPABASE_URL=$supabaseUrl

# Chave de serviço do Supabase com permissões de leitura/escrita (obrigatório)
# ATENÇÃO: nunca exponha esta chave no frontend ou em repositórios públicos
SUPABASE_SERVICE_KEY=$supabaseKeyPlain

# Porta em que o servidor HTTP irá escutar (padrão: 3333)
PORT=3333

# Taxa horária de estacionamento em reais (padrão: 10.00)
HOURLY_RATE=10.00

# Teto máximo de cobrança diária em reais (padrão: 80.00)
DAILY_RATE_CAP=80.00
"@

Set-Content -Path $backendEnvPath -Value $backendEnvContent -Encoding UTF8

Write-Host ""
Write-Host "✅ Arquivo backend/.env atualizado com sucesso!" -ForegroundColor Green
Write-Host ""
Write-Host "Próximos passos:" -ForegroundColor Yellow
Write-Host "1. Reinicie o backend: npm run dev (em backend/)" -ForegroundColor White
Write-Host "2. Verifique se a conexão está funcionando" -ForegroundColor White
Write-Host "3. Teste os endpoints da API" -ForegroundColor White
Write-Host ""
Write-Host "Para testar a conexão, execute:" -ForegroundColor Yellow
Write-Host "  Invoke-WebRequest -Uri 'http://localhost:3333/api/parking'" -ForegroundColor White
Write-Host ""
