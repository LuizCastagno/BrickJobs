/**
 * Gera o documento HTML estruturado no padrão tipográfico ABNT (Times New Roman / Liberation Serif)
 * espelhando fielmente a diagramação do arquivo original BrickJobs_01f8a3ef.pdf.
 */
import fs from 'node:fs';
import path from 'node:path';

const outHtmlPath = path.resolve('.playwright-cli/brickjobs-doc.html');
fs.mkdirSync(path.dirname(outHtmlPath), { recursive: true });

// Exact page numbers verified from Pass 1 PDF render
const tocPages = {
  s1: '4',
  s1_1: '5',
  s1_2: '5',
  s1_3: '5',
  s1_4: '5',
  s2: '6',
  s2_1: '6',
  s2_2: '6',
  s3: '6',
  s3_1: '6',
  s3_2: '7',
  s3_3: '8',
  s4: '11',
  s4_1: '11',
  s4_2: '11',
  s4_3: '13',
  s5: '13',
  refs: '15',
};

const fontDir = '/usr/share/fonts/truetype/liberation';
const toFontDataUri = (fileName) => {
  const buf = fs.readFileSync(path.join(fontDir, fileName));
  return `data:font/ttf;base64,${buf.toString('base64')}`;
};

const html = `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8" />
<title>BrickJobs — Documentação Técnica e Projeto Integrador Refatorado</title>
<style>
  @font-face {
    font-family: 'ABNTSerif';
    src: url('${toFontDataUri('LiberationSerif-Regular.ttf')}') format('truetype');
    font-weight: 400;
    font-style: normal;
  }
  @font-face {
    font-family: 'ABNTSerif';
    src: url('${toFontDataUri('LiberationSerif-Bold.ttf')}') format('truetype');
    font-weight: 700;
    font-style: normal;
  }
  @font-face {
    font-family: 'ABNTSerif';
    src: url('${toFontDataUri('LiberationSerif-Italic.ttf')}') format('truetype');
    font-weight: 400;
    font-style: italic;
  }
  @font-face {
    font-family: 'ABNTSerif';
    src: url('${toFontDataUri('LiberationSerif-BoldItalic.ttf')}') format('truetype');
    font-weight: 700;
    font-style: italic;
  }
  @font-face {
    font-family: 'ABNTMono';
    src: url('${toFontDataUri('LiberationMono-Regular.ttf')}') format('truetype');
    font-weight: 400;
    font-style: normal;
  }

  @page {
    size: A4 portrait;
    margin: 30mm 20mm 20mm 30mm;
    @top-right {
      content: counter(page);
      font-family: 'ABNTSerif', 'Times New Roman', serif;
      font-size: 11pt;
      color: #000000;
      vertical-align: bottom;
      padding-bottom: 6mm;
    }
  }

  @page :first {
    @top-right {
      content: none;
    }
  }

  * {
    box-sizing: border-box;
  }

  body {
    margin: 0;
    padding: 0;
    font-family: 'ABNTSerif', 'Times New Roman', serif;
    font-size: 12pt;
    line-height: 1.5;
    color: #000000;
    background: #ffffff;
  }

  .page-break {
    page-break-before: always;
    break-before: page;
  }

  /* Capa & Folha de Rosto matching original exact visual structure */
  .cover-page,
  .title-page {
    height: 246mm;
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    text-align: center;
  }

  .cover-institution {
    font-weight: 700;
    font-size: 12pt;
    line-height: 1.35;
    text-transform: uppercase;
    max-width: 115mm;
    margin: 10mm auto 0 auto;
  }

  .cover-authors {
    font-weight: 700;
    font-size: 12pt;
    line-height: 1.35;
    text-transform: uppercase;
    margin: 0 auto;
  }

  .cover-title-wrap {
    margin: 0 auto;
    max-width: 145mm;
  }

  .cover-title {
    font-weight: 700;
    font-size: 12pt;
    line-height: 1.35;
    text-transform: uppercase;
    margin: 0;
  }

  .cover-subtitle {
    font-style: italic;
    font-weight: 400;
    font-size: 12pt;
    line-height: 1.35;
    text-transform: uppercase;
    margin-top: 2mm;
  }

  .cover-footer {
    font-size: 12pt;
    line-height: 1.4;
    margin-bottom: 4mm;
  }

  .titlepage-authors {
    font-weight: 700;
    font-size: 12pt;
    line-height: 1.35;
    text-transform: uppercase;
    text-align: center;
    margin-top: 2mm;
  }

  .titlepage-title {
    font-weight: 700;
    font-size: 12pt;
    line-height: 1.35;
    text-transform: uppercase;
    text-align: center;
    max-width: 145mm;
    margin: 0 auto;
  }

  .titlepage-note {
    margin-left: 50%;
    text-align: left;
    font-size: 11pt;
    line-height: 1.3;
  }

  .titlepage-note p {
    margin: 0 0 4mm 0;
    text-indent: 0;
    text-align: left;
  }

  /* Headings */
  h1.center-heading {
    font-size: 12pt;
    font-weight: 700;
    text-transform: uppercase;
    text-align: center;
    margin: 0 0 6mm 0;
    line-height: 1.3;
  }

  h2.section-l1 {
    font-size: 12pt;
    font-weight: 700;
    text-transform: uppercase;
    text-align: left;
    margin: 7mm 0 4mm 0;
    line-height: 1.35;
    page-break-after: avoid;
    break-after: avoid;
  }

  h3.section-l2 {
    font-size: 12pt;
    font-weight: 400;
    text-align: left;
    margin: 5mm 0 3mm 0;
    line-height: 1.4;
    page-break-after: avoid;
    break-after: avoid;
  }

  h4.section-l3 {
    font-size: 12pt;
    font-weight: 700;
    text-align: left;
    margin: 4mm 0 2mm 0;
    line-height: 1.4;
    page-break-after: avoid;
    break-after: avoid;
  }

  /* Paragraphs */
  p.body-p {
    font-size: 12pt;
    line-height: 1.5;
    text-align: justify;
    text-indent: 12.5mm;
    margin: 0 0 2.5mm 0;
  }

  p.no-indent {
    font-size: 12pt;
    line-height: 1.5;
    text-align: justify;
    text-indent: 0;
    margin: 0 0 3mm 0;
  }

  p.keywords {
    font-size: 12pt;
    line-height: 1.5;
    text-align: left;
    text-indent: 0;
    margin-top: 4mm;
  }

  ul.alpha-list {
    list-style: none;
    padding-left: 12.5mm;
    margin: 1mm 0 3mm 0;
  }

  ul.alpha-list li {
    text-align: justify;
    margin-bottom: 1.5mm;
    line-height: 1.45;
  }

  /* Sumário with dotted leaders matching Page 4 */
  .toc-list {
    margin: 0 0 8mm 0;
    padding: 0;
  }

  .toc-row {
    display: flex;
    align-items: baseline;
    font-size: 12pt;
    line-height: 1.55;
    margin-bottom: 1mm;
  }

  .toc-row.l1 {
    font-weight: 700;
    text-transform: uppercase;
  }

  .toc-row.l2 {
    font-weight: 400;
    padding-left: 9mm;
  }

  .toc-label {
    flex: 0 1 auto;
    padding-right: 1.5mm;
  }

  .toc-dots {
    flex: 1 1 auto;
    border-bottom: 1px dotted #000000;
    margin: 0 1.5mm;
    min-width: 8mm;
  }

  .toc-page {
    flex: 0 0 auto;
    font-weight: 400;
  }

  /* Quadros (ABNT bordered tables matching pages 6–8) */
  .quadro-wrap {
    margin: 4mm 0 5mm 0;
  }

  .quadro-lead {
    font-size: 12pt;
    font-weight: 700;
    text-align: left;
    margin: 0 0 2mm 0;
  }

  table.abnt-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 10.5pt;
    line-height: 1.32;
  }

  table.abnt-table th,
  table.abnt-table td {
    border: 1px solid #000000;
    padding: 2mm 2.5mm;
    text-align: left;
    vertical-align: top;
  }

  table.abnt-table th {
    font-weight: 700;
  }

  table.abnt-table tr {
    page-break-inside: avoid;
    break-inside: avoid;
  }

  .quadro-caption {
    font-size: 10pt;
    line-height: 1.35;
    text-align: left;
    margin-top: 1.5mm;
  }

  .quadro-caption strong {
    font-weight: 700;
  }

  /* Referências matching Page 9 */
  .ref-item {
    font-size: 12pt;
    line-height: 1.35;
    text-align: left;
    text-indent: 0;
    margin: 0 0 4mm 0;
    overflow-wrap: anywhere;
  }

  code.mono {
    font-family: 'ABNTMono', 'Liberation Mono', monospace;
    font-size: 10pt;
  }
</style>
</head>
<body>

  <!-- PÁGINA 1: CAPA -->
  <section class="cover-page">
    <div class="cover-institution">
      ESCOLA TÉCNICA ESTADUAL DE RONDONÓPOLIS – MATO GROSSO (ETEC – ROO/MT)<br />
      CURSO TÉCNICO EM EDIFICAÇÕES 2026
    </div>

    <div class="cover-authors">
      LUIZ AUGUSTO SILVA CASTAGNO SANTOS, FRANKA DE PAULA GUEDES,<br />
      GUSTAVO OLIVEIRA
    </div>

    <div class="cover-title-wrap">
      <p class="cover-title">
        MOBILIDADE E EMPREGO NA CONSTRUÇÃO CIVIL: EXPERIÊNCIA DO USUÁRIO E PROTOTIPAÇÃO DE UM APLICATIVO MÓVEL DE INTERMEDIAÇÃO DE VAGAS
      </p>
      <p class="cover-subtitle">PROJETO BRICKJOBS</p>
    </div>

    <div class="cover-footer">
      Rondonópolis – MT<br />
      2026
    </div>
  </section>

  <!-- PÁGINA 2: FOLHA DE ROSTO -->
  <section class="title-page page-break">
    <div class="titlepage-authors">
      LUIZ AUGUSTO SILVA CASTAGNO SANTOS, FRANKA DE PAULA GUEDES,<br />
      GUSTAVO OLIVEIRA ABRAHAN SAID MERIDA GUTOWSKI.<br />
      (GUSTAVO OLIVEIRA)
    </div>

    <div class="titlepage-title">
      MOBILIDADE E EMPREGO NA CONSTRUÇÃO CIVIL: EXPERIÊNCIA DO USUÁRIO E PROTOTIPAÇÃO DE UM APLICATIVO MÓVEL DE INTERMEDIAÇÃO DE VAGAS
    </div>

    <div class="titlepage-note">
      <p>
        Documentação técnica consolidada e projeto integrador apresentado ao curso de Edificações de 2026/27 pela instituição ETEC – ROO/MT (Escola Técnica Estadual do Estado de Mato Grosso - Rondonópolis), como requisito parcial para a elaboração e entrega do trabalho de projeto integrador do segundo semestre do ano de 2026.
      </p>
      <p>Orientador: Prof. Msc. José Olavo Pio</p>
    </div>

    <div class="cover-footer">
      Rondonópolis – MT<br />
      2026
    </div>
  </section>

  <!-- PÁGINA 3: RESUMO -->
  <section class="page-break">
    <h1 class="center-heading">RESUMO</h1>

    <p class="no-indent">
      Este trabalho apresenta o estudo da experiência do usuário (UX) em dispositivos móveis e a engenharia completa do aplicativo web progressivo (PWA) <strong>BrickJobs</strong>, desenvolvido para a intermediação de vagas de emprego na construção civil em Rondonópolis e região (Mato Grosso). O sistema evoluiu de uma prototipação inicial concebida nas plataformas Base44 e Google AI Studio para uma aplicação full-stack modular em React 19, TypeScript, Tailwind CSS 4, Vite 8 e servidor Node.js/Express. O aplicativo estrutura-se em dois portais dedicados: o portal <strong>Contratante</strong> (construtora), que permite o cadastro completo da empresa com validação documental, publicação e edição de vagas com níveis de prioridade e competências, gestão de candidaturas com celebração visual/sonora, chat pós-aprovação, agendamento de início de obra com lembretes automáticos, painel mensal e estatísticas em D3/Recharts com exportação em PDF/CSV; e o portal <strong>Contratado</strong> (trabalhador), que oferece cadastro com envio de currículo em PDF ou preenchimento guiado por sub-abas de experiências com cálculo automático de duração, sugestão automática de 3 competências técnicas via Gemini API (<code class="mono">gemini-4-hydrogen</code>), pesquisa textual e por voz (Web Speech API), geolocalização GPS com raio ajustável por cálculo de distância Haversine, previsões meteorológicas em tempo real via Open-Meteo, ranking de construtoras em destaque, compartilhamento de vagas pela Web Share API, dicas de carreira, notícias regionais com Search Grounding, quiz e guias de segurança no canteiro de obras (NRs 06 a 35) disponíveis offline, painel de produtividade, estimativa de ganhos e calculadora trabalhista CLT. A pesquisa apoia-se em indicadores do Novo Caged, RAIS, CBIC e SINDUSCON-MT, bem como em conformidade com a LGPD (Lei nº 13.709/2018) e verificação automatizada por 42 suítes de testes unitários (214 casos aprovados).
    </p>

    <p class="keywords">
      <strong>Palavras-chave:</strong> Construção civil. Emprego formal. Experiência do usuário. Aplicativo web progressivo (PWA). Inteligência artificial aplicada. Rondonópolis-MT.
    </p>
  </section>

  <!-- PÁGINA 4+: SUMÁRIO + TEXTO -->
  <section class="page-break">
    <h1 class="center-heading">SUMÁRIO</h1>

    <div class="toc-list" id="toc-container">
      <div class="toc-row l1"><span class="toc-label">1 INTRODUÇÃO</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s1">${tocPages.s1}</span></div>
      <div class="toc-row l2"><span class="toc-label">1.1 Tema e delimitação</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s1_1">${tocPages.s1_1}</span></div>
      <div class="toc-row l2"><span class="toc-label">1.2 Problema de pesquisa</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s1_2">${tocPages.s1_2}</span></div>
      <div class="toc-row l2"><span class="toc-label">1.3 Hipótese</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s1_3">${tocPages.s1_3}</span></div>
      <div class="toc-row l2"><span class="toc-label">1.4 Justificativa</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s1_4">${tocPages.s1_4}</span></div>

      <div class="toc-row l1"><span class="toc-label">2 OBJETIVOS</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s2">${tocPages.s2}</span></div>
      <div class="toc-row l2"><span class="toc-label">2.1 Objetivo geral</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s2_1">${tocPages.s2_1}</span></div>
      <div class="toc-row l2"><span class="toc-label">2.2 Objetivos específicos</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s2_2">${tocPages.s2_2}</span></div>

      <div class="toc-row l1"><span class="toc-label">3 REFERENCIAL TEÓRICO E DESCRITIVO DO APLICATIVO</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s3">${tocPages.s3}</span></div>
      <div class="toc-row l2"><span class="toc-label">3.1 Experiência do usuário e aplicativos móveis</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s3_1">${tocPages.s3_1}</span></div>
      <div class="toc-row l2"><span class="toc-label">3.2 Construção civil e emprego no Brasil e em Mato Grosso</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s3_2">${tocPages.s3_2}</span></div>
      <div class="toc-row l2"><span class="toc-label">3.3 Descritivo completo dos recursos e ferramentas do aplicativo</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s3_3">${tocPages.s3_3}</span></div>

      <div class="toc-row l1"><span class="toc-label">4 METODOLOGIA E EVOLUÇÃO TÉCNICA DO SISTEMA</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s4">${tocPages.s4}</span></div>
      <div class="toc-row l2"><span class="toc-label">4.1 Natureza da pesquisa, persistência e conformidade LGPD</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s4_1">${tocPages.s4_1}</span></div>
      <div class="toc-row l2"><span class="toc-label">4.2 Ferramentas utilizadas do desenvolvimento inicial até a versão atual</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s4_2">${tocPages.s4_2}</span></div>
      <div class="toc-row l2"><span class="toc-label">4.3 Alterações estruturais na v1 e atualizações recentes</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s4_3">${tocPages.s4_3}</span></div>

      <div class="toc-row l1"><span class="toc-label">5 CRONOGRAMA</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="s5">${tocPages.s5}</span></div>
      <div class="toc-row l1"><span class="toc-label">REFERÊNCIAS</span><span class="toc-dots"></span><span class="toc-page" data-toc-for="refs">${tocPages.refs}</span></div>
    </div>

    <!-- 1 INTRODUÇÃO -->
    <h2 class="section-l1" id="s1">1 INTRODUÇÃO</h2>

    <p class="body-p">
      A construção civil é um dos setores que mais empregam no Brasil. Segundo a Câmara Brasileira da Indústria da Construção (CBIC), com base no Novo Caged, o setor alcançou 3,131 milhões de trabalhadores formais em julho de 2026 (CBIC, 2026a), o que representa em torno de 6,5% do estoque total de vínculos formais do país, de 48,2 milhões em agosto de 2026 (PARAÍBA BUSINESS, 2026), em cálculo aproximado dos autores. Apesar dessa relevância econômica e social, a conexão entre empresas que precisam contratar mão de obra qualificada e profissionais que buscam oportunidade no canteiro ainda ocorre, em grande parte, por indicação pessoal e contatos informais.
    </p>
    <p class="body-p">
      Neste contexto, ferramentas digitais móveis simples, responsivas e resilientes à conexão instável podem aproximar as duas pontas com eficiência. Para que sejam efetivamente adotadas no cotidiano das obras, contudo, precisam ser concebidas a partir dos princípios de experiência do usuário (UX), acessibilidade e formulários progressivos, considerando que parte dos trabalhadores da obra possui familiaridade limitada com tecnologia ou utiliza aparelhos móveis em campo. Este trabalho consolida o estudo teórico aplicado e a documentação completa do aplicativo web progressivo <strong>BrickJobs</strong>, estruturado para atender construtoras e trabalhadores em Rondonópolis-MT com recursos completos de cadastro, filtragem georreferenciada, segurança do trabalho, inteligência artificial e geração automática de documentos.
    </p>

    <h3 class="section-l2" id="s1_1">1.1 Tema e delimitação</h3>
    <p class="body-p">
      Experiência do usuário (UX), engenharia de interface web progressiva (PWA) e inteligência artificial aplicada à intermediação de emprego na construção civil, com recorte socioeconômico para o Brasil e o estado de Mato Grosso e implementação funcional direcionada ao município de Rondonópolis-MT e região.
    </p>

    <h3 class="section-l2" id="s1_2">1.2 Problema de pesquisa</h3>
    <p class="body-p">
      Como projetar e implementar um aplicativo móvel progressivo de intermediação de vagas que seja prático, acessível offline em pontos críticos do canteiro e direto para empresas e trabalhadores da construção civil, inclusive para profissionais que não possuem currículo formal prévio?
    </p>

    <h3 class="section-l2" id="s1_3">1.3 Hipótese</h3>
    <p class="body-p">
      Um aplicativo web progressivo com cadastro simplificado em duas modalidades (anexo de currículo em PDF ou preenchimento guiado por sub-abas de experiências com cálculo automático de tempo de atuação), integrado a filtros por geolocalização, validação documental, ferramentas de segurança do trabalho offline e sugestão automática de competências por inteligência artificial, reduz barreiras de entrada e torna mais ágil o encontro entre construtoras e trabalhadores.
    </p>

    <h3 class="section-l2" id="s1_4">1.4 Justificativa</h3>
    <p class="body-p">
      O setor da construção civil exerce peso estratégico na geração de empregos formais e no desenvolvimento urbano, habitacional e logístico. Mato Grosso figura entre os estados com melhor desempenho proporcional à população na abertura de vagas formais na construção civil em 2026 (CBIC, 2026b), com forte demanda em polos agroindustriais e logísticos como Rondonópolis-MT. Soluções digitais bem projetadas contribuem para a organização da oferta e da demanda de mão de obra, para a difusão de boas práticas prevencionistas (NRs) e para a valorização profissional do operário. Academicamente, o projeto integra fundamentos de experiência do usuário, gestão de obras, segurança do trabalho e engenharia de software moderna.
    </p>

    <!-- 2 OBJETIVOS -->
    <h2 class="section-l1" id="s2">2 OBJETIVOS</h2>

    <h3 class="section-l2" id="s2_1">2.1 Objetivo geral</h3>
    <p class="body-p">
      Projetar, desenvolver e validar tecnicamente o aplicativo web progressivo <strong>BrickJobs</strong> para intermediação de vagas de emprego na construção civil, orientado pela experiência do usuário, acessibilidade em campo e uso de ferramentas digitais modernas para construtoras e trabalhadores.
    </p>

    <h3 class="section-l2" id="s2_2">2.2 Objetivos específicos</h3>
    <ul class="alpha-list">
      <li>a) revisar a literatura técnica e normativa sobre experiência do usuário, usabilidade móvel e acessibilidade digital (NBR ISO 9241-210);</li>
      <li>b) levantar e consolidar indicadores sobre o emprego formal na construção civil nos âmbitos nacional e estadual (Mato Grosso);</li>
      <li>c) definir os perfis de usuário (Contratante e Contratado), seus fluxos operacionais, validação documental e requisitos de privacidade conforme a LGPD (Lei nº 13.709/2018);</li>
      <li>d) implementar integralmente os módulos de busca georreferenciada, cadastro guiado, comunicação pós-aprovação, segurança no canteiro offline, previsão meteorológica, relatórios em PDF/CSV e análise de competências com a Gemini API;</li>
      <li>e) evoluir o protótipo inicial concebido nas plataformas Base44 e Google AI Studio para uma aplicação full-stack verificada por testes unitários automatizados (<code class="mono">node:test</code>), checagem estática TypeScript e inspeção visual em navegador real (Chromium).</li>
    </ul>

    <!-- 3 REFERENCIAL TEÓRICO E DESCRITIVO -->
    <h2 class="section-l1" id="s3">3 REFERENCIAL TEÓRICO E DESCRITIVO DO APLICATIVO</h2>

    <h3 class="section-l2" id="s3_1">3.1 Experiência do usuário e aplicativos móveis</h3>
    <p class="body-p">
      A norma ABNT NBR ISO 9241-210 define a experiência do usuário como as percepções e respostas de uma pessoa resultantes do uso ou da expectativa de uso de um sistema, produto ou serviço interativo. No contexto de aplicativos móveis destinados a trabalhadores da construção civil, Nielsen e Budiu (2014) destacam restrições críticas de ambiente: telas reduzidas, operação com uma mão, exposição solar (que exige alto contraste e suporte a tema claro/escuro), conectividade intermitente em canteiros periféricos e menor familiaridade com jargões corporativos.
    </p>
    <p class="body-p">
      Complementarmente, Norman (2006) ressalta a importância de modelos conceituais claros, <em>affordances</em> visíveis e feedback imediato após cada ação. No BrickJobs, esses princípios materializam-se em alvos de toque mínimos de 44×44 pixels, navegação inferior fixa em dispositivos móveis (<code class="mono">MobileBottomNav</code>), formulários progressivos por sub-abas, entrada por comando de voz via Web Speech API para reduzir atrito de digitação, tour guiado interativo por perfil (<code class="mono">GuidedTourModal</code>), tela dedicada para falhas de carregamento (<code class="mono">AppErrorScreen</code>) e cache offline via Service Worker (PWA) para conteúdos críticos como dicas de segurança e carreira.
    </p>

    <h3 class="section-l2" id="s3_2">3.2 Construção civil e emprego no Brasil e em Mato Grosso</h3>
    <p class="body-p">
      O Novo Caged, do Ministério do Trabalho e Emprego, registra mensalmente admissões e desligamentos do emprego celetista no Brasil. Entre janeiro e agosto de 2026, a construção civil gerou saldo positivo de 200.431 empregos com carteira assinada e atingiu patamar histórico de trabalhadores formais (CBIC, 2026b). Apenas em agosto de 2026, o setor abriu 20.848 vagas formais de um total de 165.827 no país (PARAÍBA BUSINESS, 2026). Em julho de 2026, o estoque nacional somou 3,131 milhões de vínculos formais, avanço de 2,92% frente a julho de 2025 (CBIC, 2026a).
    </p>
    <p class="body-p">
      Em termos proporcionais à população, Mato Grosso do Sul e Mato Grosso lideraram a criação de vagas na construção em 2026, registrando 251 e 181 novas vagas por 100 mil habitantes, respectivamente (DIÁRIO DO COMÉRCIO, 2026). Embora se observe desaceleração pontual no segmento de edifícios a partir de abril de 2026 (CBIC, 2026b), obras de infraestrutura logística, galpões agroindustriais, pavimentação e habitação em municípios polo como Rondonópolis-MT sustentam demanda constante por pedreiros, armadores de ferragem, carpinteiros, eletricistas, operadores de máquinas e técnicos em segurança do trabalho.
    </p>

    <div class="quadro-wrap">
      <table class="abnt-table">
        <thead>
          <tr>
            <th>Indicador</th>
            <th>Brasil</th>
            <th>Mato Grosso</th>
            <th>Fonte</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Estoque de trabalhadores formais na construção civil</td>
            <td>3,131 milhões (jul/2026; +2,92% a/a)</td>
            <td>Demanda regional liderada por infraestrutura e agroindústria</td>
            <td>CBIC / Novo Caged (2026a)</td>
          </tr>
          <tr>
            <td>Estoque total de vínculos formais (todos os setores)</td>
            <td>48,2 milhões (ago/2026)</td>
            <td>Base estadual acompanhada no Caged / RAIS</td>
            <td>MTE / Paraíba Business (2026)</td>
          </tr>
          <tr>
            <td>Participação da construção no emprego formal (%)</td>
            <td>Aproximadamente 6,5%</td>
            <td>Alta representatividade no saldo estadual</td>
            <td>Cálculo dos autores (2026)</td>
          </tr>
          <tr>
            <td>Saldo de vagas da construção no ano</td>
            <td>200.431 (jan–ago/2026); 20.848 em ago/2026</td>
            <td>2º maior saldo proporcional do país</td>
            <td>CBIC / Novo Caged (2026b)</td>
          </tr>
          <tr>
            <td>Vagas na construção por 100 mil habitantes</td>
            <td>–</td>
            <td>181 vagas / 100 mil hab. (2º lugar nacional)</td>
            <td>CBIC / Diário do Comércio (2026)</td>
          </tr>
          <tr>
            <td>Setores motrizes regionais mapeados no app</td>
            <td>Edificações, infraestrutura e logística</td>
            <td>Ferrovia Estadual MT, BR-163, silos, galpões e habitação</td>
            <td>SINDUSCON-MT / Seed Regional BrickJobs</td>
          </tr>
        </tbody>
      </table>
      <p class="quadro-caption">
        <strong>Quadro 1</strong> – Indicadores consolidados de emprego na construção civil (Brasil e Mato Grosso). Fonte: CBIC (2026a, 2026b); Paraíba Business (2026); Diário do Comércio (2026); elaboração dos autores.
      </p>
    </div>

    <h3 class="section-l2" id="s3_3">3.3 Descritivo completo dos recursos e ferramentas do aplicativo</h3>
    <p class="body-p">
      Na versão atual consolidada (<code class="mono">v1</code> até 27/11/2026), o <strong>BrickJobs</strong> é composto por <strong>40 componentes React</strong> (<code class="mono">src/components/</code>), <strong>43 módulos de regras puras</strong> (<code class="mono">src/utils/</code>) e <strong>5 endpoints de API</strong> no servidor Express (<code class="mono">server.ts</code>), organizados nos módulos funcionais descritos a seguir e sintetizados no Quadro 2.
    </p>

    <h4 class="section-l3">a) Capa, Navegação Adaptativa, Tema, LGPD e Resiliência de Inicialização</h4>
    <p class="body-p">
      A tela inicial (<code class="mono">CoverScreen</code>) apresenta duas entradas principais — <strong>Contratante</strong> (empresa) e <strong>Contratado</strong> (colaborador) — além de barra de pesquisa ao vivo por título/descrição, seletor de distância máxima (km) com detecção de proximidade GPS, contadores regionais em tempo real (vagas abertas, construtoras, perfis e bairros de Rondonópolis-MT) e acesso direto ao documento técnico em PDF no rodapé. O cabeçalho (<code class="mono">TopNavBar</code>) e a barra inferior móvel (<code class="mono">MobileBottomNav</code>) adaptam as abas ao portal ativo. O menu de configurações (<code class="mono">UserSettingsMenu</code>) permite alternar entre tema claro e escuro, instalar o PWA na tela inicial (<code class="mono">usePWAInstall</code>), gerenciar notificações push nativas (<code class="mono">NativePushPermissionCard</code>), ativar ou silenciar alertas sonoros sintetizados pela Web Audio API (<code class="mono">notificationSound.ts</code>), rever o tour guiado (<code class="mono">GuidedTourModal</code>) e controlar preferências de cookies e tratamento de dados sensíveis conforme a LGPD (<code class="mono">CookieConsentBanner</code> e <code class="mono">LgpdPrivacyModal</code>). Caso ocorra falha de carregamento inicial ou erro inesperado de renderização, o sistema exibe a tela diagnóstica <code class="mono">AppErrorScreen</code> envolvida por <code class="mono">AppErrorBoundary</code>, com detecção de status offline e botão de recuperação.
    </p>

    <h4 class="section-l3">b) Portal do Contratante (Construtora)</h4>
    <p class="body-p">
      O portal <code class="mono">EmployerPortal</code> organiza a operação da empresa em quatro abas principais: (1) <strong>Vagas e Candidaturas</strong>, onde a construtora publica, edita e encerra oportunidades especificando função, quantidade de vagas, bairro/região, salário ou diária, modalidade de contrato (CLT, Autônomo ou Temporário), nível de experiência, prioridade (Normal, Alta ou Urgente), competências requeridas/preferenciais e sugestões contextuais de descrição (<code class="mono">JobDescriptionSuggestions</code>); também gerencia candidaturas com guardas estritas de transição (<code class="mono">canAcceptApplication</code>), aceita profissionais com disparo de confetes (<code class="mono">ContractAcceptedConfetti</code> via <code class="mono">canvas-confetti</code>) e efeito sonoro, abre chat dedicado após aprovação (<code class="mono">ApplicationChatModal</code>) e agenda data/hora de início na obra com lembrete automático 30 minutos antes (<code class="mono">workReminders.ts</code>); (2) <strong>Estatísticas</strong> (<code class="mono">EmployerStatisticsTab</code> e <code class="mono">EmployerMonthlyDashboard</code>), com métricas mensais de vagas abertas versus finalizadas, histórico dos últimos 6 meses em gráficos D3 e Recharts, tempo médio de preenchimento, notas recebidas e exportação de relatório executivo em PDF (<code class="mono">employerReportPdf.ts</code>); (3) <strong>Dados da Empresa</strong>, contemplando razão social, CNPJ, responsável, contatos, foto de perfil (<code class="mono">ProfilePhotoField</code>) e anexo obrigatório de documentos conforme o sexo do responsável (<code class="mono">RequiredDocumentsSection</code>); e (4) <strong>Profissionais</strong>, diretório somente leitura de profissionais contratados, concluídos e disponíveis na região com exportação direta em PDF (<code class="mono">jsPDF</code>) e CSV (UTF-8 com BOM). Um modal dedicado de ferramentas operacionais reúne o painel de avisos de chuva no canteiro (<code class="mono">RainAlertsPanel</code> via Open-Meteo) e a calculadora de rescisão trabalhista CLT (<code class="mono">SeveranceCalculatorPanel</code>).
    </p>

    <h4 class="section-l3">c) Portal do Contratado (Trabalhador)</h4>
    <p class="body-p">
      O portal <code class="mono">WorkerPortal</code> estrutura a jornada do profissional em cinco abas integradas:
    </p>
    <p class="body-p">
      1) <strong>Vagas Disponíveis</strong>: reúne busca textual, pesquisa por voz no navegador (<code class="mono">voiceSearch.ts</code> via Web Speech API), barra de localização e proximidade GPS com cálculo de distância Haversine (<code class="mono">LocationRegionBar</code> e <code class="mono">geolocation.ts</code>) e geocodificação reversa via Nominatim, filtros avançados por faixa salarial, tipo de serviço, ocupação, modalidade contratual, nível e prioridade (<code class="mono">jobAdvancedFilters.ts</code>), barra de tags técnicas (<code class="mono">SkillTagFilterBar</code> com destaque para alvenaria, elétrica, pintura, construções industriais, pré-moldados e construções sustentáveis), seção <strong>Construtoras em Destaque</strong> (<code class="mono">FeaturedCompaniesSection</code>) exibindo gráfico comparativo em Recharts da média de avaliações dos trabalhadores com atalho de filtro por empresa, e modal de detalhes (<code class="mono">JobDetailsModal</code>) equipado com a funcionalidade <strong>Compartilhar Vaga</strong> via Web Share API, deep link (<code class="mono">?vaga=&lt;id&gt;</code>), WhatsApp e cópia para área de transferência (<code class="mono">jobShare.ts</code>).
    </p>
    <p class="body-p">
      2) <strong>Dicas de Segurança</strong>: concentra o quiz educativo pontuado de EPIs (<code class="mono">SafetyTipsCard</code>) com ranking de desempenho (<code class="mono">SafetyLeaderboardCard</code>), os <strong>Lembretes Semanais de Segurança e EPIs</strong> (<code class="mono">SafetyWeeklyRemindersCard</code>) gerados via Gemini API com fallback curado offline e a seção <strong>Dicas de Segurança no Canteiro de Obras</strong> (<code class="mono">ConstructionSiteSafetySection</code>), que disponibiliza guias práticos das NRs 06, 10, 11, 12, 18, 21 e 35 armazenados localmente para consulta integral mesmo sem conexão à internet.
    </p>
    <p class="body-p">
      3) <strong>Notícias da Construção</strong> (<code class="mono">ConstructionNewsTab</code>): apresenta panorama regional de obras em Mato Grosso e Rondonópolis (Ferrovia Estadual, duplicação da BR-163, saneamento, galpões e habitação) alimentado por Gemini Search Grounding no servidor com catálogo local de contingência.
    </p>
    <p class="body-p">
      4) <strong>Meu Cadastro</strong>: permite informar dados pessoais, sexo, contatos, foto de perfil, anexar os documentos obrigatórios com validação dinâmica por sexo (histórico criminal, título de eleitor, teste toxicológico e certificado de reservista/CDI quando aplicável), escolher entre anexar currículo em PDF ou preencher experiências em sub-abas progressivas com cálculo automático de meses/anos de atuação (<code class="mono">duration.ts</code>), configurar categorias de alerta de vagas e utilizar o módulo <strong>Sugestão Automática de 3 Competências (Gemini AI)</strong> (<code class="mono">WorkerCompetencySuggestionsCard</code>), que analisa as experiências registradas via <code class="mono">POST /api/worker-competencies</code> e permite aplicar as 3 competências recomendadas diretamente ao perfil e ao PDF gerado.
    </p>
    <p class="body-p">
      5) <strong>Perfil Gerado</strong>: consolida automaticamente dados, competências selecionadas, documentos, experiências e tempo total de atuação; lista candidaturas com acesso ao chat pós-aprovação, lembretes de início de obra e avaliação por estrelas da construtora após conclusão (<code class="mono">CompanyRatingModal</code>); permite exportar o currículo profissional formatado em PDF (<code class="mono">resumePdf.ts</code>); e integra as <strong>Dicas de Carreira</strong> (<code class="mono">CareerTipsCard</code>), o <strong>Painel de Produtividade por Obra e Mês</strong> (<code class="mono">WorkerProductivityPanel</code>), a <strong>Estimativa de Ganhos Acumulados</strong> (<code class="mono">WorkerEarningsPanel</code>) e a calculadora rescisória CLT.
    </p>

    <div class="quadro-wrap">
      <table class="abnt-table">
        <thead>
          <tr>
            <th style="width: 28%;">Módulo / Área</th>
            <th>Recursos e Ferramentas Implementadas</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Capa, Acesso e Resiliência</td>
            <td>Entrada dual (Contratante/Contratado), busca textual e GPS por raio na capa, contador regional, tema claro/escuro, banner e modal LGPD, tour guiado por perfil, abertura animada (<code class="mono">AppLoadingOverlay</code>), tela de erro (<code class="mono">AppErrorScreen</code>) e link de download da documentação PDF.</td>
          </tr>
          <tr>
            <td>Portal Contratante (Construtora)</td>
            <td>Cadastro empresarial com validação documental, criação/edição de vagas com prioridades e competências, sugestões de descrição, aceite de candidatura com confetes/som, chat em tempo real local, lembrete de obra T-30 min, diretório de profissionais com exportação PDF/CSV, estatísticas D3/Recharts com relatório PDF, avisos de chuva Open-Meteo e calculadora CLT.</td>
          </tr>
          <tr>
            <td>Portal Contratado — Busca e Empresas</td>
            <td>Pesquisa textual e por voz (Web Speech API), filtro GPS Haversine com slider de raio, filtros avançados (salário, contrato, prioridade, tags), Construtoras em Destaque (gráfico Recharts por média de estrelas) e detalhes da vaga com Web Share API + deep link <code class="mono">?vaga=</code>.</td>
          </tr>
          <tr>
            <td>Portal Contratado — Segurança e Notícias</td>
            <td>Quiz gamificado de EPIs com leaderboard, Lembretes Semanais via Gemini AI + fallback offline, Dicas de Segurança no Canteiro de Obras (NRs 06–35) com cache 100% offline e Notícias da Construção em MT via Search Grounding.</td>
          </tr>
          <tr>
            <td>Portal Contratado — Cadastro, IA e Perfil</td>
            <td>Modo PDF ou sub-abas de experiências com duração automática, sugestão automática de 3 competências via Gemini API (<code class="mono">/api/worker-competencies</code>), documentos obrigatórios validados por sexo, exportação de currículo PDF (<code class="mono">jsPDF</code>), Dicas de Carreira, Produtividade por obra e Estimativa de Ganhos.</td>
          </tr>
        </tbody>
      </table>
      <p class="quadro-caption">
        <strong>Quadro 2</strong> – Escopo funcional completo implementado na versão atual do aplicativo BrickJobs. Fonte: elaboração dos autores a partir do código-fonte do repositório.
      </p>
    </div>

    <!-- 4 METODOLOGIA E EVOLUÇÃO TÉCNICA -->
    <h2 class="section-l1" id="s4">4 METODOLOGIA E EVOLUÇÃO TÉCNICA DO SISTEMA</h2>

    <h3 class="section-l2" id="s4_1">4.1 Natureza da pesquisa, persistência e conformidade LGPD</h3>
    <p class="body-p">
      A pesquisa possui natureza aplicada e abordagem mista, articulando: (a) revisão bibliográfica sobre ergonomia de interação e usabilidade móvel; (b) pesquisa documental em bases oficiais e setoriais do emprego formal (Novo Caged, RAIS, CBIC, IBGE e SINDUSCON-MT); e (c) desenvolvimento iterativo do aplicativo web progressivo BrickJobs com verificação automatizada e inspeção de usabilidade em navegador headless Chromium.
    </p>
    <p class="body-p">
      Sob a perspectiva arquitetural, a versão atual adota arquitetura cliente-servidor local: o estado principal da aplicação é persistido no navegador sob a chave <code class="mono">brickjobs_rondonopolis_state_v1</code> (<code class="mono">src/utils/storage.ts</code>), com migração retrocompatível de registros antigos e sincronização automática entre abas via evento <code class="mono">storage</code>. O tratamento de dados pessoais e documentos anexos observa os princípios de finalidade, transparência e consentimento da Lei Geral de Proteção de Dados Pessoais (Lei nº 13.709/2018), incluindo gestão explícita de cookies e consentimento específico para dados sensíveis (Art. 11) via <code class="mono">lgpdConsent.ts</code>, com possibilidade de revogação e limpeza integral dos dados locais.
    </p>

    <h3 class="section-l2" id="s4_2">4.2 Ferramentas utilizadas do desenvolvimento inicial até a versão atual</h3>
    <p class="body-p">
      A trajetória técnica do BrickJobs abrangeu desde a concepção visual inicial e prototipagem assistida até a consolidação de uma base full-stack em TypeScript modularizada e testada. Na fase inicial, utilizaram-se <strong>Base44</strong> e <strong>Google AI Studio</strong> para modelagem rápida de interface e validação dos fluxos de Contratante e Contratado, apoiados por controle de versão em <strong>Git / GitHub</strong> (repositório público <code class="mono">LuizCastagno/BrickJobs</code>).
    </p>
    <p class="body-p">
      Na consolidação da aplicação atual, o frontend foi estruturado em <strong>React 19</strong> com <strong>TypeScript 7</strong> e estilização utilitária em <strong>Tailwind CSS 4</strong> (<code class="mono">@tailwindcss/vite</code>), empacotado com <strong>Vite 8</strong> (Rolldown com divisão otimizada de chunks para React, Motion, Recharts/D3, jsPDF e ícones) e transformado em aplicativo instalável com <strong>vite-plugin-pwa</strong> e <strong>Workbox</strong> (incluindo service worker dedicado <code class="mono">sw-push.js</code> para notificações push). Os recursos de interface utilizam <strong>Lucide React</strong> para iconografia técnica, <strong>Motion</strong> (<code class="mono">motion/react</code>) para transições de aba e cartões, e <strong>canvas-confetti</strong> combinado à <strong>Web Audio API</strong> para microinterações de aceite contratual.
    </p>
    <p class="body-p">
      Para visualização analítica e emissão documental, empregam-se <strong>Recharts</strong> e <strong>D3</strong> (painéis mensais, ranking de construtoras e gráficos estatísticos) e <strong>jsPDF</strong> (currículos do trabalhador, relatórios executivos da construtora e listagens de profissionais, além da geração CSV com BOM UTF-8). O backend em <strong>Node.js</strong> e <strong>Express 4</strong> (executado em desenvolvimento via <strong>tsx</strong> e gerenciado em lockfile <strong>Bun</strong>) centraliza as rotas REST <code class="mono">/api/rain-alerts</code> (<strong>Open-Meteo API</strong>), <code class="mono">/api/career-tips</code>, <code class="mono">/api/safety-weekly-reminders</code>, <code class="mono">/api/construction-news</code> (<strong>Google Search Grounding</strong>) e <code class="mono">/api/worker-competencies</code> por meio do SDK oficial <strong>@google/genai</strong> com o modelo <code class="mono">gemini-4-hydrogen</code> (<code class="mono">ThinkingLevel.LOW</code> e esquema JSON tipado). No navegador, integram-se ainda a <strong>Geolocation API</strong> com <strong>OpenStreetMap Nominatim</strong>, <strong>Web Share API</strong>, <strong>Web Speech API</strong>, <strong>Notification API</strong> e <strong>FileReader API</strong>. A qualidade do código é verificada por <strong>42 suítes de testes unitários</strong> (<code class="mono">node:test</code> + <code class="mono">node:assert/strict</code>, totalizando 214 casos), checagem estrita <code class="mono">tsc --noEmit</code>, script pré-build <code class="mono">scripts/sync-readme.mjs</code> e testes funcionais/visuais em navegador real com <strong>Playwright / Chromium</strong>.
    </p>

    <div class="quadro-wrap">
      <table class="abnt-table">
        <thead>
          <tr>
            <th style="width: 26%;">Fase / Camada</th>
            <th>Ferramentas, Bibliotecas, APIs e Serviços</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Concepção e Prototipação Inicial</td>
            <td>Google AI Studio (prototipação e fluxos iniciais), Base44 (validação inicial de escopo), Git e GitHub (<code class="mono">LuizCastagno/BrickJobs</code>).</td>
          </tr>
          <tr>
            <td>Frontend e Interface (UI/UX)</td>
            <td>React 19, TypeScript 7, Tailwind CSS 4 (<code class="mono">@tailwindcss/vite</code>), Lucide React, Motion (<code class="mono">motion/react</code>), canvas-confetti, fontes Google (Outfit, Plus Jakarta Sans, JetBrains Mono).</td>
          </tr>
          <tr>
            <td>Build, Empacotamento e PWA</td>
            <td>Vite 8 (Rolldown &amp; LightningCSS), <code class="mono">vite-plugin-pwa</code>, Workbox (<code class="mono">generateSW</code> + <code class="mono">sw-push.js</code>), Bun (<code class="mono">bun.lock</code>), script <code class="mono">scripts/sync-readme.mjs</code>.</td>
          </tr>
          <tr>
            <td>Backend e Servidor HTTP</td>
            <td>Node.js, Express 4 (<code class="mono">server.ts</code>), <code class="mono">tsx</code> (execução TypeScript), <code class="mono">dotenv</code>, cache em memória por TTL e guarda de cooldown Gemini (<code class="mono">geminiQuota.ts</code>).</td>
          </tr>
          <tr>
            <td>Inteligência Artificial e APIs Externas</td>
            <td>SDK <code class="mono">@google/genai</code> (modelo <code class="mono">gemini-4-hydrogen</code>, esquema JSON estruturado e Search Grounding), Open-Meteo API (previsão de chuva), OpenStreetMap Nominatim (geocodificação reversa).</td>
          </tr>
          <tr>
            <td>Gráficos, Documentos e Web APIs</td>
            <td>Recharts, D3, jsPDF, CSV UTF-8/BOM, Geolocation API, Web Share API, Web Speech API, Web Audio API, Notification API, FileReader API e <code class="mono">localStorage</code>.</td>
          </tr>
          <tr>
            <td>Qualidade, Testes e Verificação</td>
            <td><code class="mono">node:test</code> + <code class="mono">node:assert/strict</code> (42 suítes / 214 testes), <code class="mono">tsc --noEmit</code>, Playwright CLI e Chromium headless.</td>
          </tr>
        </tbody>
      </table>
      <p class="quadro-caption">
        <strong>Quadro 3</strong> – Matriz completa de ferramentas utilizadas desde o desenvolvimento inicial até a versão atual. Fonte: <code class="mono">package.json</code>, <code class="mono">vite.config.ts</code> e <code class="mono">server.ts</code> do repositório BrickJobs.
      </p>
    </div>

    <h3 class="section-l2" id="s4_3">4.3 Alterações estruturais na v1 e atualizações recentes</h3>
    <p class="body-p">
      Ao longo da primeira versão (<code class="mono">v1</code>, entre 18/11/2026 e 27/11/2026), a arquitetura passou por refatoração contínua para separar contratos de dados (<code class="mono">src/types/brickjobs.ts</code>), regras puras testáveis (<code class="mono">src/utils/</code>) e componentes de interface (<code class="mono">src/components/</code>), mantendo retrocompatibilidade com perfis salvos localmente. O Quadro 4 consolida os principais marcos evolutivos registrados nos documentos do repositório (<code class="mono">README.md</code>, <code class="mono">ALTERACOES-RECENTES-CODIGO.md</code> e <code class="mono">HISTORICO-ALTERACOES-RECENTES.md</code>) e nas entregas subsequentes.
    </p>

    <div class="quadro-wrap">
      <table class="abnt-table">
        <thead>
          <tr>
            <th style="width: 19%;">Período</th>
            <th>Principais Alterações e Marcos Arquiteturais</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>18/11 – 20/11/2026</td>
            <td>Fotos de perfil e vagas; preferências de notificação por categoria; estatísticas de vagas abertas vs. encerradas com relatório PDF; lembretes semanais de segurança e notícias via Gemini; celebrações (<code class="mono">canvas-confetti</code> e Web Audio API); currículo em PDF (<code class="mono">jsPDF</code>); sistema de prioridades; filtros salariais/serviço e gestão de competências das vagas.</td>
          </tr>
          <tr>
            <td>21/11 – 23/11/2026</td>
            <td>Substituição da aba redundante de utilidades pelo diretório de Profissionais da Construtora com exportação CSV/PDF; dicas de carreira offline e histórico mensal de contratações em Recharts; guarda compartilhada de cooldown contra erros <code class="mono">429/RESOURCE_EXHAUSTED</code> da Gemini API e ajuste resiliente em <code class="mono">scripts/sync-readme.mjs</code>.</td>
          </tr>
          <tr>
            <td>24/11/2026</td>
            <td>Guardas de candidatura (<code class="mono">canAcceptApplication</code>, <code class="mono">canApplyToJob</code>); <code class="mono">AbortController</code> em buscas; proteção contra duplo clique; revisão técnica de JSDoc e limpeza de estado em <code class="mono">App.tsx</code>; otimização de bundle em <code class="mono">vite.config.ts</code> e separação de <code class="mono">devDependencies</code>.</td>
          </tr>
          <tr>
            <td>24/11 – 27/11/2026 (Atual)</td>
            <td>Tela dedicada de erro de carregamento (<code class="mono">AppErrorScreen</code> + fallback de boot em <code class="mono">index.html</code>); seção offline de Dicas de Segurança no Canteiro de Obras; seção Construtoras em Destaque com gráfico Recharts; compartilhamento de vagas via Web Share API + deep link <code class="mono">?vaga=</code>; e análise automática de experiências com sugestão de 3 competências via Gemini API (<code class="mono">POST /api/worker-competencies</code>).</td>
          </tr>
        </tbody>
      </table>
      <p class="quadro-caption">
        <strong>Quadro 4</strong> – Evolução técnica e marcos funcionais do aplicativo BrickJobs ao longo da v1 até a versão atual. Fonte: documentação histórica e código-fonte do repositório.
      </p>
    </div>

    <!-- 5 CRONOGRAMA -->
    <h2 class="section-l1" id="s5">5 CRONOGRAMA</h2>
    <p class="body-p">
      O cronograma consolidado no Quadro 5 apresenta a distribuição das etapas cumpridas desde a fundamentação teórica e prototipação inicial até a consolidação técnica, testes automatizados e revisão documental final.
    </p>

    <div class="quadro-wrap">
      <table class="abnt-table">
        <thead>
          <tr>
            <th>Etapa</th>
            <th style="width: 12%; text-align: center;">Mês 1</th>
            <th style="width: 12%; text-align: center;">Mês 2</th>
            <th style="width: 12%; text-align: center;">Mês 3</th>
            <th style="width: 12%; text-align: center;">Mês 4</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Referencial teórico (UX, NBR ISO 9241-210 e aplicativos móveis)</td>
            <td style="text-align: center;">X</td>
            <td style="text-align: center;">X</td>
            <td></td>
            <td></td>
          </tr>
          <tr>
            <td>Levantamento de dados do setor (Brasil, MT e Rondonópolis)</td>
            <td></td>
            <td style="text-align: center;">X</td>
            <td style="text-align: center;">X</td>
            <td></td>
          </tr>
          <tr>
            <td>Prototipação inicial (Base44 / Google AI Studio) e arquitetura full-stack</td>
            <td></td>
            <td></td>
            <td style="text-align: center;">X</td>
            <td style="text-align: center;">X</td>
          </tr>
          <tr>
            <td>Implementação de IA (Gemini API), PWA offline, testes unitários e validação visual</td>
            <td></td>
            <td></td>
            <td style="text-align: center;">X</td>
            <td style="text-align: center;">X</td>
          </tr>
          <tr>
            <td>Refatoração documental, revisão técnica final e entrega</td>
            <td></td>
            <td></td>
            <td></td>
            <td style="text-align: center;">X</td>
          </tr>
        </tbody>
      </table>
      <p class="quadro-caption">
        <strong>Quadro 5</strong> – Cronograma de execução e consolidação do projeto integrador. Fonte: elaboração dos autores.
      </p>
    </div>

    <!-- REFERÊNCIAS -->
    <h1 class="center-heading page-break" id="refs">REFERÊNCIAS</h1>

    <p class="ref-item">
      ASSOCIAÇÃO BRASILEIRA DE NORMAS TÉCNICAS. <strong>ABNT NBR ISO 9241-210</strong>: ergonomia da interação humano-sistema: parte 210: projeto centrado no ser humano para sistemas interativos. Rio de Janeiro: ABNT, 2011.
    </p>
    <p class="ref-item">
      BRASIL. <strong>Lei nº 13.709, de 14 de agosto de 2018</strong>. Lei Geral de Proteção de Dados Pessoais (LGPD). Brasília, DF: Presidência da República, 2018.
    </p>
    <p class="ref-item">
      BRASIL. Ministério do Trabalho e Emprego. <strong>Normas Regulamentadoras (NR-06, NR-10, NR-11, NR-12, NR-18, NR-21 e NR-35)</strong>: segurança e saúde no trabalho na indústria da construção. Brasília, DF: MTE, 2026.
    </p>
    <p class="ref-item">
      CÂMARA BRASILEIRA DA INDÚSTRIA DA CONSTRUÇÃO (CBIC). <strong>Construção respondeu por mais de 21% dos novos empregos formais do país em julho</strong>. Brasília, DF: CBIC, 2026a. Disponível em: https://cbic.org.br/construcao-respondeu-por-mais-de-21-dos-novos-empregos-formais-do-pais-em-julho/. Acesso em: 13 nov. 2026.
    </p>
    <p class="ref-item">
      CÂMARA BRASILEIRA DA INDÚSTRIA DA CONSTRUÇÃO (CBIC). <strong>Desempenho da Construção Civil no 3º Trimestre de 2026 e Perspectivas</strong>. Brasília, DF: CBIC, 2026b. Disponível em: https://cbic.org.br/?p=109536. Acesso em: 13 nov. 2026.
    </p>
    <p class="ref-item">
      DIÁRIO DO COMÉRCIO. <strong>Número de trabalhadores na construção é recorde em nova série do Caged, diz CBIC</strong>. Belo Horizonte, 2026. Disponível em: https://diariodocomercio.com.br/economia/trabalhadores-construcao-recorde-caged/. Acesso em: 13 nov. 2026.
    </p>
    <p class="ref-item">
      GOOGLE. <strong>Google GenAI SDK (@google/genai) e Gemini API Documentation</strong>. Mountain View: Google, 2026. Disponível em: https://ai.google.dev/. Acesso em: 27 nov. 2026.
    </p>
    <p class="ref-item">
      MINISTÉRIO DO TRABALHO E EMPREGO. <strong>Novo Caged</strong>: estatísticas mensais do emprego formal. Brasília, DF: MTE, 2026. Disponível em: https://www.gov.br/trabalhoeemprego/pt-br/assuntos/estatisticas-trabalho/novo-caged. Acesso em: 13 nov. 2026.
    </p>
    <p class="ref-item">
      NIELSEN, Jakob; BUDIU, Raluca. <strong>Usabilidade móvel</strong>. Rio de Janeiro: Elsevier, 2014.
    </p>
    <p class="ref-item">
      NORMAN, Donald A. <strong>O design do dia a dia</strong>. Rio de Janeiro: Rocco, 2006.
    </p>
    <p class="ref-item">
      OPEN-METEO. <strong>Weather Forecast API Documentation</strong>. Zurique: Open-Meteo, 2026. Disponível em: https://open-meteo.com/en/docs. Acesso em: 24 nov. 2026.
    </p>
    <p class="ref-item">
      PARAÍBA BUSINESS. <strong>Construção civil cria 20,8 mil vagas e lidera avanço entre setores no mês</strong>. João Pessoa, 2026. Disponível em: https://paraibabusiness.com.br/construcao-civil-cria-208-mil-vagas-e-lidera-avanco-entre-setores-no-mes/. Acesso em: 13 nov. 2026.
    </p>
    <p class="ref-item">
      SANTOS, Luiz Augusto Silva Castagno; GUEDES, Franka de Paula; GUTOWSKI, Gustavo Oliveira Abrahan Said Merida. <strong>BrickJobs</strong>: repositório e documentação técnica (<code class="mono">README.md</code>, <code class="mono">ALTERACOES-RECENTES-CODIGO.md</code> e <code class="mono">HISTORICO-ALTERACOES-RECENTES.md</code>). Rondonópolis: GitHub, 2026. Disponível em: https://github.com/LuizCastagno/BrickJobs. Acesso em: 27 nov. 2026.
    </p>
    <p class="ref-item">
      SINDICATO DA INDÚSTRIA DA CONSTRUÇÃO DO ESTADO DE MATO GROSSO (SINDUSCON-MT). <strong>Publicações setoriais e mercado da construção civil em Mato Grosso</strong>. Cuiabá: SINDUSCON-MT, 2026. Disponível em: https://www.sindusconmt.com.br/. Acesso em: 24 nov. 2026.
    </p>
  </section>

</body>
</html>`;

fs.writeFileSync(outHtmlPath, html, 'utf8');
console.log('Generated HTML at', outHtmlPath);
