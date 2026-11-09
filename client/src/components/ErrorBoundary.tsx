import { Component, ErrorInfo, ReactNode } from 'react';

export class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Erro na interface:', error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="fatal-error">
          <h1>Algo deu errado na interface</h1>
          <p>Seus dados não foram alterados. Recarregue a página para continuar.</p>
          <pre>{this.state.error.message}</pre>
          <button type="button" className="btn btn-primary btn-md" onClick={() => window.location.reload()}>
            Recarregar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
