# Prompts Utilizados no Desenvolvimento

Este diretório documenta os prompts e interações com IA utilizados durante o desenvolvimento do ParkingWash.

## Etapas do Desenvolvimento com IA

### 1. Especificação e Arquitetura
- Definição da arquitetura em camadas (Controller → Service → Database)
- Escolha de tecnologias (React, Express, TypeScript, Supabase)
- Modelagem do banco de dados (4 tabelas: vehicle_types, parking_records, wash_services, wash_orders)

### 2. Geração de Código
- Geração dos módulos backend com Chain of Thought
- Implementação dos componentes React com refinamento iterativo
- Criação de validadores com Zod

### 3. Refatoração
- Refatoração do PricingService seguindo princípios SOLID
- Separação de responsabilidades (services puros, controllers HTTP)
- Remoção de dependências externas não funcionais (SINESP → mock local)

### 4. Testes Automatizados
- Geração de testes unitários com Jest
- Testes property-based com fast-check
- Cobertura de cenários de erro e edge cases

### 5. Pipeline CI/CD
- Configuração do GitHub Actions para build e testes automáticos
- Validação de TypeScript em ambos os projetos (backend + frontend)

### 6. Documentação
- README com instruções de execução
- Documentação de regras de precificação
- Lista de placas mock para testes
- Changelog por feature

## Casos de Refinamento

### Caso 1: API FIPE não funcional
- **Problema:** APIs externas (SINESP, FIPE) não retornavam dados
- **Solução via IA:** Criação de mock local com 26 veículos realistas
- **Resultado:** Sistema funciona 100% sem dependência externa

### Caso 2: Regras de precificação incorretas
- **Problema:** Cálculo usava fração fixa de R$ 5 para todos os tipos de veículo
- **Refinamento:** Implementação de fração proporcional (50% da tarifa horária de cada tipo)
- **Resultado:** Cálculo proporcional — cada tipo tem sua fração baseada na 1ª hora configurada

### Caso 3: Checkout falhando com gateway
- **Problema:** PaymentService tentava conectar a gateway inexistente
- **Solução:** Modo simulação quando PAYMENT_GATEWAY_URL não está configurado
- **Resultado:** Checkout funciona em ambiente de desenvolvimento

## Ferramentas de IA Utilizadas
- Kiro (IDE com IA integrada)
- Prompts em linguagem natural para geração e refatoração de código
- Análise de erros e correções assistidas por IA
