/**
 * @file src/main.tsx
 * @description Ponto de entrada principal da aplicação React BrickJobs, responsável por montar o
 *   componente raiz protegido por ErrorBoundary e monitoramento de falhas de carregamento.
 */

import { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { AppErrorBoundary } from './components/AppErrorBoundary.tsx';
import { AppErrorScreen } from './components/AppErrorScreen.tsx';
import { isFatalLoadError } from './utils/appErrorHandling.ts';
import './index.css';

declare global {
  interface Window {
    __BRICKJOBS_APP_READY__?: boolean;
  }
}

function RootErrorGuard() {
  const [fatalLoadError, setFatalLoadError] = useState<unknown>(null);

  useEffect(() => {
    window.__BRICKJOBS_APP_READY__ = true;

    const handlePreloadError = (event: Event) => {
      event.preventDefault();
      const customEvent = event as CustomEvent<unknown>;
      setFatalLoadError(
        customEvent.detail ??
          new Error('Falha ao pré-carregar módulo dinâmico do aplicativo.')
      );
    };

    const handleWindowError = (event: ErrorEvent) => {
      const target = event.target as HTMLElement | null;
      const isModuleResourceError =
        target instanceof HTMLScriptElement ||
        (target instanceof HTMLLinkElement && target.rel === 'stylesheet');
      if (isModuleResourceError) {
        setFatalLoadError(
          new Error('Falha ao carregar recurso essencial da página.')
        );
        return;
      }
      if (isFatalLoadError(event.error ?? event.message)) {
        setFatalLoadError(event.error ?? event.message);
      }
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isFatalLoadError(event.reason)) {
        event.preventDefault();
        setFatalLoadError(event.reason);
      }
    };

    window.addEventListener('vite:preloadError', handlePreloadError);
    window.addEventListener('error', handleWindowError, true);
    window.addEventListener('unhandledrejection', handleUnhandledRejection);

    return () => {
      window.removeEventListener('vite:preloadError', handlePreloadError);
      window.removeEventListener('error', handleWindowError, true);
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
    };
  }, []);

  if (fatalLoadError) {
    return (
      <AppErrorScreen
        error={fatalLoadError}
        scope="app"
        onRetry={() => setFatalLoadError(null)}
      />
    );
  }

  return (
    <AppErrorBoundary scope="app">
      <App />
    </AppErrorBoundary>
  );
}

const rootElement = document.getElementById('root');
if (rootElement) {
  createRoot(rootElement).render(<RootErrorGuard />);
}
