import { Link } from 'react-router-dom';
import type { AiAnswer } from '../../../shared/types';
import { DemoBadge } from './Badge';
import { Icon } from './Icons';
import { Markdown } from './Markdown';

export function AiAnswerView({
  result,
  researchId,
  label,
}: {
  result: AiAnswer;
  researchId: string;
  label: string;
}) {
  const consulted = result.references.length ? result.references : result.contextSources;
  return (
    <div className="ai-answer">
      <div className="ai-answer-head">
        <span className="ai-answer-label">
          <Icon name="sparkles" size={14} />
          {label}
        </span>
        {result.demo ? <DemoBadge /> : <span className="ai-provider">{result.provider} · {result.model}</span>}
      </div>

      {result.demo ? (
        <div className="callout callout-warning demo-callout">
          <Icon name="alert" size={15} />
          <p>
            Resposta de demonstração. Configure um provedor de IA em Configurações para obter uma
            análise real.
          </p>
        </div>
      ) : null}

      <Markdown>{result.answer}</Markdown>

      {consulted.length ? (
        <div className="ai-sources">
          <div className="ai-sources-title">
            {result.references.length
              ? 'Fontes citadas'
              : result.demo
                ? 'Fontes que entrariam no contexto'
                : 'Fontes consultadas'}
          </div>
          <ul>
            {consulted.map((reference) => (
              <li key={reference.label}>
                <Link to={`/research/${researchId}/reader?source=${reference.sourceId}`}>
                  <span className="ai-source-label">[{reference.label}]</span>
                  <span>{reference.title}</span>
                </Link>
              </li>
            ))}
          </ul>
          {!result.demo && !result.references.length && result.contextSources.length ? (
            <p className="ai-citation-warning">
              A resposta não citou fontes específicas. Confira as fontes consultadas antes de usar
              estas conclusões.
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
