# BrickJobs

**BrickJobs** é um aplicativo web progressivo (PWA) que conecta construtoras e trabalhadores da construção civil em Rondonópolis-MT.

O projeto permite buscar e publicar vagas, gerenciar candidaturas, conversar após aprovações, cadastrar profissionais e empresas, acompanhar produtividade, receber alertas de chuva e segurança e gerar currículos e relatórios em PDF/CSV.

> **Estado atual:** aplicação em desenvolvimento, com dados persistidos no navegador. Não há banco de dados compartilhado, autenticação real nem backend de contas nesta versão.

## Índice

- [Status atual](#status-atual)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Execução local](#execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Estrutura](#estrutura)
- [Persistência e APIs](#persistência-e-apis)
- [Testes](#testes)
- [Estado do repositório](#estado-do-repositório)
- [Modificações recentes](#modificações-recentes)
- [Resumo das alterações estruturais na v1](#resumo-das-alterações-estruturais-na-v1)
- [Histórico recente de commits](#histórico-recente-de-commits)
- [Limitações](#limitações)

## Status atual

- Repositório público em TypeScript na branch `main`.
- Interface React responsiva para desktop e dispositivos móveis.
- Dois portais principais: **Construtora** e **Trabalhador**.
- PWA instalável, com service worker, manifestos, ícones e suporte de cache.
- Estado principal persistido em `localStorage` no navegador.
- APIs locais para clima, lembretes de segurança, notícias e dicas de carreira.
- Integração opcional com Gemini e Search Grounding.
- Dados e vagas demonstrativos voltados para Rondonópolis-MT.
- Proteções adicionadas para quedas de disponibilidade ou limite de quota da API Gemini.
- Documentação detalhada das alterações mais recentes no código disponível em [`ALTERACOES-RECENTES-CODIGO.md`](./ALTERACOES-RECENTES-CODIGO.md).
- Último push confirmado em `23/11/2026 às 14:55:50 UTC` (com correções locais consolidadas em `24/11/2026`).

## Funcionalidades

### Para construtoras

- Publicação, edição e encerramento de vagas por função, quantidade, salário, modalidade e competências.
- Níveis de prioridade e ordenação de vagas urgentes.
- Painel mensal de vagas abertas e finalizadas.
- Estatísticas por ocupação, avaliações e tempo de preenchimento.
- Exportação de relatórios em PDF e de profissionais em PDF/CSV.
- Cadastro da empresa, responsável, contatos, endereço, imagem e documentos.
- Diretório de profissionais contratados, concluídos e disponíveis.
- Gestão de candidaturas e chat após aprovação.
- Agendamento de início das obras e avisos de chuva.

### Para trabalhadores

- Cadastro profissional com foto, telefone, sexo, currículo e documentos.
- Geração e download de currículo em PDF.
- Upload e validação de documentos obrigatórios.
- Busca por texto, função, bairro, região, proximidade, salário e tipo de serviço.
- Pesquisa por voz quando suportada pelo navegador.
- Filtros avançados e vagas classificadas por prioridade.
- Candidaturas e acompanhamento do status.
- Chat com construtoras após aprovação.
- Notificações nativas por categorias compatíveis.
- Produtividade por obra e mês, estimativa de ganhos e calculadora de rescisão.
- Alertas de chuva, lembretes semanais de segurança, EPIs, notícias e dicas de carreira.
- Dicas de carreira com conteúdo curado disponível offline.
- Avaliação das construtoras após a conclusão do trabalho.
- Onboarding guiado para os dois perfis.

### Experiência geral

- Temas claro e escuro e controle de privacidade LGPD.
- Sincronização do estado entre abas.
- Navegação adaptada por portal.
- Instalação PWA e notificações em segundo plano quando suportadas.
- Sons sintetizados pela Web Audio API.
- Animação comemorativa com `canvas-confetti` ao aceitar contratos.
- Componentes responsivos padronizados e interface preparada para celular.

## Tecnologias

- **Frontend:** React 19, TypeScript/TSX e Tailwind CSS 4.
- **Build:** Vite 8.
- **Servidor:** Node.js e Express, executado por `tsx`.
- **PWA:** `vite-plugin-pwa` e Workbox.
- **Interface:** `lucide-react`, `motion` e `canvas-confetti`.
- **Dados visuais:** Recharts e D3.
- **Documentos:** jsPDF e exportação CSV.
- **IA:** SDK `@google/genai`.
- **Testes:** `node:test`, `node:assert/strict` e `tsx`.

## Execução local

Pré-requisitos: Bun ou Node.js/npm.

```bash
git clone https://github.com/LuizCastagno/BrickJobs.git
cd BrickJobs
bun install
bun run dev
```

Por padrão, o servidor utiliza a porta `3000`. Em desenvolvimento, Express fornece as APIs e o middleware do Vite serve o frontend.

Usando npm:

```bash
npm install
npm run dev
```

O lockfile principal é `bun.lock`.

## Variáveis de ambiente

Copie `.env.example` para `.env`:

| Variável | Uso |
| --- | --- |
| `GEMINI_API_KEY` | Chave privada usada no servidor para dicas de carreira, segurança e notícias. |
| `APP_URL` | URL pública documentada no exemplo. |
| `PORT` | Porta HTTP. Padrão: `3000`. |
| `NODE_ENV` | Em `production`, serve os arquivos compilados de `dist/`. |
| `DISABLE_HMR` | Quando `true`, desativa HMR e observação de arquivos no servidor Vite. |

A integração com Gemini é opcional. Em caso de indisponibilidade, quota esgotada ou ausência de chave, o servidor usa conteúdo local ou respostas controladas. Clima usa Open-Meteo e não exige chave no código atual.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `bun run dev` | Executa servidor Express e Vite em desenvolvimento. |
| `bun run build` | Executa a sincronização pré-build e gera o frontend em `dist/`. |
| `bun run preview` | Executa o preview do build do Vite. |
| `bun run start` | Executa `server.ts`; gere `dist/` antes da produção. |
| `bun run lint` | Executa `tsc --noEmit`. |
| `bun run clean` | Remove `dist` e `server.js`. |
| `npm run docs:sync` | Executa o sincronizador de documentação. |

## Estrutura

```text
.
├── .env.example
├── README.md
├── ALTERACOES-RECENTES-CODIGO.md
├── HISTORICO-ALTERACOES-RECENTES.md
├── index.html
├── server.ts
├── vite.config.ts
├── package.json
├── bun.lock
├── public/
├── scripts/
│   └── sync-readme.mjs
└── src/
    ├── main.tsx
    ├── App.tsx
    ├── index.css
    ├── components/     # 34 componentes React (portais, painéis, gráficos e modais)
    ├── data/           # Dados iniciais e seed regional (rondonopolisSeed.ts)
    ├── hooks/          # Hook de instalação PWA (usePWAInstall.ts)
    ├── types/          # Contratos TypeScript centrais (brickjobs.ts)
    └── utils/          # 38 módulos de regras puras e 37 suítes *.test.ts
```

- `App.tsx` centraliza estado, transição entre portais, tour guiado, modais e persistência.
- `WorkerPortal.tsx` concentra o fluxo do trabalhador (busca, segurança, notícias, cadastro e perfil).
- `EmployerPortal.tsx` concentra o fluxo da construtora (vagas, estatísticas, empresa e profissionais).
- `rondonopolisSeed.ts` fornece dados iniciais.
- `storage.ts` realiza leitura, migração e persistência.
- `server.ts` expõe APIs (`/api/*`) com guarda de quota Gemini e serve o frontend.
- `scripts/sync-readme.mjs` sincroniza o inventário quando os marcadores existirem no README; na ausência deles, encerra sem falhar.

## Persistência e APIs

Estado principal armazenado em:

```text
brickjobs_rondonopolis_state_v1
```

A leitura normaliza campos antigos para manter compatibilidade.

APIs internas:

- `GET /api/rain-alerts` — previsão meteorológica da Open-Meteo.
- `POST /api/career-tips` — dicas com Gemini e fallback local.
- `POST /api/safety-weekly-reminders` — lembretes semanais de segurança.
- `GET /api/construction-news` — notícias por Search Grounding ou feed curado.

## Testes

```bash
npx tsx --test src/utils/*.test.ts
npm run lint
npm run build
```

## Estado do repositório

- **Nome:** `LuizCastagno/BrickJobs`
- **Visibilidade:** público
- **Branch padrão:** `main`
- **Linguagem principal:** TypeScript
- **Descrição:** `Construction App`
- **Licença:** não definida
- **Issues abertas:** 0
- **Stars:** 0
- **Watchers:** 0
- **Forks:** 0
- **Tamanho:** 4.719 KB
- **Última atualização registrada:** `23/11/2026 às 14:55:50 UTC`
- **Repositório:** https://github.com/LuizCastagno/BrickJobs

## Modificações recentes

| Data/hora UTC | Commit | Alteração |
| --- | --- | --- |
| 24/11/2026 (local) | — | Correções gerais de fluxo e interface: guardas de transição de candidaturas, sincronização do tour guiado com abas externas, correção do toggle de notificações, reset de input PDF, `AbortController` em fetches, fechamento por `Escape`/backdrop no modal da empresa e ajustes de contraste/acessibilidade. Detalhes em [`ALTERACOES-RECENTES-CODIGO.md`](./ALTERACOES-RECENTES-CODIGO.md). |
| 23/11/2026 14:55:50 | [`b4df2a2`](https://github.com/LuizCastagno/BrickJobs/commit/b4df2a259462e577c3db1b87f1ced98b596403e4) | O sincronizador deixa de lançar erro quando os marcadores de inventário do README estão ausentes e registra uma mensagem informativa. |
| 23/11/2026 14:54:36 | [`0b74ccc`](https://github.com/LuizCastagno/BrickJobs/commit/0b74cccdc29be4415eaa0c296499a9a1dc68092e) | Proteção com cooldown para erros de quota/limitação 429 da API Gemini, evitando requisições redundantes e oferecendo fallback local. |
| 23/11/2026 14:49:44 | [`baa155f`](https://github.com/LuizCastagno/BrickJobs/commit/baa155f1817e2cd8ce173503b995461e5a2b2b1d) | Inclusão do histórico completo de commits no README. |
| 23/11/2026 14:29:58 | [`032c241`](https://github.com/LuizCastagno/BrickJobs/commit/032c241d01d8022f4a362e4078242e64a0f23bf9) | Dicas de carreira offline e estatísticas mensais de contratações finalizadas. |
| 22/11/2026 | [`7928c5a`](https://github.com/LuizCastagno/BrickJobs/commit/7928c5a2da3ae6db51a62a219e07880905d4caf0) | Histórico recente datado de alterações. |
| 22/11/2026 | [`738a601`](https://github.com/LuizCastagno/BrickJobs/commit/738a601bd37329d09bb2073e05fd5bec2ab38f63) | Exportação de profissionais em CSV/PDF. |
| 21/11/2026 | [`592e2f3`](https://github.com/LuizCastagno/BrickJobs/commit/592e2f3b08cdc4b62b7263324cf942217e616c0f) | Remoção de aba duplicada e criação do diretório de profissionais. |
| 20/11/2026 | [`243e401`](https://github.com/LuizCastagno/BrickJobs/commit/243e401b099e99623ce08b52ea89ad90b9f6e907) | Competências e exigências das vagas ampliadas. |
| 20/11/2026 | [`950b6aa`](https://github.com/LuizCastagno/BrickJobs/commit/950b6aaf9d6a9125f8b5d7e060b65922b92ea76c) | Filtros avançados por faixa salarial e tipo de serviço. |
| 20/11/2026 | [`36445fc`](https://github.com/LuizCastagno/BrickJobs/commit/36445fc1139dfc5427514b733a6b2de0c15891fc) | Sistema de prioridade para vagas. |
| 20/11/2026 | [`0acf91d`](https://github.com/LuizCastagno/BrickJobs/commit/0acf91d60b857b6788f7d49f2022c85812ec0f06) | Currículo em PDF. |
| 20/11/2026 | [`4d912fe`](https://github.com/LuizCastagno/BrickJobs/commit/4d912febbfb9d2d05a9aef2c183f0e707822b9be) | Confetes e sons de notificação. |
| 18/11/2026 | [`be4fe6c`](https://github.com/LuizCastagno/BrickJobs/commit/be4fe6cdee9ae94a891510709615f1a0e4451860) | Lembretes semanais de segurança e notícias da construção. |

## Resumo das alterações estruturais na v1

Ao longo da primeira versão (`v1`), a arquitetura do **BrickJobs** evoluiu de uma estrutura enxuta centrada nos fluxos principais de cadastro e vagas para uma organização modular em camadas, acompanhando o crescimento dos portais sem perder compatibilidade com dados salvos localmente:

1. **Separação de domínio, contratos e persistência versionada (`src/types/`, `src/data/`, `src/utils/storage.ts`):** os modelos centrais (`JobPosting`, `WorkerProfile`, `CompanyProfile`, `JobApplication`, `CompanyRating`, `ChatMessage`) foram isolados em `src/types/brickjobs.ts`, com seed regional em `src/data/rondonopolisSeed.ts` e leitura/normalização retrocompatível em `src/utils/storage.ts` para novos campos (prioridades, tags de habilidades, fotos de perfil, documentos e categorias de notificação).
2. **Desacoplamento da lógica de negócio para módulos puros testáveis (`src/utils/`):** cálculos de duração de obras, rescisão CLT, filtros avançados, ordenação por prioridade, exportação PDF/CSV, métricas mensais e regras de avaliação/onboarding foram extraídos dos componentes React para **38 módulos utilitários** acompanhados por **37 suítes de testes automatizados** (`*.test.ts`).
3. **Componentização dos portais e visualizações (`src/components/`):** a interface passou a contar com **34 componentes** especializados, separando os portais (`EmployerPortal`, `WorkerPortal`), navegação adaptativa (`TopNavBar`, `MobileBottomNav`), painéis analíticos em D3/Recharts (`EmployerMonthlyDashboard`, `EmployerStatisticsTab`, `WorkerEarningsPanel`, `WorkerProductivityPanel`), educação/notícias (`SafetyTipsCard`, `SafetyWeeklyRemindersCard`, `ConstructionNewsTab`, `CareerTipsCard`) e modais de fluxo (`ApplicationChatModal`, `CompanyRatingModal`, `LgpdPrivacyModal`, `GuidedTourModal`).
4. **Reorganização de abas e diretrizes de navegação:** a aba redundante de utilidades da construtora foi removida e substituída pelo diretório somente leitura `Profissionais Registrados/Disponíveis` (com exportação CSV/PDF), os controles de rescisão/chuva foram consolidados em modal dedicado e o atalho de configurações foi retirado da barra do portal do contratado.
5. **Camada de servidor e resiliência de APIs (`server.ts`, `src/utils/geminiQuota.ts`):** o servidor Express passou a centralizar rotas internas (`/api/rain-alerts`, `/api/career-tips`, `/api/safety-weekly-reminders`, `/api/construction-news`) com cache em memória, guarda compartilhada de cooldown contra erros `429` da API Gemini e fallback curado local para funcionamento offline.
6. **Automação de build e proteção de ciclo de vida:** inclusão do plugin PWA (`vite-plugin-pwa`), script pré-build resiliente em `scripts/sync-readme.mjs`, além de guardas formais de transição de candidaturas, coordenação entre tour guiado e abas externas, cancelamento de requisições com `AbortController` e limpeza de timers nos componentes.

## Histórico recente de commits

Os registros abaixo correspondem ao histórico disponível na consulta recente. Para consultar commits anteriores e todos os próximos resultados:

**[Ver todos os commits no GitHub](https://github.com/LuizCastagno/BrickJobs/commits/main)**

| SHA curto | Commit principal |
| --- | --- |
| [`b4df2a2`](https://github.com/LuizCastagno/BrickJobs/commit/b4df2a259462e577c3db1b87f1ced98b596403e4) | `chore: update readme sync to skip missing markers` |
| [`0b74ccc`](https://github.com/LuizCastagno/BrickJobs/commit/0b74cccdc29be4415eaa0c296499a9a1dc68092e) | `feat: implement Gemini API quota cooldown guard` |
| [`baa155f`](https://github.com/LuizCastagno/BrickJobs/commit/baa155f1817e2cd8ce173503b995461e5a2b2b1d) | `docs: add full recent commit history to README` |
| [`032c241`](https://github.com/LuizCastagno/BrickJobs/commit/032c241d01d8022f4a362e4078242e64a0f23bf9) | `feat: add offline career tips and hiring statistics` |
| [`7928c5a`](https://github.com/LuizCastagno/BrickJobs/commit/7928c5a2da3ae6db51a62a219e07880905d4caf0) | `docs: add dated recent changes history` |
| [`738a601`](https://github.com/LuizCastagno/BrickJobs/commit/738a601bd37329d09bb2073e05fd5bec2ab38f63) | `feat(employer): add export functionality for registered professionals` |
| [`592e2f3`](https://github.com/LuizCastagno/BrickJobs/commit/592e2f3b08cdc4b62b7263324cf942217e616c0f) | `refactor: remove utility tab and add professionals list` |
| [`243e401`](https://github.com/LuizCastagno/BrickJobs/commit/243e401b099e99623ce08b52ea89ad90b9f6e907) | `feat(employer): add competency management to jobs` |
| [`950b6aa`](https://github.com/LuizCastagno/BrickJobs/commit/950b6aaf9d6a9125f8b5d7e060b65922b92ea76c) | `feat: implement advanced job filtering system` |
| [`36445fc`](https://github.com/LuizCastagno/BrickJobs/commit/36445fc1139dfc5427514b733a6b2de0c15891fc) | `feat: add job priority system` |
| [`d8bc1a4`](https://github.com/LuizCastagno/BrickJobs/commit/d8bc1a42f2ab75a05e1258a95b8775d5bdca33e2) | `feat: add canvas-confetti dependency` |
| [`0acf91d`](https://github.com/LuizCastagno/BrickJobs/commit/0acf91d60b857b6788f7d49f2022c85812ec0f06) | `feat(worker): add draft resume PDF generation` |
| [`4d912fe`](https://github.com/LuizCastagno/BrickJobs/commit/4d912febbfb9d2d05a9aef2c183f0e707822b9be) | `feat: add celebration effects and sound notifications` |
| [`7962531`](https://github.com/LuizCastagno/BrickJobs/commit/7962531fdd55290c65f2ca6288d2303801219038) | `fix(ui): apply fixed dimensions to header title` |
| [`a792edf`](https://github.com/LuizCastagno/BrickJobs/commit/a792edfdc982271dc4e219d56401946a16f0b03d) | `docs: atualizar README completo e histórico de mudanças` |
| [`be4fe6c`](https://github.com/LuizCastagno/BrickJobs/commit/be4fe6cdee9ae94a891510709615f1a0e4451860) | `feat: add safety reminders and construction news` |
| [`7393211`](https://github.com/LuizCastagno/BrickJobs/commit/73932119c2d0102ccff3e31a812e216ecd2b161c) | `docs: add BrickJobs maintenance README` |
| [`0913042`](https://github.com/LuizCastagno/BrickJobs/commit/0913042271a798cf76147c827b46755656ee6d8d) | `feat(stats): add open vs closed vacancy analytics and PDF reporting` |
| [`5a58484`](https://github.com/LuizCastagno/BrickJobs/commit/5a58484932901bf1e47ca856f7420864295089de) | `feat: add job notification categories preference` |
| [`fbc4687`](https://github.com/LuizCastagno/BrickJobs/commit/fbc46878c2af0c055b2b8c5289b0609b92956e3b) | `feat: add profile photo support for users and jobs` |

## Limitações

- Não há banco de dados compartilhado entre dispositivos.
- Não há autenticação, autorização ou contas reais.
- `localStorage` pode atingir limite de quota ou ser apagado pelo usuário.
- Dados e vagas são exemplos locais, não oportunidades confirmadas.
- Documentos e imagens são armazenados como data URLs no navegador.
- APIs não implementam autenticação ou rate limiting próprios no servidor atual.
- Cache PWA não sincroniza dados locais.
- Notificações nativas dependem de permissão e suporte do navegador.
- Clima e recursos de IA dependem de serviços externos.
- Cálculos trabalhistas e meteorológicos são informativos e devem ser validados por profissionais.

Ao alterar contratos de dados, migre o estado antigo em `src/utils/storage.ts`, atualize os tipos em `src/types/brickjobs.ts`, revise componentes afetados e adicione ou atualize testes.

---

**Repositório:** https://github.com/LuizCastagno/BrickJobs
