# **Research Companion — Documento de Requisitos v0.3**

Direção do produto definida  
Requisitos atualizados

## **1\. Identidade e proposta de valor**

Research Companion é um ambiente pessoal de investigação intelectual assistido por inteligência artificial, destinado a pesquisadores independentes e estudantes autodidatas.

Seu propósito é ajudar o usuário a investigar assuntos complexos, trabalhar com fontes selecionadas por ele próprio, confrontar diferentes perspectivas, desenvolver interpretações próprias e consolidar conhecimento através de técnicas didáticas.

Princípio central: a assistência da IA como ampliação da capacidade de investigar, questionar, relacionar e compreender informações.

## **2\. Decisões consolidadas**

**01\. Entrada de documentos**

Arquivos locais e URLs.

O usuário poderá adicionar documentos diretamente ou fornecer links de materiais disponíveis na internet.

**02\. Busca de fontes**

Busca sob demanda.

A pesquisa na internet será iniciada por solicitação explícita do usuário. A IA não adiciona fontes automaticamente.

**03\. Investigação cruzada**

Relatórios estruturados e painéis comparativos.

O usuário poderá compreender as relações entre fontes por meio de sínteses textuais e comparações organizadas.

**04\. Memória da IA**

Memória isolada por pesquisa.

Cada espaço terá seu próprio contexto. Informações de uma pesquisa não serão utilizadas em outra automaticamente.

**05\. Teach the AI**

Experiência adaptativa.

A IA fará perguntas sobre os conceitos da pesquisa, avaliará a explicação do usuário, identificará lacunas, formulará perguntas progressivas e fornecerá uma avaliação final.

**06\. Repetição espaçada**

Sistema de revisão espaçada integrado aos flashcards.

Cada cartão terá seu próprio agendamento de revisão, ajustado de acordo com os acertos e erros do usuário. Os cartões serão organizados em baralhos, que poderão ser associados a espaços de pesquisa.

A revisão será iniciada manualmente pelo usuário, mediante a abertura do baralho desejado. O sistema utilizará notificações internas individuais para informar quando os cartões estiverem prontos para revisão.

## **3\. Requisitos funcionais atualizados**

Abaixo está a versão consolidada. Os identificadores permitem rastrear os requisitos e facilitar futuras alterações.

## **RW — Research Workspace**

Módulo essencial

| ID | Requisito |
| ----- | ----- |
| RW-01 | Criar espaços de pesquisa com título e descrição. |
| RW-02 | Editar, arquivar e excluir espaços. |
| RW-03 | Adicionar arquivos locais aos espaços. |
| RW-04 | Adicionar fontes por URL. |
| RW-05 | Consultar a biblioteca de fontes de cada pesquisa. |
| RW-06 | Organizar fontes por categorias e etiquetas. |
| RW-07 | Registrar perguntas e objetivos de investigação. |
| RW-08 | Criar anotações independentes dos documentos. |
| RW-09 | Consultar o histórico de atividades e descobertas. |
| RW-10 | Identificar fontes duplicadas. |
| RW-11 | Remover fontes aprovadas. |

Regra de gestão de fontes:

Toda fonte terá um estado de validação:

* Pendente de aprovação.  
* Aprovada pelo usuário.  
* Rejeitada pelo usuário.

Apenas fontes aprovadas participarão das análises e respostas fundamentadas na biblioteca da pesquisa.

## **SR — Source Research & Validation**

Este módulo merece identidade própria, embora compartilhe funcionalidades com o Workspace.

Módulo essencial

| ID | Requisito |
| ----- | ----- |
| SR-01 | Permitir pesquisas na internet mediante solicitação do usuário. |
| SR-02 | Receber uma pergunta ou tema como critério de busca. |
| SR-03 | Apresentar resultados potencialmente relevantes. |
| SR-04 | Exibir informações disponíveis sobre autoria, publicação, data e origem. |
| SR-05 | Permitir visualizar o conteúdo da fonte antes da aprovação, quando acessível. |
| SR-06 | Permitir aceitar ou rejeitar individualmente os resultados. |
| SR-07 | Incorporar fontes aprovadas ao espaço de pesquisa. |
| SR-08 | Manter fontes rejeitadas fora do contexto de investigação. |

Uma distinção importante: encontrar um resultado na internet não significa validar sua credibilidade. O sistema deverá fornecer informações que ajudem o usuário a avaliar a fonte, sem apresentar uma classificação automática como garantia de confiabilidade.

## **IR — Intelligent Reader**

Módulo essencial

| ID | Requisito |
| ----- | ----- |
| IR-01 | Abrir e ler documentos da biblioteca. |
| IR-02 | Selecionar trechos para análise. |
| IR-03 | Solicitar explicações de conceitos e passagens complexas. |
| IR-04 | Solicitar explicações em diferentes níveis de profundidade. |
| IR-05 | Simplificar textos preservando seu significado. |
| IR-06 | Identificar argumentos e teses centrais. |
| IR-07 | Identificar pressupostos e limitações argumentativas. |
| IR-08 | Fazer perguntas sobre o documento em leitura. |
| IR-09 | Registrar anotações vinculadas a trechos. |
| IR-10 | Identificar conceitos que mereçam investigação adicional. |
| IR-11 | Apresentar referências e trechos que fundamentaram as respostas. |

Decisão incorporada: o Intelligent Reader utilizará o contexto da pesquisa atual, sem misturar automaticamente informações de outros espaços.

## 

## **CS — Cross-Source Investigation**

Módulo essencial

| ID | Requisito |
| ----- | ----- |
| CS-01 | Selecionar duas ou mais fontes aprovadas para comparação. |
| CS-02 | Identificar conceitos recorrentes. |
| CS-03 | Identificar concordâncias entre autores. |
| CS-04 | Identificar divergências e contradições. |
| CS-05 | Comparar argumentos e interpretações. |
| CS-06 | Identificar informações complementares. |
| CS-07 | Gerar sínteses temáticas fundamentadas em múltiplas fontes. |
| CS-08 | Apresentar referências para cada afirmação da síntese. |
| CS-09 | Identificar questões não respondidas pelas fontes. |
| CS-10 | Gerar relatórios comparativos exportáveis. |
| CS-11 | Apresentar painéis comparativos entre fontes. |

Decisão incorporada: o usuário terá duas maneiras complementares de consumir os resultados:

1. Relatório narrativo, que organiza o conhecimento de forma coesa.  
2. Painel comparativo, que evidencia diferenças e semelhanças entre as fontes.

## **ID — Intellectual Debate**

Módulo essencial

| ID | Requisito |
| ----- | ----- |
| ID-01 | Apresentar hipóteses, opiniões e interpretações à IA. |
| ID-02 | Solicitar críticas fundamentadas nas fontes aprovadas. |
| ID-03 | Solicitar argumentos contrários a uma posição. |
| ID-04 | Identificar possíveis falhas lógicas e contradições. |
| ID-05 | Solicitar interpretações alternativas. |
| ID-06 | Identificar evidências favoráveis e contrárias a uma hipótese. |
| ID-07 | Registrar debates e seus resultados na pesquisa. |
| ID-08 | Escolher entre discussão baseada exclusivamente nas fontes aprovadas ou discussão ampliada com conhecimento externo. |

### **Modos de interlocução**

A IA poderá assumir cinco perspectivas:

* Crítico: examina a consistência dos argumentos.  
* Advogado do Diabo: constrói a melhor argumentação contrária possível.  
* Investigador: identifica questões que exigem mais evidências.  
* Sintetizador: procura integrar perspectivas distintas sem ocultar divergências.  
* Especialista: aprofunda a discussão em determinado campo.

Uma regra importante: quando o usuário escolher o modo de discussão baseado nas fontes, a IA deverá respeitar esse limite. No modo ampliado, deverá distinguir claramente conhecimento externo de informações presentes na biblioteca.

## **KB — Knowledge Builder**

Módulo essencial

| ID | Requisito |
| ----- | ----- |
| KB-01 | Criar registros de conceitos importantes. |
| KB-02 | Registrar hipóteses e interpretações pessoais. |
| KB-03 | Relacionar conceitos entre si. |
| KB-04 | Relacionar conceitos às fontes que os fundamentam. |
| KB-05 | Construir mapas conceituais. |
| KB-06 | Registrar conclusões provisórias e definitivas. |
| KB-07 | Identificar conceitos pouco explorados. |
| KB-08 | Atualizar registros quando novas fontes forem incorporadas. |
| KB-09 | Consultar a evolução das interpretações do usuário. |
| KB-10 | Registrar a origem e o histórico das alterações de um conceito. |

### **Organização do conhecimento**

Conceito pode possuir uma ficha própria:

**Exemplo de ficha conceitual**

# **Determinismo filosófico**

Conceito em desenvolvimento

**Descrição pessoal**

Interpretação formulada pelo próprio usuário.

**Fontes relacionadas**

Documentos e trechos que fundamentam o conceito.

**Conceitos relacionados**

Causalidade, livre-arbítrio, necessidade e contingência.

**Questões em aberto**

Dúvidas e problemas que ainda precisam ser investigados.

**Domínio declarado**

O usuário indica se considera que compreendeu o conceito.

É importante que o domínio declarado pelo usuário seja diferente do domínio avaliado pelo sistema. Um usuário pode acreditar que domina determinado conceito e descobrir, durante o Teach the AI, que ainda existem lacunas.

## **LM — Learning & Mastery**

Módulo essencial

| ID | Requisito |
| ----- | ----- |
| LM-01 | Gerar flashcards a partir das fontes e dos conceitos. |
| LM-02 | Permitir editar e criar cartões manualmente. |
| LM-03 | Gerar questionários de múltipla escolha. |
| LM-04 | Gerar perguntas abertas. |
| LM-05 | Explicar respostas corretas e incorretas. |
| LM-06 | Ajustar a dificuldade dos exercícios. |
| LM-07 | Acompanhar o desempenho do usuário. |
| LM-08 | Identificar conceitos que precisam de revisão. |
| LM-09 | Recomendar atividades de aprofundamento. |
| LM-10 | Oferecer sessões adaptativas de ensino de conceitos por meio do Teach the AI. |
| LM-11 | Registrar e permitir consultar o histórico de aprendizagem. |
| LM-12 | Permitir criar e gerenciar baralhos de flashcards. |
| LM-13 | Implementar repetição espaçada com agendamento individual por cartão. |
| LM-14 | Apresentar notificações internas individuais quando cartões estiverem prontos para revisão. |

### **LM-10 — Teach the AI**

O usuário deverá conseguir selecionar um conceito de sua pesquisa e iniciar uma sessão de ensino.

A experiência será dividida em cinco momentos:

1. **Escolha do conceito**  
   O usuário escolhe um conceito de sua biblioteca ou de uma fonte aprovada.  
2. **Explicação espontânea**  
   O usuário explica o conceito com suas próprias palavras, sem consultar os materiais.  
3. **Avaliação preliminar**  
   A IA avalia precisão, clareza, coesão, profundidade e capacidade de exemplificação.  
4. **Diálogo adaptativo**  
   A IA identifica lacunas e formula perguntas progressivas. As perguntas seguintes devem considerar as respostas anteriores.  
5. **Avaliação final e recomendações**  
   O usuário recebe uma avaliação detalhada, identifica pontos fortes e fracos e recebe sugestões de aprofundamento.

Critérios de avaliação:

| Critério | O que será observado |
| ----- | ----- |
| Precisão | Correção conceitual da explicação. |
| Clareza | Capacidade de comunicar a ideia. |
| Coesão | Organização e conexão das ideias. |
| Profundidade | Compreensão das implicações e relações. |
| Exemplificação | Capacidade de ilustrar o conceito. |

A avaliação deverá ser acompanhada de justificativas e exemplos extraídos da explicação do usuário e das fontes de referência.

Não queremos uma nota arbitrária. Queremos um diagnóstico útil.

### **LM-11 — Histórico de aprendizagem**

O usuário poderá consultar:

* Conceitos estudados.  
* Sessões de ensino realizadas.  
* Avaliações anteriores.  
* Dificuldades recorrentes.  
* Evolução da compreensão.  
* Recomendações de revisão.

Uma característica interessante seria permitir comparar duas explicações dadas pelo usuário em momentos diferentes, mostrando como seu domínio do conceito evoluiu.

### **LM-12 — Gerenciamento de baralhos de flashcards**

O sistema deverá oferecer uma coleção pessoal de baralhos, permitindo organizar os flashcards de acordo com as pesquisas do usuário.

| ID | Requisito |
| ----- | ----- |
| LM-12.01 | Criar baralhos de flashcards com título próprio. |
| LM-12.02 | Consultar e gerenciar a coleção pessoal de baralhos. |
| LM-12.03 | Organizar baralhos por espaço de pesquisa. |
| LM-12.04 | Permitir manter baralhos independentes de qualquer espaço de pesquisa. |
| LM-12.05 | Ao solicitar a criação de um conjunto de flashcards, permitir salvá-lo como um novo baralho. |
| LM-12.06 | Permitir adicionar os flashcards recém-criados a um baralho já existente. |
| LM-12.07 | Permitir consultar os cartões pertencentes a cada baralho. |
| LM-12.08 | Permitir gerenciar os baralhos da coleção. |

**Regras de organização**

* Um baralho poderá estar associado a um espaço de pesquisa ou ser independente.  
* O usuário decidirá em qual baralho deseja salvar os flashcards gerados.  
* A criação de novos cartões não deverá exigir a criação de um novo baralho caso o usuário prefira utilizar um existente.  
* Cada cartão deverá possuir identidade e agendamento próprios.  
* O agendamento de um cartão deverá permanecer individual, independentemente dos demais cartões do baralho.

### **LM-13 — Sistema de repetição espaçada**

O sistema deverá implementar um mecanismo de repetição espaçada (Spaced Repetition System — SRS), integrado aos baralhos de flashcards.

Seu objetivo será determinar quando cada cartão deverá ser revisado novamente, ajustando o intervalo de acordo com o desempenho do usuário.

**13.1. Rastreamento individual dos cartões**

Cada cartão deverá manter seu próprio controle de revisão, incluindo:

* Data de criação.  
* Data da última revisão.  
* Data da próxima revisão.  
* Intervalo atual entre revisões.  
* Resultado das revisões realizadas.

O agendamento deverá ser independente dos demais cartões, inclusive daqueles pertencentes ao mesmo baralho.

**13.2. Avaliação do usuário**

A avaliação durante a revisão será binária:

* **Acertei:** o usuário conseguiu recuperar corretamente a informação apresentada no cartão.  
* **Errei:** o usuário esqueceu, respondeu incorretamente ou não conseguiu recuperar a informação.

Fluxo de revisão:

1. O sistema apresenta a pergunta sem revelar a resposta.  
2. O usuário tenta recuperar a informação.  
3. O usuário revela a resposta.  
4. Compara sua resposta com o conteúdo do cartão.  
5. Seleciona Acertei ou Errei.  
6. O sistema registra o resultado e atualiza o agendamento.

A avaliação dependerá do julgamento do próprio usuário. O sistema não deverá exigir uma análise automática da resposta para determinar se houve acerto.

**13.3. Algoritmo de agendamento**

O intervalo inicial será de 24 horas.

A cada revisão concluída:

| Resultado | Ajuste do intervalo |
| ----- | ----- |
| Acertei | Multiplicar o intervalo atual por 2\. |
| Errei | Dividir o intervalo atual por 2\. |
| Intervalo mínimo | 24 horas. |
| Intervalo máximo | Sem limite máximo. |

Exemplo de progressão:

| Revisão | Resultado | Próximo intervalo |
| ----- | ----- | ----- |
| Primeira programação | — | 24 horas |
| Primeira revisão | Acertei | 48 horas |
| Segunda revisão | Acertei | 96 horas |
| Terceira revisão | Acertei | 192 horas |
| Quarta revisão | Errei | 96 horas |
| Quinta revisão | Errei | 48 horas |
| Sexta revisão | Errei | 24 horas |

O intervalo será calculado a partir do momento em que a revisão for concluída.

**13.4. Comportamento dos cartões**

| Situação | Comportamento |
| ----- | ----- |
| Cartão acertado | O intervalo é dobrado. |
| Cartão errado | O intervalo é reduzido pela metade, respeitando o mínimo de 24 horas. |
| Cartão errado durante uma sessão | O cartão retorna à fila da próxima sessão, sem reaparecer na sessão atual. |
| Cartão atrasado | Não recebe penalidade adicional por atraso. |
| Revisão antecipada | O resultado é registrado e o intervalo é recalculado normalmente. |
| Cartão suspenso | Deixa de participar das revisões e de gerar notificações. |
| Cartão reativado | Retoma seu agendamento de revisão. |

**13.5. Suspensão de cartões**

O usuário poderá suspender individualmente um cartão.

Enquanto estiver suspenso:

* O cartão não deverá aparecer na fila de revisão.  
* O cartão não deverá gerar notificações.  
* Seu agendamento deverá ser preservado.

Ao reativar o cartão, o sistema deverá retomar seu acompanhamento de revisão.

**13.6. Revisões atrasadas**

Um cartão será considerado atrasado quando sua data de próxima revisão já tiver passado.

O atraso não deverá provocar redução automática do intervalo. O sistema deverá considerar o resultado obtido pelo usuário na revisão para recalcular o próximo agendamento.

**13.7. Revisões antecipadas**

O usuário poderá revisar um cartão antes da data programada, desde que abra o baralho correspondente e acesse o cartão.

Nesse caso:

* A revisão será registrada normalmente.  
* O resultado será considerado pelo algoritmo.  
* O intervalo será recalculado com base no resultado.  
* A próxima data de revisão será calculada a partir do momento da revisão antecipada.

**13.8. Acesso às revisões**

O usuário deverá iniciar as revisões manualmente, abrindo o baralho que deseja estudar.

A primeira versão não deverá oferecer:

* Revisão automática consolidada de cartões de diferentes baralhos.  
* Seleção manual de cartões individuais para montar uma sessão.

Ao abrir um baralho, o usuário poderá revisar os cartões que estiverem elegíveis para revisão naquele momento.

Não haverá obrigação de revisar todos os baralhos ou cartões pendentes de uma só vez.

### **LM-14 — Notificações internas de revisão**

O sistema deverá apresentar notificações visuais dentro da interface do Research Companion quando cartões atingirem suas datas de revisão.

| ID | Requisito |
| ----- | ----- |
| LM-14.01 | Gerar uma notificação individual para cada cartão quando chegar sua data de revisão. |
| LM-14.02 | Identificar o cartão e o baralho ao qual pertence. |
| LM-14.03 | Permitir acessar o respectivo baralho a partir da notificação. |
| LM-14.04 | Manter notificações de cartões atrasados visíveis até que sejam revisados ou suspensos. |
| LM-14.05 | Não gerar notificações para cartões suspensos. |
| LM-14.06 | Não revelar a resposta do cartão na notificação. |

**Regras das notificações**

* As notificações serão exclusivamente internas, apresentadas visualmente na interface enquanto a aplicação estiver aberta.  
* Não serão utilizadas notificações externas do sistema operacional ou do navegador na primeira versão.  
* Cada cartão terá sua própria notificação.  
* A notificação deverá permitir que o usuário acesse o baralho correspondente.  
* A notificação não deverá alterar o agendamento nem registrar uma revisão por si só.  
* A revisão somente será registrada quando o usuário efetivamente concluir a avaliação do cartão.

**Organização das revisões dentro dos baralhos**

Ao abrir um baralho para revisar, o sistema deverá disponibilizar os cartões elegíveis, incluindo aqueles cuja data de revisão já passou e aqueles cuja revisão está programada para o dia atual.

A ordem de apresentação desses cartões ainda será definida.

## **4\. Requisitos não funcionais consolidados**

Estes requisitos estabelecem as características que deverão ser respeitadas em todo o sistema.

| ID | Requisito |
| ----- | ----- |
| NFR-01 | Respostas fundamentadas deverão apresentar referências verificáveis. |
| NFR-02 | A IA deverá reconhecer insuficiência de evidências. |
| NFR-03 | Fontes pendentes e rejeitadas não poderão alimentar análises. |
| NFR-04 | Informações documentadas deverão ser distinguíveis de interpretações da IA. |
| NFR-05 | O usuário deverá manter controle sobre suas anotações e conclusões. |
| NFR-06 | O sistema deverá permitir utilização com modelos de IA gratuitos ou locais. |
| NFR-07 | A memória deverá ser isolada por espaço de pesquisa. |
| NFR-08 | O usuário deverá conseguir exportar suas pesquisas. |
| NFR-09 | Falhas e limitações das operações de IA deverão ser comunicadas. |
| NFR-10 | Documentos e informações privadas deverão permanecer sob controle do usuário. |
| NFR-11 | O sistema deverá preservar a rastreabilidade das informações. |
| NFR-12 | A interface deverá funcionar adequadamente em diferentes resoluções de tela. |
| NFR-13 | O sistema deverá evitar perda de informações durante falhas ou encerramentos inesperados. |
| NFR-14 | Os dados de revisão dos flashcards deverão ser preservados entre sessões e após o encerramento da aplicação. |
| NFR-15 | O agendamento de revisões deverá utilizar datas e horários consistentes, evitando alterações indevidas nos intervalos calculados. |
| NFR-16 | As notificações internas deverão refletir o estado atual dos cartões e seus respectivos agendamentos. |

## **5\. Regras gerais de negócio**

Quero separar algumas regras porque elas são especialmente importantes para o comportamento do produto.

| ID | Regra |
| ----- | ----- |
| BR-01 | Toda fonte adicionada por busca deverá passar pela aprovação do usuário. |
| BR-02 | Apenas fontes aprovadas poderão ser utilizadas como evidências da pesquisa. |
| BR-03 | Uma fonte rejeitada não poderá ser utilizada nas análises daquele espaço. |
| BR-04 | Cada pesquisa deverá possuir contexto e histórico independentes. |
| BR-05 | O usuário poderá autorizar explicitamente o compartilhamento de informações entre pesquisas, se essa funcionalidade for implementada futuramente. |
| BR-06 | Toda síntese deverá permitir rastrear suas fontes de origem. |
| BR-07 | A IA deverá identificar divergências entre fontes, sem presumir que uma delas está necessariamente correta. |
| BR-08 | Conclusões e interpretações pessoais deverão ser identificadas como tais. |
| BR-09 | O usuário poderá modificar ou rejeitar qualquer interpretação sugerida pela IA. |
| BR-10 | Avaliações de aprendizagem deverão ser acompanhadas de justificativas. |
| BR-11 | Cada cartão deverá possuir agendamento de revisão independente dos demais cartões. |
| BR-12 | O resultado de uma revisão deverá atualizar somente o agendamento do cartão avaliado. |
| BR-13 | O intervalo mínimo de revisão será de 24 horas, sem limite máximo. |
| BR-14 | Cartões atrasados não receberão penalidade automática adicional. |
| BR-15 | Revisões antecipadas deverão recalcular o agendamento normalmente. |
| BR-16 | Cartões suspensos não participarão das revisões nem gerarão notificações. |
| BR-17 | A revisão deverá ser iniciada manualmente pelo usuário a partir de um baralho. |
| BR-18 | A inclusão de cartões em um baralho existente não deverá reiniciar o agendamento dos demais cartões. |
| BR-19 | Notificações internas não deverão registrar automaticamente uma revisão. |

## 

## 

## **6\. Escopo de desenvolvimento**

### **V1 — Research Core**

**Produto funcional**

* Workspace e gerenciamento de pesquisas.  
* Importação de arquivos e URLs.  
* Busca de fontes sob demanda.  
* Aprovação e rejeição de fontes.  
* Leitura inteligente.  
* Perguntas e respostas fundamentadas.

### **V2 — Research Intelligence**

**Investigação avançada**

* Investigação cruzada.  
* Relatórios e painéis comparativos.  
* Debate intelectual.  
* Registro de hipóteses e interpretações.

### **V3 — Knowledge Mastery**

**Aprendizagem profunda**

* Knowledge Builder.  
* Mapas conceituais.  
* Flashcards e questionários.  
* Gerenciamento de baralhos.  
* Repetição espaçada.  
* Notificações internas de revisão.  
* Teach the AI adaptativo.  
* Histórico de aprendizagem.

O grande marco de conclusão do portfólio será uma demonstração integrada da V2, com uma pesquisa real contendo documentos, comparação de fontes e debate fundamentado. A V3 será um diferencial ainda maior, mas não deve atrasar a entrega de um produto sólido.

## 

## 

## **7\. Pontos ainda em aberto**

| Tema | Questão pendente |
| ----- | ----- |
| Formatos | Quais formatos de arquivo serão suportados inicialmente? PDF: documentos com texto selecionável. OCR para documentos digitalizados fica fora da primeira versão. TXT: texto simples. MD: Markdown. DOCX: documentos do Word. EPUB, DOC, planilhas, apresentações e outros formatos para versões futuras.  |
| URLs | Como lidar com páginas protegidas, conteúdo dinâmico ou inacessível? R.: O sistema deverá acessar apenas páginas cujo conteúdo possa ser obtido diretamente. Páginas protegidas por autenticação, conteúdo inacessível ou dependente de mecanismos dinâmicos incompatíveis com a extração serão ignoradas. O sistema deverá informar ao usuário que não conseguiu acessar o conteúdo, sem tentar contornar as restrições.  |
| Busca | Quais critérios ajudarão o usuário a avaliar a qualidade das fontes? R.: IA: apresenta uma avaliação orientativa considerando autoria, instituição, data, referências, metodologia, consistência e relevância para a pesquisa. Usuário: decide se aprova ou rejeita a fonte. Sistema: só incorpora fontes aprovadas ao contexto de pesquisa.  |
| Comparação | Como apresentar divergências entre fontes extensas? Evitar tentar comparar documentos inteiros palavra por palavra. A comparação deve ser organizada por temas, argumentos e afirmações relevantes. Por exemplo: **Tema** **Fonte A** **Fonte B** Origem do fenômeno Apresenta a hipótese histórica Apresenta uma hipótese econômica Causa principal Fator político Fator tecnológico Consequência Interpretação A Interpretação B A IA deverá indicar as referências correspondentes em cada documento. Assim, o sistema destaca divergências importantes sem precisar construir um mecanismo sofisticado de comparação textual.  |
| Mapas | Qual será o nível de interação dos mapas conceituais? Começar com mapas simples e interativos. Na primeira versão, permitir: Visualizar conceitos como nós. Visualizar relações entre conceitos. Clicar em um conceito para consultar sua explicação. Acessar as fontes associadas ao conceito. Adicionar ou editar conceitos e relações manualmente. Deixaria recursos como movimentação avançada, edição visual complexa, múltiplos tipos de relações e personalização gráfica para depois. O importante é que o mapa seja útil para compreender as relações entre ideias, não que seja um editor gráfico sofisticado.  |
| Exportação | Quais formatos de exportação serão oferecidos? Começar com: Markdown (.md): relatórios, análises, notas e sínteses. PDF (.pdf): versão pronta para leitura e compartilhamento. |
| Privacidade | Os documentos serão armazenados exclusivamente no computador do usuário? R.:  Todos os documentos, dados de pesquisa, notas, interpretações, baralhos e históricos de aprendizagem deverão permanecer armazenados localmente no computador do usuário. O sistema não deverá depender de armazenamento remoto para funcionar. Utilizar arquivos locais: Documentos originais em suas pastas. Metadados e configurações em arquivos JSON. Dados de cada pesquisa organizados em diretórios próprios. Baralhos e históricos de revisão armazenados localmente.  |
| Aprendizagem | Como diferenciar uma dificuldade de expressão de uma lacuna real de conhecimento? R.: A IA avalia dois critérios independentes: Expressão do conhecimento: clareza, organização, precisão da linguagem e capacidade de comunicar ideias. Domínio do conhecimento: compreensão conceitual, capacidade de explicar relações, aplicar conceitos e elaborar argumentos. Se não conseguir determinar se uma resposta demonstra desconhecimento ou apenas dificuldade de expressão, deverá fazer perguntas adicionais antes de emitir uma avaliação.  |
| Flashcards | Qual será a ordem de apresentação dos cartões atrasados e dos cartões cuja revisão está programada para o dia atual? R.: Priorizar os cartões atrasados. |
| Flashcards | Como serão tratados cartões cujo conteúdo for editado após já possuírem histórico de revisão? R.: Seu processo de revisão não será alterado, apenas o seu conteúdo. |
| Flashcards | Como serão tratados cartões quando um baralho for arquivado ou excluído?Cada pesquisa terá uma área de arquivo para seus baralhos arquivados. Baralhos independentes de pesquisas terão um arquivo geral. Arquivar não excluirá cartões nem históricos. Baralhos arquivados não aparecerão na lista principal de baralhos. Baralhos arquivados não gerarão notificações. As datas e os intervalos de revisão continuarão sendo preservados. Ao restaurar um baralho, os cartões vencidos voltarão a ser considerados para revisão. **Exclusão de baralhos** Sua mensagem de confirmação está adequada: Tem certeza que deseja excluir este baralho? Esta ação não poderá ser revertida. Eu acrescentaria uma regra técnica: A exclusão remove permanentemente o baralho, seus cartões e seus respectivos históricos de revisão. A operação não poderá ser desfeita pelo sistema.  |

## **8\. Critérios para considerar o produto bem-sucedido**

Critérios de avaliação do resultado final.

O Research Companion deverá demonstrar que:

1. Um usuário consegue iniciar e organizar uma investigação sem dificuldades.  
2. A inclusão de fontes depende efetivamente da aprovação do usuário.  
3. A IA consegue responder perguntas utilizando evidências rastreáveis.  
4. O sistema consegue identificar concordâncias e divergências entre documentos.  
5. O usuário consegue confrontar suas próprias ideias com argumentos contrários.  
6. O Knowledge Builder consegue organizar conceitos e relações.  
7. O Teach the AI consegue identificar lacunas e adaptar suas perguntas.  
8. As informações de uma pesquisa não contaminam o contexto de outra.  
9. O produto funciona sem depender de uma API comercial paga.  
10. O código é testável, documentado e suficientemente organizado para manutenção.  
11. O usuário consegue criar baralhos e organizar flashcards por pesquisa.  
12. Cada cartão possui um agendamento independente de repetição espaçada.  
13. O intervalo de revisão aumenta com acertos e diminui com erros, respeitando o mínimo de 24 horas.  
14. Revisões antecipadas e cartões atrasados seguem as regras definidas.  
15. O usuário consegue suspender e reativar cartões.  
16. As notificações internas identificam individualmente os cartões prontos para revisão.  
17. O usuário consegue iniciar revisões abrindo o baralho desejado, sem depender de uma fila automática consolidada.  
18. O histórico e os agendamentos dos cartões permanecem preservados entre sessões.

## **9\. Próximas etapas**

Etapa intermediária de Product Design, com três entregáveis:

**1\. User Stories:** transformar os requisitos em histórias de utilização, por exemplo:

"Como pesquisador, quero selecionar trechos de diferentes documentos para compará-los, de modo que consiga identificar divergências entre os autores."

**2\. Fluxos de utilização:** desenhar como o usuário navega pelo produto e como cada funcionalidade se conecta às demais.

**3\. MVP definitivo:** selecionar quais funcionalidades entram na primeira entrega e definir critérios objetivos para considerar cada uma concluída.

Minha sugestão é começar pelo desenho da experiência do usuário, especialmente o fluxo completo de criação de uma pesquisa, inclusão de fontes, leitura e investigação. Posteriormente, desenhar o fluxo de criação, organização e revisão dos baralhos de flashcards.

