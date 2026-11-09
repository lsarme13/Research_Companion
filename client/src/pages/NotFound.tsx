import { Link } from 'react-router-dom';
import { EmptyState } from '../components/Layout';

export function NotFound() {
  return (
    <EmptyState
      icon="alert"
      title="Página não encontrada"
      description="O endereço solicitado não existe ou foi movido."
      action={
        <Link to="/" className="btn btn-primary btn-md">
          Voltar para a Dashboard
        </Link>
      }
    />
  );
}
