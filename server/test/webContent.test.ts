import { describe, expect, it } from 'vitest';
import { extractHtml } from '../services/webContent.js';

describe('extração de conteúdo HTML', () => {
  it('descarta menus, listas de idiomas e rodapés, preservando o texto do artigo', () => {
    const html = `
      <!doctype html>
      <html lang="pt-BR">
        <head>
          <title>Consciência e inteligência artificial</title>
          <meta name="author" content="Autora Exemplo" />
        </head>
        <body>
          <header role="banner"><a href="/">Wikipédia</a></header>
          <main>
            <h1>Consciência e inteligência artificial</h1>
            <div role="navigation">
              <a href="#historia">História</a>
              <a href="#debates">Debates</a>
            </div>
            <div class="sidebar">
              <a href="/tema">Tema lateral</a>
              <a href="/outro">Outro atalho</a>
            </div>
            <ul class="vector-menu-content-list">
              <li><a href="/en">English</a></li>
              <li><a href="/de">Deutsch</a></li>
              <li><a href="/fr">Français</a></li>
              <li><a href="/es">Español</a></li>
            </ul>
            <p>
              A discussão sobre a possibilidade de consciência em sistemas artificiais
              envolve filosofia da mente, ciência cognitiva e ética. Diferentes posições
              discordam sobre o que caracteriza a experiência subjetiva e sobre quais
              evidências seriam suficientes para atribuí-la a uma máquina. Este parágrafo
              existe para garantir que o conteúdo principal seja selecionado pelo extrator.
            </p>
            <p>
              O debate também examina conceitos como intencionalidade, agência e
              compreensão. Uma posição funcionalista sustenta que estados mentais podem
              ser realizados por qualquer sistema que cumpra as funções apropriadas.
            </p>
            <ul>
              <li>
                <a href="/teoria-a">Teoria A</a> — defende que a consciência depende de
                processos de integração de informação observáveis no comportamento.
              </li>
              <li>
                <a href="/teoria-b">Teoria B</a> — argumenta que a simulação funcional não
                basta para produzir experiência subjetiva genuína.
              </li>
            </ul>
          </main>
          <footer><a href="/privacidade">Política de privacidade</a></footer>
        </body>
      </html>
    `;

    const content = extractHtml('https://example.org/consciencia', html, 'example.org');

    expect(content.title).toBe('Consciência e inteligência artificial');
    expect(content.authors).toBe('Autora Exemplo');
    expect(content.text).toContain('A discussão sobre a possibilidade de consciência');
    expect(content.text).toContain('Teoria A');
    expect(content.text).not.toContain('English');
    expect(content.text).not.toContain('Deutsch');
    expect(content.text).not.toContain('História');
    expect(content.text).not.toContain('Tema lateral');
    expect(content.text).not.toContain('Política de privacidade');
  });
});
