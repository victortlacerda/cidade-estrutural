# Cidade Estrutural — Roadmap

**Versão v0.1 · 06/11/2026**

Um mundo 3D navegável no navegador em que cada lote é uma zona temática de engenharia estrutural, e cada obra tem uma sequência animada em vista em corte: do canteiro (fôrma, armadura, concretagem) até o comportamento estrutural (esforços, tensões, fissuras, flecha), com números calculados em código e o texto escrito a partir deles.

Herda o método da Cidade Geotécnica (obra por obra, função do tempo, corte com painéis planares), do Showroom 3D (regras puras testadas antes da cena) e da Arena (roadmap vivo, decisões numeradas, arquivo único que abre por duplo clique).

## O que mudou nesta rodada (v0.1)

- Projeto criado do zero: Three.js 0.170 + Vite 5, build em arquivo único.
- Cidade com 8 lotes (zonas A a H), ruas, placas e vinhetas de todas as obras planejadas.
- **Obra A1 — Viga biapoiada de concreto armado** pronta e testada (7 etapas, 2:04 min).
- Cálculos da viga em módulo puro (`src/calc/viga.js`) com 8 testes.
- Interface: índice de zonas, ficha da obra com etapas clicáveis, linha do tempo arrastável, pausa, velocidade 0,5×/1×/2×, tema claro/escuro, tour guiado, link direto `#viga`.

## 1. Premissas

- Público: estudante ou leigo informado; o usuário é o especialista que confere.
- Tudo roda no navegador, sem servidor. Entrega: `cidade-estrutural.html` (duplo clique) e versão publicada como artifact.
- Todo número inventado é marcado como **exemplo, não é de projeto**.
- A animação é sempre função do tempo `t`; nada acumulado que não se recalcule de `t`.
- Texto e gráfico sempre concordam: o texto é gerado a partir dos números do cálculo.

## 2. Mapa da cidade (grade 4 × 2, lotes 46 × 52 m)

| Zona | Tema | Obras |
|---|---|---|
| A | Concreto armado | [x] Viga biapoiada · [ ] Pilar e flambagem · [ ] Laje maciça e nervurada · [ ] Sapata isolada |
| B | Estruturas de aço | [ ] Treliça de cobertura · [ ] Ligação parafusada e soldada · [ ] Pórtico de galpão |
| C | Pontes | [ ] Ponte em vigas protendidas · [ ] Ponte em arco · [ ] Ponte estaiada |
| D | Edifícios altos | [ ] Vento e deslocamento lateral · [ ] Núcleo rígido e contraventamento |
| E | Laboratório de materiais | [ ] Compressão do corpo de prova · [ ] Tração da barra de aço · [ ] Abatimento (slump) |
| F | Patologias e reforço | [ ] Corrosão de armadura · [ ] Reforço com fibra de carbono |
| G | Madeira e alvenaria | [ ] Tesoura de telhado · [ ] Alvenaria estrutural |
| H | Praça da Estrutura | Entrada da cidade (pórtico, bancos) |

## 3. Obras prontas

### A1 · Viga biapoiada de concreto armado (v0.1)

Corte longitudinal no eixo da viga: a metade da frente do concreto foi retirada, então se veem as barras e os estribos encostados na face cortada, e as fissuras aparecem desenhadas nessa face.

| # | Etapa | Início | O que se vê |
|---|---|---|---|
| 1 | Os apoios | 0 s | pilares prontos, apoio fixo e móvel |
| 2 | Fôrma e escoramento | 12 s | escoras a cada 0,80 m, fundo e laterais de compensado |
| 3 | Armadura | 28 s | 4 φ16 embaixo, estribos φ6,3 c/10 perto dos apoios e c/20 no meio, porta-estribos, espaçadores |
| 4 | Concretagem e adensamento | 48 s | betoneira, bomba-lança, frente de concreto, vibrador |
| 5 | Cura e desforma | 66 s | cura úmida 7 dias (acelerada), retirada das fôrmas e das escoras |
| 6 | Carregamento | 80 s | carga sobe até 20 kN/m, diagramas V e M crescem, 1ª fissura em q ≈ 7,1 kN/m |
| 7 | Leitura do resultado | 104 s | fissuras no trecho central, linha neutra, flecha × limite |

**Valores adotados (exemplo, não é de projeto):**

- Vão 6,00 m; seção 20 × 50 cm; C25; CA-50; cobrimento 3 cm; d = 45,6 cm.
- Carga de serviço 20 kN/m (peso próprio 2,5 + sobrecarga 17,5).
- M = 90 kN·m; V = 60 kN; Md = 126 kN·m.
- As necessária 7,17 cm²; adotada 4 φ16 = 8,04 cm².
- Ecs = 24,15 GPa; fctm = 2,56 MPa; Mr = 32,1 kN·m (α = 1,5) → fissura com q ≈ 7,1 kN/m.
- Estádio II: x = 14,7 cm; σc = 15,1 MPa; σs = 275 MPa.
- Flecha imediata: 6,7 mm sem fissura (Estádio I) e 15,0 mm com inércia de Branson; limite L/250 = 24 mm.
- Deformada desenhada 40× maior; diâmetro das barras desenhado 1,5× maior (só para enxergar).

**Pendente (para o especialista confirmar):**

- [ ] Estribos φ6,3 c/10 e c/20 foram adotados, não calculados (falta verificação ao cisalhamento).
- [ ] σc = 15,1 MPa fica no limite de 0,6 fck em serviço; manter, aumentar a seção ou reduzir a carga?
- [ ] Flecha diferida (fluência) não está no texto. Incluir na leitura?
- [ ] Espaçamento das fissuras segue os estribos de forma simplificada.
- [ ] Representação dos apoios (fixo/móvel) sobre pilar: suficiente ou desenhar o símbolo de apoio?

## 4. Arquitetura

```
src/
  config.js        paleta, grade de lotes, zonas e obras
  calc/viga.js     cálculos PUROS da viga (testados em Node)
  core/engine.js   renderizador, luzes, câmera com voo, tema, rótulos 3D
  core/kit.js      materiais, caixas, pessoas articuladas, painéis de canvas, tempo
  world.js         ruas, lotes, placas, vinhetas
  zones/viga.js    obra A1 (contrato abaixo)
  ui/ui.js         índice, ficha da obra, linha do tempo, tour
  main.js          monta tudo e roda o laço
tests/viga.test.js
scripts/artifact.mjs   gera dist/cidade-estrutural.html e dist/artifact.html
scripts/cutn.mjs       fotos headless por instante da obra
```

**Contrato de uma obra:** `{ id, group, state{active,speed,paused,tc,hold,step,progress,note}, update(dt), render(t), enter(), exit(), steps, starts, fim, nome, tit, sub, hide, cam, mcam }`.

**Técnica do corte (estrutural):** o elemento é cortado no seu eixo; a face cortada é uma textura de canvas redesenhada só quando a chave de estado muda (agregados, fissuras, linha neutra). Aço e estribos são geometria real e aparecem na frente da face. Elementos que fletem usam vértices deformados pela linha elástica; objetos soltos (estribos, blocos) "seguem" a deformada.

## 5. Decisões

| # | Decisão | Resposta | Impacto |
|---|---|---|---|
| D01 | Stack | ⭐ Three.js 0.170 + Vite 5, JS puro | igual à Cidade Geotécnica |
| D02 | Entrega | ⭐ arquivo único + artifact publicado + bundle git | abre sem servidor |
| D03 | Primeira obra | ⭐ viga biapoiada (canteiro + comportamento) | define o padrão das próximas |
| D04 | Exagero visual | ⭐ deformada 40×, barras 1,5×, sempre avisado na tela | legibilidade |
| D05 | Norma de referência | ⭐ NBR 6118 simplificada | textos e números |
| D06 | Repositório | ⏳ `cidade-estrutural` ainda não existe no GitHub da sessão; entregue como bundle | ver próximos passos |

### Perguntas abertas

- **D07 · Próxima obra** — ⭐ Laboratório E1 (compressão do corpo de prova, completa a história do C25) · Pilar e flambagem (A2) · Ponte estaiada (C3). Ajustar: ___
- **D08 · Tom do texto** — ⭐ leigo informado (como hoje) · estudante de engenharia com fórmulas · dois níveis com botão. Ajustar: ___

## 6. Banco de ideias

- Botão "ver fórmula" em cada número da legenda.
- Comparar duas vigas lado a lado (com e sem armadura; c/10 × c/20).
- Arrastar a carga e ver a fissuração ao vivo (modo laboratório).
- Linha do tempo da cidade (obras sendo construídas ao longo do tour).
- Narração em áudio (usar ferramentas de voz do repositório Lemo-Opuscar).
- Gerar um vídeo curto de cada obra para redes (estilos do Lemo-Opuscar, ex.: blueprint, white-model).

## 7. Riscos

| Risco | Mitigação |
|---|---|
| fps real desconhecido | medido só em renderização por software no teste; conferir no computador do usuário |
| Textos técnicos incorretos | números gerados pelo código e pendências explícitas para o especialista |
| Arquivo crescer demais | geometrias simples e cache de materiais; meta < 2 MB |
| Fontes offline | sem internet usa fontes do sistema (aparência um pouco diferente) |

## 8. Não verificado

- Desempenho (fps) em computador e celular reais.
- Toque e arrasto no celular real (testado só em tela simulada 390 × 844).
- Fontes do Google carregando (ambiente de teste sem internet).

## 9. Próximos passos

1. Usuário revisa a obra A1 e responde as pendências.
2. Decidir D07 e fazer a próxima obra.
3. Criar o repositório `cidade-estrutural` vazio e enviar o bundle (instruções no README).

## 10. Changelog

| Versão | Data | Mudança |
|---|---|---|
| v0.1 | 06/11/2026 | Projeto criado; cidade com 8 zonas e vinhetas; obra A1 Viga biapoiada; 8 testes |
