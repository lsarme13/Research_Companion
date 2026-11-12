# Manual do Usuário — Research Companion

**Versão:** 0.1.0 — V1 *Research Core*  
**Aplicação:** web local, executada no computador do usuário e acessada pelo navegador.  
**Interface:** português do Brasil, uso desktop-first.

Este manual descreve a instalação, a configuração e o uso da primeira versão funcional do Research Companion. Ele foi escrito para ser útil tanto a quem deseja apenas utilizar o aplicativo quanto a quem precisa mantê-lo ou executá-lo tecnicamente.

---

## Sumário

1. [Visão geral](#1-visão-geral)
2. [Requisitos e dependências](#2-requisitos-e-dependências)
3. [Instalação](#3-instalação)
4. [Configuração inicial](#4-configuração-inicial)
5. [Conceitos do aplicativo](#5-conceitos-do-aplicativo)
6. [Dashboard e gestão de pesquisas](#6-dashboard-e-gestão-de-pesquisas)
7. [Documentos](#7-documentos)
8. [Fontes e aprovação](#8-fontes-e-aprovação)
9. [Leitor Inteligente](#9-leitor-inteligente)
10. [Notas](#10-notas)
11. [Biblioteca de documentos](#11-biblioteca-de-documentos)
12. [Configurações](#12-configurações)
13. [Exportação](#13-exportação)
14. [Fluxo recomendado para uma pesquisa](#14-fluxo-recomendado-para-uma-pesquisa)
15. [Privacidade, segurança e integridade dos dados](#15-privacidade-segurança-e-integridade-dos-dados)
16. [Limites técnicos](#16-limites-técnicos)
17. [Solução de problemas](#17-solução-de-problemas)
18. [Verificação, manutenção e estrutura do projeto](#18-verificação-manutenção-e-estrutura-do-projeto)
19. [Glossário](#19-glossário)

---

## 1. Visão geral

O Research Companion é um ambiente pessoal de investigação intelectual assistida por inteligência artificial. Cada pesquisa funciona como um espaço isolado, com suas próprias fontes, documentos, anotações e histórico.

A IA atua como apoio à leitura e à investigação. Ela não substitui a avaliação do pesquisador, não decide quais fontes são confiáveis e não deve ser tratada como fonte documental.

### 1.1. O que esta versão faz

- Criação, edição, arquivamento, restauração e exclusão de pesquisas.
- Importação de arquivos locais: PDF com texto selecionável, TXT, Markdown (`.md`) e DOCX.
- Importação de páginas da internet por URL.
- Busca explícita de novas fontes na internet, com resultados pendentes de aprovação.
- Aprovação, rejeição, edição e remoção de fontes.
- Leitura dos documentos aprovados.
- Análise de trechos selecionados: explicar, simplificar, identificar argumentos, pressupostos e perguntas.
- Perguntas fundamentadas nas fontes aprovadas, com referências rastreáveis.
- Avaliação orientativa de fontes com IA.
- Criação de notas independentes ou vinculadas a um trecho/fonte.
- Biblioteca com todos os documentos aprovados das pesquisas.
- Exportação em JSON completo e em Markdown legível.
- Três temas visuais: Editorial/Acadêmico, Dark/Tecnológico e Neutro/Funcional.
- Funcionamento em modo demonstração, sem provedor de IA real.

### 1.2. O que esta versão não faz

- Não faz OCR de PDFs digitalizados ou imagens.
- Não exporta em PDF.
- Não possui contas de usuário, autenticação ou controle de acesso.
- Não sincroniza dados entre computadores.
- Não envia telemetria.
- Não cria mapas conceituais, flashcards, repetição espaçada ou experiências *Teach the AI*; esses recursos pertencem a etapas futuras do projeto.
- Não realiza investigação automática em segundo plano: a busca na internet só ocorre quando solicitada.
- Não persiste respostas da IA no armazenamento da pesquisa.

---

## 2. Requisitos e dependências

### 2.1. Requisitos obrigatórios

| Item | Requisito |
| --- | --- |
| Sistema operacional | Windows, macOS ou Linux |
| Node.js | `^20.19.0` ou `>=22.12.0` |
| npm | Incluído na instalação do Node.js |
| Navegador | Versão atual de Chrome, Edge, Firefox ou Safari |
| Espaço em disco | Suficiente para `node_modules`, `dist` e os documentos que serão importados |
| Rede | Necessária para instalar dependências, importar URLs e buscar fontes |

O projeto usa Vite 8, que exige as versões de Node.js indicadas acima. Verifique com:

```powershell
node -v
npm -v
```

### 2.2. Dependências opcionais

| Recurso | Dependência | Observação |
| --- | --- | --- |
| IA local | [Ollama](https://ollama.com/) | Recomendado para manter o conteúdo no computador |
| Outro provedor de IA | Endpoint compatível com OpenAI | LM Studio, llama.cpp, vLLM ou serviço compatível |
| Busca alternativa | Instância SearXNG própria | Precisa permitir respostas em JSON |

O modo demonstração funciona sem qualquer provedor de IA. A busca padrão usa DuckDuckGo e não exige chave de API.

### 2.3. O que não é necessário

- Banco de dados externo.
- Docker.
- Conta em serviço de nuvem.
- Chave de API comercial paga.
- Servidor web separado.

### 2.4. Dependências principais do projeto

- **Backend:** Express 5, Cheerio, unpdf, mammoth, multer, zod.
- **Frontend:** React 19, React Router, react-markdown, Vite.
- **Desenvolvimento e testes:** TypeScript, Vitest, Supertest, tsx, concurrently.

Todas são instaladas localmente por `npm install` ou `npm ci`. Não é necessário instalá-las globalmente.

---

## 3. Instalação

### 3.1. Obter o projeto

Coloque a pasta do projeto em um local de sua preferência. Todos os comandos deste manual devem ser executados na raiz do projeto, isto é, na pasta que contém o arquivo `package.json`.

No Windows PowerShell:

```powershell
cd C:\Users\Usuario\Desktop\Projetos\Research_Companion
```

### 3.2. Instalar as dependências

Com o Node.js correto instalado:

```powershell
npm ci
```

`npm ci` instala exatamente as versões registradas no `package-lock.json`. Se preferir o comportamento tradicional do npm:

```powershell
npm install
```

A instalação cria a pasta `node_modules` e não altera os documentos do usuário.

### 3.3. Verificar a instalação

Execute as verificações automatizadas:

```powershell
npm run typecheck
npm test
```

O primeiro comando verifica os tipos do cliente, do servidor e dos testes. O segundo executa a suíte automatizada em diretórios temporários, sem usar os dados reais da aplicação.

### 3.4. Executar em modo de desenvolvimento

```powershell
npm run dev
```

Esse comando inicia dois processos:

- Servidor da API em `http://127.0.0.1:4317`.
- Interface Vite em `http://127.0.0.1:5173`.

Abra no navegador:

```text
http://127.0.0.1:5173
```

O Vite encaminha as requisições `/api` para o servidor local na porta 4317. Para encerrar, pressione `Ctrl+C` no terminal.

### 3.5. Compilar e executar em modo de produção

```powershell
npm run build
npm start
```

O build gera:

- `dist/client`: interface compilada.
- `dist/server`: servidor compilado.

Depois de `npm start`, abra:

```text
http://127.0.0.1:4317
```

O servidor de produção também entrega a interface compilada. Se a interface não tiver sido compilada, a API responderá com uma mensagem solicitando `npm run build`.

Para verificar se o servidor está ativo:

```powershell
Invoke-RestMethod http://127.0.0.1:4317/api/health
```

Resposta esperada:

```json
{ "ok": true, "name": "Research Companion", "version": "0.1.0" }
```

### 3.6. Variáveis de ambiente

| Variável | Padrão | Função |
| --- | --- | --- |
| `PORT` | `4317` | Porta do servidor local |
| `HOST` | `127.0.0.1` | Endereço de escuta do servidor |
| `RC_DATA_DIR` | `<raiz>/data` | Pasta onde os dados são gravados |
| `RC_ROOT` | diretório atual | Raiz usada para localizar `dist/client` e o `data` padrão |

Exemplo no Windows PowerShell, usando outra porta e outra pasta de dados:

```powershell
$env:PORT = "4318"
$env:RC_DATA_DIR = "D:\ResearchCompanionData"
npm start
```

Exemplo em macOS/Linux:

```bash
PORT=4318 RC_DATA_DIR="$HOME/ResearchCompanionData" npm start
```

Observações importantes:

- O servidor deve ser iniciado a partir da raiz do projeto, salvo se `RC_ROOT` for definido corretamente.
- A porta 4317 é usada pelo servidor; a 5173 é usada apenas pelo Vite em desenvolvimento.
- Se `HOST` for alterado para `0.0.0.0`, o aplicativo ficará acessível na rede local. Como não há autenticação, isso não é recomendado sem controle de firewall e confiança no ambiente.

---

## 4. Configuração inicial

### 4.1. Primeiro acesso

Abra a interface no navegador. A tela inicial é a **Dashboard**, com a lista de pesquisas e o feed de atividades recentes.

Na primeira execução:

- A pasta `data` é criada automaticamente.
- O tema padrão é **Editorial/Acadêmico**.
- O provedor de IA padrão é **Modo demonstração**.
- O provedor de busca padrão é **DuckDuckGo**.

### 4.2. Tema visual

Acesse **Configurações** no menu lateral e escolha um dos temas:

- **Editorial/Acadêmico:** padrão, com fundos claros e aparência de leitura.
- **Dark/Tecnológico:** tons escuros para uso prolongado.
- **Neutro/Funcional:** paleta sóbria e discreta.

A alteração é aplicada imediatamente e fica registrada nas configurações locais.

### 4.3. Inteligência artificial

Em **Configurações → Inteligência artificial**, escolha um provedor.

#### Modo demonstração

Não faz chamadas externas. As respostas são simuladas e identificadas como demonstração. A busca de fontes continua funcionando. É útil para conhecer a interface e testar o fluxo sem configurar um modelo.

#### Ollama local

1. Instale o Ollama.
2. Baixe um modelo:

   ```powershell
   ollama pull llama3.2
   ```

3. Confirme que o modelo aparece:

   ```powershell
   ollama list
   ```

4. Verifique se o serviço está em execução em `http://127.0.0.1:11434`. Em instalações desktop, o Ollama normalmente inicia sozinho; se necessário, execute:

   ```powershell
   ollama serve
   ```

5. No Research Companion, selecione **Ollama local**, informe o endereço e o nome exato do modelo.
6. Clique em **Salvar e testar conexão**.

O modelo padrão sugerido é `llama3.2`, mas qualquer modelo instalado pode ser usado. Modelos maiores tendem a produzir respostas melhores e exigir mais memória e tempo.

#### Endpoint compatível com OpenAI

Use esta opção para LM Studio, llama.cpp, vLLM ou outro serviço com API compatível.

- **Base URL:** normalmente termina em `/v1`, por exemplo `http://127.0.0.1:1234/v1`.
- **Modelo:** identificador exibido pelo servidor do modelo.
- **Chave de API:** opcional para servidores locais; obrigatória quando o serviço exigir autenticação.

A aplicação acrescenta `/chat/completions` ao endereço configurado, caso ele já não termine com esse caminho.

Atenção: se o endpoint estiver em outro computador ou em um serviço remoto, os trechos de fontes aprovadas serão enviados a esse serviço para gerar a resposta. Para material sensível, prefira um modelo local.

#### Teste de conexão

O botão **Salvar e testar conexão** salva as configurações e faz uma chamada mínima ao provedor. O resultado indica provedor, modelo e latência, ou apresenta o erro retornado.

### 4.4. Busca de fontes

Em **Configurações → Busca de fontes**:

- **DuckDuckGo:** padrão, gratuito e sem chave. Pode sofrer limitação temporária de requisições.
- **SearXNG:** informe a URL de uma instância própria. A instância precisa permitir respostas no formato JSON.

A busca só é executada quando o usuário solicita na página **Fontes**. Nenhum resultado é aprovado automaticamente.

### 4.5. Dados locais e backup

A própria tela de Configurações mostra o caminho da pasta de dados. O padrão é `data/` na raiz do projeto.

Para fazer backup:

1. Encerre o servidor com `Ctrl+C`.
2. Copie a pasta `data` inteira para outro local.
3. Guarde a cópia com o mesmo cuidado que você dedica aos documentos originais.

Para restaurar:

1. Encerre o servidor.
2. Substitua a pasta `data` atual pela cópia de backup.
3. Inicie o servidor novamente.

Não há histórico de versões automático. A exclusão de uma pesquisa remove seus arquivos e não pode ser desfeita pelo sistema.

---

## 5. Conceitos do aplicativo

| Conceito | Significado |
| --- | --- |
| **Pesquisa** | Espaço isolado de investigação, com fontes, notas, histórico e contexto próprios. |
| **Documento** | Fonte aprovada que possui texto extraído e pode ser lida no Leitor Inteligente. |
| **Fonte** | Registro de um arquivo ou página da internet. Pode estar pendente, aprovada ou rejeitada. |
| **Fonte pendente** | Resultado de busca que ainda não foi avaliado pelo usuário. Não participa das análises. |
| **Fonte aprovada** | Fonte autorizada pelo usuário. Pode alimentar leitura e respostas fundamentadas. |
| **Fonte rejeitada** | Fonte descartada. Permanece registrada, mas não participa das análises. |
| **Contexto da pesquisa** | Título, descrição, perguntas e instruções iniciais. Orienta a IA, mas não é evidência documental. |
| **Trecho** | Parte selecionada de um documento no leitor, usada para análise ou nota. |
| **Referência `[F1]`** | Marcador que liga uma afirmação da IA a uma fonte aprovada. |
| **Nota** | Registro do pesquisador, independente ou vinculado a uma fonte/trecho. |
| **Biblioteca** | Visão agregada dos documentos aprovados em todas as pesquisas. |

### 5.1. Regra central de fontes

Apenas fontes **aprovadas** e com texto disponível participam das análises da IA.

- Fontes pendentes não entram no contexto.
- Fontes rejeitadas não entram no contexto.
- Fontes aprovadas sem texto extraído não entram no contexto.
- A IA deve indicar quando as fontes não sustentam uma conclusão.
- A decisão de aprovar, rejeitar ou remover uma fonte é sempre do usuário.

### 5.2. Isolamento entre pesquisas

Fontes, notas, histórico e contexto de uma pesquisa não são misturados com os de outra. A Biblioteca reúne documentos de várias pesquisas apenas para consulta e navegação; cada documento continua vinculado à pesquisa de origem.

---

## 6. Dashboard e gestão de pesquisas

### 6.1. Criar uma pesquisa

1. Na Dashboard, clique em **Nova pesquisa**.
2. Preencha:
   - **Nome da pesquisa** (obrigatório).
   - **Descrição** (opcional): o que se pretende investigar.
   - **Instruções ou contexto inicial para a IA** (opcional): recortes, orientações ou delimitações.
3. Clique em **Criar pesquisa**.

O contexto inicial orienta as respostas, mas não é tratado como evidência documental. Ele não substitui fontes aprovadas.

### 6.2. Abrir e continuar uma pesquisa

Clique em um cartão de pesquisa. O aplicativo abre a última seção utilizada e, no leitor, o último documento acessado. Isso preserva a continuidade do trabalho.

Os cartões mostram:

- Título e descrição.
- Tempo desde a última atividade.
- Quantidade de documentos aprovados.
- Quantidade de notas.
- Quantidade de fontes pendentes, quando houver.

### 6.3. Ordenar e localizar

Na Dashboard, use **Ordenar por**:

- Atividade recente.
- Título.
- Criação: mais novas.
- Criação: mais antigas.

Pesquisas arquivadas ficam em uma seção recolhível abaixo da lista principal.

### 6.4. Editar uma pesquisa

Dentro da pesquisa, clique em **Editar** no cabeçalho. É possível alterar:

- Título.
- Descrição.
- Perguntas de investigação, uma por linha.
- Contexto e instruções iniciais.

As perguntas orientam a investigação e são incluídas no contexto enviado à IA.

### 6.5. Histórico de atividades

No menu **Mais → Histórico de atividades**, consulte os eventos da pesquisa: criação, importações, aprovações, rejeições, notas, perguntas e análises. A Dashboard também mostra um feed global de atividades recentes.

### 6.6. Arquivar e restaurar

**Mais → Arquivar pesquisa** remove a pesquisa da lista principal, sem apagar documentos, fontes ou notas.

Para recuperar:

1. Na Dashboard, expanda **Pesquisas arquivadas**.
2. Abra a pesquisa.
3. Clique em **Restaurar** no aviso superior ou use **Mais → Restaurar pesquisa**.

### 6.7. Excluir permanentemente

**Mais → Excluir permanentemente** remove a pesquisa e todos os seus dados: fontes, textos extraídos, documentos copiados, notas e histórico.

A ação exige confirmação e não pode ser desfeita pelo aplicativo. Faça backup antes.

### 6.8. Exportar

**Mais → Exportar pesquisa** oferece:

- **Backup completo em JSON.**
- **Relatório em Markdown.**

Detalhes no capítulo 13.

---

## 7. Documentos

A página **Documentos** lista apenas fontes aprovadas. É o ponto de partida para leitura e uso das fontes no Leitor Inteligente.

### 7.1. Adicionar arquivos

1. Abra a pesquisa e clique em **Documentos**.
2. Clique em **Adicionar arquivo**.
3. Selecione um ou vários arquivos.

Formatos aceitos:

- PDF com texto selecionável.
- TXT.
- Markdown (`.md`).
- DOCX.

Regras:

- Limite de 30 MB por arquivo.
- O arquivo é copiado para a pasta de dados da pesquisa; o original do usuário não é alterado.
- O texto é extraído e armazenado separadamente.
- Arquivos com o mesmo conteúdo são recusados como duplicados, mesmo que tenham outro nome.
- Arquivos sem texto extraível são recusados. OCR não é suportado.

### 7.2. Adicionar uma URL

1. Clique em **Adicionar URL**.
2. Informe a URL completa, começando com `http://` ou `https://`.
3. Opcionalmente, informe categoria e etiquetas.
4. Clique em **Adicionar fonte**.

A fonte é importada como **aprovada**, desde que a página possa ser acessada e tenha conteúdo suportado.

Restrições de segurança e funcionamento:

- Apenas endereços públicos da internet são aceitos.
- `localhost`, endereços privados, loopback e domínios `.local` ou `.internal` são bloqueados.
- Redirecionamentos são verificados novamente.
- Limite de 8 MB para a resposta da página.
- Tempo limite de 25 segundos.
- Páginas que exigem autenticação, JavaScript obrigatório, paywall ou proteção antibot podem não ser importadas.
- URLs duplicadas são recusadas; a mensagem indica a fonte já existente.

### 7.3. Ler, pré-visualizar e baixar

Cada documento aprovado oferece:

- **Prévia:** exibe o texto extraído em uma janela.
- **Ler:** abre o documento no Leitor Inteligente.
- **Abrir original:** para fontes de URL, abre o endereço no navegador.
- **Baixar arquivo original:** para arquivos locais, baixa a cópia armazenada.

### 7.4. Buscar e organizar

O campo de busca filtra por título, autoria, domínio, categoria e etiquetas. A contagem mostra quantos documentos correspondem ao termo.

Categoria e etiquetas são editadas na página **Fontes**, em **Editar**.

### 7.5. Remover um documento

A remoção é feita na página **Fontes**, pela ação **Remover**. A fonte, o texto extraído e a cópia do arquivo são apagados. Notas já criadas preservam o trecho citado, mas não poderão abrir o documento original.

Para substituir um documento, remova a fonte antiga e importe o novo arquivo.

---

## 8. Fontes e aprovação

A página **Fontes** reúne todas as fontes da pesquisa, em qualquer estado.

### 8.1. Buscar novas fontes na internet

1. Abra **Fontes**.
2. Digite um tema ou pergunta com pelo menos 2 caracteres.
3. Clique em **Pesquisar**.

A busca só é executada sob solicitação explícita. Os resultados são adicionados como **pendentes de aprovação** e aparecem com um aviso de quantos aguardam decisão.

A busca retorna até 12 resultados. Resultados cuja URL já pertence à pesquisa são indicados como duplicados e não são adicionados novamente.

Encontrar uma fonte não valida sua credibilidade. Antes de aprovar, verifique autoria, data, referências, metodologia e relevância.

### 8.2. Pré-visualizar

Use **Pré-visualizar** para examinar o conteúdo extraído antes de decidir. Para fontes pendentes de URL, a prévia acessa a página naquele momento; para fontes aprovadas, usa o texto já armazenado.

A prévia exibe até 60.000 caracteres de fontes aprovadas. Para URLs pendentes, o servidor limita o texto retornado a 30.000 caracteres.

### 8.3. Aprovar uma fonte

Clique em **Aprovar** em uma fonte pendente.

Ao aprovar uma fonte de URL, o aplicativo tenta obter o texto e armazená-lo. Se a página estiver indisponível, a fonte permanece pendente e o erro é exibido; você pode tentar novamente mais tarde ou removê-la.

Uma fonte aprovada passa a aparecer em **Documentos** e pode ser usada no leitor e nas análises.

### 8.4. Rejeitar uma fonte

Clique em **Rejeitar** em uma fonte pendente e confirme.

A fonte continua registrada no histórico como rejeitada, mas não participa de leituras, análises ou respostas. Uma fonte rejeitada não pode ser aprovada posteriormente; se mudar de ideia, remova-a e adicione novamente.

Uma fonte já aprovada não pode ser rejeitada. Para retirá-la da pesquisa, use **Remover**.

### 8.5. Editar categoria e etiquetas

Em fontes aprovadas ou rejeitadas, use **Editar** para alterar:

- Título.
- Categoria.
- Etiquetas, separadas por vírgula.

Esses metadados ajudam a filtrar documentos e fontes, mas não alteram o texto extraído.

### 8.6. Avaliar com IA

Em uma fonte aprovada, clique em **Avaliar com IA**.

A avaliação é orientativa e examina autoria, data, referências, consistência e relevância. Ela não atribui nota, selo ou classificação automática de confiabilidade. A decisão final continua sendo do usuário.

No modo demonstração, a avaliação é substituída por um checklist simulado e identificado.

### 8.7. Remover uma fonte

A ação **Remover** apaga a fonte, o texto extraído e a cópia do arquivo original. A operação exige confirmação.

Notas vinculadas preservam o trecho citado e o título da fonte, mas o link para o documento deixa de funcionar.

### 8.8. Filtros e busca local

A página **Fontes** oferece:

- **Todas**, **Pendentes**, **Aprovadas** e **Rejeitadas**, com contadores.
- Campo para filtrar a lista por título, domínio, autoria, publicação, categoria ou etiquetas.

O contador de pendentes também aparece no menu lateral e no cabeçalho da pesquisa.

---

## 9. Leitor Inteligente

O **Leitor Inteligente** possui três áreas:

- **Esquerda:** documentos aprovados disponíveis.
- **Centro:** texto do documento.
- **Direita:** assistência de IA, com as abas **Perguntar** e **Analisar**.

### 9.1. Abrir um documento

Clique em um documento na lista da esquerda. Também é possível abrir diretamente pelo link **Ler** na página de Documentos ou por um item da Biblioteca.

O leitor carrega os parágrafos em blocos de 120. Se o documento for maior, use **Mostrar mais** para continuar.

A posição de rolagem é lembrada por pesquisa e documento no navegador. O último documento acessado também é registrado na pesquisa.

### 9.2. Selecionar um trecho

Selecione texto com o mouse ou pelo teclado. Uma barra de ações aparece próxima à seleção:

- **Explicar**
- **Simplificar**
- **Argumentos**
- **Pressupostos**
- **Perguntas**
- **Anotar**

As ações de análise usam o trecho selecionado. **Anotar** abre o formulário de nova nota com o trecho citado.

### 9.3. Analisar o documento

Na aba **Analisar**, escolha uma ação:

- **Explicar:** explica a ideia central, termos e relações. Permite escolher o nível **Simples**, **Intermediário** ou **Avançado**.
- **Simplificar:** reescreve o trecho em linguagem mais simples, preservando o significado.
- **Argumentos:** identifica tese, argumentos e evidências.
- **Pressupostos:** aponta pressupostos implícitos, limitações e objeções possíveis.
- **Perguntas:** sugere conceitos e perguntas para aprofundar a leitura.

Se houver um trecho selecionado, ele é analisado. Sem seleção, a análise usa o início do documento.

A análise deve se basear exclusivamente no documento e no trecho fornecidos. Se o material não permitir responder, a IA deve indicar o que falta.

### 9.4. Perguntar à IA

Na aba **Perguntar**:

1. Escolha o escopo:
   - **Somente o documento atual.**
   - **Todas as fontes aprovadas da pesquisa.**
2. Escreva a pergunta.
3. Clique em **Perguntar à IA**.

A resposta é fundamentada nas fontes aprovadas com texto. O contexto é montado por relevância e limitado a 26.000 caracteres. Fontes pendentes, rejeitadas ou sem texto não participam.

### 9.5. Referências e rastreabilidade

A IA deve citar as fontes no formato `[F1]`, `[F2]` etc. Abaixo da resposta, o aplicativo mostra:

- **Fontes citadas**, quando a resposta contém marcadores.
- **Fontes consultadas**, quando a resposta não cita marcadores específicos.

Cada referência abre o documento correspondente no leitor.

Se a resposta não citar fontes, a interface alerta que as conclusões devem ser conferidas antes de serem usadas.

### 9.6. Limitações das respostas

- A IA pode interpretar ou inferir; a interface e o prompt pedem que informação documentada seja distinguida de interpretação.
- A ausência de evidência deve ser explicitada pela IA, mas o pesquisador deve verificar.
- A IA não acessa a internet durante a resposta; ela usa apenas o contexto aprovado.
- Respostas não são armazenadas automaticamente. O histórico registra a pergunta ou a análise, não o texto da resposta.
- No modo demonstração, as respostas são simuladas e identificadas; não substituem uma análise real.

---

## 10. Notas

A página **Notas** reúne as anotações da pesquisa.

### 10.1. Criar uma nota independente

1. Abra **Notas**.
2. Clique em **Nova nota**.
3. Informe título e/ou conteúdo.
4. Clique em **Criar nota**.

Se o título ficar vazio, ele é derivado da primeira linha do conteúdo. Se ambos estiverem vazios, a nota não é criada.

### 10.2. Criar uma nota a partir de um trecho

1. No **Leitor Inteligente**, selecione um trecho.
2. Clique em **Anotar**.
3. Escreva sua interpretação, dúvida ou relação com outros materiais.
4. Opcionalmente, informe um título.
5. Clique em **Salvar nota**.

A nota guarda o trecho citado, o vínculo com a fonte e o título do documento. O conteúdo escrito é obrigatório nesse fluxo.

### 10.3. Editar e excluir

Cada cartão de nota oferece:

- **Editar:** altera título e conteúdo.
- **Excluir:** remove a nota após confirmação.

A exclusão é permanente. O trecho citado e o vínculo com a fonte não são recriados automaticamente.

### 10.4. Buscar e abrir a fonte

O campo de busca filtra por título, conteúdo, trecho citado e título da fonte. O contador mostra quantas notas estão vinculadas a fontes.

Em notas vinculadas, clique no cartão da fonte para abrir o documento no leitor. Se a fonte tiver sido removida, o vínculo não abrirá o original, mas o trecho citado permanece na nota.

---

## 11. Biblioteca de documentos

A **Biblioteca de documentos** mostra todos os documentos aprovados de todas as pesquisas em um único lugar.

Recursos:

- Busca por título, autoria, pesquisa, domínio, categoria e etiquetas.
- Filtro por pesquisa.
- Contagem de documentos.
- Abertura direta no leitor, no contexto da pesquisa de origem.

A Biblioteca é apenas uma visão agregada. Ela não mistura contextos: ao abrir um documento, você volta à pesquisa à qual ele pertence.

---

## 12. Configurações

A página **Configurações** contém:

### 12.1. Tema visual

Três opções, aplicadas imediatamente e persistidas:

- Editorial/Acadêmico.
- Dark/Tecnológico.
- Neutro/Funcional.

### 12.2. Inteligência artificial

- Provedor: demonstração, Ollama local ou endpoint compatível com OpenAI.
- Endereço e modelo do provedor.
- Chave de API opcional para endpoints compatíveis.
- Botão **Salvar e testar conexão**.

A chave é armazenada apenas no arquivo local de configurações e não é incluída nas exportações.

### 12.3. Busca de fontes

- DuckDuckGo ou SearXNG.
- URL da instância SearXNG, quando aplicável.

### 12.4. Dados locais

Mostra o caminho da pasta de dados e recomenda backups periódicos.

### 12.5. Salvar

Alterações de IA e busca são aplicadas ao clicar em **Salvar configurações** ou em **Salvar e testar conexão**. A troca de tema é aplicada imediatamente.

---

## 13. Exportação

Abra a pesquisa e use **Mais → Exportar pesquisa**.

### 13.1. Backup completo em JSON

Inclui:

- Metadados da pesquisa.
- Perguntas e contexto inicial.
- Fontes, com metadados e status.
- Texto extraído das fontes aprovadas.
- Notas.
- Histórico de atividades.

Não inclui:

- Respostas da IA.
- Chave de API.
- Configurações globais do aplicativo.

É o formato recomendado para backup e migração.

### 13.2. Relatório em Markdown

Gera um documento legível com:

- Título, descrição e status.
- Datas de criação e última atividade.
- Perguntas de investigação.
- Contexto e instruções iniciais.
- Tabela de fontes aprovadas.
- Lista de fontes pendentes e rejeitadas, quando houver.
- Notas, incluindo trechos citados e vínculos.

O arquivo é baixado pelo navegador. Não há exportação em PDF nesta versão.

### 13.3. Cuidados com arquivos exportados

Os arquivos podem conter textos integrais, notas e metadados privados. Guarde-os em local seguro e não os compartilhe sem revisar o conteúdo.

---

## 14. Fluxo recomendado para uma pesquisa

Este é um roteiro prático para conduzir uma investigação do início ao fim.

### 14.1. Delimitar a investigação

1. Crie uma pesquisa com um título específico.
2. Escreva uma descrição objetiva do que deseja investigar.
3. Registre perguntas de investigação, uma por linha.
4. Se necessário, acrescente contexto e instruções iniciais.
5. Lembre-se: o contexto inicial orienta a IA, mas não é evidência.

Exemplo de perguntas:

```text
O que caracteriza a consciência em sistemas artificiais?
Quais critérios são usados para atribuir consciência a uma máquina?
Quais são as principais objeções à possibilidade de consciência artificial?
```

### 14.2. Reunir materiais iniciais

1. Abra **Documentos**.
2. Importe arquivos que você já possui.
3. Adicione URLs de referências conhecidas.
4. Confira se o texto foi extraído corretamente pela prévia.

Importações diretas entram como aprovadas. Ainda assim, avalie a qualidade e a pertinência de cada material.

### 14.3. Buscar fontes complementares

1. Abra **Fontes**.
2. Pesquise termos específicos, não apenas o tema geral.
3. Examine os resultados pendentes.
4. Use **Pré-visualizar** para ler o conteúdo extraído.
5. Verifique autoria, data, referências e relevância.
6. Aprove apenas o que sustenta a investigação.
7. Rejeite o que não for pertinente.

Boas práticas:

- Prefira fontes primárias quando possível.
- Compare perspectivas divergentes.
- Não trate um único resultado de busca como conclusão.
- Registre no seu próprio vocabulário por que uma fonte foi aceita ou descartada.

### 14.4. Ler e analisar

1. Abra o **Leitor Inteligente**.
2. Selecione um documento.
3. Leia o texto.
4. Selecione trechos importantes.
5. Use **Explicar**, **Simplificar**, **Argumentos**, **Pressupostos** ou **Perguntas**.
6. Confira as referências apresentadas.
7. Anote interpretações e dúvidas.

### 14.5. Perguntar com escopo controlado

No leitor, use **Perguntar**:

- Para uma dúvida localizada, escolha **Somente o documento atual**.
- Para comparar o que várias fontes aprovadas dizem, escolha **Todas as fontes aprovadas da pesquisa**.

Formule perguntas específicas. Em vez de “fale sobre consciência”, pergunte:

```text
Quais critérios o texto apresenta para distinguir simulação funcional de experiência subjetiva?
```

### 14.6. Registrar a síntese

Crie notas para:

- Interpretações próprias.
- Divergências entre autores.
- Conceitos que precisam ser aprofundados.
- Próximos passos da investigação.
- Trechos que sustentam uma conclusão.

As notas são o espaço do pesquisador. A IA pode ajudar a examinar o material, mas a síntese deve ser sua.

### 14.7. Revisar e exportar

1. Revise as fontes aprovadas e remova o que não for mais necessário.
2. Verifique se as notas refletem seu entendimento atual.
3. Exporte um JSON para backup.
4. Exporte um Markdown para leitura ou compartilhamento controlado.
5. Se a pesquisa terminou, arquive-a. Se não terminar, deixe-a ativa para retomar depois.

### 14.8. Exemplo de ciclo completo

1. Criar a pesquisa “Consciência e inteligência artificial”.
2. Adicionar um artigo em PDF e uma página da web.
3. Buscar “consciência artificial critérios filosofia da mente”.
4. Pré-visualizar e aprovar dois resultados relevantes; rejeitar os demais.
5. Ler o PDF, selecionar um trecho e pedir **Argumentos**.
6. Perguntar a todas as fontes aprovadas quais critérios aparecem para atribuir consciência.
7. Criar uma nota com a comparação entre as posições.
8. Exportar o backup JSON e o relatório Markdown.
9. Arquivar a pesquisa ou mantê-la ativa para continuar.

---

## 15. Privacidade, segurança e integridade dos dados

### 15.1. Armazenamento local

Documentos, textos extraídos, metadados, notas, atividades e configurações ficam na pasta `data` do computador. Não há armazenamento remoto obrigatório nem sincronização.

A pasta `data` está no `.gitignore` e não deve ser versionada.

### 15.2. Chave de API

A chave de API é gravada em texto simples no arquivo local `data/settings.json`. Ela não é exibida novamente na interface depois de salva e não é incluída nas exportações.

Proteja a pasta de dados e não compartilhe o arquivo de configurações.

### 15.3. Envio de conteúdo a provedores

- **Ollama local:** o conteúdo permanece no computador, salvo se o endereço configurado apontar para outra máquina.
- **Endpoint compatível com OpenAI:** os trechos de fontes aprovadas e o contexto da pergunta são enviados ao endereço configurado.
- **Busca:** as consultas são enviadas ao DuckDuckGo ou à instância SearXNG configurada.
- **Importação de URL:** o servidor acessa a página diretamente.

Para material sensível, use um modelo local e verifique para onde o endpoint aponta.

### 15.4. Acesso ao aplicativo

Por padrão, o servidor escuta apenas em `127.0.0.1`, ou seja, no próprio computador. Não há login, senha ou controle de usuários.

Não altere `HOST` para `0.0.0.0` em redes não confiáveis. Se precisar acessar de outro dispositivo, faça isso apenas em ambiente controlado e com firewall adequado.

### 15.5. Exclusões e perda de dados

- Remover uma fonte apaga seu texto e a cópia do arquivo.
- Excluir uma pesquisa apaga todos os seus dados.
- Excluir uma nota é permanente.
- Não há lixeira ou desfazer.

Faça backups periódicos da pasta `data`.

### 15.6. Integridade

As gravações usam arquivos JSON com escrita atômica, reduzindo o risco de arquivos parcialmente gravados. Ainda assim, interrupções do sistema, disco cheio ou remoção manual de arquivos podem causar perda de dados.

### 15.7. Sem telemetria

O aplicativo não inclui telemetria, rastreamento de uso ou compartilhamento automático de dados. As únicas comunicações externas são as que você configura ou solicita: importação de URL, busca e provedor de IA.

---

## 16. Limites técnicos

| Limite | Valor |
| --- | --- |
| Tamanho máximo de upload | 30 MB por arquivo |
| Tamanho máximo de resposta ao importar URL | 8 MB |
| Tempo limite de acesso a URL | 25 segundos |
| Redirecionamentos de URL | Até 5 |
| Texto máximo por fonte | 4.000.000 de caracteres |
| Contexto máximo enviado à IA | 26.000 caracteres |
| Pergunta à IA | 3 a 2.000 caracteres |
| Tempo limite da IA | 180 segundos |
| Prévia de fonte | 60.000 caracteres (30.000 para URLs pendentes) |
| Resultados por busca | Até 12 |
| Tamanho máximo de nota | 200.000 caracteres |
| Histórico por pesquisa | Até 400 atividades |
| Formatos de arquivo | PDF com texto, TXT, MD, DOCX |
| Formatos de exportação | JSON e Markdown |

Observações:

- O limite de texto por fonte é aplicado após a extração.
- PDFs digitalizados sem camada de texto não são suportados.
- DOCX é lido como texto; formatação, imagens e tabelas complexas podem ser simplificadas.
- Markdown importado é tratado como texto no leitor, não como página renderizada.
- A IA não acessa a internet durante a resposta.

---

## 17. Solução de problemas

### 17.1. “Não foi possível conectar ao servidor local”

**Causas prováveis:** servidor não está em execução, porta diferente ou processo encerrado.

**Soluções:**

1. Verifique se `npm run dev` ou `npm start` está ativo no terminal.
2. Confirme a porta em uso.
3. Teste `http://127.0.0.1:4317/api/health`.
4. Se a porta estiver ocupada, inicie com outra:

   ```powershell
   $env:PORT = "4318"
   npm start
   ```

### 17.2. “A porta 4317 já está em uso”

Outro processo está usando a porta. Encerre-o ou use `PORT` com outro valor.

No Windows, para identificar o processo:

```powershell
Get-NetTCPConnection -LocalPort 4317
```

### 17.3. A interface mostra “Interface não compilada”

Em modo de produção, execute:

```powershell
npm run build
npm start
```

Em desenvolvimento, use `npm run dev` e abra a porta 5173.

### 17.4. A IA responde como demonstração

O provedor está em **Modo demonstração**. Vá em **Configurações**, escolha Ollama ou endpoint compatível, salve e teste a conexão.

### 17.5. Erro de conexão com o Ollama

Verifique:

1. O Ollama está em execução?
2. O endereço está correto, por exemplo `http://127.0.0.1:11434`?
3. O modelo foi baixado com `ollama pull <modelo>`?
4. O nome do modelo nas configurações corresponde exatamente ao exibido por `ollama list`?

Se o modelo não for encontrado, o erro indica o comando de download.

### 17.6. A IA demora muito ou expira

Modelos grandes podem levar mais de 180 segundos na primeira resposta. Use um modelo menor, aguarde o carregamento inicial ou verifique a memória disponível.

### 17.7. Erro de autenticação no provedor compatível com OpenAI

Confira a chave de API e o endereço base. Para servidores locais que não exigem chave, o campo pode ficar vazio.

### 17.8. A busca não funciona

- O DuckDuckGo pode limitar temporariamente as requisições. Aguarde ou configure SearXNG.
- Verifique a conexão com a internet.
- No SearXNG, confirme que a instância responde e permite `format=json`.
- A consulta precisa ter pelo menos 2 caracteres.

### 17.9. A URL não é importada

Possíveis causas:

- URL inválida ou sem `http://`/`https://`.
- Endereço privado, localhost ou domínio interno.
- Página com status de erro, tempo esgotado ou conteúdo maior que 8 MB.
- Conteúdo não suportado.
- Página que exige login, JavaScript ou proteção antibot.
- URL já adicionada à pesquisa.

Tente abrir a URL no navegador, verificar se o conteúdo é público e, se necessário, salvar a página como PDF com texto e importar o arquivo.

### 17.10. O PDF não é aceito

O PDF pode ser digitalizado, estar protegido ou não ter camada de texto. OCR não é suportado. Use um PDF com texto selecionável ou converta o conteúdo para TXT/MD.

### 17.11. Arquivo recusado como duplicado

O conteúdo já existe na pesquisa, mesmo que com outro nome. Localize a fonte existente em **Fontes** ou remova-a antes de importar novamente.

### 17.12. Fonte aprovada não aparece no leitor

O leitor lista apenas fontes aprovadas **com texto disponível**. Verifique se a extração foi concluída e se a fonte possui texto. Se necessário, remova e importe novamente.

### 17.13. Nota vinculada não abre o documento

A fonte pode ter sido removida. O trecho citado permanece na nota, mas o documento original não está mais disponível.

### 17.14. Perdi dados ou a pasta `data`

Restaure o backup mais recente com o servidor parado. Sem backup, não há mecanismo automático de recuperação.

### 17.15. `npm` não executa no PowerShell

Se houver bloqueio de script do PowerShell, use:

```powershell
npm.cmd ci
npm.cmd run dev
```

Ou ajuste a política de execução conforme as regras da sua organização.

---

## 18. Verificação, manutenção e estrutura do projeto

### 18.1. Comandos úteis

| Comando | Função |
| --- | --- |
| `npm run dev` | Inicia servidor e cliente em modo de desenvolvimento |
| `npm run dev:server` | Inicia apenas o servidor com recarga automática |
| `npm run dev:client` | Inicia apenas o cliente Vite |
| `npm run build` | Compila cliente e servidor |
| `npm start` | Executa o servidor compilado |
| `npm test` | Executa a suíte de testes |
| `npm run test:watch` | Executa os testes em modo observação |
| `npm run typecheck` | Verifica tipos do cliente, servidor e testes |
| `npm run clean` | Remove a pasta `dist` |

### 18.2. Testes

A suíte cobre, entre outros pontos:

- Criação e isolamento de pesquisas.
- Importação, leitura e remoção de documentos.
- Regras de aprovação e rejeição de fontes.
- Proteção contra URLs privadas e inválidas.
- Extração de conteúdo HTML.
- Configurações, chave de API e exportação.
- Comportamento do modo demonstração da IA.

Execute antes de alterar o código:

```powershell
npm test
npm run typecheck
npm run build
```

Os testes usam diretórios temporários e não leem nem alteram `data/`.

### 18.3. Estrutura de pastas

```text
Research_Companion/
├── client/                  Interface React
│   ├── src/
│   │   ├── components/      Componentes reutilizáveis
│   │   ├── context/         Contextos de pesquisa e configurações
│   │   ├── pages/           Dashboard, documentos, fontes, leitor, notas etc.
│   │   ├── api.ts           Cliente da API
│   │   └── styles.css       Sistema visual e temas
│   └── vite.config.ts
├── server/                  API Express
│   ├── routes/              Rotas HTTP
│   ├── services/            Regras de negócio, extração, busca e IA
│   ├── storage/             Persistência JSON e repositório
│   ├── test/                Testes automatizados
│   └── index.ts             Entrada do servidor
├── shared/                  Tipos compartilhados
├── docs/                    Requisitos e Product Design
├── data/                    Dados locais (não versionar)
├── dist/                    Build de produção
├── package.json
└── manual_usuario.md
```

### 18.4. Layout dos dados

```text
data/
├── settings.json
└── research/
    └── <id-da-pesquisa>/
        ├── research.json
        ├── sources.json
        ├── notes.json
        ├── activity.json
        ├── documents/
        └── texts/
```

- `research.json`: metadados, contexto, perguntas e continuidade.
- `sources.json`: fontes e status.
- `notes.json`: notas.
- `activity.json`: histórico.
- `documents/`: cópias dos arquivos importados.
- `texts/`: textos extraídos usados pelo leitor e pela IA.

### 18.5. Atualização do aplicativo

Antes de atualizar o código:

1. Faça backup de `data`.
2. Encerre o servidor.
3. Atualize os arquivos do projeto.
4. Execute `npm ci`.
5. Execute `npm run typecheck`, `npm test` e `npm run build`.
6. Inicie o servidor e verifique se os dados continuam acessíveis.

Não remova `data` durante uma atualização.

### 18.6. Diagnóstico de erros

- O terminal do servidor exibe mensagens de erro inesperado.
- A interface mostra mensagens contextuais e um aviso quando perde a conexão com o servidor local.
- O endpoint `/api/health` confirma se o servidor está respondendo.
- O histórico da pesquisa registra ações concluídas, mas não substitui logs do terminal.

---

## 19. Glossário

**Aprovação**  
Ato de autorizar uma fonte a participar da pesquisa. Somente fontes aprovadas com texto alimentam a IA.

**Contexto**  
Informações que orientam a resposta da IA. O contexto declarado pelo pesquisador não é evidência documental.

**Corpus**  
Conjunto de fontes aprovadas de uma pesquisa.

**Fonte primária**  
Documento ou registro original, produzido por quem participou ou testemunhou o fenômeno.

**Fonte secundária**  
Texto que interpreta, resume ou analisa fontes primárias.

**Grounding**  
Uso de trechos de fontes aprovadas como base para a resposta, com referências rastreáveis.

**Pendente**  
Estado de uma fonte encontrada por busca que ainda aguarda decisão do usuário.

**RAG**  
*Retrieval-Augmented Generation*: abordagem em que trechos relevantes das fontes são recuperados e enviados ao modelo junto com a pergunta.

**Rejeição**  
Descarte de uma fonte pendente. A fonte permanece registrada, mas não participa das análises.

**Trecho**  
Parte selecionada de um documento, usada para análise ou para compor uma nota.

**V1 — Research Core**  
Primeira etapa do projeto: fundamentos do ambiente de pesquisa, organização de materiais e ferramentas essenciais de investigação.

---

*Research Companion — ambiente pessoal de investigação intelectual assistida por IA.*
