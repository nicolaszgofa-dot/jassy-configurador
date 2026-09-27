# Configurador J.Assy — MVP

Protótipo do configurador técnico de equipamentos (Titanium Electric / Selenium Electric),
baseado na especificação v0.1. Front-end puro (HTML + CSS + JS), sem dependências e sem build step.

## Estrutura

```
jassy-configurador/
├── index.html   # marcação e wizard (telas 1–9)
├── style.css    # estilos
├── app.js       # estado do wizard + motor de regras
└── README.md
```

## Motor de regras

Toda a lógica de negócio fica isolada em três funções puras dentro de `app.js`,
para poder ser extraída depois para um backend (Node, Python, etc.) sem reescrever:

- `computeDistribution()` — distribui as linhas de cada seção pelas 6 saídas do
  alternador, respeitando o máximo de 10 linhas/saída (regras R001, seções 13–17).
- `computeCables()` — decompõe cada saída em cabos de 4 e 1 linha. **Esta composição
  é ilustrativa (regra R05 da especificação ainda não validada tecnicamente).**
- `computeComponents()` — monta a lista de componentes obrigatórios por tecnologia
  e por condição (alternador vs. cabo de bateria).

Regras ainda não definidas na especificação (R01–R13) aparecem sinalizadas como
"pendente" na tela de resultado, não são inventadas.

## Rodando localmente

Não precisa de servidor nem instalação — é só abrir `index.html` num navegador.

Se preferir servir por HTTP (recomendado para evitar bloqueios de `file://` em
alguns navegadores):

```bash
cd jassy-configurador
python3 -m http.server 8000
# depois abra http://localhost:8000
```

## Publicando para acesso externo

Qualquer hospedagem de arquivos estáticos serve, já que não há backend:

### GitHub Pages
1. Crie um repositório e suba estes 3 arquivos (`index.html`, `style.css`, `app.js`).
2. Em *Settings → Pages*, selecione a branch principal como fonte.
3. O app fica disponível em `https://<usuario>.github.io/<repositorio>/`.

### Netlify / Vercel
1. Arraste a pasta `jassy-configurador` na área de deploy do painel (ou conecte o
   repositório Git).
2. Nenhuma configuração de build é necessária — é site estático puro.

### Servidor próprio (Nginx/Apache/IIS)
Copie os 3 arquivos para a pasta pública do servidor (`/var/www/html`, `wwwroot`, etc.).

## Próximos passos (fora do MVP)

- Definir e implementar as regras pendentes R01–R13 (comprimento de cabos,
  mangueiras, banco de marcas/modelos/adaptações, etc.).
- Adicionar as etapas de Marca → Modelo → Adaptação → Configuração final.
- Extrair o motor de regras para uma API própria, com persistência em banco e
  geração de pedido de venda.
