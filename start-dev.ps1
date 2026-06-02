# ============================================================
# ParkingWash Development Server Startup Script
# ============================================================
# Este script inicia o backend e frontend em paralelo
# Uso: .\start-dev.ps1

Write-Host "🚀 Iniciando ParkingWash Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Cores para output
$successColor = "Green"
$errorColor = "Red"
$infoColor = "Cyan"
$warningColor = "Yellow"

# Verificar se Node.js está instalado
Write-Host "📋 Verificando dependências..." -ForegroundColor $infoColor
$nodeVersion = node --version 2>$null
if ($null -eq $nodeVersion) {
    Write-Host "❌ Node.js não está instalado!" -ForegroundColor $errorColor
    exit 1
}
Write-Host "✅ Node.js $nodeVersion encontrado" -ForegroundColor $successColor

# Verificar se npm está instalado
$npmVersion = npm --version 2>$null
if ($null -eq $npmVersion) {
    Write-Host "❌ npm não está instalado!" -ForegroundColor $errorColor
    exit 1
}
Write-Host "✅ npm $npmVersion encontrado" -ForegroundColor $successColor
Write-Host ""

# Matar processos anteriores na porta 3333 e 5173
Write-Host "🧹 Limpando portas anteriores..." -ForegroundColor $infoColor
$processes = Get-NetTCPConnection -LocalPort 3333, 5173 -ErrorAction SilentlyContinue
if ($processes) {
    foreach ($process in $processes) {
        $proc = Get-Process -Id $process.OwningProcess -ErrorAction SilentlyContinue
        if ($proc) {
            Write-Host "  Encerrando $($proc.Name) (PID: $($proc.Id))" -ForegroundColor $warningColor
            Stop-Process -Id $proc.Id -Force -ErrorAction SilentlyContinue
        }
    }
}
Write-Host ""

# Iniciar backend e frontend em paralelo
Write-Host "🎯 Iniciando servidores..." -ForegroundColor $infoColor
Write-Host ""

# Iniciar backend
Write-Host "📦 Backend iniciando na porta 3333..." -ForegroundColor $infoColor
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev:backend" -WorkingDirectory $PSScriptRoot

# Aguardar um pouco para o backend iniciar
Start-Sleep -Seconds 3

# Verificar se backend está respondendo
$backendReady = $false
$attempts = 0
$maxAttempts = 30

Write-Host "⏳ Aguardando backend ficar pronto..." -ForegroundColor $infoColor
while (-not $backendReady -and $attempts -lt $maxAttempts) {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:3333/api/parking" -ErrorAction Stop -TimeoutSec 2
        if ($response.StatusCode -eq 200) {
            $backendReady = $true
            Write-Host "✅ Backend está pronto!" -ForegroundColor $successColor
        }
    } catch {
        $attempts++
        Write-Host "  Tentativa $attempts/$maxAttempts..." -ForegroundColor $warningColor
        Start-Sleep -Seconds 1
    }
}

if (-not $backendReady) {
    Write-Host "❌ Backend não respondeu após $maxAttempts tentativas" -ForegroundColor $errorColor
    Write-Host "Verifique os logs do backend para mais detalhes" -ForegroundColor $errorColor
}

Write-Host ""

# Iniciar frontend
Write-Host "🎨 Frontend iniciando na porta 5173..." -ForegroundColor $infoColor
Start-Process -NoNewWindow -FilePath "npm" -ArgumentList "run dev:frontend" -WorkingDirectory $PSScriptRoot

Write-Host ""
Write-Host "✨ Ambiente de desenvolvimento iniciado!" -ForegroundColor $successColor
Write-Host ""
Write-Host "📍 URLs:" -ForegroundColor $infoColor
Write-Host "   Backend:  http://localhost:3333" -ForegroundColor $infoColor
Write-Host "   Frontend: http://localhost:5173" -ForegroundColor $infoColor
Write-Host ""
Write-Host "💡 Dicas:" -ForegroundColor $infoColor
Write-Host "   - Abra http://localhost:5173 no navegador" -ForegroundColor $infoColor
Write-Host "   - Os servidores continuarão rodando em background" -ForegroundColor $infoColor
Write-Host "   - Use Ctrl+C para parar os servidores" -ForegroundColor $infoColor
Write-Host ""
