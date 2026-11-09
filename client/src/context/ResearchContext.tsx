import { useOutletContext } from 'react-router-dom';
import type { ResearchSummary } from '../../../shared/types';

export interface ResearchOutletContext {
  research: ResearchSummary;
  refresh: () => Promise<void>;
}

export function useResearch(): ResearchOutletContext {
  const context = useOutletContext<ResearchOutletContext | null>();
  if (!context) {
    throw new Error('useResearch deve ser usado dentro do workspace de uma pesquisa.');
  }
  return context;
}
