# Regras de Precificação — ParkingWash

## Regras de Cobrança

### 1. Primeira Hora (até 60 minutos)
- **Valor configurável por tipo de veículo**
- Qualquer permanência de 1 minuto até 60 minutos cobra o valor da 1ª hora
- O valor é definido pelo usuário em Dashboard > Configurações

### 2. Frações Adicionais (após a primeira hora)
- **50% do valor da 1ª hora** por cada 30 minutos (ou fração de 30 min)
- A fração é calculada automaticamente: `fracao = tarifa_horaria × 0.5`
- Exemplos com Carro (1ª hora = R$ 15):
  - Fração = R$ 15 × 50% = R$ 7,50
  - 1h01 a 1h30 → R$ 15 + R$ 7,50 = R$ 22,50
  - 1h31 a 2h00 → R$ 15 + R$ 7,50 + R$ 7,50 = R$ 30,00
  - 2h01 a 2h30 → R$ 15 + R$ 7,50 + R$ 7,50 + R$ 7,50 = R$ 37,50

### 3. Diária (teto automático)
- **Valor configurável por tipo de veículo**
- Aplica automaticamente quando o cálculo horário atinge ou ultrapassa o valor da diária
- Qualquer permanência cujo cálculo exceda a diária cobra apenas a diária

### 4. Excedente (após 24 horas)
- Após 24h, inicia-se **nova cobrança**
- Cada bloco de 24h = 1 diária
- O período restante após os blocos de 24h segue as regras 1-3

---

## Tabela de Exemplos

### Carro (1ª Hora = R$ 15, Diária = R$ 70)
Fração = R$ 15 × 50% = R$ 7,50

| Permanência | Cálculo | Total |
|-------------|---------|-------|
| 15 min | 1ª hora | R$ 15,00 |
| 45 min | 1ª hora | R$ 15,00 |
| 1h00 | 1ª hora | R$ 15,00 |
| 1h15 | 15 + 7,50 | R$ 22,50 |
| 1h30 | 15 + 7,50 | R$ 22,50 |
| 1h45 | 15 + 7,50 + 7,50 | R$ 30,00 |
| 2h00 | 15 + 7,50 + 7,50 | R$ 30,00 |
| 2h30 | 15 + 3×7,50 | R$ 37,50 |
| 3h00 | 15 + 4×7,50 | R$ 45,00 |
| 4h00 | 15 + 6×7,50 | R$ 60,00 |
| 5h00 | 15 + 8×7,50 = 75 → Diária | R$ 70,00 |
| 8h00 | Diária (teto) | R$ 70,00 |
| 24h00 | 1 diária | R$ 70,00 |
| 25h00 | 1 diária + 1ª hora | R$ 85,00 |
| 26h30 | 1 diária + 15 + 7,50 + 7,50 | R$ 100,00 |
| 48h00 | 2 diárias | R$ 140,00 |

### Motocicleta (1ª Hora = R$ 6,50, Diária = R$ 35)
Fração = R$ 6,50 × 50% = R$ 3,25

| Permanência | Cálculo | Total |
|-------------|---------|-------|
| 1h00 | 1ª hora | R$ 6,50 |
| 1h30 | 6,50 + 3,25 | R$ 9,75 |
| 2h00 | 6,50 + 3,25 + 3,25 | R$ 13,00 |
| 3h00 | 6,50 + 4×3,25 | R$ 19,50 |
| ~10h | Diária (teto) | R$ 35,00 |

### Motorhome (1ª Hora = R$ 25, Diária = R$ 140)
Fração = R$ 25 × 50% = R$ 12,50

| Permanência | Cálculo | Total |
|-------------|---------|-------|
| 1h00 | 1ª hora | R$ 25,00 |
| 1h30 | 25 + 12,50 | R$ 37,50 |
| 2h00 | 25 + 12,50 + 12,50 | R$ 50,00 |
| 3h00 | 25 + 4×12,50 | R$ 75,00 |
| ~10h30 | Diária (teto) | R$ 140,00 |

---

## Configuração pelo Usuário

O usuário pode alterar os valores a qualquer momento via **Dashboard > ⚙️ Configurações**:

| Campo | Descrição | Efeito |
|-------|-----------|--------|
| 1ª Hora (R$) | Valor cobrado nos primeiros 60 min | Define também a fração (50% deste valor) |
| Diária (R$) | Teto máximo de cobrança por período de 24h | Aplica automaticamente quando frações atingem esse valor |

A fração de 30 minutos **não é configurável diretamente** — é sempre 50% da 1ª hora. Isso garante proporcionalidade entre os tipos de veículo.

---

## Implementação Técnica

### Backend
- Arquivo: `backend/src/modules/parking/services/pricing.service.ts`
- Classe: `PricingService`
- Método: `calculateFee(entry, exit, hourlyRate, dailyRate)`
- Fração: `fractionRate = hourlyRate * 0.5` (calculada internamente)

### Frontend
- Arquivo: `frontend/src/utils/pricing.ts`
- Função: `calculatePricing(entryTime, hourlyRate, dailyRate)`
- Mesma lógica do backend (espelhada para exibição em tempo real no modal)

### Fluxo no Checkout
1. Backend busca `vehicleType.hourlyRate` e `vehicleType.dailyRate` do banco
2. Calcula fração = hourlyRate × 0.5
3. Aplica regras progressivas (1ª hora + frações + teto diário)
4. Retorna `totalAmount` formatado com 2 casas decimais

---

## Regra de Manutenção de Documentação

> **IMPORTANTE:** Toda alteração relevante nas regras de negócio do projeto DEVE ser refletida nas respectivas documentações. Ao modificar qualquer regra de precificação, cálculo, fluxo de checkout ou configuração, atualize obrigatoriamente:
> - Este arquivo (`PRICING_IMPLEMENTATION_RULES.md`)
> - `README.md` (seção de regras e cenários de uso)
> - `docs/prompts/README.md` (se envolver refinamento com IA)
> - Comentários no código-fonte (`pricing.service.ts`, `pricing.ts`)
>
> Nenhuma regra deve existir apenas no código sem estar documentada.

---

## Regra de Reset da Fila de Lavagem (Virada do Dia)

A coluna "Concluídos" na fila de lavagem é **resetada automaticamente à meia-noite (00:00)**:

- **O que acontece:** Ao virar o dia, a coluna "Concluídos" fica vazia
- **Dados deletados?** NÃO — os registros permanecem no banco de dados
- **Histórico:** Todos os registros continuam acessíveis via botão "📋 Histórico"
- **Como funciona:** O backend filtra `completed_at >= hoje 00:00:00` para a fila ativa
- **Colunas afetadas:** Apenas "Concluídos" — "Aguardando" e "Em Andamento" não são afetadas

**Implementação técnica:**
- Backend: `wash-orders.service.ts` → `listOrders()` aplica filtro `completed_at >= dayStart` quando status é "Completed" ou quando não há filtro de status
- Frontend: Nenhuma alteração necessária — consome o endpoint normalmente
- Histórico: Endpoint separado (`/api/wash-orders/history`) retorna todos os registros sem filtro de data

---

## Histórico de Alterações

| Data | Alteração |
|------|-----------|
| 26/05/2026 | Regra inicial: R$ 10/hora fixa, threshold 6h para diária |
| 27/05/2026 | Nova regra: 1ª hora + frações de 30min R$ 5 fixo + diária como teto |
| 28/05/2026 | **Regra atual:** 1ª hora configurável + frações = 50% da 1ª hora + diária configurável |
| 28/05/2026 | Reset automático da coluna "Concluídos" na fila de lavagem à meia-noite |
