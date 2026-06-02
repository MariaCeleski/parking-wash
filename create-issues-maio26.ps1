# =============================================================================
# Script para criar Issues no GitHub — Alterações realizadas desde 26/05/2026
# =============================================================================
# Repositório: IA-para-DEVs-SCTEC-T2/parking-wash
#
# COMO EXECUTAR:
#   1. Abra o PowerShell na pasta do projeto
#   2. Execute: .\parking-wash\create-issues-maio26.ps1
#   3. O script usa as credenciais do Git (git credential fill)
#
# Se preferir usar um token manualmente, descomente a linha abaixo:
# $token = "ghp_SEU_TOKEN_AQUI"
# =============================================================================

$cred = "protocol=https`nhost=github.com`n" | git credential fill 2>$null
$token = ($cred | Select-String "password=").ToString().Replace("password=","")
$headers = @{ Authorization = "token $token"; Accept = "application/vnd.github.v3+json" }
$repo = "IA-para-DEVs-SCTEC-T2/parking-wash"
$baseUrl = "https://api.github.com/repos/$repo/issues"

$issues = @(
  # =========================================================================
  # ISSUE 1 — Fix vehicle type in wash orders + timestamps
  # Commit: ec75e2b (26/05)
  # =========================================================================
  @{
    title = "[Fix] Correcao do tipo de veiculo em ordens de lavagem + timestamps"
    body = "## Descricao`n`nCorrigido o campo vehicle_type nas ordens de lavagem (wash orders) que nao estava sendo salvo corretamente. Adicionados timestamps de criacao e atualizacao.`n`n## Alteracoes Realizadas`n- Corrigido mapeamento do campo vehicle_type no backend`n- Adicionados campos created_at e updated_at nas ordens`n- Validacao do tipo de veiculo antes de salvar`n`n## Branch`nfeature/wash-queue-vehicle-type-fix`n`n## Status`n:white_check_mark: Concluido em 26/05/2026"
    labels = @("bug", "backend")
  },

  # =========================================================================
  # ISSUE 2 — Pricing rules (6h threshold) + toast + receipt
  # Commit: 335fe61 (26/05)
  # =========================================================================
  @{
    title = "[Feature] Regras de precificacao (threshold 6h) + toast + recibo de checkout"
    body = "## Descricao`n`nImplementadas regras de precificacao com threshold de 6 horas para aplicacao de tarifa diaria, notificacoes toast no frontend e recibo detalhado no checkout.`n`n## Alteracoes Realizadas`n- Regra: se duracao >= 6h, aplica tarifa diaria automaticamente`n- Toast notifications para feedback visual (check-in, checkout, erros)`n- Recibo de checkout com detalhes: placa, tipo, entrada, saida, duracao, valor`n- Documentacao das regras em PRICING_IMPLEMENTATION_RULES.md`n`n## Branch`nfeature/pricing-rules-toast-receipt`n`n## Status`n:white_check_mark: Concluido em 26/05/2026"
    labels = @("enhancement", "frontend", "backend")
  },

  # =========================================================================
  # ISSUE 3 — Pricing implementation rules documentation
  # Commit: 1f1800e (26/05)
  # =========================================================================
  @{
    title = "[Docs] Documentacao das regras de precificacao"
    body = "## Descricao`n`nCriada documentacao detalhada das regras de calculo de tarifa do estacionamento.`n`n## Alteracoes Realizadas`n- Criado arquivo PRICING_IMPLEMENTATION_RULES.md`n- Documentadas formulas de calculo (horaria e diaria)`n- Documentado threshold de 6h para tarifa diaria`n- Exemplos de calculo para cada tipo de veiculo`n`n## Branch`ndocs/pricing-implementation-rules`n`n## Status`n:white_check_mark: Concluido em 26/05/2026"
    labels = @("documentation")
  },

  # =========================================================================
  # ISSUE 4 — Dashboard with daily metrics
  # Commit: 1366c0c (26/05)
  # =========================================================================
  @{
    title = "[Feature] Dashboard com metricas diarias"
    body = "## Descricao`n`nImplementado painel de dashboard com metricas consolidadas do dia: receita, checkouts, ocupacao e duracao media.`n`n## Alteracoes Realizadas`n- Endpoint GET /api/parking/dashboard no backend`n- Calculo de receita do dia, total de checkouts, ocupacao atual`n- Calculo de duracao media de permanencia`n- Componente Dashboard no frontend com cards de metricas`n`n## Branch`nfeature/dashboard-metrics`n`n## Status`n:white_check_mark: Concluido em 26/05/2026"
    labels = @("enhancement", "frontend", "backend")
  },

  # =========================================================================
  # ISSUE 5 — BillingService (getDailyReport)
  # Sessão 27/05
  # =========================================================================
  @{
    title = "[Feature] Servico de faturamento diario (BillingService)"
    body = "## Descricao`n`nImplementado servico de faturamento que gera relatorio diario com receita total, quantidade de veiculos e breakdown por tipo de veiculo.`n`n## Alteracoes Realizadas`n- Criado modulo billing em backend/src/modules/billing/`n- billing.types.ts com interfaces DailyBillingReport e VehicleTypeBreakdown`n- billing.service.ts com metodo getDailyReport(date?)`n- Consulta parking_records com status=Exited no dia UTC`n- Agrupamento por vehicle_type_id com contagem e receita`n- Formatacao monetaria com 2 casas decimais`n`n## Requisitos Atendidos`n- Req 6.1, 6.2, 6.3, 6.4, 6.5`n`n## Status`n:white_check_mark: Concluido em 27/05/2026"
    labels = @("enhancement", "backend")
  },

  # =========================================================================
  # ISSUE 6 — PaymentService (processPayment + error handling)
  # Sessão 27/05
  # =========================================================================
  @{
    title = "[Feature] Servico de pagamento com gateway externo (PaymentService)"
    body = "## Descricao`n`nImplementado servico de integracao com gateway de pagamento externo, incluindo tratamento completo de erros.`n`n## Alteracoes Realizadas`n- Criado payment.service.ts em backend/src/modules/parking/services/`n- Metodo processPayment() com chamada HTTP ao gateway`n- Tratamento de erros: timeout, metodo invalido, fundos insuficientes, erro generico`n- Tipos: PaymentRequest, PaymentResponse, PaymentErrorType`n- Configuracao via env: PAYMENT_GATEWAY_URL, KEY, SECRET`n- Testes unitarios (17 cenarios) em tests/payment.service.test.ts`n`n## Requisitos Atendidos`n- Req 7.1, 7.2, 7.3`n`n## Status`n:white_check_mark: Concluido em 27/05/2026"
    labels = @("enhancement", "backend")
  },

  # =========================================================================
  # ISSUE 7 — NotificationService (checkTimeWarnings + sendNotification)
  # Sessão 27/05
  # =========================================================================
  @{
    title = "[Feature] Servico de notificacoes de tempo limite (NotificationService)"
    body = "## Descricao`n`nImplementado servico que monitora veiculos estacionados e gera alertas quando se aproximam ou excedem o tempo limite configuravel.`n`n## Alteracoes Realizadas`n- Criado modulo notifications em backend/src/modules/notifications/`n- notification.types.ts com interfaces TimeWarningNotification e NotificationResult`n- notification.service.ts com metodos checkTimeWarnings() e sendNotification()`n- Warning: duracao >= (limite - 1h), Critical: duracao >= limite`n- Configuracao via env: PARKING_TIME_LIMIT_HOURS (padrao: 24)`n- Logging de notificacoes para auditoria`n- Testes unitarios (10 cenarios) em tests/notification.service.test.ts`n`n## Requisitos Atendidos`n- Req 8.1, 8.2, 8.3, 8.4, 8.6`n`n## Status`n:white_check_mark: Concluido em 27/05/2026"
    labels = @("enhancement", "backend")
  },

  # =========================================================================
  # ISSUE 8 — Payment integration in checkout flow
  # Sessão 27/05
  # =========================================================================
  @{
    title = "[Feature] Integracao de pagamento no fluxo de checkout"
    body = "## Descricao`n`nIntegrado o PaymentService ao fluxo de checkout do ParkingService. Pagamento e processado antes de marcar o veiculo como 'Exited'.`n`n## Alteracoes Realizadas`n- ParkingService.checkOut() agora chama PaymentService.processPayment()`n- Sucesso: atualiza payment_status=Completed, payment_transaction_id, status=Exited`n- Falha: lanca PaymentRequiredError (HTTP 402), NAO atualiza status`n- Criado PaymentRequiredError em middleware/errors.ts`n- Controller valida paymentMethodId (HTTP 422 se ausente)`n- Fluxo legado mantido (sem paymentMethodId = checkout sem pagamento)`n`n## Requisitos Atendidos`n- Req 7.1, 7.2, 7.3, 7.4`n`n## Status`n:white_check_mark: Concluido em 27/05/2026"
    labels = @("enhancement", "backend")
  },

  # =========================================================================
  # ISSUE 9 — Fix: vehicleTypeId optional in check-in
  # Sessão 27/05
  # =========================================================================
  @{
    title = "[Fix] vehicleTypeId tornado opcional no check-in (compatibilidade)"
    body = "## Descricao`n`nCorrigido erro 'vehicleTypeId e obrigatorio' que impedia o check-in no frontend existente. O campo agora e opcional para manter compatibilidade com o frontend que ainda nao tem seletor de tipo de veiculo.`n`n## Problema`n- O controller exigia vehicleTypeId como campo obrigatorio`n- O frontend de check-in nao enviava esse campo`n- Resultado: erro 422 ao tentar fazer check-in`n`n## Correcao`n- Removida validacao obrigatoria de vehicleTypeId no controller`n- Mantida validacao de formato UUID quando o campo e fornecido`n- ParkingService ja tratava vehicleTypeId como opcional (null para legados)`n`n## Status`n:white_check_mark: Concluido em 27/05/2026"
    labels = @("bug", "backend")
  },

  # =========================================================================
  # ISSUE 10 — Mock FIPE service with 26 vehicles
  # Sessão 27/05
  # =========================================================================
  @{
    title = "[Feature] API FIPE mock local com 26 veiculos cadastrados"
    body = "## Descricao`n`nSubstituida a integracao com APIs externas (SINESP/FIPE) que nao funcionavam por um banco de dados mock local com 26 veiculos realistas.`n`n## Problema Anterior`n- API SINESP nao e publica e retornava erros`n- API FIPE nao faz lookup por placa`n- Todas as consultas retornavam 'Desconhecido'`n`n## Solucao`n- Criado fipe-mock-data.ts com 26 veiculos (19 carros, 5 motos, 2 caminhoes)`n- Reescrito fipe.service.ts para usar mock local`n- Mantida mesma interface (getVehicleData, getVehicleDataFromFipe)`n- Cache de 24h mantido`n- Placas nao cadastradas retornam fallback generico`n- Criado PLACAS_MOCK_CONSULTA.md com lista para testes`n- Criado fipe.service.LEGACY.ts com codigo antigo documentado`n`n## Placas Disponiveis`n19 carros + 5 motos + 2 caminhoes (ver PLACAS_MOCK_CONSULTA.md)`n`n## Status`n:white_check_mark: Concluido em 27/05/2026"
    labels = @("enhancement", "backend", "documentation")
  }
)

# =============================================================================
# Execução
# =============================================================================
Write-Host "Criando issues no repositorio: $repo" -ForegroundColor Cyan
Write-Host "Total de issues a criar: $($issues.Count)" -ForegroundColor Cyan
Write-Host ""

$created = 0
foreach ($issue in $issues) {
  $body = @{ title = $issue.title; body = $issue.body; labels = $issue.labels } | ConvertTo-Json -Depth 3
  try {
    $result = Invoke-RestMethod -Uri $baseUrl -Method POST -Headers $headers -Body ([System.Text.Encoding]::UTF8.GetBytes($body)) -ContentType "application/json; charset=utf-8"
    Write-Host "Created #$($result.number): $($result.title)" -ForegroundColor Green
    $created++
    Start-Sleep -Milliseconds 500
  } catch {
    Write-Host "FAILED: $($issue.title) - $($_.Exception.Message)" -ForegroundColor Red
  }
}

Write-Host ""
Write-Host "Resultado: $created/$($issues.Count) issues criadas com sucesso" -ForegroundColor Cyan
