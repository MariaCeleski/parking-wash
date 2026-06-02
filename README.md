# 🅿️ ParkingWash

## Descrição do Problema

Estacionamentos e lava-rápidos enfrentam dificuldades no controle manual de entradas, saídas, cálculo de tarifas e gestão de filas de lavagem. Erros de cobrança, falta de visibilidade sobre ocupação e ausência de histórico para auditoria são problemas recorrentes.

O **ParkingWash** resolve esses problemas oferecendo um sistema web completo para gerenciamento de estacionamento e lavagem de veículos, com cálculo automático de tarifas, controle de vagas em tempo real, histórico auditável e dashboard operacional.

---

## Ferramentas de IA Utilizadas

| Ferramenta | Etapa | Uso |
|------------|-------|-----|
| **Kiro** (IDE com IA) | Todas | Geração de código, refatoração, debugging, testes |
| **Chain of Thought** | Geração de código | Decomposição de problemas complexos em passos |
| **Prompts iterativos** | Refinamento | Correção de bugs e melhoria incremental |
| **Análise de contexto** | Arquitetura | Decisões de design baseadas no código existente |

### Etapas com IA:
1. **Especificação** — Definição de requisitos e arquitetura
2. **Geração de código** — Módulos backend e componentes frontend
3. **Refatoração** — PricingService (SOLID), remoção de dependências externas
4. **Testes** — Geração de testes unitários e property-based
5. **CI/CD** — Configuração do GitHub Actions
6. **Documentação** — README, docstrings, changelogs

---

## Padrões de Prompting Aplicados

### Padrão 1: Chain of Thought (Decomposição)
```
Prompt: "Implemente o PricingService com as seguintes regras:
1. Primeira hora: R$ 10 fixo
2. Frações adicionais: R$ 5 por 30 min
3. Diária: R$ 60 (teto automático)
4. Excedente 24h: nova cobrança
Analise a necessidade, exclua somente o que é necessário, 
e execute sem quebrar o projeto."
```
**Resultado:** Serviço implementado com lógica progressiva, testes e documentação.

### Padrão 2: Contexto Estruturado + Restrições
```
Prompt: "Crie um mock FIPE com 26 veículos. 
Como não existe API gratuita para consulta de placas no Brasil,
use dados fictícios realistas. Mantenha a mesma interface 
(getVehicleData). Não quebre o projeto."
```
**Resultado:** Mock local substituiu APIs externas não funcionais, mantendo compatibilidade.

### Padrão 3: Análise Antes de Ação
```
Prompt: "Analise a imagem do erro. O checkout mostra R$ 10 
mas deveria usar a tarifa do Motorhome (R$ 25/hora). 
Investigue o fluxo completo antes de corrigir."
```
**Resultado:** Identificação de que o CheckoutModal não passava a tarifa do tipo de veículo.

---

## Arquitetura

```
┌─────────────────────────────────────────────────────────┐
│                   Frontend (React + Vite)                │
│  ParkingPanel │ WashQueue │ Dashboard │ SettingsModal    │
└───────────────────────────┬─────────────────────────────┘
                            │ HTTP (REST API)
┌───────────────────────────┴─────────────────────────────┐
│                   Backend (Express + TypeScript)         │
│  Controllers → Services → Supabase Client               │
│  Modules: parking, wash-orders, vehicle-types,          │
│           billing, notifications, settings              │
└───────────────────────────┬─────────────────────────────┘
                            │ PostgreSQL
┌───────────────────────────┴─────────────────────────────┐
│                   Supabase (PostgreSQL)                  │
│  Tables: parking_records, vehicle_types,                │
│          wash_orders, wash_services                     │
└─────────────────────────────────────────────────────────┘
```

**Padrão arquitetural:** MVC em camadas (Controller → Service → Database)

---

## Instalação e Execução

### Pré-requisitos
- Node.js 20+
- npm
- Conta no Supabase (para banco de dados)

### 1. Clonar o repositório
```bash
git clone https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash.git
cd parking-wash
```

### 2. Instalar dependências
```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Configurar variáveis de ambiente
```bash
cp backend/.env.example backend/.env
# Editar backend/.env com suas credenciais do Supabase
```

### 4. Iniciar o projeto
```bash
# Terminal 1 - Backend (porta 3333)
cd backend && npm run dev

# Terminal 2 - Frontend (porta 5173)
cd frontend && npm run dev
```

### 5. Acessar
- Frontend: http://localhost:5173
- API: http://localhost:3333

---

## Cenários de Uso

### Cenário 1: Check-in e Checkout de Veículo

**Entrada:**
```json
POST /api/parking/checkin
{ "licensePlate": "ABC-1234", "vehicleTypeId": "uuid-do-tipo-carro" }
```

**Saída (201):**
```json
{
  "id": "uuid-do-registro",
  "licensePlate": "ABC-1234",
  "entryTime": "2026-05-27T15:00:00.000Z",
  "status": "Parked"
}
```

**Checkout após 1h30:**
```json
POST /api/parking/uuid-do-registro/checkout
{ "paymentMethodId": "credit_card" }
```

**Saída (200):**
```json
{
  "totalAmount": 15.00,
  "durationMinutes": 90,
  "status": "Exited",
  "paymentStatus": "Completed"
}
```
> Cálculo: 1ª hora R$15 + 1 fração de 30min (50% = R$7,50) = R$22,50

### Cenário 2: Fila de Lavagem

**Entrada:**
```json
POST /api/wash-orders
{ "licensePlate": "XYZ-5678", "washServiceId": "uuid-lavagem-completa" }
```

**Saída (201):**
```json
{
  "id": "uuid-ordem",
  "licensePlate": "XYZ-5678",
  "washService": { "name": "Lavagem Completa", "price": 80.00 },
  "status": "Waiting"
}
```

**Avançar status:**
```json
PATCH /api/wash-orders/uuid-ordem/status
{ "status": "InProgress" }
// Depois:
{ "status": "Completed" }
```

---

## Caso de Saída Incorreta da IA

### Problema: API FIPE retornando "Desconhecido" para todas as placas

**Contexto:** A IA gerou integração com SINESP e FIPE APIs para consulta de veículos por placa.

**Saída incorreta:** Todas as consultas retornavam dados genéricos ("Marca: Desconhecido, Modelo: Desconhecido") porque:
1. A API do SINESP não é pública (requer autenticação do app mobile)
2. A API FIPE não faz lookup por placa (apenas por código FIPE)

**Análise crítica:** A IA assumiu que existiam APIs REST públicas para consulta de placas no Brasil, mas isso não existe por questões legais (LGPD) e de privacidade.

**Correção aplicada:**
- Substituição por mock local com 26 veículos realistas
- Documentação do motivo em `fipe.service.LEGACY.ts`
- Criação de `PLACAS_MOCK_CONSULTA.md` com lista de placas para teste

**Lição:** Sempre validar se APIs externas realmente existem e funcionam antes de integrá-las.

---

## Melhorias Futuras

- [ ] Autenticação de usuários (login/logout com roles admin/operador)
- [ ] Cadastro de mensalistas com tarifa fixa mensal
- [ ] Exportação de relatórios em PDF/CSV
- [ ] Integração com API de pagamento real (Stripe, PagSeguro)
- [ ] QR Code no ticket de entrada para checkout rápido
- [ ] Notificações push para alertas de tempo limite
- [ ] Tema escuro (dark mode)
- [ ] Integração com API de placas paga (ApiPlacas, Olho no Carro)
- [ ] Multi-unidade (gerenciar vários estacionamentos)
- [ ] App mobile (React Native)

---

## Vídeo de Demonstração

📹 [Link do vídeo no YouTube](https://youtube.com/watch?v=SEU_VIDEO_AQUI)

> ⚠️ Substituir pelo link real após gravação

---

## Tecnologias

| Camada | Tecnologia |
|--------|-----------|
| Frontend | React 18 + TypeScript + Vite |
| Backend | Express + TypeScript + tsx |
| Banco de Dados | Supabase (PostgreSQL) |
| Testes | Jest + fast-check (property-based) |
| CI/CD | GitHub Actions |
| IA | Kiro IDE | 

## Estrutura do Projeto

```
parking-wash/
├── backend/
│   ├── src/
│   │   ├── config/          # Variáveis de ambiente
│   │   ├── db/              # Schema, migrations, Supabase client
│   │   ├── middleware/      # Erros, validação
│   │   └── modules/
│   │       ├── parking/     # Check-in, checkout, histórico
│   │       ├── vehicle-types/ # Tipos de veículo e tarifas
│   │       ├── wash-orders/ # Fila de lavagem
│   │       ├── wash-services/ # Serviços disponíveis
│   │       ├── billing/     # Relatório de faturamento
│   │       ├── notifications/ # Alertas de tempo limite
│   │       └── settings/    # Configurações (vagas, etc.)
│   └── tests/               # Testes unitários e PBT
├── frontend/
│   ├── src/
│   │   ├── api/             # Funções de chamada à API
│   │   ├── components/      # Componentes React
│   │   ├── hooks/           # Hooks customizados
│   │   ├── types/           # Interfaces TypeScript
│   │   └── utils/           # Utilitários (pricing, formatação)
├── docs/
│   └── prompts/             # Prompts utilizados por etapa
└── .github/workflows/       # CI/CD pipeline
```

## Testes

```bash
cd parking-wash/backend
npm test
```

## Licença

Projeto acadêmico — Senai 2026.
