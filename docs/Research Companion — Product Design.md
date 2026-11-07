# **Research Companion — Product Design**

**Versão:** 0.1  
**Status:** Primeira consolidação  
**Documento relacionado:** Research Companion — Documento de Requisitos v0.3

---

## **1\. Objetivo do documento**

Este documento estabelece as diretrizes de design de produto e experiência do usuário (UX) do Research Companion.

Seu propósito é orientar a construção de uma interface coerente, minimalista e funcional, garantindo que as decisões visuais e de navegação estejam alinhadas à proposta do produto.

O documento complementa o Documento de Requisitos, sem substituí-lo.

**Distinção entre os documentos:**

* Documento de Requisitos: define o que o sistema deve fazer.  
* Product Design: define como o usuário experimenta, acessa e utiliza essas funcionalidades.

As decisões aqui registradas devem orientar a criação de telas, componentes, fluxos de utilização e futuras evoluções da interface.

## **2\. Princípios fundamentais de design**

### **2.1. Minimalismo funcional**

A interface deve facilitar o pensamento, não disputar a atenção do usuário.

O Research Companion é uma ferramenta voltada ao trabalho intelectual. Portanto, sua interface deve reduzir distrações e priorizar o conteúdo e as atividades de investigação.

Diretrizes:

* Poucos elementos visuais simultâneos.  
* Hierarquia tipográfica clara.  
* Cores utilizadas com moderação.  
* Ausência de animações e efeitos meramente decorativos.  
* Espaçamento adequado entre elementos.  
* Informações secundárias apresentadas quando necessárias.  
* Componentes consistentes e previsíveis.  
* Feedback visual discreto, mas suficientemente claro.

Minimalismo não significa esconder funcionalidades. Significa apresentar cada funcionalidade no momento e contexto em que ela é necessária.

### **2.2. Continuidade do trabalho**

O usuário deverá conseguir interromper uma investigação e retomá-la posteriormente sem precisar reconstruir seu contexto de trabalho.

A interface deverá preservar o estado relevante de cada pesquisa, incluindo navegação, documentos abertos, posições de leitura, filtros e outras informações contextuais.

### **2.3. Centralidade do usuário**

A IA deve ampliar a capacidade de investigação e compreensão do usuário, sem assumir o controle do processo intelectual.

A interface deverá preservar a autonomia do usuário sobre suas fontes, interpretações, conclusões e atividades de aprendizagem.

### **2.4. Organização contextual**

As ferramentas deverão aparecer de acordo com o contexto de utilização.

As funcionalidades específicas de uma pesquisa estarão disponíveis dentro do workspace daquela pesquisa, evitando apresentar ferramentas que não sejam relevantes para a atividade atual.

### **2.5. Consistência**

Elementos com funções semelhantes deverão apresentar comportamentos e padrões visuais semelhantes em diferentes áreas do aplicativo.

A consistência deverá ser preservada entre temas visuais e futuras expansões.

---

## **3\. Plataforma e experiência de utilização**

### **3.1. Plataforma inicial**

O Research Companion será desenvolvido inicialmente como uma **aplicação web local**.

O aplicativo será executado no computador do usuário e acessado por meio de um navegador.

Essa escolha prioriza a simplicidade de desenvolvimento e utilização.

Uma futura versão hospedada online poderá ser considerada, mas não constitui uma exigência da primeira versão.

A experiência e a organização da interface não deverão depender exclusivamente de características que impeçam essa evolução.

### **3.2. Prioridade de dispositivos**

O desenvolvimento da experiência será **desktop-first**.

Prioridades:

* Otimização para monitores de computador.  
* Aproveitamento do espaço horizontal.  
* Facilidade para trabalhar simultaneamente com documentos, fontes e ferramentas de investigação.  
* Navegação acessível e persistente.  
* Organização adequada para sessões prolongadas de leitura e escrita.

A experiência mobile não será desenvolvida como prioridade na V1.

Entretanto, decisões de interface deverão evitar limitações desnecessárias à possibilidade de adaptação futura para telas menores.

### **3.3. Natureza da experiência**

O Research Companion deverá apresentar uma experiência semelhante à de um ambiente pessoal de trabalho intelectual.

Não deverá parecer um site institucional ou um dashboard administrativo convencional.

O conceito central será o de um workspace integrado, no qual o usuário encontra suas pesquisas e acessa as ferramentas necessárias para desenvolvê-las.

---

## **4\. Identidade visual**

### **4.1. Direção estética padrão**

A identidade visual padrão será **Editorial / Acadêmica**.

Características:

* Predominância de fundos claros.  
* Tipografia elegante e legível.  
* Hierarquia visual inspirada em ferramentas de leitura, escrita e pesquisa.  
* Elementos visuais discretos.  
* Aparência organizada e contemporânea.  
* Referências estéticas sutis a livros, publicações e ambientes acadêmicos.

A interface deverá transmitir clareza, concentração e seriedade intelectual.

### **4.2. Temas alternativos**

O aplicativo oferecerá três temas visuais:

| Tema | Características | Configuração |
| ----- | ----- | ----- |
| Editorial / Acadêmico | Fundo claro, tipografia elegante e estética editorial. | Padrão |
| Dark / Tecnológico | Tons escuros, contraste controlado e aparência contemporânea. | Alternativo |
| Neutro / Funcional | Paleta neutra e elementos discretos. | Alternativo |

O usuário poderá alterar o tema na seção Configurações.

### **4.3. Comportamento dos temas**

Os temas deverão compartilhar:

* A mesma estrutura de navegação.  
* A mesma hierarquia de informações.  
* Os mesmos componentes.  
* Os mesmos comportamentos e interações.

A alteração de tema deverá produzir efeito imediato e a preferência escolhida deverá ser preservada entre sessões.

Os temas representam diferentes apresentações visuais do mesmo produto, não diferentes experiências funcionais.

---

## **5\. Arquitetura geral da interface**

### **5.1. Workspace integrado**

O aplicativo utilizará um modelo de workspace integrado.

Sua estrutura principal será composta por:

1. Navegação lateral persistente.  
2. Área central dinâmica.

A navegação lateral organizará o acesso às funcionalidades globais e contextuais.

A área central representará o principal espaço de trabalho do usuário e será atualizada de acordo com a seção selecionada.

### **5.2. Navegação global**

A navegação global permanecerá disponível independentemente da pesquisa ativa.

Organização inicial:

* Dashboard.  
* Biblioteca de documentos.  
* Coleção de baralhos.  
* Configurações.

Essas áreas representam funcionalidades gerais do aplicativo, não restritas a uma pesquisa específica.

### **5.3. Navegação contextual**

Ao abrir uma pesquisa, seus recursos específicos serão apresentados dentro da própria barra lateral, organizados por grupos.

A navegação contextual desaparecerá quando o usuário sair da pesquisa ativa, enquanto a navegação global permanecerá disponível.

Organização definida:

**Materiais**

* Documentos.  
* Fontes.

**Investigação**

* Intelligent Reader.  
* Investigação Cruzada.  
* Debate Intelectual.  
* Notas.

**Conhecimento**

* Knowledge Builder.  
* Mapas Conceituais.

**Aprendizagem**

* Teach the AI.  
* Flashcards.

Os grupos representam uma organização visual das ferramentas. Não implicam necessariamente uma divisão equivalente na arquitetura técnica do sistema.

### **5.4. Comportamento dos grupos**

* Todos os grupos começarão expandidos.  
* O usuário poderá recolher ou expandir cada grupo individualmente.  
* O estado de expansão deverá ser preservado durante a navegação.  
* A estrutura dos grupos deverá permanecer consistente entre diferentes pesquisas.

### **5.5. Área central dinâmica**

A área central será o principal espaço de interação.

Seu conteúdo será determinado pela funcionalidade selecionada na navegação lateral.

Exemplos:

| Seção selecionada | Conteúdo da área central |
| ----- | ----- |
| Documentos | Biblioteca de documentos da pesquisa e acesso aos materiais. |
| Fontes | Gerenciamento, avaliação e organização das fontes. |
| Intelligent Reader | Ambiente de leitura e interação com a IA. |
| Investigação Cruzada | Relatórios e painéis comparativos. |
| Debate Intelectual | Ambiente de discussão e análise de argumentos. |
| Notas | Criação e organização de anotações. |
| Knowledge Builder | Registros de conceitos, hipóteses e interpretações. |
| Mapas Conceituais | Visualização e edição das relações entre conceitos. |
| Teach the AI | Sessões adaptativas de aprendizagem. |
| Flashcards | Consulta e gerenciamento dos cartões e baralhos disponíveis na pesquisa. |

A área central deverá adaptar sua organização às necessidades de cada funcionalidade, mantendo os padrões visuais e de interação do aplicativo.

### **5.6. Painel lateral secundário**

Um painel lateral secundário não será implementado na V1.

Entretanto, a organização visual deverá permitir sua inclusão futura.

Possíveis utilizações:

* Metadados de documentos.  
* Informações detalhadas sobre fontes.  
* Propriedades de cartões.  
* Informações contextuais.  
* Ferramentas complementares.

Não deverá existir espaço vazio reservado permanentemente para esse painel na versão inicial.

---

## **6\. Dashboard**

### **6.1. Tela inicial**

A Dashboard será a primeira tela apresentada quando o usuário abrir o aplicativo.

Seu propósito será facilitar o início de novas investigações e a retomada de pesquisas existentes.

Não deverá funcionar como um painel administrativo carregado de métricas.

### **6.2. Organização da Dashboard**

A Dashboard apresentará quatro elementos principais:

**1\. Pesquisas recentes**

Apresentação das pesquisas do usuário por meio de cards minimalistas.

**2\. Criar pesquisa**

Acesso rápido à criação de uma nova pesquisa.

**3\. Revisões pendentes**

Apresentação dos cartões de aprendizagem que estão prontos para revisão, respeitando as regras do módulo de repetição espaçada.

Esse elemento deverá acompanhar a disponibilidade do módulo de aprendizagem.

**4\. Atividade recente**

Registro de atividades relevantes realizadas no aplicativo.

### **6.3. Cards de pesquisa**

Cada pesquisa será representada por um card contendo:

* Nome da pesquisa.  
* Descrição breve, quando disponível.  
* Data da última atividade.

O card deverá permitir acesso direto ao workspace correspondente.

A apresentação deverá ser discreta, com hierarquia visual clara e sem informações desnecessárias.

O espaço visual deverá permitir futuras expansões, como indicadores de progresso e informações adicionais, sem exigir que esses elementos estejam presentes na V1.

### **6.4. Ordenação das pesquisas**

A ordenação padrão será por atividade mais recente.

O usuário poderá alterar a organização por meio de um seletor compacto localizado no topo da área de pesquisas.

Critérios disponíveis:

| Critério | Ordem |
| ----- | ----- |
| Atividade mais recente | Mais recentes primeiro. Padrão. |
| Título | Ordem alfabética crescente. |
| Tamanho | Maior quantidade de flashcards primeiro. |
| Data de criação | Mais novas primeiro ou mais antigas primeiro. |

**Definição de tamanho:** quantidade de flashcards pertencentes aos baralhos associados à pesquisa.

O tamanho não será calculado pela quantidade de arquivos, documentos ou fontes.

O seletor deverá apresentar apenas as opções necessárias, sem ocupar espaço excessivo na Dashboard.

---

## **7\. Criação e gerenciamento de pesquisas**

### **7.1. Criação de pesquisas**

A criação deverá seguir um fluxo minimalista.

Informações solicitadas inicialmente:

| Campo | Obrigatoriedade |
| ----- | ----- |
| Nome da pesquisa | Obrigatório |
| Descrição | Opcional |
| Instruções ou contexto inicial para a IA | Opcional |

Após a criação, o usuário será direcionado automaticamente ao workspace da nova pesquisa.

### **7.2. Extensibilidade da criação**

O fluxo deverá permitir a inclusão futura de configurações adicionais sem exigir uma reformulação completa da experiência.

Possíveis expansões:

* Objetivos e perguntas de pesquisa.  
* Preferências de comportamento da IA.  
* Modelos predefinidos de pesquisa.  
* Configurações adicionais de fontes.  
* Personalização do ambiente de trabalho.

Essas possibilidades não fazem parte do formulário inicial da V1.

### **7.3. Arquivamento e exclusão**

O comportamento de arquivamento e exclusão seguirá as regras estabelecidas no Documento de Requisitos.

O Product Design deverá garantir que as ações sejam visualmente distintas e que operações permanentes sejam acompanhadas de confirmação adequada.

Não serão criadas regras de negócio paralelas neste documento.

---

## **8\. Continuidade e preservação do contexto**

### **8.1. Preservação da navegação**

Cada pesquisa deverá preservar sua própria posição de trabalho.

Ao retornar a uma pesquisa, o aplicativo deverá abrir a última seção utilizada, em vez de retornar automaticamente à Dashboard ou à tela inicial da pesquisa.

Exemplo:

* Pesquisa A: última seção utilizada foi Investigação Cruzada.  
* Pesquisa B: última seção utilizada foi Documentos.  
* Ao alternar entre A e B, cada pesquisa retorna à sua respectiva seção anterior.

### **8.2. Preservação do estado interno**

Além da seção acessada, o aplicativo deverá preservar o contexto relevante de utilização.

Exemplos:

* Documento que estava aberto.  
* Página ou posição de leitura.  
* Filtros aplicados.  
* Seleções e visualizações em uso.  
* Estado dos grupos da navegação contextual.  
* Contexto de uma atividade de aprendizagem em andamento, quando aplicável.

A preservação deverá ocorrer automaticamente.

### **8.3. Persistência entre sessões**

O estado relevante deverá permanecer preservado mesmo quando o usuário fechar e reabrir o aplicativo.

A retomada não deverá depender de uma ação manual de salvamento.

É importante distinguir a preservação do estado da interface do salvamento de conteúdo:

* Estado de interface: navegação, filtros, posição de leitura e contexto visual.  
* Conteúdo: notas, documentos, interpretações e demais dados produzidos pelo usuário.

O conteúdo deverá possuir mecanismos próprios de persistência, respeitando os requisitos de integridade e prevenção de perda de informações.

---

## **9\. Configurações**

A seção Configurações será acessada pela navegação global.

Na V1, deverá contemplar a seleção dos temas visuais.

A organização deverá permitir a inclusão futura de outras preferências do usuário, sem transformar a seção em um conjunto excessivamente complexo de opções.

Possíveis expansões:

* Preferências de interface.  
* Configurações de IA.  
* Preferências de leitura.  
* Gerenciamento de armazenamento local.  
* Preferências de notificações.  
* Configurações de aprendizagem.

A inclusão dessas opções deverá acompanhar a implementação das respectivas funcionalidades.

---

## **10\. Diretrizes gerais de interação**

As interações deverão priorizar previsibilidade e simplicidade.

Diretrizes:

1. Ações frequentes devem ser facilmente acessíveis.  
2. Ações destrutivas devem ser claramente identificadas.  
3. Alterações de configuração devem produzir feedback compreensível.  
4. O usuário não deverá precisar repetir ações já realizadas.  
5. Informações importantes não devem depender exclusivamente de elementos visuais sutis.  
6. A interface deverá comunicar carregamentos, erros e limitações de operações.  
7. A navegação deverá preservar o contexto sempre que possível.  
8. Ações e componentes semelhantes deverão manter comportamentos consistentes.

Essas diretrizes serão detalhadas futuramente na especificação de componentes e estados de interface.

---

## **11\. Evolução do Product Design**

O design deverá acompanhar o desenvolvimento progressivo do produto.

A V1 não deverá antecipar visualmente funcionalidades que ainda não estejam implementadas, mas poderá manter espaço estrutural para sua evolução.

Princípios:

* Implementar primeiro a experiência essencial.  
* Evitar complexidade visual sem necessidade funcional.  
* Não criar controles sem comportamento definido.  
* Não apresentar funcionalidades futuras como se já estivessem disponíveis.  
* Preservar consistência entre as versões.  
* Expandir a interface conforme surgirem necessidades concretas.

A evolução visual deverá acompanhar o escopo funcional estabelecido no Documento de Requisitos.

---

## **12\. Questões em aberto e futuras expansões**

Esta seção reúne decisões que ainda precisam ser desenvolvidas. Não representa requisitos confirmados nem obrigações de implementação da V1.

Seu objetivo é orientar futuras revisões deste documento.

### **12.1. Arquitetura visual detalhada**

* Qual será a largura padrão da barra lateral?  
* A barra lateral poderá ser totalmente recolhida?  
* Qual será o comportamento da barra superior?  
* Como será identificado visualmente o workspace ativo?  
* Quais elementos deverão permanecer visíveis durante a navegação?

### **12.2. Dashboard**

* Como será apresentada a atividade recente?  
* Qual será a quantidade inicial de pesquisas exibidas?  
* Haverá paginação ou carregamento progressivo?  
* Como serão apresentados os estados vazios?  
* Como serão tratados empates na ordenação?  
* Como será calculada exatamente a quantidade de flashcards de uma pesquisa, considerando baralhos arquivados e cartões suspensos?

### **12.3. Navegação contextual**

* Os grupos terão indicadores de atividade?  
* A preferência de expansão será individual por pesquisa ou global?  
* Como será apresentada a navegação quando uma pesquisa possuir muitos recursos?  
* Haverá atalhos de teclado para navegação?

### **12.4. Workspace e área central**

* Quais funcionalidades exigirão layouts especiais?  
* Como será o comportamento de leitura em documentos extensos?  
* Haverá possibilidade de visualizar documentos e interagir com a IA simultaneamente?  
* Quais funcionalidades poderão utilizar visualizações divididas?  
* Quando será necessário implementar o painel lateral secundário?

### **12.5. Identidade visual e design system**

* Quais famílias tipográficas serão utilizadas?  
* Quais serão as paletas definitivas dos três temas?  
* Quais serão os padrões de espaçamento e dimensões?  
* Quais componentes formarão o design system inicial?  
* Como será definida a hierarquia de botões, menus e controles?  
* Quais padrões de acessibilidade deverão ser adotados?

### **12.6. Configurações**

* Como serão organizadas as categorias de configurações?  
* Quais preferências serão globais e quais poderão variar por pesquisa?  
* Haverá personalização adicional da interface?  
* Como serão apresentadas configurações específicas de IA e aprendizagem?

### **12.7. Responsividade**

* Quais resoluções deverão ser consideradas como referência?  
* Como a interface se comportará em monitores menores?  
* Quais elementos poderão ser reorganizados ou ocultados?  
* Em que momento será necessário desenvolver uma experiência mobile?

### **12.8. Estados e feedback**

* Como serão apresentados estados de carregamento?  
* Como serão comunicadas falhas de leitura e processamento?  
* Como serão apresentadas notificações internas?  
* Como será indicado o salvamento automático?  
* Como serão tratados estados vazios e ausência de resultados?  
* Como será comunicada a indisponibilidade de funcionalidades?

### **12.9. Fluxos completos de utilização**

Ainda deverão ser documentados os fluxos de:

* Criação e configuração inicial de pesquisas.  
* Inclusão e organização de documentos.  
* Busca, avaliação e aprovação de fontes.  
* Leitura e interação com a IA.  
* Investigação cruzada.  
* Construção e organização do conhecimento.  
* Criação e gerenciamento de baralhos.  
* Revisão de flashcards.  
* Sessões Teach the AI.  
* Arquivamento e restauração de pesquisas.

---

## **13\. Próximos documentos de design**

Este documento funciona como referência central de Product Design.

Conforme o projeto avançar, suas especificações poderão ser detalhadas em documentos complementares:

| Documento | Conteúdo |
| ----- | ----- |
| Information Architecture | Estrutura detalhada da informação e navegação. |
| User Flows | Fluxos completos de utilização. |
| Screen Specifications | Especificação das telas, componentes e comportamentos. |
| Design System | Cores, tipografia, espaçamento e componentes reutilizáveis. |
| Interaction States | Estados de interface, carregamento, erros e feedback. |

Esses documentos deverão complementar as diretrizes aqui estabelecidas, evitando duplicação desnecessária.

---

**Princípio orientador do Product Design:**

O Research Companion deve oferecer um ambiente de trabalho intelectual organizado, silencioso e consistente, no qual a tecnologia permaneça a serviço da investigação, da compreensão e da autonomia do usuário.

