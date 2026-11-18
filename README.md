# BrickJobs

Aplicativo web instalável (PWA) que aproxima construtoras e profissionais da construção civil em Rondonópolis-MT. O projeto oferece publicação e busca de vagas, perfis profissionais, candidaturas, conversa entre as partes e ferramentas de apoio para a rotina no canteiro.

> **Sobre esta documentação:** o código do BrickJobs é extenso e muda com o tempo. Este guia descreve a função dos arquivos, módulos, fluxos e responsabilidades relevantes para manutenção; não reproduz uma anotação literal de cada linha. Para uma alteração específica, use os arquivos e símbolos indicados abaixo como ponto de partida e confirme o comportamento no código atual.

## Índice

- [Tecnologias](#tecnologias)
- [Requisitos e execução local](#requisitos-e-execução-local)
- [Comandos disponíveis](#comandos-disponíveis)
- [Estrutura do projeto](#estrutura-do-projeto)
- [Como o aplicativo funciona](#como-o-aplicativo-funciona)
- [Dados, persistência e integrações](#dados-persistência-e-integrações)
- [Testes e verificação](#testes-e-verificação)
- [Boas práticas para manutenção](#boas-práticas-para-manutenção)
- [Limitações importantes](#limitações-importantes)

## Tecnologias

- **Linguagens:** TypeScript/TSX, JavaScript e CSS.
- **Interface:** React 19; Vite 8; Tailwind CSS 4.
- **Servidor:** Node.js, Express e TypeScript executado com `tsx` em desenvolvimento.
- **PWA:** `vite-plugin-pwa` e Workbox para manifesto, service worker e cache de recursos.
- **Bibliotecas de interface e visualização:** `lucide-react`, `motion`, `recharts` e `d3`.
- **Geração de documentos e IA:** `jspdf` e SDK `@google/genai`.
- **Testes:** testes de unidade com `node:test` e `node:assert/strict`.

## Requisitos e execução local

É necessário ter Bun ou Node.js/npm instalado. O repositório contém `bun.lock`; prefira Bun para instalar dependências de acordo com o lockfile. A versão mínima exata do runtime não está fixada em `package.json`, então use uma versão atual compatível com as dependências.

```bash
 git clone https://github.com/LuizCastagno/BrickJobs.git
 cd BrickJobs
 bun install
 bun run dev
```

Abra o endereço exibido no terminal (o servidor usa a porta `3000` por padrão). O script `dev` inicia `server.ts` com `tsx`; em desenvolvimento, Express entrega as rotas `/api` e Vite serve a aplicação e HMR.

Se usar npm em vez de Bun, instale as dependências com `npm install` e execute os scripts com `npm run`. O lockfile principal, porém, é `bun.lock`.

### Variáveis de ambiente

Copie `.env.example` para `.env` se for executar localmente e preencha as variáveis necessárias:

| Variável | Uso |
| --- | --- |
| `GEMINI_API_KEY` | Chave privada usada pelo servidor para gerar dicas de carreira com o Gemini. Sem ela, `POST /api/career-tips` responde com erro `503`. Não exponha esta chave em código do navegador nem a envie ao Git. |
| `APP_URL` | URL pública do aplicativo, documentada no exemplo como usada para links e callbacks. Não é lida diretamente em `server.ts` atualmente; confirme outros usos antes de depender dela. |
| `PORT` | Porta HTTP; padrão `3000`. |
| `NODE_ENV` | Quando igual a `production`, o servidor entrega os arquivos compilados de `dist/`; caso contrário, inicializa o middleware de desenvolvimento do Vite. |
| `DISABLE_HMR` | Com valor `true`, desabilita HMR e observação de arquivos no Vite, conforme a configuração existente. |

A integração com Open-Meteo não exige chave no código atual. A API do Gemini é opcional para iniciar o servidor, mas necessária para as dicas geradas por IA.

## Comandos disponíveis

Os scripts são definidos em `package.json`:

| Comando | O que faz |
| --- | --- |
| `bun run dev` | Executa `tsx server.ts` em modo de desenvolvimento. |
| `bun run build` | Executa `vite build` e gera a aplicação estática em `dist/`. |
| `bun run preview` | Inicia o preview do build do Vite; não substitui o servidor Express das rotas API. |
| `bun run start` | Executa `node server.ts`; destinado ao servidor da aplicação. Em produção, gere `dist/` antes para disponibilizar os arquivos estáticos. |
| `bun run lint` | Executa `tsc --noEmit` (verificação de tipos; não é ESLint). |
| `bun run clean` | Remove `dist` e `server.js` usando `rm -rf` (comando de shell Unix). |

## Estrutura do projeto

```text
.
├── index.html                 # Documento HTML, metadados, tema inicial e ponto de montagem React
├── server.ts                  # Express, APIs de clima e Gemini, integração com Vite em desenvolvimento
├── vite.config.ts             # Plugins React/Tailwind/PWA, alias e regras de build/servidor
├── tsconfig.json              # Opções TypeScript, alias @/* e arquivos verificados
├── package.json               # Dependências e scripts de execução
├── bun.lock                   # Resolução de dependências do Bun
├── .env.example               # Exemplo de configuração de variáveis de ambiente
├── metadata.json              # Metadados/capacidades usados pelo ambiente AI Studio
├── public/                    # Ícones, service workers e arquivos servidos sem processamento
│   ├── assets/                # Recursos públicos estáticos
│   ├── sw.js                  # Service worker público simples
│   └── sw-push.js             # Integração de notificações pelo service worker
├── dev-dist/                  # Artefatos Workbox/PWA gerados; não editar manualmente
└── src/
    ├── main.tsx               # Inicializa React e importa o CSS global
    ├── App.tsx                # Estado central, navegação, callbacks e composição das telas
    ├── index.css              # Tailwind, tokens de fonte, estilos base e acessibilidade de movimento
    ├── assets/images/         # Imagens importadas pelo código, incluindo imagem de trabalhador
    ├── components/            # Telas, formulários, navegação, cartões, painéis e modais
    ├── data/                  # Dados de demonstração e valores iniciais de Rondonópolis
    ├── hooks/                 # Hooks React, como integração de instalação PWA
    ├── types/                 # Tipos e contratos do domínio BrickJobs
    └── utils/                 # Regras de negócio, validação, persistência, integrações e testes
```

### Componentes de `src/components/`

- **Aplicação e navegação:** `CoverScreen`, `TopNavBar`, `MobileBottomNav`, `EmployerPortal`, `WorkerPortal`, `AppLoadingOverlay` e `GuidedTourModal`.
- **Perfil, documentos e privacidade:** `ProfileAvatar`, `ProfilePhotoField`, `RequiredDocumentsSection`, `CookieConsentBanner` e `LgpdPrivacyModal`.
- **Comunicação e preferências:** `ApplicationChatModal`, `CompanyRatingModal`, `UserSettingsMenu` e `NativePushPermissionCard`.
- **Vagas e localização:** `LocationRegionBar`, `SkillTagFilterBar`, `JobDescriptionSuggestions` e `RainAlertsPanel`.
- **Painéis e ferramentas:** `EmployerMonthlyDashboard`, `EmployerStatisticsTab`, `PerformanceSummaryCard`, `SafetyLeaderboardCard`, `SafetyTipsCard`, `CareerTipsCard`, `WorkerEarningsPanel`, `WorkerProductivityPanel` e `SeveranceCalculatorPanel`.
- **Identidade visual:** `BrickLogo`.

Esses componentes não têm todos o mesmo tamanho nem a mesma responsabilidade. Comece pelo portal correspondente e siga os componentes filhos e funções utilitárias importados por ele antes de alterar uma regra ou tela.

### Utilitários de `src/utils/`

Os arquivos `.test.ts` verificam a lógica do utilitário de nome correspondente. As implementações cobrem as áreas abaixo:

- **Estado e preferências:** `storage.ts` (serialização, normalização e recuperação de estado), `theme.ts`, `lgpdConsent.ts`, `onboarding.ts` e `motionPresets.ts`.
- **Vagas e busca:** `duration.ts` (datas, duração e filtros auxiliares), `skillTags.ts`, `jobSuggestions.ts` e `voiceSearch.ts`.
- **Localização e clima:** `geolocation.ts` (coordenadas, regiões e proximidade) e `rainAlerts.ts` (normalização da previsão, classificação de risco e avisos para o canteiro).
- **Interações de trabalho:** `chat.ts`, `notifications.ts`, `workReminders.ts` e `ratings.ts`.
- **Perfil e documentos:** `requiredDocuments.ts`, `resumePdf.ts` e `avatar.ts`.
- **Indicadores e cálculos:** `employerMonthlyDashboard.ts`, `employerPerformance.ts`, `employerStats.ts`, `severanceCalculator.ts`, `workerEarnings.ts` e `workerProductivity.ts`.
- **Segurança e carreira:** `safetyTips.ts`, `careerTips.ts` (tipos, validação da resposta de IA, semana ISO e cache local) e `pwaInstall.ts` (decisões e mensagens de instalação).

## Como o aplicativo funciona

1. `index.html` define o idioma, metadados para dispositivos móveis e redes sociais, configura o tema salvo antes da montagem e fornece `<div id="root">`.
2. `src/main.tsx` cria a raiz React, importa `src/index.css` e renderiza `App`.
3. `src/App.tsx` carrega o estado inicial com `loadBrickJobsState`, controla a tela de entrada e os papéis **contratante**/**contratado**, e conecta os portais aos utilitários de regras de negócio.
4. `EmployerPortal` oferece cadastro de empresa, publicação/encerramento de vagas, busca de profissionais, candidaturas recebidas, indicadores, avaliações e alertas de chuva. `WorkerPortal` oferece busca e filtros de vagas, cadastro de perfil e currículo, candidatura, notificações, chat, lembretes e ferramentas de apoio.
5. Alterações na aplicação são mantidas no estado React e salvas pelo efeito de `saveBrickJobsState`. Os dados compartilhados entre abas do mesmo navegador são relidos pelo evento `storage`.
6. `server.ts` fornece duas rotas API: `GET /api/rain-alerts` consulta a previsão Open-Meteo e mantém cache em memória por dez minutos; `POST /api/career-tips` monta uma solicitação contextual e chama Gemini no servidor. Em produção, o mesmo processo serve `dist/` e encaminha caminhos não-API para `index.html`.

A navegação é controlada pelo estado em `App.tsx`, não por um roteador dedicado: as telas e abas são selecionadas por estado e parâmetros opcionais da URL, como `?autostart=contratado` ou `?autostart=contratante`.

## Dados, persistência e integrações

### Dados locais e exemplos

`src/data/rondonopolisSeed.ts` define regiões, ocupações, opções de turno/contrato/experiência, dados iniciais de vagas e trabalhadores, perfis vazios e `DEFAULT_APP_STATE`. Esses registros são **dados de demonstração**; revise-os antes de qualquer uso real e não os trate como oportunidades ou contatos confirmados.

`src/utils/storage.ts` salva o estado em `localStorage`, na chave `brickjobs_rondonopolis_state_v1`. Ao ler dados antigos, preenche valores padrão e normaliza alguns campos. Alterações futuras no formato do estado devem considerar migração/compatibilidade para os dados já armazenados nos navegadores.

### APIs e serviços externos

- **Clima:** `GET /api/rain-alerts?region=...` aceita região e coordenadas opcionais (`lat`, `lng`), consulta Open-Meteo e responde com previsão do local e de Rondonópolis. Erros do provedor resultam em `503`.
- **Dicas de carreira:** `POST /api/career-tips` aceita `role`, `focus`, `experienceCount` e `hasPdfResume`; usa `GEMINI_API_KEY` no servidor e devolve conteúdo estruturado em português. O cache semanal do cliente fica no navegador.
- **Fontes:** o CSS importa Outfit, Plus Jakarta Sans e JetBrains Mono do Google Fonts; a configuração PWA aplica cache de fontes.
- **Instalação e notificações:** a configuração PWA gera manifesto e service worker; o hook `usePWAInstall` acompanha o prompt de instalação. Notificações locais dependem do suporte e das permissões do navegador.

## Testes e verificação

Não há script `test` definido em `package.json`. Para executar os testes de unidade existentes com o `tsx` instalado:

```bash
bunx tsx --test src/utils/*.test.ts
bun run lint
bun run build
```

Os testes estão em `src/utils/*.test.ts` e usam o runner nativo `node:test`; a cobertura é principalmente das funções utilitárias. Ao modificar uma regra, atualize ou crie o teste próximo à implementação. O `lint` atual verifica TypeScript via `tsc --noEmit`, e não executa uma ferramenta de lint/estilo.

## Boas práticas para manutenção

1. **Entenda o fluxo antes de editar.** Localize o comportamento no portal, siga imports para utilitários e confira os tipos em `src/types/brickjobs.ts`. Mantenha apresentação em componentes e regras reutilizáveis em `src/utils/`.
2. **Preserve os contratos de dados.** Ao mudar `JobPosting`, `WorkerProfile`, `JobApplication` ou `BrickJobsAppState`, atualize tipos, valores iniciais, validação, leitura/gravação local, componentes consumidores e testes.
3. **Considere compatibilidade local.** O estado vive em `localStorage` e pode ter sido salvo por uma versão antiga. Faça a normalização/migração em `storage.ts`; teste também JSON ausente, incompleto ou inválido.
4. **Atualize as dependências de React corretamente.** Use atualizações imutáveis (`map`, `filter`, spread) e callbacks funcionais de `setState` quando o próximo valor depender do anterior. Evite mutar arrays e objetos existentes.
5. **Valide entradas nos limites.** Dados de formulário, parâmetros de API, JSON externo, arquivos e coordenadas precisam de validação; tipos TypeScript sozinhos não validam dados em runtime. Não confie nos valores enviados pelo navegador.
6. **Proteja dados pessoais e segredos.** Não registre documentos, currículos, telefones ou chaves em logs. A chave Gemini deve permanecer no servidor. Considere que documentos e PDFs em `localStorage`/data URLs não são armazenamento seguro ou escalável.
7. **Trate integrações como falíveis.** Use timeout, tratamento de erro e estados vazios/carregando; preserve uma mensagem clara para indisponibilidade de Open-Meteo, Gemini, geolocalização e notificações.
8. **Tenha cautela com regras sensíveis.** Cálculos de rescisão, requisitos documentais e recomendações relacionadas a clima/segurança devem ser revisados por profissionais e fontes oficiais. Não apresente uma estimativa ou previsão como aconselhamento legal/técnico definitivo.
9. **Acessibilidade e responsividade fazem parte do comportamento.** Mantenha rótulos associados aos campos, estados ARIA, foco visível, controles utilizáveis por teclado, alvos de toque adequados e respeito a `prefers-reduced-motion`.
10. **Não edite artefatos gerados manualmente.** `dev-dist/` contém saída do PWA/Workbox. Ajuste `vite.config.ts` ou os arquivos-fonte de `public/` e regenere o build quando necessário.
11. **Verifique a mudança antes de integrar.** Rode testes afetados, `bun run lint` e `bun run build`; revise a diff e não inclua `.env`, chaves ou dados pessoais no commit.
12. **Mantenha a documentação sincronizada.** Ao incluir uma API, componente, variável de ambiente ou comando, atualize este README e os testes relevantes.

## Limitações importantes

- O modelo de estado principal é local ao navegador; `localStorage` não substitui banco de dados, autenticação, autorização, backup nem sincronização segura entre usuários/dispositivos. A comunicação entre abas é apenas no mesmo navegador/origem.
- Os exemplos são embarcados no cliente e qualquer dado salvo localmente pode ser perdido pelo usuário, limite do navegador ou limpeza de dados. PDFs e anexos podem atingir a cota de armazenamento.
- As rotas API acessíveis pelo navegador não implementam, no `server.ts` atual, autenticação ou limitação de requisições. Antes de disponibilizar publicamente, avalie abuso, validação de payload, proteção de custos da IA, privacidade e controles de acesso.
- Cache do service worker pode fazer o aplicativo abrir sem rede, mas não garante disponibilidade das APIs externas nem sincronização offline de dados.
- O cálculo de rescisão e os alertas meteorológicos são ferramentas informativas; valide resultados e condições reais antes de tomar decisões legais ou operacionais.

---

Para entender um recurso específico, comece pela tela (`src/components/`), identifique o estado e callbacks em `src/App.tsx`, então consulte a regra correspondente em `src/utils/` e os tipos em `src/types/brickjobs.ts`.
