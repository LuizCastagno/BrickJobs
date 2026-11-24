/**
 * @file src/utils/appErrorHandling.ts
 * @description Classificação e formatação amigável de falhas de carregamento de módulos, rede,
 *   armazenamento local e erros de renderização para a tela de erro do BrickJobs.
 */

export type AppErrorCategory =
  | 'chunk_load'
  | 'network'
  | 'storage'
  | 'render'
  | 'unknown';

export interface AppErrorDescriptor {
  category: AppErrorCategory;
  code: string;
  badgeLabel: string;
  title: string;
  description: string;
  guidance: string[];
  rawMessage: string;
  stackTrace?: string;
  preferReload: boolean;
}

const CHUNK_ERROR_PATTERNS = [
  /chunkloaderror/i,
  /loading chunk [\w-]+ failed/i,
  /loading css chunk [\w-]+ failed/i,
  /failed to fetch dynamically imported module/i,
  /importing a module script failed/i,
  /error loading dynamically imported module/i,
  /unable to preload css/i,
  /dynamically imported module/i,
];

const NETWORK_ERROR_PATTERNS = [
  /failed to fetch/i,
  /networkerror/i,
  /network request failed/i,
  /err_internet_disconnected/i,
  /err_network_changed/i,
  /load failed/i,
  /the internet connection appears to be offline/i,
];

const STORAGE_ERROR_PATTERNS = [
  /quotaexceedederror/i,
  /exceeded the quota/i,
  /localstorage/i,
  /storage/i,
];

/**
 * Extrai nome, mensagem e stack de qualquer valor lançado (Error, string, objeto ou evento).
 */
export function extractErrorDetails(error: unknown): {
  name: string;
  message: string;
  stack?: string;
} {
  if (error instanceof Error) {
    return {
      name: error.name || 'Error',
      message: error.message || 'Erro inesperado na aplicação.',
      stack: error.stack,
    };
  }
  if (typeof error === 'string') {
    return {
      name: 'Error',
      message: error.trim() || 'Erro inesperado na aplicação.',
    };
  }
  if (error && typeof error === 'object') {
    const candidate = error as {
      name?: unknown;
      message?: unknown;
      reason?: unknown;
      stack?: unknown;
    };
    if (candidate.reason !== undefined) {
      return extractErrorDetails(candidate.reason);
    }
    const name =
      typeof candidate.name === 'string' && candidate.name.trim()
        ? candidate.name.trim()
        : 'Error';
    const message =
      typeof candidate.message === 'string' && candidate.message.trim()
        ? candidate.message.trim()
        : 'Falha inesperada ao carregar os recursos do aplicativo.';
    const stack =
      typeof candidate.stack === 'string' ? candidate.stack : undefined;
    return { name, message, stack };
  }
  return {
    name: 'Error',
    message: 'Falha inesperada ao carregar os recursos do aplicativo.',
  };
}

/**
 * Identifica se um erro capturado globalmente (via `error` ou `unhandledrejection`)
 * representa uma falha crítica de carregamento de módulo/bundle que deve abrir a tela de erro.
 */
export function isFatalLoadError(error: unknown): boolean {
  const { name, message } = extractErrorDetails(error);
  const combined = `${name} ${message}`;
  return CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(combined));
}

/**
 * Classifica um erro de carregamento ou renderização e retorna textos claros em português.
 */
export function classifyAppError(
  error: unknown,
  options?: { isOnline?: boolean; scope?: 'app' | 'portal' }
): AppErrorDescriptor {
  const { name, message, stack } = extractErrorDetails(error);
  const combined = `${name} ${message}`;
  const isOnline = options?.isOnline ?? true;
  const scope = options?.scope ?? 'app';

  if (CHUNK_ERROR_PATTERNS.some((pattern) => pattern.test(combined))) {
    return {
      category: 'chunk_load',
      code: 'ERR_CARREGAMENTO_MODULO',
      badgeLabel: 'Falha de carregamento',
      title:
        scope === 'portal'
          ? 'Não foi possível carregar este portal'
          : 'Falha ao carregar os arquivos do aplicativo',
      description: isOnline
        ? 'Uma atualização recente do BrickJobs ou uma oscilação na rede impediu o carregamento completo desta tela.'
        : 'Seu aparelho está sem conexão no momento e este módulo ainda não foi salvo para uso offline.',
      guidance: [
        'Recarregue a página para buscar a versão mais recente dos arquivos.',
        'Se estiver no canteiro com sinal fraco, aguarde alguns segundos antes de tentar novamente.',
      ],
      rawMessage: `${name}: ${message}`,
      stackTrace: stack,
      preferReload: true,
    };
  }

  if (
    !isOnline ||
    NETWORK_ERROR_PATTERNS.some((pattern) => pattern.test(combined))
  ) {
    return {
      category: 'network',
      code: 'ERR_CONEXAO_REDE',
      badgeLabel: isOnline ? 'Erro de rede' : 'Sem internet',
      title: isOnline
        ? 'Falha de conexão ao carregar'
        : 'Você está sem conexão com a internet',
      description: isOnline
        ? 'Não conseguimos concluir o download dos recursos necessários para abrir esta tela.'
        : 'Verifique seu Wi-Fi ou dados móveis para continuar carregando os dados e módulos do BrickJobs.',
      guidance: [
        'Confira se os dados móveis ou Wi-Fi estão ativos.',
        'Toque em "Tentar novamente" ou recarregue a página quando a conexão estabilizar.',
      ],
      rawMessage: `${name}: ${message}`,
      stackTrace: stack,
      preferReload: false,
    };
  }

  if (STORAGE_ERROR_PATTERNS.some((pattern) => pattern.test(combined))) {
    return {
      category: 'storage',
      code: 'ERR_ARMAZENAMENTO_LOCAL',
      badgeLabel: 'Armazenamento local',
      title: 'Não foi possível acessar os dados salvos no navegador',
      description:
        'O espaço de armazenamento local pode estar cheio ou bloqueado pelas configurações de privacidade do navegador.',
      guidance: [
        'Verifique se o navegador não está em modo restrito de armazenamento.',
        'Tente recarregar a página; se persistir, libere espaço removendo anexos muito grandes.',
      ],
      rawMessage: `${name}: ${message}`,
      stackTrace: stack,
      preferReload: false,
    };
  }

  if (error instanceof Error || scope === 'portal') {
    return {
      category: 'render',
      code: 'ERR_EXIBICAO_TELA',
      badgeLabel: 'Erro inesperado',
      title:
        scope === 'portal'
          ? 'Ocorreu um erro ao carregar este portal'
          : 'Ops! Algo deu errado ao carregar o BrickJobs',
      description:
        'Encontramos uma falha inesperada durante a exibição da página. Seus cadastros e vagas salvos localmente permanecem protegidos.',
      guidance: [
        'Clique em "Tentar novamente" para restaurar a visualização.',
        'Se o problema continuar, recarregue a página ou volte para a tela inicial.',
      ],
      rawMessage: `${name}: ${message}`,
      stackTrace: stack,
      preferReload: false,
    };
  }

  return {
    category: 'unknown',
    code: 'ERR_DESCONHECIDO',
    badgeLabel: 'Erro de carregamento',
    title: 'Não foi possível concluir o carregamento',
    description:
      'Houve um problema inesperado ao inicializar esta parte do aplicativo.',
    guidance: [
      'Recarregue a página para reiniciar o carregamento com segurança.',
    ],
    rawMessage: `${name}: ${message}`,
    stackTrace: stack,
    preferReload: true,
  };
}

/**
 * Formata um resumo copiável para suporte técnico sem expor tokens ou dados sensíveis.
 */
export function formatErrorReportText(
  descriptor: AppErrorDescriptor,
  timestampIso: string
): string {
  const lines = [
    `BrickJobs · Relatório de Erro`,
    `Código: ${descriptor.code} (${descriptor.category})`,
    `Data/Hora: ${timestampIso}`,
    `Detalhe: ${descriptor.rawMessage}`,
  ];
  if (descriptor.stackTrace) {
    const firstLines = descriptor.stackTrace
      .split('\n')
      .slice(0, 5)
      .join('\n');
    lines.push(`Rastreamento:\n${firstLines}`);
  }
  return lines.join('\n');
}
