# Plataforma KinseyTec

Um único repositório para todos os sistemas KinseyTec, com histórico de cada alteração.

```
kinseytec-plataforma/
├── nucleo/                      ← código comum a todos os sistemas
│   ├── app/                     sistema principal (painel, cadeia, auditoria, relatórios, importação…)
│   ├── portal/                  Portal do Fornecedor / da empresa avaliada
│   ├── fb/                      Firebase: login, vários clientes, regras de segurança, arquivos
│   └── recursos/                mapas, bibliotecas, logo e compactador
├── produtos/
│   ├── cadeias/segmentos/       Cacau, Soja, Açaí, Gado, Café, Cobre e Metal
│   ├── ma/                      M&A · Kinsey Capital (segmento capital)
│   └── fraudes/                 Fraudes e Investigações (em preparação)
├── ferramentas/
│   ├── construir.py             gera qualquer sistema: núcleo + segmento
│   └── publicar_ci.sh           publicação automática (GitHub Actions)
├── .github/workflows/publicar.yml
└── VERSOES.md                   registro das versões
```

## Como funciona

- **Melhoria no núcleo** (ex.: importação de fornecedores, relatório, vários clientes) → vale para **todos** os sistemas
  na próxima construção.
- **Melhoria de um segmento** (ex.: questionário do Cobre) → altera só `produtos/cadeias/segmentos/metal/`.
- Cada segmento tem: `seg.json` (nome, ID do projeto Firebase, textos PT/EN), `data.js` (perguntas, riscos, normas),
  `seed.js` (exemplos de demonstração). Pode ter também `app/`, `portal/` ou `fb/` com arquivos que substituem os do núcleo.

## Construir

Requisitos: Python 3 com Pillow, Node.js 18+ e zip.

```bash
python3 ferramentas/construir.py lista            # produtos e segmentos
python3 ferramentas/construir.py cadeias todos    # todos os sistemas de cadeias
python3 ferramentas/construir.py cadeias metal    # só o Cobre e Metal
```

Resultado em `dist/` (não vai para o repositório): `dist/cadeias/<segmento>/firebase/` pronto para
`firebase deploy` e o pacote `dist/KinseyTec_<Nome>_Firebase.zip`.
A construção para com erro se encontrar termos proibidos no material publicado.

## Publicar

- Manual: envie o `.zip` ao Cloud Shell e rode `firebase deploy` (ver tutorial de publicação).
- Automático: ao aprovar uma alteração na branch `main`, o GitHub Actions constrói e publica só os sistemas
  afetados (mudança no núcleo publica todos), com aprovação no ambiente **producao**.

## Novo produto ou segmento

1. Copie um segmento parecido: `produtos/<produto>/segmentos/<novo>/`.
2. Ajuste `seg.json` (nome, `file`, `projeto` = ID do Firebase) e o conteúdo de `data.js`/`seed.js`.
3. `python3 ferramentas/construir.py <produto> <novo>`.
4. Registre em `VERSOES.md` e marque a versão (`git tag`).
