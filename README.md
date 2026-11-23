# BrickJobs

**BrickJobs** é um aplicativo web progressivo (PWA) para conectar construtoras e trabalhadores da construção civil em Rondonópolis-MT.

O projeto oferece busca e publicação de vagas, candidaturas, chat entre contratante e contratado, cadastro profissional, documentos, notificações nativas, acompanhamento de produtividade e ganhos, ferramentas trabalhistas e recursos de segurança.

> Projeto atual em desenvolvimento: os dados de demonstração e o estado persistido no navegador são mantidos localmente. O projeto ainda não usa banco de dados ou autenticação real no backend atual.

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
- [Modificações recentes](#modificações-recentes)
- [Histórico completo de commits](#histórico-completo-de-commits)
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

- Publicação, ajuste e encerramento de vagas por função, número de vagas, salário, modalidade e competências requeridas.
- Painel mensal de vagas abertas e finalizadas.
- Estatísticas de avaliações, tempo de preenchimento e desempenho por ocupação.
- Exportação de relatórios em PDF e da lista de profissionais em PDF/CSV.
- Cadastro da empresa, responsável, contato, endereço, foto/logotipo e documentos.
- Consulta somente leitura de profissionais contratados, concluídos e disponíveis.
- Gestão de candidaturas, chat após aprovação e agendamento de início das obras.
- Avisos de chuva integrados ao fluxo de vagas.

### Para trabalhadores

- Cadastro profissional, sexo, foto, telefone e currículo.
- Geração e download de currículo em PDF.
- Upload e validação dos documentos obrigatórios.
- Busca de vagas por texto, função, bairro, região, proximidade, faixa salarial e tipo de serviço.
- Pesquisa por voz quando suportada pelo navegador.
- Candidatura às vagas e acompanhamento do status.
- Chat com a construtora após aprovação da candidatura.
- Notificações nativas para novas vagas compatíveis e candidaturas aceitas.
- Produtividade por obra e mês, estimativa de ganhos e calculadora de rescisão.
- Alertas de chuva, dicas semanais de segurança, EPIs, notícias e dicas de carreira.
- Avaliação das construtoras após a conclusão do trabalho.
- Tour guiado de onboarding para os dois perfis.

### Experiência geral

- Tema claro e escuro, controle de privacidade LGPD e sincronização entre abas.
- Navegação adaptada por portal, sem controles internos duplicados.
- Instalação PWA e notificações em segundo plano onde suportado.
- Sons sintetizados via Web Audio API.
- Animação comemorativa com `canvas-confetti` ao aceitar contratos.
- Controles seletores e componentes responsivos padronizados.

## Tecnologias

- **Frontend:** React 19, TypeScript/TSX e Tailwind CSS 4.
- **Build:** Vite 8.
- **Servidor:** Node.js e Express, executado com `tsx`.
- **PWA:** `vite-plugin-pwa` e Workbox.
- **Interface:** `lucide-react`, `motion` e `canvas-confetti`.
- **Dados visuais:** Recharts e D3.
- **Documentos:** jsPDF.
- **IA:** SDK `@google/genai`.
- **Testes:** `node:test` e `node:assert/strict` com `tsx`.

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
| `GEMINI_API_KEY` | Chave privada usada pelo servidor para dicas de carreira, lembretes de segurança e notícias. Não exponha no frontend. |
| `APP_URL` | URL pública documentada no exemplo. Confirmar o uso em ambientes futuros. |
| `PORT` | Porta HTTP. Padrão: `3000`. |
| `NODE_ENV` | Em `production`, serve os arquivos compilados de `dist/`. |
| `DISABLE_HMR` | Quando `true`, desativa HMR e observação de arquivos no servidor Vite. |

A API do Gemini é opcional. Sem chave, os endpoints usam dados locais ou falhas controladas conforme implementado. A integração de clima usa Open-Meteo e não exige chave no código atual.

## Scripts

| Comando | Finalidade |
| --- | --- |
| `bun run dev` | Executa o servidor Express e Vite em desenvolvimento. |
| `bun run build` | Sincroniza o inventário no README e gera o build estático em `dist/`. |
| `bun run preview` | Executa o preview do build do Vite. |
| `bun run start` | Executa `server.ts`; antes da produção, gere `dist/`. |
| `bun run lint` | Executa `tsc --noEmit`. |
| `bun run clean` | Remove `dist` e `server.js`. |
| `npm run docs:sync` | Atualiza automaticamente o inventário do README. |

## Arquitetura e estrutura

```text
.
├── index.html
├── server.ts                 # APIs Express e servidor Vite/produção
├── vite.config.ts            # React, Tailwind e configuração PWA
├── package.json
├── bun.lock
├── public/
│   ├── icons PWA e manifestos
│   └── service workers
├── scripts/
│   └── sync-readme.mjs
└── src/
    ├── main.tsx
    ├── App.tsx               # Estado central e navegação principal
    ├── index.css
    ├── components/           # Portais, telas, modais e painéis
    ├── data/
    │   └── rondonopolisSeed.ts
    ├── hooks/
    │   └── usePWAInstall.ts
    ├── types/
    │   └── brickjobs.ts
    └── utils/                # Regras de negócio e testes
```

- `App.tsx` centraliza estado da aplicação e callbacks entre portais.
- `WorkerPortal.tsx` concentra o fluxo do trabalhador.
- `EmployerPortal.tsx` concentra o fluxo da construtora.
- `rondonopolisSeed.ts` fornece dados iniciais e perfis vazios.
- `storage.ts` faz leitura, migração e persistência do estado.
- `server.ts` expõe rotas API e serve o frontend em produção.

## Persistência e APIs

O estado principal é armazenado no `localStorage`, na chave:

```text
brickjobs_rondonopolis_state_v1
```

A leitura normaliza campos antigos para manter compatibilidade ao evoluir os modelos.

APIs internas:

- `GET /api/rain-alerts` consulta previsão meteorológica da Open-Meteo.
- `POST /api/career-tips` gera dicas de carreira contextuais com Gemini.
- `POST /api/safety-weekly-reminders` gera ou fornece lembretes semanais de segurança.
- `GET /api/construction-news` consulta notícias por Search Grounding ou usa feed curado.

## Testes

```bash
npx tsx --test src/utils/*.test.ts
npm run lint
npm run build
```

## Modificações recentes

As alterações mais recentes registradas no histórico principal são:

1. **23/11/2026 — Dicas de carreira offline e estatísticas mensais:** fallback local para dicas de carreira e estatísticas mensais de contratações finalizadas.
2. **22/11/2026 — Exportação de profissionais:** adição de CSV e PDF para profissionais registrados e atualização do histórico datado no README.
3. **21/11/2026 — Diretório de profissionais:** remoção da aba utilitária duplicada e criação da lista de profissionais para empregadores.
4. **20/11/2026 — Filtros, prioridade e competências:** filtros avançados por salário e tipo de serviço, níveis de prioridade das vagas e competências nos formulários.
5. **20/11/2026 — Currículo e celebração:** geração de currículo em PDF, confetes ao aceitar contratos e sons via Web Audio API.
6. **18/11/2026 — Segurança e notícias:** lembretes semanais de segurança, notícias da construção e melhorias globais de interface.
7. **17/11/2026 — Recursos centrais:** PWA, documentos, fotos, notificações por categorias, produtividade e módulos trabalhistas.

## Histórico completo de commits

Os commits abaixo representam todo o histórico registrado no branch `main` até a data mais recente disponível.

| Data | Commit | Alteração |
| --- | --- | --- |
| 23/11/2026 | [`032c241`](https://github.com/LuizCastagno/BrickJobs/commit/032c241d01d8022f4a362e4078242e64a0f23bf9) | `feat: add offline career tips and hiring statistics` — adiciona dicas de carreira offline e estatísticas mensais de contratações finalizadas no portal do contratante. |
| 22/11/2026 | [`7928c5a`](https://github.com/LuizCastagno/BrickJobs/commit/7928c5a2da3ae6db51a62a219e07880905d4caf0) | `docs: add dated recent changes history` — adiciona histórico datado de alterações recentes ao README. |
| 22/11/2026 | [`738a601`](https://github.com/LuizCastagno/BrickJobs/commit/738a601bd37329d09bb2073e05fd5bec2ab38f63) | `feat(employer): add export functionality for registered professionals` — adiciona exportação CSV/PDF de profissionais registrados e atualiza a interface e documentação. |
| 21/11/2026 | [`592e2f3`](https://github.com/LuizCastagno/BrickJobs/commit/592e2f3b08cdc4b62b7263324cf942217e616c0f) | `refactor: remove utility tab and add professionals list` — remove uma aba utilitária redundante e implementa diretório de profissionais para empregadores. |
| 20/11/2026 | [`243e401`](https://github.com/LuizCastagno/BrickJobs/commit/243e401b099e99623ce08b52ea89ad90b9f6e907) | `feat(employer): add competency management to jobs` — amplia competências e normas de segurança nas vagas e no portal do contratante. |
| 20/11/2026 | [`950b6aa`](https://github.com/LuizCastagno/BrickJobs/commit/950b6aaf9d6a9125f8b5d7e060b65922b92ea76c) | `feat: implement advanced job filtering system` — implementa filtros por faixa salarial e tipo de serviço, utilitários e testes. |
| 20/11/2026 | [`36445fc`](https://github.com/LuizCastagno/BrickJobs/commit/36445fc1139dfc5427514b733a6b2de0c15891fc) | `feat: add job priority system` — implementa níveis de prioridade, indicador urgente, ordenação e normalização das vagas. |
| 20/11/2026 | [`d8bc1a4`](https://github.com/LuizCastagno/BrickJobs/commit/d8bc1a42f2ab75a05e1258a95b8775d5bdca33e2) | `feat: add canvas-confetti dependency` — instala `canvas-confetti` e tipos para animações comemorativas. |
| 20/11/2026 | [`0acf91d`](https://github.com/LuizCastagno/BrickJobs/commit/0acf91d60b857b6788f7d49f2022c85812ec0f06) | `feat(worker): add draft resume PDF generation` — adiciona geração de currículo em PDF diretamente pelo portal do trabalhador. |
| 20/11/2026 | [`4d912fe`](https://github.com/LuizCastagno/BrickJobs/commit/4d912febbfb9d2d05a9aef2c183f0e707822b9be) | `feat: add celebration effects and sound notifications` — adiciona confetes, sons por Web Audio API, sincronização automática do README e melhorias visuais. |
| 18/11/2026 | [`7962531`](https://github.com/LuizCastagno/BrickJobs/commit/7962531fdd55290c65f2ca6288d2303801219038) | `fix(ui): apply fixed dimensions to header title` — corrige dimensões do título do cabeçalho da empresa para manter consistência visual. |
| 18/11/2026 | [`a792edf`](https://github.com/LuizCastagno/BrickJobs/commit/a792edfdc982271dc4e219d56401946a16f0b03d) | `docs: atualizar README completo e histórico de mudanças` — amplia a documentação completa e o histórico do projeto. |
| 18/11/2026 | [`be4fe6c`](https://github.com/LuizCastagno/BrickJobs/commit/be4fe6cdee9ae94a891510709615f1a0e4451860) | `feat: add safety reminders and construction news` — cria lembretes semanais de segurança, notícias da construção e API correspondente. |
| 18/11/2026 | [`7393211`](https://github.com/LuizCastagno/BrickJobs/commit/73932119c2d0102ccff3e31a812e216ecd2b161c) | `docs: add BrickJobs maintenance README` — adiciona README de manutenção e arquitetura. |
| 18/11/2026 | [`0913042`](https://github.com/LuizCastagno/BrickJobs/commit/0913042271a798cf76147c827b46755656ee6d8d) | `feat(stats): add open vs closed vacancy analytics and PDF reporting` — implementa estatísticas de vagas abertas/encerradas e relatório PDF. |
| 17/11/2026 | [`5a58484`](https://github.com/LuizCastagno/BrickJobs/commit/5a58484932901bf1e47ca856f7420864295089de) | `feat: add job notification categories preference` — adiciona preferências de categorias para notificações personalizadas de vagas. |
| 17/11/2026 | [`fbc4687`](https://github.com/LuizCastagno/BrickJobs/commit/fbc46878c2af0c055b2b8c5289b0609b92956e3b) | `feat: add profile photo support for users and jobs` — adiciona fotos e avatares a trabalhadores e construtoras. |
| 17/11/2026 | [`78590ab`](https://github.com/LuizCastagno/BrickJobs/commit/78590ab88033d92bc2db19ec6bcd597f7a87f974) | `feat: implement PWA support and add job completion date` — integra suporte PWA e registra a data de conclusão das candidaturas. |
| 17/11/2026 | [`10c8518`](https://github.com/LuizCastagno/BrickJobs/commit/10c85189fb3c380b5fa6d30d126701d5474178ee) | `feat(registration): enhance document validation and UI feedback` — melhora validação de documentos, mensagens de formulário e gerenciamento de foco. |
| 17/11/2026 | [`6a23026`](https://github.com/LuizCastagno/BrickJobs/commit/6a230265bdbc458863f27e7438e881bfb9f05c6b) | `feat: add document management and sex profile fields` — adiciona sexo e anexos de documentos aos perfis e à persistência. |
| 17/11/2026 | [`e0807ec`](https://github.com/LuizCastagno/BrickJobs/commit/e0807ec1976bd704493d1d284f36352e97388b17) | `feat: add worker productivity tracking panel` — adiciona acompanhamento de horas, produtividade e tendências por canteiro. |
| 17/11/2026 | [`fbd4a638`](https://github.com/LuizCastagno/BrickJobs/commit/fbd4a6385a89f2fbd58d77e34e4a93a595d78438) | `feat: add worker safety module and enhance UI` — cria módulo de segurança, quiz, ranking e aprimora a interface. |
| 15/11/2026 | [`7a3dc227`](https://github.com/LuizCastagno/BrickJobs/commit/7a3dc2270f38762d425865536a55eafb4e301897) | `feat: add severance calculator and rain alerts` — integra calculadora de rescisão CLT e alertas meteorológicos aos portais. |
| 15/11/2026 | [`b1f793c`](https://github.com/LuizCastagno/BrickJobs/commit/b1f793cd09322289a843da9c2f9e8810c1ff0fbf) | `feat: enhance application and infrastructure` — adiciona tema, área segura, modais e amplia modelos de dados e scripts. |
| 14/11/2026 | [`160fe4dd`](https://github.com/LuizCastagno/BrickJobs/commit/160fe4dd39c8cfbdc7165f126ee465f4db212be0) | `feat: initialize BrickJobs web platform` — cria a estrutura React/Vite/Tailwind/TypeScript e a aplicação inicial. |
| 14/11/2026 | [`a7f5dee`](https://github.com/LuizCastagno/BrickJobs/commit/a7f5dee630c9cf9e9146cb46232dad4e56d58fe9) | `Initial commit` — commit inicial do template AI Studio. |

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
