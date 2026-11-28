# Alterações mais recentes nos códigos — BrickJobs

Registro técnico das modificações mais recentes implementadas no código-fonte da aplicação (**23/11/2026 – 24/11/2026**), organizadas por camada e arquivo. Para a linha do tempo resumida por commit desde o início da série recente, consulte também [`HISTORICO-ALTERACOES-RECENTES.md`](./HISTORICO-ALTERACOES-RECENTES.md).

---

## 1. Regras de fluxo, estado e onboarding (`src/App.tsx`, `src/utils/`)

### `src/utils/ratings.ts` e `src/utils/ratings.test.ts`
- Adicionadas as funções puras **`canAcceptApplication`** (permite aceitação apenas quando `status === 'pendente'`, impedindo reaceitar contratos já concluídos) e **`canApplyToJob`** (exige vaga com `status === 'aberta'` e ausência de candidatura anterior na mesma vaga).
- Cobertura adicionada na suíte `src/utils/ratings.test.ts`.

### `src/utils/onboarding.ts` e `src/utils/onboarding.test.ts`
- Atualizados os passos do tour guiado do perfil `contratante` para refletir as abas vigentes: **`Dados da Empresa`** e **`Profissionais`** (visualização somente leitura de registrados/disponíveis com exportação CSV/PDF).
- Extraída a função pura **`resolveTourTabSelection`**, responsável por sincronizar o índice do passo ao clicar em uma aba coberta pelo tour ou encerrar o tour automaticamente ao navegar para outra aba (ex.: *Estatísticas*).
- Testes atualizados em `src/utils/onboarding.test.ts`.

### `src/App.tsx`
- Aplicadas as guardas `canAcceptApplication` e `canApplyToJob` em `handleAcceptApplication` e `handleApplyJob`.
- Adicionado sufixo aleatório aos IDs criados em `handleCreateJob` e `handleApplyJob` para evitar colisões em chamadas consecutivas no mesmo milissegundo.
- Separados `handleCompleteTour` (conclusão com retorno à aba `vagas`) e `handleDismissTour` (fechamento sem desviar o usuário da aba atual) e conectado `handlePortalTabSelect` às barras `TopNavBar` e `MobileBottomNav`.

---

## 2. Portal da Construtora e Estatísticas (`src/components/EmployerPortal.tsx`, `src/components/EmployerStatisticsTab.tsx`)

### `src/components/EmployerPortal.tsx`
- **Sincronização externa de formulário:** efeito comparando o perfil recebido via `lastSyncedCompanyProfileRef` para atualizar `companyForm` em eventos externos de `storage` sem sobrescrever edições em andamento.
- **Limpeza de timers e trava de duplo clique:** adição de `exportRegisteredTimerRef` com limpeza em unmount e guarda `isExportingRegistered` em `handleExportRegisteredPdf`.
- **Acessibilidade do modal de ferramentas (`employer-tools-modal`):** fechamento por tecla `Escape` e clique no backdrop externo.
- **Consistência de listas e layout mobile:** cálculo memoizado de `visibleApplications` (garantindo paridade entre contador do título e cartões exibidos), espaçamento explícito entre quantidade e palavra `"vaga(s)"` para leitores de tela e ocultação de divisórias verticais (`hidden sm:block`) no cabeçalho em telas estreitas.

### `src/components/EmployerStatisticsTab.tsx` e `src/utils/employerPerformance.ts`
- Adicionado gráfico de barras dos últimos **6 meses** de contratações finalizadas com **Recharts** (`buildMonthlyFinalizedHiringsHistory`), considerando vagas encerradas e candidaturas concluídas.
- Adicionados `exportTimerRef`, `feedbackTimerRef` e proteção contra duplo clique em `handleExportReport`, com limpeza automática ao desmontar o componente.

### `src/utils/employerProfessionals.ts` e `src/utils/employerProfessionalsExport.ts`
- Estruturado o diretório somente leitura de profissionais registrados na empresa (aceitos/concluídos) e disponíveis para serviço (`buildEmployerProfessionalsDirectory`).
- Implementada a exportação da lista de profissionais registrados em **CSV** (UTF-8 com BOM) e **PDF** via `jsPDF`.

---

## 3. Portal do Trabalhador, Segurança e Notícias (`src/components/`)

### `src/components/WorkerPortal.tsx`
- **Sincronização do painel de notificações:** `showNotifications` passou a controlar de forma única tanto o atributo `aria-expanded` quanto a renderização do painel (sem travar aberto quando `unreadCount > 0`), mantendo abertura automática apenas quando novos avisos não lidos chegam.
- **Upload de PDF e perfil sincronizado:** limpeza de `input.value` em `handlePdfUpload` para permitir selecionar novamente o mesmo arquivo após erro ou remoção, validação contra resultado vazio do `FileReader` e sincronização segura de `form` via `lastSyncedWorkerProfileRef`.
- **Consistência de candidaturas e acessibilidade:** memoização de `visibleApplications` alinhada ao contador do cabeçalho e espaçamento explícito no badge de quantidade de vagas.

### `src/components/SafetyWeeklyRemindersCard.tsx` e `src/components/ConstructionNewsTab.tsx`
- Adicionado controle de cancelamento e ciclo de vida (`AbortController` + `isMountedRef`) para evitar atualizações de estado após desmontagem ou requisições sobrepostas.
- Corrigida a contagem `completedChecks` no checklist semanal de EPIs para contabilizar apenas entradas verdadeiras (`Boolean(checked)`).
- Ajustado o contraste dos selos sobre o gradiente escuro/terracota do cabeçalho (`text-[#FDE68A]` sobre `bg-white/15`).

### `src/components/MobileBottomNav.tsx`
- Removido bloco de comentário JSDoc duplicado no topo do arquivo.

---

## 4. Servidor, Quota da API Gemini e Scripts (`server.ts`, `src/utils/`, `scripts/`)

### `src/utils/geminiQuota.ts` e `server.ts`
- Implementado `createGeminiCooldownGuard` (com detecção de erros `429` / `RESOURCE_EXHAUSTED` via `isGeminiQuotaError` e `extractRetryDelayMs`), compartilhado entre `/api/career-tips`, `/api/safety-weekly-reminders` e `/api/construction-news`.
- Durante o período de cooldown ou indisponibilidade da API externa, o servidor responde com conteúdo curado offline sem repetir requisições à API Gemini nem poluir o log com erros brutos repetidos.

### `src/utils/careerTips.ts` e `src/components/CareerTipsCard.tsx`
- Ampliação do catálogo curado e cache semanal em `localStorage` para dicas de currículo e entrevista disponíveis mesmo em modo offline.

### `scripts/sync-readme.mjs`
- Atualizado para encerrar com log informativo (sem lançar erro nem falhar o `prebuild`) quando os marcadores `<!-- AUTO_INVENTORY_START -->` e `<!-- AUTO_INVENTORY_END -->` não estiverem presentes no `README.md`.

---

## 5. Evoluções adicionais e documentação consolidada (24/11/2026 – 27/11/2026)

- **Resiliência de carregamento (`src/components/AppErrorScreen.tsx`, `src/components/AppErrorBoundary.tsx`, `index.html`):** tela diagnóstica de erro com detecção de status offline e recuperação de inicialização.
- **Dicas de Segurança no Canteiro de Obras offline (`src/utils/siteSafetyGuides.ts`, `src/components/ConstructionSiteSafetySection.tsx`):** guias práticos das NRs 06, 10, 11, 12, 18, 21 e 35 armazenados localmente para consulta offline.
- **Construtoras em Destaque (`src/utils/featuredCompanies.ts`, `src/components/FeaturedCompaniesSection.tsx`):** gráfico comparativo em Recharts com média das avaliações por empresa e atalho de filtro.
- **Compartilhamento de vagas (`src/utils/jobShare.ts`, `src/components/JobDetailsModal.tsx`):** integração com Web Share API, WhatsApp, cópia e deep link `?vaga=<id>`.
- **Sugestão de 3 competências via Gemini API (`src/utils/workerCompetencySuggestions.ts`, `src/components/WorkerCompetencySuggestionsCard.tsx`, `server.ts`):** endpoint `POST /api/worker-competencies` analisando experiências para recomendar 3 competências aplicáveis ao perfil e ao currículo PDF.
- **Documentação refatorada em PDF (`public/BrickJobs_Documentacao_Refatorada.pdf`, `vite.config.ts`, `CoverScreen.tsx`, `UserSettingsMenu.tsx`):** arquivo ABNT completo com exclusão de fallback `.pdf` no Workbox e links diretos de download no aplicativo.

---

## 6. Resumo da verificação após as alterações

- **Testes automatizados (`npx tsx --test src/utils/*.test.ts`):** 42 suítes / 214 casos aprovados.
- **Checagem de tipos (`npm run lint`):** `tsc --noEmit` sem erros.
- **Build de produção (`npm run build`):** `sync-readme.mjs` e `vite build` executados com saída `0`.
