# Prompts para Desenvolvimento do Projeto ParkingWash

Este documento contém todos os prompts necessários para reconstruir o projeto ParkingWash do zero, na ordem correta de execução.

---

## Informações do Projeto

| Item | Detalhe |
|------|---------|
| **Nome** | ParkingWash |
| **Tipo** | Sistema web fullstack |
| **Domínio** | Gerenciamento de estacionamento e lavagem de veículos |
| **Frontend** | React 18 + TypeScript + Vite 5 |
| **Backend** | Node.js 20 + Express 4 + TypeScript + tsx |
| **Banco de Dados** | Supabase (PostgreSQL hospedado) |
| **Testes** | Jest 29 + fast-check (property-based testing) |
| **CI/CD** | GitHub Actions |
| **Validação** | Zod |
| **HTTP Client** | Axios (backend), Fetch API (frontend) |
| **IDE com IA** | Kiro |

---

## Prompt 1 — Estrutura Inicial do Projeto

```
Crie um projeto fullstack chamado "parking-wash" com:

FRONTEND (pasta frontend/):
- React 18 + TypeScript + Vite
- Estrutura: src/api/, src/components/, src/hooks/, src/types/, src/utils/
- Scripts: dev (vite), build (tsc && vite build), test (vitest run)
- Dependências: react, react-dom
- DevDeps: @types/react, @types/react-dom, typescript, vite, @vitejs/plugin-react

BACKEND (pasta backend/):
- Express + TypeScript + tsx (hot reload)
- Estrutura: src/config/, src/db/, src/middleware/, src/modules/, src/app.ts, src/server.ts
- Scripts: dev (tsx watch src/server.ts), build (tsc), test (jest --runInBand), start (node dist/server.js)
- Dependências: express, cors, dotenv, @supabase/supabase-js, zod, axios
- DevDeps: @types/express, @types/cors, @types/node, typescript, tsx, jest, ts-jest, @types/jest, fast-check

Crie também:
- backend/.env.example com: SUPABASE_URL, SUPABASE_SERVICE_KEY, PORT=3333, HOURLY_RATE=10, DAILY_RATE_CAP=60
- backend/.gitignore (node_modules, dist, .env)
- frontend/.gitignore (node_modules, dist)
- .github/workflows/ci.yml (lint + test backend, build frontend)
```

---

## Prompt 2 — Banco de Dados (Schema SQL para Supabase)

```
Crie o schema SQL para executar no Supabase com 4 tabelas:

1. vehicle_types:
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - name VARCHAR(50) NOT NULL
   - code VARCHAR(20) UNIQUE NOT NULL
   - hourly_rate NUMERIC(10,2) NOT NULL CHECK (>= 0.01)
   - daily_rate NUMERIC(10,2) NOT NULL CHECK (>= 0.01)
   - is_active BOOLEAN DEFAULT TRUE
   - created_at TIMESTAMPTZ DEFAULT NOW()
   - updated_at TIMESTAMPTZ DEFAULT NOW()

2. parking_records:
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - license_plate VARCHAR(10) NOT NULL
   - vehicle_type_id UUID REFERENCES vehicle_types(id) (nullable para legados)
   - entry_time TIMESTAMPTZ NOT NULL
   - exit_time TIMESTAMPTZ
   - duration_minutes INTEGER
   - total_amount NUMERIC(10,2)
   - applied_daily_rate BOOLEAN DEFAULT FALSE
   - payment_status VARCHAR(20) DEFAULT 'Pending'
   - payment_method_id VARCHAR(100)
   - payment_transaction_id VARCHAR(100)
   - status VARCHAR(10) NOT NULL DEFAULT 'Parked'

3. wash_services:
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - name VARCHAR(100) NOT NULL
   - price NUMERIC(10,2) NOT NULL
   - duration_estimate INTEGER
   - is_active BOOLEAN DEFAULT TRUE

4. wash_orders:
   - id UUID PRIMARY KEY DEFAULT gen_random_uuid()
   - license_plate VARCHAR(10) NOT NULL
   - wash_service_id UUID REFERENCES wash_services(id) NOT NULL
   - vehicle_type_id UUID REFERENCES vehicle_types(id)
   - status VARCHAR(20) NOT NULL DEFAULT 'Waiting'
   - created_at TIMESTAMPTZ DEFAULT NOW()
   - started_at TIMESTAMPTZ
   - completed_at TIMESTAMPTZ

Índices:
- parking_records(vehicle_type_id)
- parking_records(payment_status)
- parking_records(exit_time DESC)
- parking_records(status)
- vehicle_types(is_active)
- wash_orders(status)

Seed data:
- vehicle_types: Motocicleta (R$5/h, R$30/dia), Carro (R$10/h, R$60/dia), Motorhome (R$20/h, R$120/dia)
- wash_services: Lavagem Simples (R$40), Lavagem Completa (R$70), Polimento (R$150)
```

---

## Prompt 3 — Backend: Módulo de Estacionamento

```
Implemente o módulo "parking" em backend/src/modules/parking/ com:

TIPOS (parking.types.ts):
- ParkingRecord, CheckInRequest, CheckInResponse, CheckOutRequest, CheckOutResponse

VALIDADOR (parking.validator.ts):
- checkInSchema (Zod): licensePlate (regex AAA-9999 ou AAA9A99), vehicleTypeId (UUID opcional)
- validateVehicleTypeIdWithResult(id): valida formato UUID

SERVICE (parking.service.ts):
- checkIn(request): verifica duplicata, valida tipo, insere registro
- checkOut(id, request?): calcula tarifa via PricingService, processa pagamento simulado, atualiza registro
- getHistory(limit=20, offset=0): últimos registros com status "Exited", paginado
- getDashboardMetrics(): receita do dia, checkouts, entradas, ocupação, permanência média, últimos 5 checkouts
- listRecords(status?): lista com filtro opcional

PRICING SERVICE (services/pricing.service.ts):
- calculateFee(entry, exit, hourlyRate, dailyRate): calcula tarifa progressiva
- Regras: 1ª hora = hourlyRate, frações 30min = hourlyRate × 0.5, diária = dailyRate (teto), excedente 24h = nova cobrança

PAYMENT SERVICE (services/payment.service.ts):
- processPayment(request): modo simulação quando PAYMENT_GATEWAY_URL vazio, retorna mock transactionId

FIPE SERVICE (services/fipe.service.ts):
- getVehicleData(licensePlate): mock local com 26 veículos, fallback "Desconhecido"

CONTROLLER (parking.controller.ts):
- postCheckIn, postCheckOut, getHistory, getParking, getDashboard, getFipeData

ROUTER (parking.router.ts):
- POST /checkin, POST /:id/checkout, GET /, GET /history, GET /dashboard, GET /fipe/:licensePlate
```

---

## Prompt 4 — Backend: Módulo de Lavagem

```
Implemente o módulo "wash-orders" em backend/src/modules/wash-orders/ com:

TIPOS (wash-orders.types.ts):
- WashOrderStatus: 'Waiting' | 'InProgress' | 'Completed'
- WashOrder, WashOrderResponse

SERVICE (wash-orders.service.ts):
- createOrder(licensePlate, washServiceId, vehicleTypeId?)
- advanceStatus(id, newStatus): valida transições Waiting→InProgress→Completed
- listOrders(status?, date?, showAll?): filtra concluídos para hoje (reset meia-noite)
- listHistory(limit=20, offset=0): todos os concluídos, paginado
- getDashboardMetrics(): ordens do dia, concluídas, em andamento, receita, últimas 5

CONTROLLER e ROUTER:
- POST /, PATCH /:id/status, GET /, GET /history, GET /dashboard
```

---

## Prompt 5 — Backend: Módulos Auxiliares

```
Implemente:

1. vehicle-types (backend/src/modules/vehicle-types/):
   - VehicleTypeService: listActive(), getById(id), updateRates(id, hourlyRate, dailyRate)
   - Controller + Router: GET /api/vehicle-types, PATCH /api/vehicle-types/:id

2. wash-services (backend/src/modules/wash-services/):
   - WashServicesService: listActiveServices(), updatePrice(id, price)
   - Controller + Router: GET /api/wash-services, PATCH /api/wash-services/:id

3. settings (backend/src/modules/settings/):
   - SettingsService: getSettings(), updateSettings({totalSpots?, washSpots?})
   - Fallback em memória quando tabela parking_settings não existe
   - Controller + Router: GET /api/settings, PATCH /api/settings

4. notifications (backend/src/modules/notifications/):
   - NotificationService: checkTimeWarnings(), sendNotification()
   - Gera warning quando duração >= (PARKING_TIME_LIMIT_HOURS - 1h)
   - Gera critical quando duração >= PARKING_TIME_LIMIT_HOURS
   - Controller + Router: GET /api/notifications

5. billing (backend/src/modules/billing/):
   - BillingService: getDailyReport(date?)
   - Controller + Router: GET /api/billing/daily-report
```

---

## Prompt 6 — Frontend: Estacionamento

```
Crie componentes React em frontend/src/components/ParkingPanel/:

1. CheckInForm.tsx:
   - Campo de placa (regex validação)
   - Seletor de tipo de veículo (carrega de GET /api/vehicle-types)
   - Exibe tarifa do tipo selecionado
   - Busca dados FIPE ao digitar placa válida
   - Auto-refresh tipos a cada 5 min

2. CurrentVehiclesPanel.tsx:
   - Grid de cards com veículos estacionados
   - Mostra: placa, tipo de veículo, duração em tempo real
   - Busca FIPE em background (não bloqueia renderização)

3. CheckoutModal.tsx:
   - Modal com: placa, tipo, entrada, duração (atualiza a cada segundo)
   - Exibe tarifa do tipo (1ª hora + diária)
   - PricingCalculation com breakdown em tempo real
   - Seletor de método de pagamento
   - Botão confirmar → chama API → mostra recibo

4. CheckoutReceipt.tsx:
   - Recibo com: placa, tipo, entrada, saída, permanência, cálculo, pagamento, total
   - Botão imprimir

5. ParkingPanel.tsx:
   - Container com: OccupancyBar + CheckInForm + CurrentVehiclesPanel + VehicleCards
   - Botão "Histórico" com tabela, busca por placa, paginação "Carregar mais"

API (frontend/src/api/parking.ts):
- checkIn, checkOut, listParking, getHistory, getDashboard, getFipeData
```

---

## Prompt 7 — Frontend: Lavagem

```
Crie componentes React em frontend/src/components/WashQueue/:

1. NewOrderForm.tsx:
   - Campo de placa + seletor de serviço de lavagem
   - Carrega serviços de GET /api/wash-services

2. StatusColumn.tsx:
   - Coluna Kanban com título e lista de cards
   - Botão para avançar status

3. WashQueue.tsx:
   - Container com: OccupancyBar + NewOrderForm + 3 StatusColumns
   - Botão "Histórico" com tabela, busca por placa, paginação
   - Auto-refresh a cada 30 segundos
   - Concluídos mostram apenas os de hoje (reset meia-noite)

API (frontend/src/api/washOrders.ts):
- createWashOrder, updateWashOrderStatus, listWashOrders, listWashOrdersHistory, getWashDashboard
```

---

## Prompt 8 — Frontend: Dashboard

```
Crie componente Dashboard em frontend/src/components/Dashboard/:

1. Dashboard.tsx:
   - 3 cards de resumo: Faturamento Total, Veículos Hoje, Permanência Média
   - 2 seções lado a lado: Estacionamento (métricas + últimos 5) e Lavagem (métricas + últimas 5)
   - Botão "Configurações" → abre SettingsModal
   - Botão "Exportar CSV" → gera relatório do dia
   - Auto-refresh 15 segundos

2. SettingsModal.tsx:
   - Vagas: estacionamento + lavagem
   - Tarifas por tipo de veículo (1ª hora + diária)
   - Preços de lavagem
   - Botão salvar

3. OccupancyBar.tsx (componente reutilizável):
   - Props: occupied, total
   - Barra visual com cores: verde (<70%), amarelo (70-90%), vermelho (>90%)
   - Mostra: "X livres / Y total" + percentual + status
```

---

## Prompt 9 — Dark Mode

```
Implemente dark mode:

1. Hook useDarkMode.ts:
   - Estado persiste no localStorage ('parkingwash-theme')
   - Respeita prefers-color-scheme do sistema
   - Adiciona/remove classe 'dark' no document.documentElement

2. theme.css:
   - Variáveis CSS em :root (modo claro) e :root.dark (modo escuro)
   - Variáveis: --bg-primary, --bg-card, --text-primary, --border-color, --accent, etc.
   - Overrides .dark para todos os componentes

3. Botão toggle no header (🌙/☀️):
   - Circular, posição absoluta no canto superior direito
   - Transição suave ao trocar
```

---

## Prompt 10 — Notificações de Tempo Limite

```
Implemente NotificationBadge:

1. Componente NotificationBadge.tsx:
   - Polling GET /api/notifications a cada 30 segundos
   - Badge 🔔 com contador no header
   - Animação pulse (laranja para warning, vermelho para critical)
   - Clique abre painel dropdown com lista de alertas
   - Cada alerta mostra: placa, tipo, tempo decorrido, status

2. Aparece apenas quando há alertas (count > 0)
3. Suporta dark mode
```

---

## Prompt 11 — Exportação CSV

```
Implemente exportação CSV:

1. Utilitário exportCsv.ts:
   - Função exportToCsv(filename, columns, data)
   - Usa ponto-e-vírgula como separador (Excel PT-BR)
   - Adiciona BOM UTF-8 para acentos
   - Trigger download automático

2. Botão "Exportar CSV" no Dashboard:
   - Gera relatório com: Tipo, Placa, Valor, Duração/Serviço, Hora
   - Inclui dados de estacionamento e lavagem do dia
```

---

## Prompt 12 — Testes

```
Configure testes:

1. jest.config.ts:
   - Preset: ts-jest
   - testEnvironment: node
   - testMatch: tests/**/*.test.ts

2. Testes unitários para:
   - PricingService (cálculo horário, diário, multi-dia, frações)
   - ParkingService (checkIn, checkOut, getHistory)
   - WashOrderService (createOrder, advanceStatus, listOrders)
   - PaymentService (sucesso, timeout, erro)
   - NotificationService (warning, critical, sendNotification)

3. Property-based tests com fast-check:
   - Determinismo do cálculo de tarifa
   - Filtro de tipos ativos
   - Ordenação do histórico

4. Mock do Supabase client em todos os testes
```

---

## Prompt 13 — CI/CD Pipeline

```
Crie .github/workflows/ci.yml:

name: CI - ParkingWash
on: push (main, develop) e pull_request

Jobs:
1. backend-tests:
   - ubuntu-latest, Node 20
   - npm ci, npx tsc --noEmit, npm test -- --passWithNoTests --forceExit

2. frontend-build:
   - ubuntu-latest, Node 20
   - npm ci, npx tsc --noEmit, npm run build
```

---

## Ordem de Execução

1. Prompt 1 → Estrutura
2. Prompt 2 → Banco de dados (executar SQL no Supabase)
3. Prompt 3 → Módulo estacionamento
4. Prompt 4 → Módulo lavagem
5. Prompt 5 → Módulos auxiliares
6. Prompt 6 → Frontend estacionamento
7. Prompt 7 → Frontend lavagem
8. Prompt 8 → Frontend dashboard
9. Prompt 9 → Dark mode
10. Prompt 10 → Notificações
11. Prompt 11 → Exportação CSV
12. Prompt 12 → Testes
13. Prompt 13 → CI/CD

---

## Regras Gerais para Todos os Prompts

Ao enviar qualquer prompt para a IA, inclua estas instruções:
- Analise a necessidade antes de implementar
- Não quebre o que já funciona
- Use TypeScript estrito
- Siga o padrão de módulos existente (service → controller → router)
- Formate valores monetários com 2 casas decimais
- Use camelCase na API e snake_case no banco
- Trate erros com classes específicas (ValidationError, NotFoundError, etc.)
- Componentes React devem ser responsivos
- Toda regra de negócio deve estar documentada
