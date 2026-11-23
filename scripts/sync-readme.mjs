/**
 * @file scripts/sync-readme.mjs
 * @description Script de sincronização automática do README.md a partir do inventário real de componentes, módulos, testes e scripts do projeto.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const README_PATH = path.join(ROOT_DIR, 'README.md');
const PACKAGE_JSON_PATH = path.join(ROOT_DIR, 'package.json');

const START_MARKER = '<!-- AUTO_INVENTORY_START -->';
const END_MARKER = '<!-- AUTO_INVENTORY_END -->';

/**
 * Extrai a linha `@description` do cabeçalho JSDoc de um arquivo TypeScript/TSX.
 * @param {string} filePath Caminho absoluto do arquivo fonte.
 * @returns {string} Descrição resumida para a tabela do README.
 */
function extractFileDescription(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const match = content.match(/@description\s+([^\r\n*]+)/);
  if (match && match[1]) {
    return match[1].trim().replace(/\|/g, '\\|');
  }
  return 'Módulo do sistema BrickJobs.';
}

/**
 * Lista e ordena arquivos de um diretório filtrando por extensão e predicado opcional.
 * @param {string} relDir Diretório relativo à raiz.
 * @param {(name: string) => boolean} predicate Filtro de nomes de arquivo.
 */
function collectModuleEntries(relDir, predicate) {
  const fullDir = path.join(ROOT_DIR, relDir);
  if (!fs.existsSync(fullDir)) return [];

  return fs
    .readdirSync(fullDir)
    .filter(predicate)
    .sort((a, b) => a.localeCompare(b, 'pt-BR'))
    .map((fileName) => {
      const relPath = `${relDir}/${fileName}`;
      return {
        fileName,
        relPath,
        description: extractFileDescription(path.join(fullDir, fileName)),
      };
    });
}

function buildInventoryMarkdown() {
  const pkg = JSON.parse(fs.readFileSync(PACKAGE_JSON_PATH, 'utf8'));
  const components = collectModuleEntries('src/components', (name) => name.endsWith('.tsx'));
  const utils = collectModuleEntries(
    'src/utils',
    (name) => name.endsWith('.ts') && !name.endsWith('.test.ts')
  );
  const tests = fs
    .readdirSync(path.join(ROOT_DIR, 'src/utils'))
    .filter((name) => name.endsWith('.test.ts'))
    .sort((a, b) => a.localeCompare(b, 'pt-BR'));
  const hooks = collectModuleEntries('src/hooks', (name) => name.endsWith('.ts'));
  const data = collectModuleEntries('src/data', (name) => name.endsWith('.ts'));
  const types = collectModuleEntries('src/types', (name) => name.endsWith('.ts'));

  const coreFiles = [
    { relPath: 'server.ts', description: extractFileDescription(path.join(ROOT_DIR, 'server.ts')) },
    { relPath: 'src/App.tsx', description: extractFileDescription(path.join(ROOT_DIR, 'src/App.tsx')) },
    { relPath: 'src/main.tsx', description: extractFileDescription(path.join(ROOT_DIR, 'src/main.tsx')) },
    ...types,
    ...hooks,
    ...data,
  ];

  const scriptsEntries = Object.entries(pkg.scripts || {});

  const lines = [
    START_MARKER,
    `> Inventário gerado automaticamente via \`scripts/sync-readme.mjs\` (${components.length} componentes React, ${utils.length} módulos utilitários, ${tests.length} suítes de teste e ${scriptsEntries.length} scripts npm).`,
    '',
    '### Núcleo, tipos, hooks e dados',
    '',
    '| Arquivo | Função |',
    '| --- | --- |',
    ...coreFiles.map((item) => `| \`${item.relPath}\` | ${item.description} |`),
    '',
    `### Componentes de interface (\`src/components/\` — ${components.length})`,
    '',
    '| Componente | Responsabilidade |',
    '| --- | --- |',
    ...components.map((item) => `| \`${item.fileName}\` | ${item.description} |`),
    '',
    `### Utilitários e regras de negócio (\`src/utils/\` — ${utils.length})`,
    '',
    '| Módulo | Responsabilidade |',
    '| --- | --- |',
    ...utils.map((item) => `| \`${item.fileName}\` | ${item.description} |`),
    '',
    `### Suítes de teste automatizados (\`src/utils/*.test.ts\` — ${tests.length})`,
    '',
    tests.map((testName) => `\`${testName}\``).join(' · '),
    '',
    END_MARKER,
  ];

  return lines.join('\n');
}

function syncReadme() {
  if (!fs.existsSync(README_PATH)) {
    throw new Error(`README.md não encontrado em ${README_PATH}`);
  }

  const currentReadme = fs.readFileSync(README_PATH, 'utf8');
  const startIndex = currentReadme.indexOf(START_MARKER);
  const endIndex = currentReadme.indexOf(END_MARKER);

  if (startIndex === -1 || endIndex === -1 || endIndex < startIndex) {
    console.log(
      '[sync-readme] Marcadores de inventário automático ausentes no README.md; sincronização ignorada.'
    );
    return;
  }

  const nextInventory = buildInventoryMarkdown();
  const updatedReadme =
    currentReadme.slice(0, startIndex) +
    nextInventory +
    currentReadme.slice(endIndex + END_MARKER.length);

  if (updatedReadme !== currentReadme) {
    fs.writeFileSync(README_PATH, updatedReadme, 'utf8');
    console.log('[sync-readme] README.md atualizado com o inventário atual.');
  } else {
    console.log('[sync-readme] README.md já está sincronizado.');
  }
}

syncReadme();
