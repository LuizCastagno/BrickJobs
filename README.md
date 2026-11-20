# BrickJobs

**BrickJobs** é um aplicativo web progressivo (PWA) para conectar construtoras e trabalhadores da construção civil em Rondonópolis-MT.

O projeto oferece busca e publicação de vagas, candidaturas, chat entre contratante e contratado, cadastro profissional, documentos, notificações nativas, acompanhamento de produtividade e ganhos, ferramentas de segurança e clima, relatórios da construtora e recursos de privacidade conforme a LGPD.

> Projeto atual em desenvolvimento: os dados de demonstração e o estado persistido no navegador são mantidos localmente. O projeto ainda não usa um banco de dados ou autenticação real no backend atual.

## Índice

- [Status atual](#status-atual)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Execução local](#execução-local)
- [Variáveis de ambiente](#variáveis-de-ambiente)
- [Scripts](#scripts)
- [Arquitetura e estrutura](#arquitetura-e-estrutura)
- [Persistência e APIs](#persistência-e-apis)
- [Testes](#testes)
- [Histórico completo de mudanças](#histórico-completo-de-mudanças)
- [Modificações atuais](#modificações-atuais)
- [Limitações](#limitações)

## Status atual

- Interface React responsiva para desktop e dispositivos móveis.
- Dois perfis principais: **Contratante** e **Contratado**.
- PWA instalável, com service worker, ícones e cache de fontes.
- Estado persistido no `localStorage` por navegador.
- APIs locais para clima, dicas de carreira, lembretes de segurança e notícias.
- Integração opcional com Gemini e Search Grounding.
- Dados e exemplos voltados para Rondonópolis-MT.

## Funcionalidades

### Para construtoras

- Cadastro da empresa, responsável, dados de contato e endereço.
- Anexo e validação de documentos obrigatórios.
- Publicação, alteração e encerramento de vagas.
- Busca de profissionais por função e região.
- Gestão de candidaturas e aceitação de candidatos.
- Chat liberado após a aprovação da candidatura.
- Agendamento de início das obras e lembretes.
- Avaliação dos profissionais.
- Estatísticas por ocupação, tempo de preenchimento e vagas abertas/encerradas.
- Exportação de relatório em PDF.
- Painel mensal e indicadores de desempenho.
- Foto ou logotipo da construtora com fallback de iniciais.

### Para trabalhadores

- Cadastro profissional, sexo, foto, telefone e currículo.
- Currículo em PDF ou geração a partir de experiências.
- Upload e validação dos documentos obrigatórios.
- Busca de vagas por texto, função, bairro, região e proximidade.
- Pesquisa por voz quando suportada pelo navegador.
- Candidatura às vagas e acompanhamento do status.
- Chat com a construtora após a candidatura ser aceita.
- Notificações nativas para novas vagas e candidaturas aceitas.
- Preferência por categorias de vagas para filtragem dos alertas.
- Lembretes de início de trabalho.
- Avaliação das construtoras após concluir trabalhos.
- Painel de produtividade por obra e mês.
- Estimativa de ganhos mensais acumulados.
- Calculadora de rescisão e utilidades trabalhistas.
- Alertas de chuva e segurança no canteiro.
- Lembretes semanais de EPIs conforme NR-06, NR-18 e NR-35.
- Notícias de construção e infraestrutura em Mato Grosso.
- Dicas de carreira com IA.
- Sugestões de segurança, dicas semanais e ranking.
- Onboarding guiado para os dois perfis.

### Experiência geral

- Tema claro e escuro.
- Navegação animada, barra superior centralizada sem cortes e adaptações responsivas para desktop e mobile.
- Tela inicial com resumo de vagas, construtoras e trabalhadores.
- Instalação PWA.
- Sons de notificação sintetizados via Web Audio API com alternador em Configurações.
- Animação celebratória com confetes (`canvas-confetti`) disparada exclusivamente quando um contrato é aceito para ambos os lados (construtora e trabalhador).
- Caixas seletoras (`SelectWrapper`) e ícones vetoriais alinhados com precisão em todos os formulários.
- Consentimento de cookies e controles LGPD.
- Sincronização entre abas do mesmo navegador por `storage` events.
- Notificações e lembretes em segundo plano onde suportado.

## Tecnologias

- **Frontend:** React 19, TypeScript/TSX e Tailwind CSS 4.
- **Build:** Vite 8.
- **Servidor:** Node.js e Express, executado com `tsx` em desenvolvimento.
- **PWA:** `vite-plugin-pwa` e Workbox.
- **Interface e Efeitos:** `lucide-react`, `motion` e `canvas-confetti`.
- **Áudio:** Web Audio API (`notificationSound.ts`) sem dependências externas.
- **Dados visuais:** Recharts e D3.
- **Documentos:** jsPDF.
- **IA:** SDK `@google/genai`.
- **Testes:** `node:test` e `node:assert/strict` executados com `tsx`.

## Execução local

É necessário ter Bun ou Node.js/npm.

```bash
git clone https://github.com/LuizCastagno/BrickJobs.git
cd BrickJobs
bun install
bun run dev
```

Por padrão, o servidor usa a porta `3000`. O comando `dev` executa `server.ts` com `tsx`; em desenvolvimento, Express entrega as APIs e o middleware do Vite serve o frontend.

Também é possível usar npm:

```bash
npm install
npm run dev
```

O lockfile principal do repositório é `bun.lock`.

## Variáveis de ambiente

Copie `.env.example` para `.env`:

| Variável | Uso |
| --- | --- |
| `GEMINI_API_KEY` | Chave privada usada pelo servidor para dicas de carreira, lembretes de segurança e notícias. Não a exponha no frontend. |
| `APP_URL` | URL pública documentada no exemplo. Confirmar o uso em ambientes futuros antes de depender dela. |
| `PORT` | Porta HTTP. Padrão: `3000`. |
| `NODE_ENV` | Em `production`, serve os arquivos compilados de `dist/`. |
| `DISABLE_HMR` | Quando `true`, desativa HMR e observação de arquivos no servidor Vite. |

A API do Gemini é opcional para iniciar o servidor. Sem chave, os endpoints usam dados locais ou falhas controladas conforme implementado.

A integração de clima usa Open-Meteo e não exige chave no código atual.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `bun run dev` | Executa o servidor Express e Vite em desenvolvimento. |
| `bun run build` | Sincroniza o inventário no `README.md` (`prebuild`) e gera o build estático em `dist/`. |
| `bun run preview` | Executa o preview do build do Vite. |
| `bun run start` | Executa `server.ts`; antes da produção, gere `dist/`. |
| `bun run lint` | Executa `tsc --noEmit`. |
| `bun run clean` | Remove `dist` e `server.js`. |
| `npm run docs:sync` | Atualiza automaticamente a seção de inventário do `README.md` via `scripts/sync-readme.mjs`. |

Não há script `test` no `package.json`. Os testes são executados diretamente pelo runner do Node com `tsx`.

## Arquitetura e estrutura

```text
.
├── index.html
├── server.ts                 # APIs Express e servidor Vite/produção
├── vite.config.ts            # React, Tailwind e configuração PWA
├── package.json
├── bun.lock
├── metadata.json
├── public/
│   ├── icon.svg
│   ├── apple-touch-icon.png
│   ├── pwa-192x192.png
│   ├── pwa-512x512.png
│   ├── pwa-maskable-512x512.png
│   ├── sw.js
│   └── sw-push.js
├── dev-dist/                 # Artefatos gerados pelo PWA/Workbox
└── src/
    ├── main.tsx
    ├── App.tsx               # Estado central e navegação principal
    ├── index.css
    ├── assets/
    ├── components/           # Portais, telas, modais e painéis
    ├── data/
    │   └── rondonopolisSeed.ts
    ├── hooks/
    │   └── usePWAInstall.ts
    ├── types/
    │   └── brickjobs.ts
    └── utils/                # Regras de negócio e testes
```

### Pontos principais

- `App.tsx` centraliza o estado da aplicação e os callbacks entre portais.
- `WorkerPortal.tsx` concentra o fluxo do trabalhador.
- `EmployerPortal.tsx` concentra o fluxo da construtora.
- `rondonopolisSeed.ts` fornece dados iniciais e perfis vazios.
- `storage.ts` faz leitura, migração e persistência do estado.
- `server.ts` expõe rotas API e serve o frontend em produção.
- Componentes visuais ficam em `src/components/`.
- Regras reutilizáveis, cálculos e validações ficam em `src/utils/`.

### Principais módulos atuais

<!-- AUTO_INVENTORY_START -->
> Inventário gerado automaticamente via `scripts/sync-readme.mjs` (34 componentes React, 34 módulos utilitários, 33 suítes de teste e 8 scripts npm).

### Núcleo, tipos, hooks e dados

| Arquivo | Função |
| --- | --- |
| `server.ts` | Servidor Express do BrickJobs. Fornece rotas `/api/rain-alerts`, `/api/career-tips`, |
| `src/App.tsx` | Componente raiz da aplicação BrickJobs. Orquestra estado local persistido, |
| `src/main.tsx` | Ponto de entrada principal da aplicação React BrickJobs, responsável por montar o componente raiz e importar os estilos globais Tailwind. |
| `src/types/brickjobs.ts` | Definições de tipos e interfaces centrais do domínio BrickJobs (perfis, vagas, candidaturas, chat, documentos obrigatórios, avaliações e estado persistido). |
| `src/hooks/usePWAInstall.ts` | Hook React para gerenciar o fluxo de instalação PWA (`beforeinstallprompt`), detecção de modo standalone e instruções manuais/iOS. |
| `src/data/rondonopolisSeed.ts` | Dados iniciais (seed) voltados para a construção civil em Rondonópolis-MT, incluindo regiões, categorias, vagas de exemplo e perfis vazios. |

### Componentes de interface (`src/components/` — 34)

| Componente | Responsabilidade |
| --- | --- |
| `ApplicationChatModal.tsx` | Modal de mensagens e agendamento de início de obra entre construtora e trabalhador após aprovação da candidatura. |
| `AppLoadingOverlay.tsx` | Overlay animado de carregamento inicial (splash screen) e de transição suave entre os portais da aplicação. |
| `BrickLogo.tsx` | Marca vetorial SVG e assinatura tipográfica BrickJobs reutilizada nas barras de navegação e tela inicial. |
| `CareerTipsCard.tsx` | Cartão de dicas semanais de carreira e preparação para entrevistas de obra, com suporte à geração via IA no servidor e cache local. |
| `CompanyRatingModal.tsx` | Modal interativo para o trabalhador avaliar a construtora (estrelas e comentário) após a conclusão de um contrato. |
| `ConstructionNewsTab.tsx` | Aba "Notícias da Construção" do Portal do Trabalhador com headlines sobre obras e |
| `ContractAcceptedConfetti.tsx` | Componente visual comemorativo usando `canvas-confetti`, acionado exclusivamente |
| `CookieConsentBanner.tsx` | Banner inferior de consentimento de cookies e preferências de privacidade conforme a LGPD. |
| `CoverScreen.tsx` | Tela inicial (landing) do BrickJobs em Rondonópolis-MT com seleção de perfil |
| `EmployerMonthlyDashboard.tsx` | Painel mensal com gráfico comparativo de vagas abertas e encerradas da construtora ao longo dos meses. |
| `EmployerPortal.tsx` | Portal da Construtora (Contratante): cadastro da empresa, publicação de vagas, |
| `EmployerStatisticsTab.tsx` | Aba de estatísticas detalhadas da construtora (avaliações por ocupação, tempo médio de preenchimento, status de vagas e exportação em PDF). |
| `GuidedTourModal.tsx` | Modal de tour guiado (onboarding) passo a passo para orientar novos contratantes e trabalhadores nos recursos do portal. |
| `JobDescriptionSuggestions.tsx` | Painel auxiliar para construtoras aplicarem modelos e requisitos rápidos de descrição de vagas conforme a função escolhida. |
| `LgpdPrivacyModal.tsx` | Modal completo de transparência LGPD, gerenciamento granular de cookies e consulta aos direitos do titular e dados sensíveis. |
| `LocationRegionBar.tsx` | Barra de busca com seleção de região em Rondonópolis-MT, filtro de proximidade via |
| `MobileBottomNav.tsx` | Barra inferior de navegação mobile com suporte a rolagem horizontal sem barra |
| `NativePushPermissionCard.tsx` | Cartão e banner de gerenciamento de permissão e preferência de notificações nativas do navegador. |
| `PerformanceSummaryCard.tsx` | Cartão analítico com gráfico D3 de taxa de preenchimento de vagas por ocupação e mês. |
| `ProfileAvatar.tsx` | Componente de avatar responsivo para trabalhadores e construtoras, com fallback automático para iniciais e paleta determinística. |
| `ProfilePhotoField.tsx` | Campo de upload, validação e compressão automática de foto de perfil ou logotipo da empresa. |
| `RainAlertsPanel.tsx` | Painel de previsão meteorológica e alertas de chuva por região de Rondonópolis para planejamento seguro de obras. |
| `RequiredDocumentsSection.tsx` | Seção de anexo, validação e remoção dos documentos obrigatórios de cadastro para trabalhadores e construtoras. |
| `SafetyLeaderboardCard.tsx` | Placar regional de pontuação e classificação de segurança do trabalhador nos quizzes diários. |
| `SafetyTipsCard.tsx` | Biblioteca de boas práticas de segurança no canteiro (NRs) e quiz diário interativo com pontuação. |
| `SafetyWeeklyRemindersCard.tsx` | Seção educacional dinâmica "Dicas de Segurança no Canteiro" com lembretes |
| `SelectWrapper.tsx` | Wrapper reutilizável para controles `<select>` nativos com seta vetorial ChevronDown |
| `SeveranceCalculatorPanel.tsx` | Calculadora trabalhista CLT de estimativa de rescisão adaptada a cenários comuns da construção civil. |
| `SkillTagFilterBar.tsx` | Barra de filtragem rápida por especialidades e tags técnicas das vagas de obra. |
| `TopNavBar.tsx` | Barra de navegação superior fixa para desktop/tablet com marca, abas de seção |
| `UserSettingsMenu.tsx` | Modal responsivo (bottom sheet no mobile, diálogo central no desktop) com tema |
| `WorkerEarningsPanel.tsx` | Painel financeiro com gráfico Recharts de estimativa de ganhos mensais acumulados do trabalhador. |
| `WorkerPortal.tsx` | Portal do Trabalhador (Contratado): busca de vagas por proximidade/tags, |
| `WorkerProductivityPanel.tsx` | Painel de acompanhamento de horas trabalhadas, metas de produção por canteiro e registro diário do trabalhador. |

### Utilitários e regras de negócio (`src/utils/` — 34)

| Módulo | Responsabilidade |
| --- | --- |
| `avatar.ts` | Utilitários de extração de iniciais, paletas determinísticas, validação e compressão client-side de avatares. |
| `careerTips.ts` | Modelos, cache semanal local e fallback estruturado de dicas de carreira e entrevista para construção civil. |
| `chat.ts` | Regras de liberação do chat entre construtora e trabalhador, ordenação de mensagens e atalhos rápidos de conversa. |
| `constructionNews.ts` | Módulo do sistema BrickJobs. |
| `contractCelebration.ts` | Regras puras para o fluxo de celebração de contrato aceito (`status === 'aceita'`). |
| `duration.ts` | Cálculo de duração de experiências profissionais, formatação em pt-BR e filtragem combinada de vagas. |
| `employerMonthlyDashboard.ts` | Agregação mensal de vagas abertas e encerradas por construtora para o painel comparativo. |
| `employerPerformance.ts` | Cálculos mensais de taxa de preenchimento de vagas por ocupação para os gráficos da construtora. |
| `employerReportPdf.ts` | Montagem e exportação de relatório gerencial em PDF (via jsPDF) com métricas da construtora. |
| `employerStats.ts` | Estatísticas por ocupação: notas médias, tempo de preenchimento em dias e proporção de vagas abertas/encerradas. |
| `geolocation.ts` | Coordenadas de bairros de Rondonópolis-MT, cálculo de distância Haversine e filtro de vagas por proximidade GPS. |
| `jobPriority.ts` | Utilitários puros para normalização, classificação, ordenação, filtragem e |
| `jobSuggestions.ts` | Catálogo de modelos de descrição e requisitos rápidos por ocupação para agilizar a publicação de vagas. |
| `lgpdConsent.ts` | Persistência de consentimento de cookies, catálogo de dados sensíveis e direitos do titular conforme a LGPD. |
| `motionPresets.ts` | Curvas de easing, variantes de animação Motion para transições de abas, modais, splash screen e troca de portais. |
| `nativeNotifications.ts` | Integração com Notification API e Service Worker para disparo de alertas nativos do navegador. |
| `notifications.ts` | Filtragem de vagas compatíveis por região/categorias preferidas e criação de notificações internas do trabalhador. |
| `notificationSound.ts` | Motor de síntese sonora via Web Audio API para alertas do BrickJobs |
| `onboarding.ts` | Passos do tour guiado de onboarding e controle de exibição por perfil no localStorage. |
| `pwaInstall.ts` | Detecção de plataforma iOS/standalone, resolução do modo de instalação PWA e passos manuais. |
| `rainAlerts.ts` | Classificação de severidade meteorológica, recomendações para canteiros de obras e integração Open-Meteo. |
| `ratings.ts` | Validação e agregação de avaliações por estrelas feitas pelos trabalhadores às construtoras. |
| `requiredDocuments.ts` | Regras de obrigatoriedade de documentos conforme sexo do titular, validação de MIME/tamanho e leitura em Data URL. |
| `resumePdf.ts` | Geração e download de currículo profissional em PDF (via jsPDF) a partir das experiências do trabalhador. |
| `safetyTips.ts` | Dicas técnicas de segurança (NR-06, NR-18, NR-35), banco do quiz diário e placar regional simulado. |
| `safetyWeeklyTips.ts` | Módulo do sistema BrickJobs. |
| `severanceCalculator.ts` | Motor de cálculo estimativo de rescisão trabalhista CLT com cenários pré-configurados da construção civil. |
| `skillTags.ts` | Extração, normalização e contagem de tags técnicas de especialidade a partir das vagas publicadas. |
| `storage.ts` | Persistência e migração retrocompatível do estado principal do BrickJobs em |
| `theme.ts` | Persistência e aplicação do tema claro/escuro no elemento raiz da aplicação. |
| `voiceSearch.ts` | Wrapper tipado para Web Speech API (`SpeechRecognition`) em português do Brasil para busca de vagas por voz. |
| `workerEarnings.ts` | Parser de faixas salariais/diárias e projeção mensal acumulada de ganhos do trabalhador. |
| `workerProductivity.ts` | Persistência e consolidação de apontamentos diários de horas e produtividade do trabalhador por canteiro. |
| `workReminders.ts` | Agendamento e disparo de lembretes de início de trabalho com antecedência padrão configurada. |

### Suítes de teste automatizados (`src/utils/*.test.ts` — 33)

`avatar.test.ts` · `careerTips.test.ts` · `chat.test.ts` · `constructionNews.test.ts` · `contractCelebration.test.ts` · `duration.test.ts` · `employerMonthlyDashboard.test.ts` · `employerPerformance.test.ts` · `employerReportPdf.test.ts` · `employerStats.test.ts` · `geolocation.test.ts` · `jobPriority.test.ts` · `jobSuggestions.test.ts` · `lgpdConsent.test.ts` · `motionPresets.test.ts` · `nativeNotifications.test.ts` · `notifications.test.ts` · `notificationSound.test.ts` · `onboarding.test.ts` · `pwaInstall.test.ts` · `rainAlerts.test.ts` · `ratings.test.ts` · `requiredDocuments.test.ts` · `resumePdf.test.ts` · `safetyTips.test.ts` · `safetyWeeklyTips.test.ts` · `severanceCalculator.test.ts` · `skillTags.test.ts` · `theme.test.ts` · `voiceSearch.test.ts` · `workerEarnings.test.ts` · `workerProductivity.test.ts` · `workReminders.test.ts`

<!-- AUTO_INVENTORY_END -->

## Persistência e APIs

### Estado local

O estado principal é armazenado no `localStorage`, na chave:

```text
brickjobs_rondonopolis_state_v1
```

A leitura normaliza campos antigos para manter compatibilidade ao evoluir os modelos. Dados incluídos em novas versões devem ser migrados em `src/utils/storage.ts`.

Outros dados locais incluem:

- Preferências de tema.
- Preferência de notificações nativas.
- Consentimentos LGPD.
- Tours já vistos.
- Checklist semanal de EPIs.
- Histórico de produtividade do trabalhador.

### APIs internas

- `GET /api/rain-alerts` consulta previsão meteorológica da Open-Meteo.
- `POST /api/career-tips` gera dicas de carreira contextuais com Gemini.
- `POST /api/safety-weekly-reminders` gera ou fornece lembretes semanais de segurança.
- `GET /api/construction-news` consulta notícias por Search Grounding ou usa feed curado.

## Testes

Execute todos os testes utilitários:

```bash
bunx tsx --test src/utils/*.test.ts
bun run lint
bun run build
```

Os testes cobrem persistência, geolocalização, chat, notificações, documentos, avaliações, segurança, clima, produtividade, ganhos, PWA, LGPD, rescisão, currículos e relatórios.

## Histórico completo de mudanças

O histórico abaixo foi reconstruído a partir dos commits registrados no branch `main`.

| Período | Commit | Alteração registrada |
| --- | --- | --- |
| 14/11/2026 | [`a7f5dee`](https://github.com/LuizCastagno/BrickJobs/commit/a7f5dee630c9cf9e9146cb46232dad4e56d58fe9) | Commit inicial do template AI Studio, com README básico de apresentação. |
| 17/11/2026 | `fbd4a638` | Primeiras alterações estruturais iniciais do projeto. |
| 17/11/2026 | `7a3dc227` | Evolução da interface e da base funcional do aplicativo. |
| 17/11/2026 | `b1f793cd` | Ampliação dos recursos da plataforma. |
| 17/11/2026 | `160fe4dd` | Consolidação dos módulos e dados iniciais. |
| 17/11/2026 | [`e0807ec`](https://github.com/LuizCastagno/BrickJobs/commit/e0807ec1976bd704493d1d284f36352e97388b17) | Adicionado painel de produtividade com registro de horas e metas por canteiro. |
| 17/11/2026 | [`6a230265`](https://github.com/LuizCastagno/BrickJobs/commit/6a230265bdbc458863f27e7438e881bfb9f05c6b) | Introduzidos sexo do perfil e anexos de documentos para contratantes e trabalhadores. |
| 17/11/2026 | [`10c85189`](https://github.com/LuizCastagno/BrickJobs/commit/10c85189fb3c380b5fa6d30d126701d5474178ee) | Melhorada a validação de documentos, feedback de formulário e foco nos campos com erro. |
| 17/11/2026 | [`78590ab8`](https://github.com/LuizCastagno/BrickJobs/commit/78590ab88033d92bc2db19ec6bcd597f7a87f974) | Implementado suporte PWA, conclusão de candidaturas, geolocalização automática, fotos, PWA instalável e painel de ganhos. |
| 17/11/2026 | [`fbc46878`](https://github.com/LuizCastagno/BrickJobs/commit/fbc46878c2af0c055b2b8c5289b0609b92956e3b) | Adicionado suporte a fotos, avatares, logotipo da construtora e melhoria dos fluxos de chat e identidade visual. |
| 17/11/2026 | [`5a584849`](https://github.com/LuizCastagno/BrickJobs/commit/5a58484932901bf1e47ca856f7420864295089de) | Criadas preferências de categorias para notificações de novas vagas e novos ícones da identidade visual. |
| 18/11/2026 | [`09130422`](https://github.com/LuizCastagno/BrickJobs/commit/0913042271a798cf76147c827b46755656ee6d8d) | Incluídas estatísticas de vagas abertas/encerradas e geração de relatório em PDF da construtora. |
| 18/11/2026 | [`73932119`](https://github.com/LuizCastagno/BrickJobs/commit/73932119c2d0102ccff3e31a812e216ecd2b161c) | Primeiro README completo de manutenção e arquitetura do projeto. |
| 18/11/2026 | [`be4fe6cd`](https://github.com/LuizCastagno/BrickJobs/commit/be4fe6cdee9ae94a891510709615f1a0e4451860) | Versão atual: lembretes semanais de segurança, notícias da construção, API com Gemini/Search Grounding e ocultação global das barras de rolagem. |

## Modificações atuais

As alterações mais recentes adicionadas nesta iteração incluem:

1. **Animação de contrato aceito (`canvas-confetti`):** componente dedicado `ContractAcceptedConfetti.tsx` + utilitário `contractCelebration.ts` disparando exclusivamente quando um contrato muda para `aceita` tanto para a construtora quanto para o trabalhador.
2. **Sons de notificação (`Web Audio API`):** módulo `notificationSound.ts` com feedback sonoro para aceitação de contrato, lembretes de obra, novas vagas compatíveis e mensagens, além de controle de ativação em `UserSettingsMenu.tsx`.
3. **Correções visuais e responsividade desktop:** ajuste de centralização em `TopNavBar.tsx` (eliminando cortes laterais em `1440px`), colunas proporcionais em `LocationRegionBar.tsx`, alinhamento uniforme de ícones vetoriais e seletores (`SelectWrapper.tsx`), cabeçalhos flexíveis (`text-wrap: balance`) e elevação sutil nos cards em hover.
4. **Documentação automática e comentários JSDoc:** todos os componentes, utilitários, tipos, hooks, dados e rotas do servidor documentados com cabeçalhos `@file` / `@description`, além do script `scripts/sync-readme.mjs` conectado aos scripts `docs:sync` e `prebuild` para atualizar o `README.md` automaticamente a cada alteração/build.
5. **Base anterior consolidada (`be4fe6cd`):** aba **Segurança** com lembretes semanais de EPIs (NR-06, NR-18, NR-35) via Gemini/fallback, aba **Notícias da Construção** com Google Search Grounding e cache de 15 min, e ocultação global das barras de rolagem.

## Limitações

- Não há banco de dados compartilhado entre dispositivos.
- Não há autenticação, autorização ou contas reais.
- `localStorage` pode estar sujeito a limite de quota e limpeza pelo usuário.
- Dados e vagas são exemplos locais, não oportunidades confirmadas.
- Documentos e imagens são armazenados como data URLs no navegador.
- APIs não implementam autenticação ou rate limiting no servidor atual.
- Cache PWA não sincroniza dados locais.
- Notificações nativas dependem da permissão e suporte do navegador.
- Clima e dicas de IA dependem de serviços externos.
- Cálculos trabalhistas e meteorológicos são informativos e devem ser validados por profissionais.

Ao alterar contratos de dados, migre o estado antigo em `src/utils/storage.ts`, atualize os tipos em `src/types/brickjobs.ts`, revise componentes afetados e adicione ou atualize testes próximos à implementação.

---

**Repositório:** https://github.com/LuizCastagno/BrickJobs