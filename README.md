# FruFru Digital Studio

Frontend integrado com React, Vite, TypeScript estrito, Tailwind CSS v4 e React Three Fiber.

## Diretório correto

`/home/lucca/orca/frufru-digital-studio`

As alterações foram migradas do worktree criado por engano no repositório do portfólio. O portfólio permanece separado, no estado da câmera inclinada.

## Plano e estado da entrega

O plano técnico completo, critérios de aceite, inventário da migração e próximos passos estão em [PLAN.md](./PLAN.md).

**Estado: demonstração funcional, ainda não liberada para publicação comercial.** Hero 3D, arcade, portfólio, ferramentas, artigos, newsletter e contato integrados. Falta conteúdo comercial real, PSDs/ZIPs, endpoint de leads e definição do benefício; o usuário confirmou que esses recursos ainda não existem.

## Comandos

Node.js 22.18+ ou 24+ para Vite e os testes nativos com importação de TypeScript.

```sh
npm ci
npm run dev
npm run typecheck
npm run build
node --test tests/packaging.test.mjs
npm run preview
```

Build e três regressões de geometria aprovados. A verificação no Chromium cobriu desktop 1440×900 e mobile 390×844, fluxos do arcade, dobras/SVG, MDX e fallbacks sem WebGL. O bundle Three/R3F é lazy e ainda gera aviso de chunk acima de 500 kB; não foi medida performance em celular físico.

## Configuração de leads

Copie `.env.example` para `.env.local` e configure `VITE_LEADS_ENDPOINT` somente quando houver um serviço real. Sem ele, o formulário informa que nada foi enviado, inclusive em desenvolvimento. Não há simulação de sucesso nem log de dados pessoais.

Não colocar códigos de desconto, segredos de autenticação ou chaves privilegiadas em variáveis `VITE_*`, que são públicas.

O serviço deve aceitar POST JSON com `kind` (`newsletter`, `reward-claim` ou `project-inquiry`), `email`, `consent`, `submittedAt` e campos opcionais `name`, `message`, `meta`. Precisa permitir a origem do site e o header `Content-Type` via CORS, validar dados/consentimento, controlar abuso e implementar a entrega de e-mails. Resposta HTTP 2xx significa solicitação recebida, não comprovação de e-mail entregue. O teste local exercitou 202, 422 e falha de rede; não comprova integração com um provedor de produção.

## Conteúdo

Os cases, números, depoimentos e recursos em `src/lib/cms/mockData.ts` são demonstrações, não resultados comerciais comprovados. Os mockups PSD não foram fornecidos. O plano registra como publicar os arquivos reais e habilitar downloads sem links quebrados.

## Hospedagem estática

Publique `dist/` após `npm run build`. Configure fallback de rotas de aplicação para `/index.html`, preservando assets existentes: `/insights/:slug` precisa abrir diretamente. O preview do Vite comprovou esse caminho local; o provedor final ainda não foi configurado.

## Limites

- O arcade permite `?stage=N` apenas no servidor DEV; o preview de produção ignora o parâmetro. Pontuação no cliente não comprova elegibilidade comercial.
- Sem benefício aprovado, o claim apenas solicita contato; não promete percentual, código nem envio de e-mail.
- O SVG usa milímetros e escala 1:1, mas é estudo geométrico sem compensação de espessura. Material, folgas, cola e arte-final exigem aprovação da gráfica.
- O resultado detalhado e a sequência para publicação estão em `PLAN.md`.
