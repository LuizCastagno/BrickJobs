# Histórico de alterações recentes — BrickJobs

Alterações do aplicativo organizadas cronologicamente (da mais antiga para a mais recente), incluindo o registro técnico consolidado dos arquivos afetados.

## 20/11/2026

- **15:33 UTC — [Celebrações, sons e documentação automática](https://github.com/LuizCastagno/BrickJobs/commit/4d912febbfb9d2d05a9aef2c183f0e707822b9be):** confetes ao aceitar contratos; sons sintetizados pela Web Audio API; script `prebuild` para sincronizar o README.
- **15:44 UTC — [Resumo profissional em PDF](https://github.com/LuizCastagno/BrickJobs/commit/0acf91d60b857b6788f7d49f2022c85812ec0f06):** geração de currículo preliminar em PDF diretamente pelo portal do trabalhador, com validação dos campos obrigatórios.
- **22:16 UTC — [Dependência para confetes](https://github.com/LuizCastagno/BrickJobs/commit/d8bc1a42f2ab75a05e1258a95b8775d5bdca33e2):** inclusão de `canvas-confetti` e dos tipos TypeScript necessários.
- **22:30 UTC — [Prioridade e urgência das vagas](https://github.com/LuizCastagno/BrickJobs/commit/36445fc1139dfc5427514b733a6b2de0c15891fc):** níveis normal, alta e urgente; destaques visuais e ordenação nas aplicações.
- **22:35 UTC — [Filtros avançados de vagas](https://github.com/LuizCastagno/BrickJobs/commit/950b6aaf9d6a9125f8b5d7e060b65922b92ea76c):** filtros por faixa salarial estimada e tipo de serviço no portal do trabalhador.
- **22:47 UTC — [Competências e especialidades nas vagas](https://github.com/LuizCastagno/BrickJobs/commit/243e401b099e99623ce08b52ea89ad90b9f6e907):** campos para competências obrigatórias e especialidades; atualização dos prompts de segurança.

## 21/11/2026

- **15:53 UTC — [Diretório de profissionais do contratante](https://github.com/LuizCastagno/BrickJobs/commit/592e2f3b08cdc4b62b7263324cf942217e616c0f):** remoção da aba redundante de utilidades e implementação de diretório de profissionais contratados e disponíveis.

## 22/11/2026

- **07:42 UTC — [Exportação de profissionais e ajustes de navegação](https://github.com/LuizCastagno/BrickJobs/commit/738a601bd37329d09bb2073e05fd5bec2ab38f63):** exportação dos profissionais registrados em CSV/PDF e remoção do botão de configurações da barra superior.
- **07:47 UTC — [Histórico datado de alterações](https://github.com/LuizCastagno/BrickJobs/commit/7928c5a2da3ae6db51a62a219e07880905d4caf0):** organização datada e cronológica do histórico recente do projeto.

## 23/11/2026

- **14:29 UTC — [Dicas offline e estatísticas de contratações](https://github.com/LuizCastagno/BrickJobs/commit/032c241d01d8022f4a362e4078242e64a0f23bf9):** catálogo offline de dicas de carreira e gráfico mensal de contratações finalizadas no portal da construtora.
- **14:49 UTC — [Histórico completo no README](https://github.com/LuizCastagno/BrickJobs/commit/baa155f1817e2cd8ce173503b995461e5a2b2b1d):** consolidação do histórico completo de mudanças na documentação principal.
- **14:54 UTC — [Proteção contra limite de chamadas da API Gemini](https://github.com/LuizCastagno/BrickJobs/commit/0b74cccdc29be4415eaa0c296499a9a1dc68092e):** implementação de cooldown para erros `429`/`RESOURCE_EXHAUSTED`, compartilhado pelos endpoints do servidor.
- **14:55 UTC — [Sincronização resiliente do README](https://github.com/LuizCastagno/BrickJobs/commit/b4df2a259462e577c3db1b87f1ced98b596403e4):** ajuste do script de sincronização para concluir com aviso quando os marcadores do README não existirem.
- **15:22 UTC — [README atualizado](https://github.com/LuizCastagno/BrickJobs/commit/5118c9f4ad7c75b53c10731aba6158bcb1474fcd):** atualização integral da documentação com o estado atual e o histórico recente.

### Registro técnico consolidado — código-fonte

#### Regras de fluxo, estado e onboarding

- **`src/utils/ratings.ts` e `src/utils/ratings.test.ts`:** adicionadas `canAcceptApplication` e `canApplyToJob`, impedindo reaceitação de contratos concluídos e candidaturas inválidas; cobertura incluída nos testes.
- **`src/utils/onboarding.ts` e `src/utils/onboarding.test.ts`:** atualizado o tour do perfil contratante para as abas vigentes `Dados da Empresa` e `Profissionais`; adicionada `resolveTourTabSelection` para sincronizar abas e concluir ou descartar o tour.
- **`src/App.tsx`:** aplicadas as novas guardas nos fluxos de aceite e candidatura; IDs de vagas e candidaturas receberam sufixos aleatórios para evitar colisões; separadas conclusão e dispensa do tour, conectadas às barras de navegação.

#### Portal da construtora e estatísticas

- **`src/components/EmployerPortal.tsx`:** sincronização externa do formulário por perfil recebido; limpeza de timers e proteção contra duplo clique nas exportações; suporte a Escape e clique no backdrop do modal; `visibleApplications` memoizado e espaçamento mobile corrigido.
- **`src/components/EmployerStatisticsTab.tsx` e `src/utils/employerPerformance.ts`:** gráfico Recharts dos últimos seis meses de contratações finalizadas; timers de exportação e feedback protegidos contra desmontagem e duplo clique.
- **`src/utils/employerProfessionals.ts` e `src/utils/employerProfessionalsExport.ts`:** diretório somente leitura de profissionais registrados e disponíveis; exportação em CSV com UTF-8/BOM e PDF via `jsPDF`.

#### Portal do trabalhador, segurança e notícias

- **`src/components/WorkerPortal.tsx`:** painel de notificações sincronizado pelo estado `showNotifications`, upload de PDF reinicializado após remoções ou erros e listas memoizadas em paridade com os contadores.
- **`src/components/SafetyWeeklyRemindersCard.tsx` e `src/components/ConstructionNewsTab.tsx`:** `AbortController` e `isMountedRef` evitam atualizações após desmontagem ou requisições sobrepostas; contagem de EPIs considera somente valores verdadeiros; contraste dos selos ajustado.
- **`src/components/MobileBottomNav.tsx`:** removido comentário JSDoc duplicado no topo do arquivo.

#### Servidor, quota da API Gemini e scripts

- **`src/utils/geminiQuota.ts` e `server.ts`:** implementado `createGeminiCooldownGuard`, com detecção de `429`/`RESOURCE_EXHAUSTED` e cálculo de `retry delay`; os endpoints fornecem conteúdo curado offline durante indisponibilidade.
- **`src/utils/careerTips.ts` e `src/components/CareerTipsCard.tsx`:** catálogo curado ampliado e cache semanal em `localStorage`, permitindo uso offline.
- **`scripts/sync-readme.mjs`:** ausência dos marcadores de inventário agora gera log informativo, sem quebrar o `prebuild`.

## 24/11/2026

- **00:37 UTC — [Estabilidade e gerenciamento de estado](https://github.com/LuizCastagno/BrickJobs/commit/6ef66abffffcd60e8592158aa0c8f413c7a472a1):** `AbortController` para buscas, refs para limpeza e corridas assíncronas, IDs exclusivos e sincronização do formulário do empregador com mudanças externas.
- **22:31 UTC — [Dependências otimizadas e projeto limpo](https://github.com/LuizCastagno/BrickJobs/commit/8c0577fac524cec89a42fd1f944b9e11453cf217):** pacotes exclusivos de desenvolvimento movidos para `devDependencies`; refinados imports e componentes; documentação e mapeamento de estrutura atualizados.

### Verificação após as alterações recentes

- **Testes automatizados (`npx tsx --test src/utils/*.test.ts`):** 37 arquivos de teste / 190 casos aprovados.
- **Checagem de tipos (`npm run lint`):** `tsc --noEmit` sem erros.
- **Build de produção (`npm run build`):** `sync-readme.mjs` e `vite build` concluídos com sucesso.
