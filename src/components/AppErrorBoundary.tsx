/**
 * @file src/components/AppErrorBoundary.tsx
 * @description ErrorBoundary React para capturar falhas de carregamento lazy de módulos e erros
 *   de renderização tanto na raiz do aplicativo quanto dentro dos portais Contratante e Contratado.
 */

import React from 'react';
import { AppErrorScreen } from './AppErrorScreen';

interface AppErrorBoundaryProps {
  children: React.ReactNode;
  scope?: 'app' | 'portal';
  resetKeys?: unknown[];
  onRetry?: () => void;
  onBackToCover?: () => void;
  onError?: (error: unknown) => void;
}

interface AppErrorBoundaryState {
  hasError: boolean;
  error: unknown;
}

function areResetKeysChanged(
  prevKeys: unknown[] = [],
  nextKeys: unknown[] = []
): boolean {
  if (prevKeys.length !== nextKeys.length) return true;
  return prevKeys.some((item, idx) => !Object.is(item, nextKeys[idx]));
}

export class AppErrorBoundary extends React.Component<
  AppErrorBoundaryProps,
  AppErrorBoundaryState
> {
  constructor(props: AppErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: unknown): AppErrorBoundaryState {
    return { hasError: true, error };
  }

  override componentDidUpdate(prevProps: AppErrorBoundaryProps): void {
    if (
      this.state.hasError &&
      areResetKeysChanged(prevProps.resetKeys, this.props.resetKeys)
    ) {
      this.setState({ hasError: false, error: null });
    }
  }

  override componentDidCatch(error: unknown, errorInfo: React.ErrorInfo): void {
    if (typeof console !== 'undefined') {
      console.error('[BrickJobs] Erro capturado pelo AppErrorBoundary:', error, errorInfo.componentStack);
    }
    this.props.onError?.(error);
  }

  private handleRetry = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onRetry?.();
  };

  private handleBackToCover = (): void => {
    this.setState({ hasError: false, error: null });
    this.props.onBackToCover?.();
  };

  override render(): React.ReactNode {
    if (this.state.hasError) {
      return (
        <AppErrorScreen
          error={this.state.error}
          scope={this.props.scope ?? 'app'}
          onRetry={this.handleRetry}
          onBackToCover={
            this.props.onBackToCover ? this.handleBackToCover : undefined
          }
        />
      );
    }

    return this.props.children;
  }
}
