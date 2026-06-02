# Script para criar issues no GitHub
# Requer: gh cli instalado e autenticado

$issues = @(
    @{
        title = "4.3 Implementar parking.controller.ts e parking.router.ts"
        body = @"
## Descrição
Implementar controller e router para o módulo de parking.

## Tarefas
- [ ] Criar `parking.controller.ts` com métodos: `postCheckIn`, `postCheckOut`, `getParking`
- [ ] Criar `parking.router.ts` com rotas: `POST /checkin`, `POST /:id/checkout`, `GET /`
- [ ] Registrar router em `app.ts` sob prefixo `/api/parking`
- [ ] Validar com middleware de validação

## Requisitos
- Requirements: 1.1, 1.2, 1.3, 2.1, 2.3, 2.4, 2.5, 3.1, 3.4

## Critério de Aceitação
- ✅ Controller retorna status HTTP correto (201, 200, 200)
- ✅ Router registrado em app.ts
- ✅ Validação middleware aplicado
- ✅ Testes passando
"@
        labels = "backend,wave-7"
        milestone = "Backend"
    },
    @{
        title = "5.3 Implementar wash-orders.controller.ts e wash-orders.router.ts"
        body = @"
## Descrição
Implementar controller e router para o módulo de wash-orders.

## Tarefas
- [ ] Criar `wash-orders.controller.ts` com métodos: `postWashOrder`, `patchWashOrderStatus`, `getWashOrders`
- [ ] Criar `wash-orders.router.ts` com rotas: `POST /`, `PATCH /:id/status`, `GET /`
- [ ] Registrar router em `app.ts` sob prefixo `/api/wash-orders`
- [ ] Validar com middleware de validação

## Requisitos
- Requirements: 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 5.1, 5.2, 5.3, 5.4, 5.5, 6.1, 6.2, 6.3

## Critério de Aceitação
- ✅ Controller retorna status HTTP correto (201, 200, 200)
- ✅ Router registrado em app.ts
- ✅ Validação middleware aplicado
- ✅ Testes passando
"@
        labels = "backend,wave-7"
        milestone = "Backend"
    },
    @{
        title = "7.1 Criar tests/arbitraries.ts com geradores fast-check"
        body = @"
## Descrição
Criar arquivo com geradores reutilizáveis para property-based testing.

## Tarefas
- [ ] Implementar `legacyPlateArb` (formato AAA-9999)
- [ ] Implementar `mercosulPlateArb` (formato AAA9A99)
- [ ] Implementar `validPlateArb` (ambos formatos)
- [ ] Implementar `invalidPlateArb`
- [ ] Implementar `timestampPairArb`
- [ ] Implementar `durationMinutesArb`
- [ ] Implementar `hourlyRateArb`
- [ ] Implementar `dailyRateCapArb`

## Requisitos
- Requirements: 12.1, 12.2

## Critério de Aceitação
- ✅ Todos os arbitrários exportados
- ✅ Geradores funcionam com fast-check
- ✅ Cobertura de casos válidos e inválidos
"@
        labels = "backend,tests,wave-8"
        milestone = "Backend"
    },
    @{
        title = "7.2 Criar tests/parking.service.test.ts com mock do Supabase"
        body = @"
## Descrição
Criar testes para parking.service.ts com mock do Supabase.

## Tarefas
- [ ] Configurar jest.mock para Supabase
- [ ] Teste: check-in válido
- [ ] Teste: check-in com placa duplicada (409)
- [ ] Teste: checkout com cálculo de tarifa por hora
- [ ] Teste: checkout com teto diário
- [ ] Teste: checkout de registro inexistente (404)
- [ ] Teste: checkout de veículo já saído (422)
- [ ] Teste: listagem sem filtro
- [ ] Teste: listagem com filtro de status
- [ ] Teste: listagem vazia
- [ ] Teste: erro de infraestrutura (503)

## Requisitos
- Requirements: 12.1, 12.3, 12.4

## Critério de Aceitação
- ✅ Todos os testes passando
- ✅ Mock do Supabase funcionando
- ✅ Cobertura de casos de erro
"@
        labels = "backend,tests,wave-8"
        milestone = "Backend"
    },
    @{
        title = "7.3 Property test: check-in com placa válida sempre cria registro Parked"
        body = @"
## Descrição
Property-based test para validar que check-in com placa válida sempre cria registro com status Parked.

## Tarefas
- [ ] Usar `validPlateArb` para gerar placas
- [ ] Verificar `result.status === 'Parked'`
- [ ] Verificar `result.licensePlate === plate`
- [ ] Verificar `result.entryTime` definido
- [ ] Executar com numRuns: 100

## Requisitos
- Requirements: 1.1

## Critério de Aceitação
- ✅ Property test passando
- ✅ 100 runs sem falhas
- ✅ Valida Requirement 1.1
"@
        labels = "backend,tests,wave-9,optional"
        milestone = "Backend"
    },
    @{
        title = "7.4 Property test: placas inválidas são sempre rejeitadas"
        body = @"
## Descrição
Property-based test para validar que placas inválidas são sempre rejeitadas.

## Tarefas
- [ ] Usar `invalidPlateArb` para gerar placas
- [ ] Verificar que `checkIn(plate)` rejeita com `ValidationError`
- [ ] Executar com numRuns: 100

## Requisitos
- Requirements: 1.3, 4.5

## Critério de Aceitação
- ✅ Property test passando
- ✅ 100 runs sem falhas
- ✅ Valida Requirements 1.3, 4.5
"@
        labels = "backend,tests,wave-9,optional"
        milestone = "Backend"
    },
    @{
        title = "7.5 Property test: cálculo de tarifa é determinístico"
        body = @"
## Descrição
Property-based test para validar que cálculo de tarifa é determinístico para qualquer duração.

## Tarefas
- [ ] Usar `durationMinutesArb` para gerar durações
- [ ] Verificar `calculateFee(d) === Math.min(Math.ceil(d/60)*HOURLY_RATE, DAILY_RATE_CAP)`
- [ ] Usar `toBeCloseTo(expected, 2)` para comparação
- [ ] Executar com numRuns: 100

## Requisitos
- Requirements: 2.1, 2.2, 2.3, 2.6

## Critério de Aceitação
- ✅ Property test passando
- ✅ 100 runs sem falhas
- ✅ Valida Requirements 2.1, 2.2, 2.3, 2.6
"@
        labels = "backend,tests,wave-9,optional"
        milestone = "Backend"
    },
    @{
        title = "7.6 Property test: tarifas configuráveis são aplicadas corretamente"
        body = @"
## Descrição
Property-based test para validar que tarifas configuráveis são aplicadas corretamente.

## Tarefas
- [ ] Usar `durationMinutesArb`, `hourlyRateArb`, `dailyRateCapArb`
- [ ] Instanciar ParkingService com tarifas arbitrárias
- [ ] Verificar fórmula com valores arbitrários
- [ ] Executar com numRuns: 100

## Requisitos
- Requirements: 11.1, 11.2

## Critério de Aceitação
- ✅ Property test passando
- ✅ 100 runs sem falhas
- ✅ Valida Requirements 11.1, 11.2
"@
        labels = "backend,tests,wave-9,optional"
        milestone = "Backend"
    },
    @{
        title = "7.7 Criar tests/wash-order.service.test.ts com mock do Supabase"
        body = @"
## Descrição
Criar testes para wash-orders.service.ts com mock do Supabase.

## Tarefas
- [ ] Configurar jest.mock para Supabase
- [ ] Teste: criação de ordem válida (201)
- [ ] Teste: criação com serviço inativo (422)
- [ ] Teste: criação com serviço inexistente (422)
- [ ] Teste: transição Waiting→InProgress
- [ ] Teste: transição InProgress→Completed
- [ ] Teste: transição inválida Waiting→Completed (422)
- [ ] Teste: ordem inexistente (404)

## Requisitos
- Requirements: 12.2, 12.3

## Critério de Aceitação
- ✅ Todos os testes passando
- ✅ Mock do Supabase funcionando
- ✅ Cobertura de casos de erro
"@
        labels = "backend,tests,wave-8"
        milestone = "Backend"
    },
    @{
        title = "7.8 Property test: transições válidas atualizam status e timestamps"
        body = @"
## Descrição
Property-based test para validar que transições válidas atualizam status e timestamps corretamente.

## Tarefas
- [ ] Usar `validPlateArb` para gerar placas
- [ ] Verificar Waiting→InProgress grava `started_at` em ISO 8601
- [ ] Verificar InProgress→Completed grava `completed_at` em ISO 8601
- [ ] Executar com numRuns: 100

## Requisitos
- Requirements: 5.1, 5.2, 5.6

## Critério de Aceitação
- ✅ Property test passando
- ✅ 100 runs sem falhas
- ✅ Valida Requirements 5.1, 5.2, 5.6
"@
        labels = "backend,tests,wave-9,optional"
        milestone = "Backend"
    },
    @{
        title = "7.9 Property test: transições inválidas são sempre rejeitadas"
        body = @"
## Descrição
Property-based test para validar que transições inválidas são sempre rejeitadas.

## Tarefas
- [ ] Usar `validPlateArb` para gerar placas
- [ ] Verificar Waiting→Completed rejeita com `ValidationError`
- [ ] Verificar qualquer transição a partir de Completed rejeita
- [ ] Executar com numRuns: 100

## Requisitos
- Requirements: 5.3, 5.4

## Critério de Aceitação
- ✅ Property test passando
- ✅ 100 runs sem falhas
- ✅ Valida Requirements 5.3, 5.4
"@
        labels = "backend,tests,wave-9,optional"
        milestone = "Backend"
    },
    @{
        title = "8. Checkpoint - Backend completo"
        body = @"
## Descrição
Validar que backend está completo e pronto para produção.

## Tarefas
- [ ] Executar `cd backend && npx jest --runInBand --forceExit`
- [ ] Verificar que todos os testes passam
- [ ] Executar `npx eslint src/ tests/`
- [ ] Verificar que lint passa sem erros
- [ ] Revisar cobertura de testes
- [ ] Documentar qualquer ajuste necessário

## Critério de Aceitação
- ✅ Todos os testes passando
- ✅ Lint sem erros
- ✅ Cobertura adequada
- ✅ Backend pronto para frontend
"@
        labels = "backend,checkpoint,wave-10"
        milestone = "Backend"
    },
    @{
        title = "9.1 Implementar src/api/client.ts e módulos de API"
        body = @"
## Descrição
Criar cliente HTTP e módulos de API para o frontend.

## Tarefas
- [ ] Criar `client.ts`: fetch wrapper com tratamento de erros
- [ ] Exportar `apiGet<T>`, `apiPost<T>`, `apiPatch<T>`
- [ ] Criar `src/api/parking.ts`: `checkIn`, `checkOut`, `listParking`
- [ ] Criar `src/api/washOrders.ts`: `createWashOrder`, `updateWashOrderStatus`, `listWashOrders`
- [ ] Criar `src/api/washServices.ts`: `listWashServices`

## Requisitos
- Requirements: 8.2, 8.4, 8.5, 9.2, 9.7

## Critério de Aceitação
- ✅ Todos os módulos exportados
- ✅ Tratamento de erros funcionando
- ✅ TypeScript types corretos
"@
        labels = "frontend,wave-11"
        milestone = "Frontend"
    },
    @{
        title = "9.2 Definir tipos TypeScript e implementar hooks utilitários"
        body = @"
## Descrição
Criar tipos TypeScript e hooks reutilizáveis para o frontend.

## Tarefas
- [ ] Criar `src/types/parking.ts` espelhando interfaces do backend
- [ ] Criar `src/types/washOrders.ts` espelhando interfaces do backend
- [ ] Implementar `src/hooks/useElapsedTime.ts`: retorna tempo formatado HH:MM:SS
- [ ] Implementar `src/hooks/useAutoRefresh.ts`: polling com intervalo configurável
- [ ] Limpar intervalos no unmount

## Requisitos
- Requirements: 8.3, 9.6

## Critério de Aceitação
- ✅ Tipos exportados corretamente
- ✅ Hooks funcionando com React
- ✅ Cleanup de recursos funcionando
"@
        labels = "frontend,wave-11"
        milestone = "Frontend"
    },
    @{
        title = "10.1 Implementar CheckInForm.tsx"
        body = @"
## Descrição
Criar componente de formulário para check-in de veículos.

## Tarefas
- [ ] Campo de texto para `licensePlate`
- [ ] Validação em tempo real (regex legado/Mercosul)
- [ ] Botão desabilitado enquanto campo vazio ou inválido
- [ ] Chamar `checkIn` ao submeter
- [ ] Limpar campo após sucesso
- [ ] Exibir erro da API em caso de falha

## Requisitos
- Requirements: 8.1, 8.2, 8.5

## Critério de Aceitação
- ✅ Validação funcionando
- ✅ Integração com API funcionando
- ✅ Tratamento de erros funcionando
"@
        labels = "frontend,wave-12"
        milestone = "Frontend"
    },
    @{
        title = "10.2 Implementar ElapsedTimer.tsx e VehicleCard.tsx"
        body = @"
## Descrição
Criar componentes para exibir veículos estacionados.

## Tarefas
- [ ] `ElapsedTimer`: recebe `entryTime`, usa `useElapsedTime`, exibe HH:MM:SS
- [ ] `VehicleCard`: exibe placa, `ElapsedTimer`, botão "Checkout"
- [ ] Botão emite evento para abrir modal

## Requisitos
- Requirements: 8.3, 8.4

## Critério de Aceitação
- ✅ Timer atualizando a cada segundo
- ✅ Componentes renderizando corretamente
- ✅ Eventos funcionando
"@
        labels = "frontend,wave-13"
        milestone = "Frontend"
    },
    @{
        title = "10.3 Implementar CheckoutModal.tsx e ParkingPanel.tsx"
        body = @"
## Descrição
Criar modal de checkout e painel principal de parking.

## Tarefas
- [ ] `CheckoutModal`: exibe placa, tempo, valor calculado
- [ ] Botões "Confirmar" e "Cancelar"
- [ ] Chamar `checkOut(id)` ao confirmar
- [ ] Fechar modal após sucesso
- [ ] Exibir erro da API em caso de falha
- [ ] `ParkingPanel`: gerencia estado da lista de veículos
- [ ] Integra `CheckInForm`, lista de `VehicleCard`, `CheckoutModal`
- [ ] Atualiza lista após check-in e checkout

## Requisitos
- Requirements: 8.1, 8.2, 8.3, 8.4, 8.5

## Critério de Aceitação
- ✅ Modal funcionando
- ✅ Cálculo de tarifa correto
- ✅ Integração com API funcionando
- ✅ Estado gerenciado corretamente
"@
        labels = "frontend,wave-14"
        milestone = "Frontend"
    },
    @{
        title = "11.1 Implementar NewOrderForm.tsx"
        body = @"
## Descrição
Criar formulário para criar novas ordens de lavagem.

## Tarefas
- [ ] Campo de texto para `licensePlate`
- [ ] Validação em tempo real
- [ ] Seletor `<select>` de WashService
- [ ] Carregar serviços via `listWashServices()` no mount
- [ ] Botão desabilitado enquanto campos obrigatórios vazios/inválidos
- [ ] Chamar `createWashOrder` ao submeter
- [ ] Limpar formulário após sucesso
- [ ] Exibir erro da API em caso de falha

## Requisitos
- Requirements: 9.1, 9.2, 9.7

## Critério de Aceitação
- ✅ Validação funcionando
- ✅ Serviços carregando corretamente
- ✅ Integração com API funcionando
"@
        labels = "frontend,wave-12"
        milestone = "Frontend"
    },
    @{
        title = "11.2 Implementar WashOrderCard.tsx e StatusColumn.tsx"
        body = @"
## Descrição
Criar componentes para exibir ordens de lavagem.

## Tarefas
- [ ] `WashOrderCard`: exibe placa, nome do serviço, status
- [ ] Botão contextual ("Iniciar" para Waiting, "Concluir" para InProgress)
- [ ] Chamar `updateWashOrderStatus` ao clicar
- [ ] Exibir erro da API em caso de falha
- [ ] `StatusColumn`: recebe `status` e lista de ordens
- [ ] Renderiza título da coluna e lista de `WashOrderCard`

## Requisitos
- Requirements: 9.3, 9.4, 9.5, 9.7

## Critério de Aceitação
- ✅ Componentes renderizando corretamente
- ✅ Botões funcionando
- ✅ Integração com API funcionando
"@
        labels = "frontend,wave-13"
        milestone = "Frontend"
    },
    @{
        title = "11.3 Implementar WashQueue.tsx com auto-refresh"
        body = @"
## Descrição
Criar componente principal para fila de lavagem.

## Tarefas
- [ ] Gerenciar estado da lista de ordens
- [ ] Usar `useAutoRefresh(fetchOrders, 30000)` para polling
- [ ] Agrupar ordens por status
- [ ] Renderizar três `StatusColumn` (Waiting, InProgress, Completed)
- [ ] Integrar `NewOrderForm`
- [ ] Atualizar lista após nova ordem ou mudança de status

## Requisitos
- Requirements: 9.1, 9.2, 9.3, 9.4, 9.5, 9.6, 9.7

## Critério de Aceitação
- ✅ Polling funcionando
- ✅ Ordens agrupadas corretamente
- ✅ Integração com API funcionando
"@
        labels = "frontend,wave-14"
        milestone = "Frontend"
    },
    @{
        title = "12.1 Implementar App.tsx e main.tsx"
        body = @"
## Descrição
Criar componente principal e ponto de entrada do frontend.

## Tarefas
- [ ] `App.tsx`: estado `activeTab` ('parking' | 'wash')
- [ ] Renderizar dois botões de aba
- [ ] Renderizar componente ativo (`ParkingPanel` ou `WashQueue`)
- [ ] `main.tsx`: montar `<App />` no elemento `#root`

## Requisitos
- Requirements: 8.1, 9.1

## Critério de Aceitação
- ✅ Navegação por abas funcionando
- ✅ Componentes renderizando corretamente
- ✅ App montando sem erros
"@
        labels = "frontend,wave-15"
        milestone = "Frontend"
    },
    @{
        title = "13. Checkpoint - Frontend completo"
        body = @"
## Descrição
Validar que frontend está completo e pronto para produção.

## Tarefas
- [ ] Executar `cd frontend && npx vite build`
- [ ] Verificar que build completa sem erros
- [ ] Executar `cd frontend && npx vitest run`
- [ ] Verificar que testes de componente passam
- [ ] Revisar cobertura de testes
- [ ] Documentar qualquer ajuste necessário

## Critério de Aceitação
- ✅ Build completando sem erros
- ✅ Testes passando
- ✅ Frontend pronto para CI/CD
"@
        labels = "frontend,checkpoint,wave-16"
        milestone = "Frontend"
    },
    @{
        title = "14.1 Criar .github/workflows/ci.yml"
        body = @"
## Descrição
Criar pipeline CI/CD com GitHub Actions.

## Tarefas
- [ ] Configurar trigger em `push` e `pull_request` para branches `main` e `develop`
- [ ] Job `backend`: checkout, setup Node.js, `npm ci`, `npm run lint`, `npm test`
- [ ] Usar variáveis de ambiente mock para testes
- [ ] Job `frontend`: checkout, setup Node.js, `npm ci`, `npx vite build`
- [ ] Configurar `needs: [backend]` para executar após backend

## Requisitos
- Requirements: 13.1, 13.2, 13.3, 13.4, 13.5

## Critério de Aceitação
- ✅ Workflow sintaticamente correto
- ✅ Jobs executando em ordem
- ✅ Testes passando no CI
"@
        labels = "ci-cd,wave-17"
        milestone = "CI/CD"
    },
    @{
        title = "15.1 Criar README.md na raiz do projeto"
        body = @"
## Descrição
Criar documentação completa do projeto.

## Tarefas
- [ ] Seção **Visão Geral**: descrever sistema, tecnologias, funcionalidades
- [ ] Seção **Execução**: comandos para instalar, copiar .env, iniciar backend/frontend
- [ ] Seção **Arquitetura**: descrever arquitetura em camadas e domínios
- [ ] Seção **Uso de IA**: descrever como IA foi utilizada
- [ ] Seção **Exemplos de uso da API**: ao menos 2 exemplos com método, caminho, corpo, resposta
- [ ] Documentar variáveis de ambiente

## Requisitos
- Requirements: 14.1, 14.3

## Critério de Aceitação
- ✅ README completo e bem formatado
- ✅ Exemplos de API funcionando
- ✅ Instruções claras
"@
        labels = "docs,wave-18"
        milestone = "Documentation"
    },
    @{
        title = "15.2 Criar documentação de ciclos de IA em docs/prompts/"
        body = @"
## Descrição
Documentar 5 ciclos de IA utilizados no desenvolvimento.

## Tarefas
- [ ] Criar `docs/prompts/01-arquitetura.md`
- [ ] Criar `docs/prompts/02-backend.md`
- [ ] Criar `docs/prompts/03-testes.md`
- [ ] Criar `docs/prompts/04-frontend.md`
- [ ] Criar `docs/prompts/05-cicd.md`
- [ ] Cada arquivo: prompt utilizado, resposta obtida, limitação identificada, mudança aplicada

## Requisitos
- Requirements: 14.2

## Critério de Aceitação
- ✅ 5 arquivos criados
- ✅ Cada arquivo com estrutura completa
- ✅ Documentação clara e profissional
"@
        labels = "docs,wave-18"
        milestone = "Documentation"
    },
    @{
        title = "16. Checkpoint final - Garantir que tudo passa"
        body = @"
## Descrição
Validação final de todo o projeto.

## Tarefas
- [ ] Executar `cd backend && npx jest --runInBand --forceExit`
- [ ] Verificar que todos os testes passam
- [ ] Executar `cd frontend && npx vite build`
- [ ] Verificar que build completa sem erros
- [ ] Verificar que workflow CI/CD está sintaticamente correto
- [ ] Revisar documentação
- [ ] Documentar qualquer ajuste final

## Critério de Aceitação
- ✅ Todos os testes passando
- ✅ Build completando sem erros
- ✅ CI/CD funcionando
- ✅ Projeto pronto para produção
"@
        labels = "checkpoint,final,wave-19"
        milestone = "Final"
    }
)

# Criar issues
foreach ($issue in $issues) {
    Write-Host "Criando issue: $($issue.title)"
    
    $body = $issue.body -replace "`n", "\n"
    
    gh issue create `
        --title $issue.title `
        --body $body `
        --label $issue.labels `
        --milestone $issue.milestone
    
    Start-Sleep -Milliseconds 500
}

Write-Host "✅ Todas as issues foram criadas com sucesso!"
