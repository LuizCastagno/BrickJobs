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
- Navegação animada e adaptações para mobile.
- Tela inicial com resumo de vagas, construtoras e trabalhadores.
- Instalação PWA.
- Barra de navegação desktop e mobile.
- Consentimento de cookies e controles LGPD.
- Sincronização entre abas do mesmo navegador por `storage` events.
- Notificações e lembretes em segundo plano onde suportado.

## Tecnologias

- **Frontend:** React 19, TypeScript/TSX e Tailwind CSS 4.
- **Build:** Vite 8.
- **Servidor:** Node.js e Express, executado com `tsx` em desenvolvimento.
- **PWA:** `vite-plugin-pwa` e Workbox.
- **Interface:** `lucide-react` e `motion`.
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
| `bun run build` | Gera o build estático em `dist/`. |
| `bun run preview` | Executa o preview do build do Vite. |
| `bun run start` | Executa `server.ts`; antes da produção, gere `dist/`. |
| `bun run lint` | Executa `tsc --noEmit`. |
| `bun run clean` | Remove `dist` e `server.js`. |

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

- Segurança semanal: `SafetyWeeklyRemindersCard.tsx` e `safetyWeeklyTips.ts`.
- Notícias: `ConstructionNewsTab.tsx` e `constructionNews.ts`.
- Produtividade: `WorkerProductivityPanel.tsx` e `workerProductivity.ts`.
- Ganhos: `WorkerEarningsPanel.tsx` e `workerEarnings.ts`.
- Estatísticas da construtora: `EmployerStatisticsTab.tsx` e `employerStats.ts`.
- Relatórios em PDF: `employerReportPdf.ts`.
- Fotos e avatares: `ProfilePhotoField.tsx`, `ProfileAvatar.tsx` e `avatar.ts`.
- Documentos: `RequiredDocumentsSection.tsx` e `requiredDocuments.ts`.
- Localização: `LocationRegionBar.tsx` e `geolocation.ts`.
- PWA: `usePWAInstall.ts` e `pwaInstall.ts`.
- LGPD: `LgpdPrivacyModal.tsx`, `CookieConsentBanner.tsx` e `lgpdConsent.ts`.

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

As alterações mais recentes adicionadas no commit `be4fe6cdee9ae94a891510709615f1a0e4451860` foram:

1. Nova aba **Segurança** no portal do trabalhador.
2. Checklist semanal de EPIs com persistência local.
3. Conteúdo baseado em NR-06, NR-18 e NR-35.
4. Geração dinâmica dos lembretes por IA.
5. Fallback completo caso Gemini esteja indisponível.
6. Nova aba **Notícias da Construção**.
7. Notícias sobre ferrovia, rodovias, obras urbanas, habitação e mercado.
8. Filtragem de notícias por categoria e texto.
9. Integração com Google Search Grounding no servidor.
10. Cache de notícias por 15 minutos.
11. Navegação mobile ampliada para acomodar as novas abas.
12. Barras de rolagem ocultadas globalmente enquanto mantido o comportamento de rolagem.
13. Novos testes para dados de segurança e notícias.

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