import { Navigate } from 'react-router-dom';
import { useResearch } from '../context/ResearchContext';

const SECTIONS = new Set(['documents', 'sources', 'reader', 'notes']);

export function ResearchHome() {
  const { research } = useResearch();
  const section = SECTIONS.has(research.lastSection) ? research.lastSection : 'documents';
  return <Navigate to={`/research/${research.id}/${section}`} replace />;
}
