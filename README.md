# Cidade Estrutural

Cidade 3D no navegador em que cada lote é uma zona de engenharia estrutural e cada obra tem uma sequência animada em vista em corte, com os números calculados em código.

Obras prontas:

- **A1 · Viga biapoiada de concreto armado** (`#viga`): fôrma, armadura, concretagem, cura, carregamento, fissuração e flecha.
- **E1 · Compressão do corpo de prova** (`#compressao`): moldagem, cura, retificação, prensa, resultado do lote.
- **E2 · Tração da barra de aço CA-50** (`#tracao`): elástico, escoamento, estricção, ruptura e leitura.
- **I1 · Viga pré-moldada protendida** (`#protensao`): cordoalhas, cura térmica, liberação com mapa de tensões e contraflecha.
- **C2 · Ponte em vigas: içamento e laje** (`#icamento`): guindaste, transversinas, laje e tráfego.
- **C3 · Ponte estaiada da avenida** (`#estaiada`): estacas no leito, mastro, balanço sucessivo com estais, fechamento.

## Como abrir

Dê duplo clique em `cidade-estrutural.html`. Não precisa de servidor nem internet (sem internet ele usa as fontes do computador).
Para abrir direto numa obra: `cidade-estrutural.html#viga` (ou `#compressao`, `#tracao`).

Atalhos: espaço pausa, Esc sai da obra. Arraste para girar, role para aproximar.

## Para desenvolver

```bash
npm install
npm run dev        # servidor local
npm test           # testes dos cálculos (node --test)
npm run artifact   # gera dist/cidade-estrutural.html e dist/artifact.html
node scripts/cutn.mjs v "8,40,92,115"   # fotos da obra em /tmp/e
```

Planejamento, decisões e pendências: [`docs/ROADMAP.md`](docs/ROADMAP.md).

## Enviar para o GitHub

O projeto vem como `cidade-estrutural.bundle`. Crie o repositório **vazio** `cidade-estrutural` no GitHub (sem README) e rode:

```bash
git clone cidade-estrutural.bundle cidade-estrutural
cd cidade-estrutural
git remote set-url origin https://github.com/SEU-USUARIO/cidade-estrutural.git
git push -u origin main
```

Os números das obras são exemplos didáticos, não são de projeto.
