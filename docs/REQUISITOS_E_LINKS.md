# Requisitos do Projeto — Links e Status

**Repositório:** https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash  
**Data:** 28/05/2026

---

## Repositório e Organização

| Req | Descrição | Status | Link |
|-----|-----------|--------|------|
| R01 | Repositório privado com colaboradores | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/settings/access |
| R02 | Estrutura de pastas (README, docs/prompts, .env.example) | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/main/parking-wash |
| R03 | Quadro Kanban com 6 colunas | ✅ Verificar presencialmente | https://github.com/orgs/IA-para-DEVs-SCTEC-T2/projects/22 |
| R04 | Cards no quadro com descrição clara | ✅ Verificar presencialmente | https://github.com/orgs/IA-para-DEVs-SCTEC-T2/projects/22 |
| R05 | Cards atualizados ao longo do projeto | ✅ Verificar presencialmente | https://github.com/orgs/IA-para-DEVs-SCTEC-T2/projects/22 |
| R06 | Branches descritivas a partir da develop | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/branches |
| R07 | Ao menos 8 commits com mensagens claras | ✅ (9 commits) | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/commits/main |
| R08 | Tudo mergeado na main | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/main |

---

## Branches Obrigatórias

| Branch | Status | Link |
|--------|--------|------|
| main | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/main |
| develop | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/develop |
| feature/especificacao-arquitetura | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/feature/especificacao-arquitetura |
| feature/geracao-codigo-ia | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/feature/geracao-codigo-ia |
| feature/refatoracao-ia | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/feature/refatoracao-ia |
| feature/testes-automatizados | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/feature/testes-automatizados |
| feature/pipeline-ci-cd | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/feature/pipeline-ci-cd |
| docs/prompts-readme | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/docs/prompts-readme |

---

## Desenvolvimento com IA

| Req | Descrição | Status | Evidência |
|-----|-----------|--------|-----------|
| D01 | Domínio e escopo documentados | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/README.md#descri%C3%A7%C3%A3o-do-problema |
| D02 | Arquitetura com IA no README | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/README.md#arquitetura |
| D03 | 3 ciclos de geração e refinamento | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/docs/prompts/README.md |
| D04 | 2 padrões de prompting com contexto | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/README.md#padr%C3%B5es-de-prompting-aplicados |
| D05 | Prompts salvos em docs/prompts/ | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/main/parking-wash/docs/prompts |
| D06 | 1 refatoração documentada (antes/depois) | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/docs/prompts/README.md (Caso 2) |
| D07 | Testes gerados com IA e validados | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/main/parking-wash/backend/tests |
| D08 | Documentação automática (docstrings, README) | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/PRICING_IMPLEMENTATION_RULES.md |
| D09 | Pipeline CI/CD com GitHub Actions | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/actions |
| D10 | 1 caso de saída incorreta da IA | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/README.md#caso-de-sa%C3%ADda-incorreta-da-ia |
| D11 | 2 cenários de uso demonstrados | ✅ | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/README.md#cen%C3%A1rios-de-uso |

---

## README.md

| Req | Descrição | Status | Seção |
|-----|-----------|--------|-------|
| M01 | Nome do projeto + problema resolvido | ✅ | "Descrição do Problema" |
| M02 | Ferramentas de IA e etapas | ✅ | "Ferramentas de IA Utilizadas" |
| M03 | Padrões de prompting com exemplos | ✅ | "Padrões de Prompting Aplicados" |
| M04 | Diagrama/descrição da arquitetura | ✅ | "Arquitetura" |
| M05 | Instruções de instalação e execução | ✅ | "Instalação e Execução" |
| M06 | Cenários de uso com entrada/saída | ✅ | "Cenários de Uso" |
| M07 | Caso de saída incorreta da IA | ✅ | "Caso de Saída Incorreta da IA" |
| M08 | Melhorias futuras | ✅ | "Melhorias Futuras" |
| M09 | Link do vídeo YouTube | ⏳ Pendente | Placeholder no README (substituir após gravação) |

**Link do README:** https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/README.md

---

## Links Rápidos

| Recurso | Link |
|---------|------|
| Repositório | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash |
| Main (código final) | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/main |
| Branches | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/branches |
| Commits | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/commits/main |
| Issues (fechadas) | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/issues?q=is%3Aissue+is%3Aclosed |
| Actions (CI/CD) | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/actions |
| Projects (Kanban) | https://github.com/orgs/IA-para-DEVs-SCTEC-T2/projects/22 |
| README | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/README.md |
| docs/prompts | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/main/parking-wash/docs/prompts |
| Testes | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/tree/main/parking-wash/backend/tests |
| CI/CD yml | https://github.com/IA-para-DEVs-SCTEC-T2/parking-wash/blob/main/parking-wash/.github/workflows/ci.yml |

---

## Pendências

1. **M09 (Vídeo):** Gravar vídeo de demonstração e substituir o link placeholder no README

---

**Última atualização:** 28/05/2026
