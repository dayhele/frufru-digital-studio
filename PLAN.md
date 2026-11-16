# FruFru Digital Studio — plano de ação técnico completo

## Retomada implementada — 2026-11-16

O diagnóstico de migração abaixo é histórico. Os bloqueios de compilação foram resolvidos: Button aceita ref de React 19, HeroSection/HeroArcade e FooterConnect existem e estão integrados. O restante deste documento preserva o briefing e seus critérios; não é uma declaração de aprovação industrial ou publicação.

### Entregue nesta retomada

- Hero procedural R3F com mascote oficial, orientação/interação, órbita/glow, acesso DOM ao jogo, pausa e fallback de WebGL/contexto perdido.
- Newsletter e pedido de projeto pelo adaptador único; ausência de configuração, rejeição e rede têm erro fiel. Removidos sucesso simulado e log de leads.
- Paleta reconciliada sem ink-deep; cases/depoimentos/especificações demonstrativos identificados na interface.
- Navegação por hash acompanha crescimento de conteúdo lazy sem disputar ações do visitante; menu móvel devolve foco ao fechar com Esc.
- Artigo trata corpo MDX ausente/rejeitado; clipboard informa falha em vez de fingir cópia.
- Arcade: foco, pausa/retomada, mute, retry, cleanup e vitória; colisão precede pontuação; recorde protegido contra indisponibilidade de storage; sem promessa de benefício não aprovado.
- Packaging: cola limitada à profundidade, tampa 3D coerente com SVG, sequência de dobras, enquadramento, segurança/cotas e XML escapado.

### Evidência executada

- `npm run build`: aprovado (TypeScript + Vite). Aviso restante: chunk lazy compartilhado Three/R3F com aproximadamente 918 kB minificados / 243 kB gzip.
- `node --test tests/packaging.test.mjs`: 3 testes aprovados.
- Chromium: screenshots desktop 1440×900 e mobile 390×844; hero, contato, dobras 0/50/100% e luva de profundidade 10 mm observados.
- Portfólio: filtro, case, Esc, retorno de foco e CTA para contato; menu móvel; artigo MDX por link direto, cópia real de hex e slider por seta.
- Falha de import MDX injetada via rede apresentou alerta recuperável, sem spinner eterno.
- Jogo real: ready, pausa/continuar, gameover, retry, mute, saída; DEV99→100 por teclado com aleatoriedade fixa de teste, créditos estáticos e claim mobile. Claim sem endpoint mostrou explicitamente que nada foi enviado.
- Motor isolado em canvas separado: 54→55, 84→85 e 99→100; vitória emitida uma vez. Isso não equivale a uma partida manual completa de 0 a 100.
- SVG em 16 combinações extremas: XML válido, escala mm, grupos exigidos, contorno único fechado sem cruzamentos próprios e área com erro de aproximação máximo de 0,084 mm². Download real da luva 100×60×10 mm observado.
- Sem WebGL: navegação, controles e dieline disponíveis. Perda real de contexto do hero ativou fallback sem erro runtime observado. Reduced motion mostrou gabinete frontal e dobras estáticas.
- Receptor HTTP local descartável: aceite 202, rejeição 422 e falha de rede refletidos na newsletter. Nenhum provedor externo ou entrega de e-mail foi testado; serviços de prova encerrados.
- Preview de produção: artigo profundo, 404 e `?stage=99` ignorado (jogo começou em zero); nenhum erro runtime observado nesses caminhos.

### Dependências confirmadas pelo usuário

Endpoint, PSDs/ZIPs e benefício comercial **ainda não existem**. `https://naotemainda.com` foi entendido como placeholder e não configurado. Nenhum recurso foi inventado, nenhuma publicação/commit/push foi feito.

Antes de publicar: fornecer cases/assets e licença reais, serviço de leads com CORS/validação/entrega, condições comerciais aprovadas e rewrite da SPA no provedor. Falta aprovação física da embalagem e medição em dispositivo móvel real; o cursor continua provisório. Backend/portal permanecem fora do MVP.

## 1. Destino, escopo e estado real

- Repositório correto: `https://github.com/dayhele/frufru-digital-studio`.
- Checkout de trabalho: `/home/lucca/orca/frufru-digital-studio`.
- Não trabalhar em `/home/lucca/orca/portfolio` nem no worktree de `portfolio` que recebeu o nome da URL do FruFru por engano.
- Objetivo: estúdio comercial e ecossistema de recursos para designers, com hero espacial 3D, arcade opcional, portfólio, mockups PSD, Packaging Studio, Insights e captação de leads.
- Stack aprovada pelo usuário: **React + Vite + TypeScript estrito + Tailwind CSS v4 + React Three Fiber**. Não usar Next.js.
- Idioma: pt-BR; PLAY, START, GAME OVER e STAGE podem permanecer em inglês no arcade.
- Escopo da correção de worktree: migrar o código parcial e este plano; restaurar o portfólio ao touchpoint da câmera inclinada. Esta migração não equivale à conclusão do site.

### Migração realizada

O trabalho havia sido gerado em:

`/home/lucca/orca/workspaces/portfolio/https-github.com-dayhele-frufru-digital-studio`

Os fontes, assets e configurações foram transferidos para o checkout correto. As configurações Next.js e ESLint dependente de Next foram removidas, e `AGENTS.md`, `.gitignore` e README foram ajustados ao Vite. O lockfile foi sincronizado com o nome e versão do pacote FruFru.

Backup anterior à migração:

`/home/lucca/.local/state/frufru-migration-ED2k6x`

Conteúdo do backup:

- `frufru-partial/`: implementação gerada antes da transferência, incluindo o harness descartável de packaging.
- `frufru-original/`: scaffold Next.js original do repositório de destino.
- `frufru-source-before-migration/`: árvore `src` original do FruFru.
- `portfolio-camera/`: snapshot do portfólio principal, incluindo os ajustes de perspectiva ainda sem commit.
- `portfolio-restore-paths.nul`: lista de paths do worktree incorreto restaurados a partir de HEAD.

Nenhum commit ou push foi feito nesta correção. Não transferir histórico Git, `.git`, código ASCII ou configuração do portfólio para o FruFru.

### Touchpoint preservado no portfólio

O último trabalho do portfólio foi mudar a visão totalmente superior para uma cena inclinada: mar com perspectiva, barco oblíquo com mastros erguidos e profundidade compartilhada entre pássaros, vento, névoa e partículas. Esse estado está no checkout `/home/lucca/orca/portfolio`, ainda sem commit sobre `486f740`.

A restauração manteve o checkout principal intacto e copiou seus arquivos de perspectiva para o worktree incorreto. `AsciiPerspective.ts` foi preservado. O documento não relacionado `untitled.md` ficou somente no checkout original, sem alteração.

## 2. Inventário de implementação

| Área | Código já migrado | Estado |
| --- | --- | --- |
| Fundação | `index.html`, `vite.config.ts`, `tsconfig.json`, `src/main.tsx`, fontes locais via Fontsource | Integrada; build aprovado |
| Design system | `src/app/globals.css`, `ui/Button`, `Badge`, `Modal`, `SectionHeading`, `CoverArt`, `field` | Ref corrigida; paleta estrita e foco preservados |
| Shell | `src/app/layout.tsx`, `TopNav`, rotas Home, InsightPost e NotFound | Integrado; navegação/âncoras exercitadas |
| CMS | `src/lib/cms/types.ts`, `mockData.ts`, `client.ts`, `useCms.ts` | Contratos e dados demonstrativos escritos |
| Portfólio | `PortfolioBento.tsx`, filtros e modal de case | Fluxos exercitados; conteúdo demonstrativo sinalizado |
| Mockups | `DesignLab.tsx`, categorias, especificações e estados de download | Escrito; nenhum PSD/ZIP real fornecido |
| Packaging | `lab/PackagingStudio.tsx`, `lab/BoxViewer.tsx`, `lib/packaging/dieline.ts` | Dobras/SVG/extremos verificados; sem aprovação industrial |
| Insights | `InsightsBlog.tsx`, três artigos MDX, ColorPalette e BeforeAfter | Rota, cópia, slider e erro de import exercitados |
| Jogo | `ArcadeMinigame.tsx`, `game/engine`, `sprites`, `audio`, `difficulty`, `storage` | Integrado; fluxos e marcos exercitados conforme evidência acima |
| Hero 3D | `HeroSection.tsx`, `HeroArcade.tsx` | Criados; desktop/mobile/reduced motion/fallback observados |
| Newsletter e contato | `FooterConnect.tsx` | Implementados; dependem de endpoint real |
| Leads | Adaptador `src/lib/leads/index.ts`, `.env.example` | Sem simulação; ainda sem serviço de produção |
| Portal futuro | `src/lib/portal/types.ts` | Interfaces apenas; backend fora do MVP |
| Assets | Mascot, mascot-alt, wordmark oficiais e cursor de patinha gerado | Migrados; cursor provisório |

**Importante:** os subagentes foram interrompidos após escrever os arquivos de jogo e packaging. A existência do código não comprova testes, correção geométrica ou conclusão desses módulos.

### Evidência de verificação na migração

- 54 arquivos de fontes/assets/configurações conferidos byte a byte no destino antes dos ajustes de documentação e lockfile.
- 35 arquivos do checkout principal do portfólio iguais ao snapshot anterior à migração.
- 34 arquivos do worktree restaurado iguais ao touchpoint do portfólio; o arquivo não relacionado `untitled.md` não foi copiado.
- `npm run build` no portfólio restaurado: **aprovado** (`tsc` + Vite).
- `npm run build` no FruFru: **reprovado no TypeScript**, com os problemas abaixo. O bundle Vite não chegou a ser gerado.

Problemas observados:

1. `src/app/layout.tsx`: import não resolvido de `@/components/FooterConnect`.
2. `src/app/routes/Home.tsx`: import não resolvido de `@/components/HeroSection`.
3. `src/components/ArcadeMinigame.tsx`: três erros de tipagem ao passar `ref` para Button nas ações Continuar, Jogar de novo e Pular créditos.

Esses erros são o ponto inicial de retomada. Não resolver criando componentes vazios, removendo ações ou suprimindo o TypeScript.

## 3. Arquitetura e adaptação de Next.js

| Conceito do briefing original | Implementação aprovada em Vite |
| --- | --- |
| App Router/layout | React Router com RootLayout, Outlet e rotas explícitas |
| `next/font/google` | Fontsource auto-hospedado; CSS variables/font tokens |
| `next/dynamic`, `ssr: false` | `React.lazy` + Suspense; apenas o shell é carregado inicialmente |
| `next/image` | `img` com dimensões, lazy loading e decoding quando apropriado |
| Artigos | `@mdx-js/rollup`, `import.meta.glob`, corpo MDX sob demanda |
| API routes | Serviço externo ou função serverless separada, não segredos no frontend |
| Hydration | SPA com `createRoot`; não há renderização servidor/cliente para hidratar |
| Portal futuro | Contrato AuthProvider desacoplado; Supabase Auth/Google OAuth possível posteriormente |

### Estrutura de referência

```text
src/
  main.tsx                         fontes, ícones, router
  app/
    globals.css                    tokens, sombras, cursor, foco, reduced motion
    layout.tsx                     skip link, TopNav, Outlet, FooterConnect
    routes/
      Home.tsx                     hero, work, lab, insights, lazy arcade
      InsightPost.tsx              metadados + corpo MDX sob demanda
      NotFound.tsx
  components/
    HeroSection.tsx                shell HTML comercial do hero [a criar]
    HeroArcade.tsx                 cena R3F carregada sob demanda [a criar]
    ArcadeMinigame.tsx             modal/HUD/créditos/recompensa
    PortfolioBento.tsx
    DesignLab.tsx
    InsightsBlog.tsx
    FooterConnect.tsx              newsletter + projeto + contato [a criar]
    ui/                            primitivas reutilizáveis
    lab/
      PackagingStudio.tsx          controles, preview, exportação
      BoxViewer.tsx                cena e hierarquia de dobras R3F
    mdx/                           paleta, comparador e tipografia editorial
  content/insights/                 artigos .mdx
  game/
    engine.ts                      física e render Canvas 2D
    difficulty.ts                  curva e constantes 55/85/100
    audio.ts                       sons Web Audio procedurais
    sprites.ts                     mapas de pixels autorais
    storage.ts                     recorde/mute com localStorage protegido
  hooks/
    useNearViewport.ts
    usePrefersReducedMotion.ts
  lib/
    cms/                           tipos, dados, serviço, hook
    leads/                         contrato de envio de leads
    packaging/dieline.ts           geometria em milímetros + SVG
    portal/types.ts                contratos do futuro portal
    palette.ts                     cores de Canvas/WebGL/SVG
    contrast.ts                    contraste WCAG
    scrollToSection.ts             navegação após fechar modal
public/
  brand/                           assets oficiais
  cursor-patinha.png
```

### Rotas e navegação

- `/`: página comercial completa, navegável sem abrir o jogo ou carregar WebGL.
- `/#work`, `/#lab`, `/#lab-mockups`, `/#lab-packaging`, `/#insights`, `/#contact`, `/#newsletter`: âncoras públicas.
- `/insights/:slug`: artigo individual; rota desconhecida recebe página 404.
- Cases: modal acessível, não nova rota neste MVP.
- Menu superior sempre disponível no site. No jogo, manter Sair do jogo sempre visível.
- Após fechar modal e navegar a uma seção, aguardar a restauração de foco do dialog antes de rolar/focar a seção. Já existe `scrollToSection` para isso.
- Hospedagem estática deve reescrever URLs de aplicação, como `/insights/slug`, para `index.html`, sem interceptar assets existentes.

## 4. Sistema visual obrigatório

| Token | Hex | Função |
| --- | --- | --- |
| cream | `#FFF6E9` | papel e fundo principal |
| ink | `#401708` | texto, borda e sombra dura; nunca preto puro |
| pink | `#FBC4CE` | CTAs e destaques do mascote |
| pistachio | `#D9D273` | status, PSD, sucesso |
| butter | `#FFF8C7` | estrela e destaques quentes |
| cloud | `#E0EAFF` | áreas de laboratório e tecnologia |

- Bordas sólidas de 2–3 px; sombras sem blur de 4 px em cards e 2 px em controles compactos.
- Botões simulam pressão com deslocamento e redução da sombra, sem mudança de layout.
- Fontes escolhidas entre as opções do briefing: Tilt Warp, Press Start 2P, Croissant One e Plus Jakarta Sans.
- Corpo com ink sólido sobre fundos claros; não assumir AAA apenas por usar uma fonte ou cor: medir cada par e cada estado. O contraste calculado de ink sobre os cinco fundos oficiais varia de 9,98:1 a 14,59:1.
- Cursor de patinha no body e interativos; manter comportamento nativo onde necessário e não remover foco visível.
- Anel ink nas superfícies claras; nas escuras, anel claro contrastante. Não usar ink invisível sobre o próprio ink.
- A extensão `ink-deep: #260D04` está no código migrado para profundidade espacial. Antes de concluir, reconciliar com a exigência de paleta estrita: preferir profundidade por luz/opacidade e materiais derivados do ink oficial, sem espalhar novas cores no UI.
- Cards comerciais, badges, formulários e modais seguem o mesmo sistema; não criar uma segunda convenção.

## 5. Hero espacial com React Three Fiber

### Composição

- Ambiente espacial espresso, pontos estelares com parallax sutil e iluminação pastel rosa/azul/manteiga.
- Gabinete arcade modelado proceduralmente: corpo com perfil lateral extrudado, laterais, marquee, moldura/tela inclinada, painel de controle, joystick, botões, porta-fichas e pés.
- Mascote oficial como acento reconhecível; usar a textura transparente oficial se for um billboard ou criar silhueta procedural fiel.
- Estrela de quatro pontas em órbita, iluminando o mascote ao receber interações.
- HTML do título, descrição, menu e CTAs aparece antes do Canvas; nada depende de WebGL para vender o trabalho.

### Interações

1. Cabinet começa em perfil lateral e interpola suavemente para frente conforme proximidade/movimento do ponteiro.
2. Toque e foco de teclado têm caminho equivalente; não depender de hover.
3. Tela acende e mostra PLAY/START pulsante; clique abre ArcadeMinigame.
4. Botão DOM equivalente abre o mesmo jogo para teclado/leitor de tela.
5. Cada clique/interação soma impulso à velocidade orbital; velocidade retorna gradualmente à base, com limite para não descontrolar.
6. Glow sobre mascote acompanha o impulso, sem flashes fortes.
7. CTA destacado Explorar estúdio/Ver trabalhos rola diretamente a `#work`, sem passar pelo jogo.

### Execução e performance

- `HeroSection.tsx`: shell HTML e Suspense com fallback leve.
- `HeroArcade.tsx`: Canvas R3F, gabinete, mascote, estrelas, luzes e órbita.
- `useFrame` trabalha com refs e delta; não usar setState a cada frame nem criar vetores/geometrias repetidamente no loop.
- Pausar render/animação fora da viewport e quando a aba estiver oculta; limitar DPR em dispositivos móveis.
- Reduzir custo com materiais emissivos e luzes simples antes de post-processing.
- `prefers-reduced-motion`: gabinete frontal estático; sem parallax e órbita automática, CTAs continuam ativos.
- Contexto WebGL indisponível ou perdido: fallback visual leve e navegação comercial preservada; não tela vazia.
- Descartar texturas e geometrias não compartilhadas ao desmontar.

## 6. Arcade MIAU ORBITAL

### Identidade e controles

- Canvas lógico de 256×384, render escalado pixelated sem smoothing; sprites e sons autorais.
- Gato-piloto com jetpack atravessa tubos espaciais; criaturas/plantas alienígenas não copiam assets de jogos existentes.
- Espaço, seta para cima, W, clique e toque voam; P pausa; Esc sai pelo dialog.
- Controles de formulário e botões não devem disparar flap ao receber teclado.
- HUD DOM acessível: pontuação, tier e recorde. Anunciar apenas marcos e game over com aria-live, não cada frame/ponto.
- Mute e Sair do jogo fixos e acessíveis em todos os estados, inclusive créditos e claim.

### Curva planejada

| Stage/score | Tier | Velocidade | Vão | Obstáculos |
| --- | --- | --- | --- | --- |
| 0–54 | CRUISE | 78→108 px/s | 124→100 px | tubos estáticos; espaçamento 150→132 px |
| 55–84 | HYPER | 120→138 px/s | 96→88 px | oscilação vertical 10→20 px, período 2,4 s |
| 85–99 | EXTREME | 146→156 px/s | 86→82 px | oscilação 22→26 px, período 1,9 s e plantas telegráficas |
| 100 | vitória | encerrar partida | — | créditos e recompensa |

- Passo fixo de 1/60 s, delta limitado para não atravessar obstáculos após travar/trocar aba.
- Gravidade 900 px/s², flap em -250 px/s, velocidade de queda limitada a 380 px/s.
- Hitbox menor que o sprite; colisão consistente entre tubos, bocas e plantas.
- Plantas só avançam no vão com antecipação visível; evitar sequência procedural impossível.
- Um ponto por obstáculo passado; vitória dispara uma vez exatamente em 100.
- Recorde e mute persistem via localStorage com try/catch; modo privado não pode quebrar o jogo.
- AudioContext só após gesto do usuário; sons de flap, ponto, hit, milestone e vitória por osciladores/ruído.
- Destruir rAF, timers, listeners e áudio ao sair. Ocultar a aba pausa a partida em vez de causar morte instantânea ao retornar.

### Estados e recompensa

`ready → playing ↔ paused → gameover → ready`, ou `playing → credits → claim → claimed`.

- Créditos rolantes retro após 100; Pular créditos sempre funciona. Movimento reduzido apresenta créditos legíveis sem rolagem automática.
- Formulário de nome/e-mail/consentimento com validação, estados de envio, erro e confirmação verdadeira.
- Exibir explicitamente junto ao formulário: **desconto não cumulativo**, **exclusivo para novos clientes sem contrato anterior**.
- O percentual de 10% presente no mock é demonstrativo, não condição comercial fornecida pelo usuário. Parametrizar e confirmar o benefício real antes de publicar.
- Não colocar código de desconto no bundle. Serviço externo recebe o claim e envia o código por e-mail.
- Pontuação em cliente/localStorage não prova elegibilidade. Se o desconto exigir garantia contra fraude, validação e emissão precisam de serviço confiável; não alegar proteção inexistente.
- `?stage=N` existe somente em DEV para testar 54/55, 84/85 e 99/100; nunca habilitar atalho público em produção.

## 7. Workspace comercial

### Work / PortfolioBento

- Bento assimétrico com seis cases, filtros por identidade, embalagem, editorial e digital.
- Cada case apresenta capa, resumo, cliente/ano/disciplinas e abre modal com desafio, solução, entregas, métricas, paleta, galeria e CTA de contato.
- Modal: título associado, foco preso, Esc fecha, foco retorna ao gatilho, fundo inerte e scroll bloqueado.
- As áreas clicáveis precisam de nome acessível e foco visível sobre o card inteiro.
- Não publicar métricas/depoimentos fictícios como prova de trabalhos reais; substituir ou rotular a demonstração também na interface.

### Lab A / Mockups PSD

- Oferta separada do Packaging Studio, com título, descrição e navegação própria.
- Categorias, dimensão em pixels, 300 dpi, smart objects, licença, peso e ZIP explícitos.
- Modelo de download já distingue `available` com URL real e `coming-soon` sem link quebrado.
- Arquivos PSD de alta resolução e ZIPs não foram fornecidos. Obter/criar recursos reais e verificar seu conteúdo antes de ativar Baixar ZIP.
- Estado Em breve não é substituto final para o download pedido; manter a lista de espera como estado honesto até existirem assets.
- Não renomear qualquer arquivo como PSD para simular entrega.

### Lab B / Packaging Studio

- Duas estruturas planejadas: cartucho tuck-end e luva.
- Dimensões internas em mm, defaults e limites por template; troca de estrutura redefine as medidas.
- Controles de largura/altura/profundidade, dobra 0–100%, planificar/montar, cores oficiais e OrbitControls.
- Preview sem WebGL mantém dieline e download disponíveis.
- Geometria 2D e 3D compartilha proporções: quatro painéis, aba de cola e, no tuck-end, tampas/abas/dust flaps.
- Dobras em hierarquia de hinges: paredes primeiro, dust flaps depois, tampas e encaixes por último.
- Verificar 0%, intermediários e 100%: orientações, folgas, encaixe, câmeras ajustadas às medidas e ausência de z-fighting/gaps involuntários.
- `buildDieline`: contorno externo único fechado e sem auto-interseções, vincos e rótulos; margem de sangria + segurança.
- Export SVG vetorial 1:1 com width/height em mm e grupos `sangria`, `corte`, `vinco`, `cotas`; nomes/textos escapados para XML.
- Sangria padrão de 3 mm; corte contínuo, vinco tracejado, rótulos e dimensão planificada visíveis.
- Validar medidas extremas e dobras; conferir fisicamente com a gráfica. Um SVG de faca não substitui aprovação de material, espessura, tolerância, CMYK ou arte-final.
- Blob de download deve ser revogado depois da entrega e não antes de o navegador começar a baixar.

### Insights

- Lista editorial com destaque e três posts iniciais; corpo MDX carregado por slug.
- Categorias, autor, data, tempo de leitura e tags em interfaces estritas do CMS.
- Paletas clicáveis copiam hex e mostram contraste; tratar Clipboard API indisponível sem fingir cópia.
- BeforeAfter com range nativo e labels, operável por toque/teclado e valor acessível.
- Estados: carregamento, artigo inexistente e erro no carregamento do corpo; não spinner eterno se o import falhar.
- Datas formatadas em UTC para não voltar um dia no fuso brasileiro; atualizar título da página por rota.

### Newsletter e contato / FooterConnect

- Bloco newsletter com acesso antecipado a packs de textura/mockup, campo e-mail, consentimento, envio, sucesso e erro.
- CTA de projeto claro, separado da newsletter; e-mail real existente: `oi@frufrudigital.com`.
- Link Instagram existente: `https://instagram.com/frufrudigital`.
- Pode usar mailto como contato direto, mas não como sucesso silencioso de formulário não enviado.
- Implementar `#contact` e `#newsletter`, hoje referenciados por outras seções.
- Reaproveitar `getSiteSettings` e `submitLead`; não duplicar dados ou convenção de campos.

## 8. Camada de conteúdo e portal futuro

### CMS

- Tipos existentes: Project, PsdMockup, PackagingTemplate, InsightPost, SiteSettings, Cover e tokens de paleta.
- `client.ts` expõe getters assíncronos; componentes não importam mockData diretamente.
- Adaptador de Sanity/Payload futuro mapeia documentos para os mesmos contratos, sem acoplar a UI aos SDKs.
- Capa aceita imagem real ou composição generativa; substituir arte demonstrativa por cases e previews reais quando disponíveis.
- Estados de erro/carregamento/vazio explícitos; efeitos devem ignorar respostas após desmontagem ou troca de slug.

### Portal, fora do MVP

- Manter UserRole admin/client, PortalUser, AuthSession/AuthProvider, ClientProject, ProjectStep e Contract separados de CMS e leads.
- Nenhum backend, tela de login ou portal completo será criado neste passe.
- Futuro: Supabase PostgreSQL/Storage, Google OAuth, associação cliente/projetos, contratos assinados, stepper e resumo de status copiável.
- Autorização não pode depender apenas de um campo role no frontend. Aplicar RLS/políticas e verificação no serviço quando o backend existir.
- URLs de contrato com assinatura temporária; nunca chave service-role nem documentos privados em `VITE_*`.
- Auth.js do briefing é opção futura somente se houver serviço compatível; não portar arquitetura Next para esta SPA apenas por esse nome.

## 9. Leads, segurança e configuração

- `.env.example`: `VITE_LEADS_ENDPOINT` público, sem segredos.
- O endpoint precisa aceitar JSON por POST e permitir a origem do domínio via CORS; validar dados e consentimento do lado do serviço.
- Newsletter, claim e projeto têm tipos distintos, fonte identificável e feedback fiel ao retorno do serviço.
- O adaptador atual simula sucesso em DEV sem endpoint e faz log do lead: remover a falsa confirmação ou deixar o modo demonstração inequivocamente explícito antes da verificação final. Não afirmar que um e-mail foi enviado quando não foi.
- Falha de rede, rejeição e falta de configuração devem aparecer com recuperação e contato direto.
- Definir serviço real antes de publicar captura funcional; o frontend sozinho não entrega e-mail ou desconto.
- Não armazenar dados pessoais de formulários em localStorage. Recorde/mute do jogo não precisam identificar ninguém.

## 10. Sequência de implementação retomável

### Fase 0 — Fundação e integração inicial

1. Trabalhar exclusivamente no checkout FruFru indicado no início deste documento.
2. Corrigir Button para aceitar ref de HTMLButtonElement em React 19, sem casts para esconder erro; preservar os três callsites de foco do jogo.
3. Implementar HeroSection/HeroArcade e FooterConnect completos, sem stubs.
4. Manter React.lazy/Suspense nas superfícies pesadas; não importar Three no shell por acidente.
5. Confirmar compatibilidade do pipeline MDX com Vite 8 e fontes auto-hospedadas.

Aceite: entrada real compilável, navegação alcança seções e não há imports pendentes. O primeiro check desta fase só deve acontecer após a implementação desses itens, não para reconfirmar os erros já registrados.

### Fase 1 — Design system e dados

1. Reconciliar paleta estrita, cursor, tipografia, sombras e anéis de foco.
2. Corrigir primitivas e contratos de dados onde a integração revelar necessidade; não adicionar segunda camada de componentes.
3. Marcar conteúdo demonstrativo na interface e preparar a substituição pelo CMS.

Aceite: todas as seções usam o mesmo sistema visual e apenas o serviço de CMS.

### Fase 2 — Navegação e workspace

1. Finalizar menu desktop/mobile, skip link, scroll por hash e foco após modais.
2. Exercitar filtros e modal de portfólio.
3. Conferir separação Mockups PSD/Packaging, badges e disponibilidade honesta dos arquivos.
4. Exercitar artigos, paleta clicável e comparador, incluindo links profundos e erro de import.
5. Finalizar newsletter, contato e feedback real do adaptador de leads.

Aceite: um cliente chega ao trabalho e ao contato sem abrir o jogo ou usar 3D.

### Fase 3 — Hero R3F

1. Modelar gabinete e integrar marca/mascote.
2. Implementar orientação por ponteiro, tela, aceleração orbital e glow.
3. Garantir equivalência DOM/teclado/toque.
4. Implementar pause fora de vista, reduced motion e fallback WebGL.

Aceite: assinatura interativa do briefing presente; navegação comercial nunca bloqueada.

### Fase 4 — Minigame

1. Integrar código existente ao modal e corrigir ciclo de foco/saída.
2. Exercitar física, colisões, dificuldade e recorde.
3. Exercitar milestones 55/85 e vitória 100 com auxílio DEV.
4. Conferir áudio/mute, pausas, retry e cleanup.
5. Créditos e claim com condições comerciais explícitas e envio verdadeiro.

Aceite: fluxo de ready até gameover/retry e vitória/claim, navegável por teclado e toque.

### Fase 5 — Packaging Studio e assets reais

1. Exercitar as duas estruturas, dimensões e sequência completa de dobras.
2. Comparar geometria planificada, hierarquia 3D e export SVG nas mesmas medidas.
3. Verificar escala 1:1, camadas, download e medidas extremas.
4. Substituir previews/ZIPs de mockups quando fornecidos; nenhum link inválido.

Aceite: caixa montável e dieline vetorial coerente, sem alegação de aprovação industrial não realizada.

### Fase 6 — Verificação e publicação

1. Rodar o check mais específico de cada caminho modificado; não repetir build a cada arquivo.
2. Ao terminar a integração, `npm run build` comprova tipagem e bundle.
3. Abrir o site real no Chromium, desktop 1440×900 e mobile 390×844, com screenshots.
4. Exercitar teclado, toque, reduced motion, fallback sem WebGL e formulários configurados.
5. Registrar falhas observadas, corrigir em lote e confirmar os caminhos alterados.
6. Documentar comandos, assets, endpoint, rewrite de SPA e resultado real dos checks.

Aceite final: zero erros TypeScript/runtime observados nos cenários exercitados; todos os itens do briefing presentes ou, quando dependem de assets/serviços externos, claramente identificados e configurados antes da publicação.

## 11. Matriz de prova final

| Cenário | Resultado exigido |
| --- | --- |
| Home sem WebGL | título, navegação, trabalhos e contato disponíveis |
| Hero desktop | perfil para frente, PLAY, órbita acelerada e glow visíveis |
| Hero mobile/reduced motion | sem dependência de hover ou animação para agir |
| Portfólio | filtros funcionam; case abre/fecha; foco retorna; CTA chega ao contato |
| PSD | smart objects/resolução/licença corretos; ZIP real quando available |
| Packaging 0/50/100% | forma coerente; caixa fecha; dimensão muda geometria |
| SVG baixado | XML válido, medidas mm, quatro grupos e contorno fechado |
| Insights | rota direta abre; paleta copia; slider opera com setas |
| Arcade normal | start, flap, hit, gameover, retry e saída funcionam |
| Arcade 55/85/100 | progressão, créditos, claim e condições corretas |
| Audio/storage | som só após gesto; mute/recorde persistem; storage bloqueado não derruba |
| Troca de aba | jogo pausa sem acumular tempo perigoso |
| Formulários | erro/sucesso refletem envio real; nenhum segredo/código no bundle |
| Build/deploy | `npm ci`, build e preview; rotas profundas com fallback de SPA |

## 12. Limites de conclusão e próximos passos imediatos

A integração frontend foi realizada e exercitada nos cenários registrados no início deste plano. A liberação comercial continua condicionada a:

1. Fornecer conteúdo comercial comprovado e arquivos PSD/ZIP reais com licença definida.
2. Implementar/configurar endpoint real de leads e verificar entrega, consentimento e proteção contra abuso.
3. Aprovar benefício e condições comerciais antes de habilitar qualquer promessa de recompensa.
4. Conferir embalagem física, material, espessura e tolerâncias com a gráfica.
5. Configurar hospedagem/rewrite da SPA e medir o resultado em dispositivos reais.

Não continuar o desenvolvimento FruFru no portfólio e não mexer no touchpoint da câmera para realizar entregas deste projeto.
