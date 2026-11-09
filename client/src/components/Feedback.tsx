import { useState } from 'react';

export function Spinner({ size = 16 }: { size?: number }) {
  return (
    <span
      className="spinner"
      style={{ width: size, height: size }}
      role="status"
      aria-label="Carregando"
    />
  );
}

export function LoadingBlock({ label = 'Carregando…' }: { label?: string }) {
  return (
    <div className="loading-block">
      <Spinner />
      <span>{label}</span>
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="error-block" role="alert">
      <div>
        <strong>Não foi possível concluir a operação.</strong>
        <p>{message}</p>
      </div>
      {onRetry ? (
        <button type="button" className="btn btn-secondary btn-sm" onClick={onRetry}>
          Tentar novamente
        </button>
      ) : null}
    </div>
  );
}

export function useDisclosure(initial = false) {
  const [open, setOpen] = useState(initial);
  return {
    open,
    show: () => setOpen(true),
    hide: () => setOpen(false),
    toggle: () => setOpen((value) => !value),
  };
}
