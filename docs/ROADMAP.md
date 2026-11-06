# Cidade Estrutural — Roadmap

**Versão v0.5 · 06/11/2026**

Um mundo 3D navegável no navegador em que cada lote é uma zona temática de engenharia estrutural, e cada obra tem uma sequência animada em vista em corte: do canteiro (fôrma, armadura, concretagem) até o comportamento estrutural (esforços, tensões, fissuras, flecha), com números calculados em código e o texto escrito a partir deles.

Herda o método da Cidade Geotécnica (obra por obra, função do tempo, corte com painéis planares), do Showroom 3D (regras puras testadas antes da cena) e da Arena (roadmap vivo, decisões numeradas, arquivo único que abre por duplo clique).

## O que mudou nesta rodada (v0.5) — Pontes e Pré-moldados separados

Pedido do usuário: "pontes e pré-moldados são áreas diferentes, não podem ficar tudo no C".

- **C · Pontes** agora é o trecho do rio com as três pontes (estaiada, vigas e arco). Não tem lote, e a placa fica sobre o rio. Ganhou uma balsa com guindaste de inspeção.
- **I · Pré-moldados** é uma zona nova, no lote ao norte do rio que antes era do C: pistas de protensão, vigas I, estoque e pórtico rolante.
- **Ligação I → C:** a carreta de vigas leva uma viga pré-moldada do pátio até a ponte em vigas e para sobre ela. Na volta vem vazia, e o pórtico carrega a próxima.
- O basculante agora entrega brita no pátio de pré-moldados (I).
- Malha viária aceita "entrada especial" de zona sem lote (a parada da carreta sobre a ponte).

## Rodada anterior (v0.4) — rio, avenida e pontes

Pedido do usuário: avenida central principal com mais faixas, rio dividindo a cidade em duas partes, ponte unindo os lados e uma zona C Pontes melhor e mais ilustrativa.

- **Rio** de leste a oeste em canal de 36 m, com cais de concreto, calçadão e guarda-corpo. Norte: zonas A–D; sul: E–H.
- **Avenida central** (x = 0) com 2 × 2 faixas de 3,3 m, canteiro arborizado e calçadas largas. Os carros escolhem a faixa da esquerda ou da direita.
- **Marginais** dos dois lados do rio; as entradas dos lotes agora ficam voltadas para o rio.
- **Três pontes reais** sobre o rio:
  - estaiada da avenida: mastro de 34 m no meio do rio e leque de estais no canteiro;
  - ponte em vigas protendidas (x = 66): 4 longarinas sobre 2 pilares-parede, com trânsito;
  - passarela em arco atirantado (x = 36): arcos de 9 m, pendurais e pedestres atravessando.
- Norte e sul se ligam só pelas duas pontes de veículos. A logística da central (sul) cruza a estaiada para chegar à viga (norte).
- **Zona C** virou "Pontes e pré-moldados": pistas de protensão, vigas I prontas, estoque e pórtico rolante animado.
- Barcos navegam pelo rio passando por baixo das pontes.
- O tour passa pelo rio, e a placa C enquadra as pontes.
- Malha viária com 20 cruzamentos; testes garantem que norte e sul só se ligam pelas pontes (20 testes no total).

## Rodada anterior (v0.3) — cidade viva

Pedido do usuário: "está meio sem vida, não parece uma cidade dinâmica com interação entre as obras".

- **Trânsito:** 16 carros e 2 ônibus circulando pela malha de ruas, na mão de direção.
- **Pedestres:** 24 pessoas andando nas calçadas em volta dos lotes.
- **Logística que liga as obras** (veículos com etiqueta clicável):
  - betoneira: central (H) → viga (A) → central;
  - van do laboratório: leva os corpos de prova da viga (A) para o laboratório (E) e volta;
  - carreta de aço: depósito (H) → viga (A) → amostra para o laboratório (E) → treliça (B) → depósito;
  - basculante: brita da central (H) → pontes (C).
- **Zona H virou "Central de concreto e aço"**: silos, misturador, esteira, baias de agregados e depósito de barras.
- **Canteiros trabalhando:** 2 gruas girando e içando carga (A e D), operários em todas as zonas, carros atravessando as três pontes, elevadores subindo nos prédios, prensa batendo no laboratório, pás do misturador girando.
- **Interação:**
  - placas de zona clicáveis, com a atividade do momento ("Betoneira descarregando concreto na viga");
  - botões laranja "▶ Abrir obra" na própria cena;
  - painel "Agora na cidade" com os últimos eventos e um botão "Seguir" que põe a câmera atrás do veículo.
- **Atalhos entre obras:** a viga leva aos ensaios do seu concreto (E1) e do seu aço (E2), e os ensaios voltam para a etapa certa da viga.
- O índice de zonas agora abre pelo botão "Zonas", para não tampar a cena.
- Malha viária em módulo puro (`src/core/malha.js`) com 5 testes novos (19 no total).

## Rodada anterior (v0.2)

- **Obra E1 — Compressão do corpo de prova** pronta (6 etapas, 1:50 min).
- **Obra E2 — Tração da barra de aço CA-50** pronta (7 etapas, 1:40 min), com a barra deformando de verdade: nervuras, base de medida, estricção e ruptura.
- Base comum de obra (`src/core/obra.js`): relógio, ciclo, rótulos e **câmera por etapa** (a câmera acompanha cada etapa até o usuário girar a cena).
- Cálculos dos ensaios em `src/calc/ensaios.js`, com 6 testes novos (14 no total).
- Corrigido: a câmera não deixava chegar a menos de 4 m (closes não funcionavam).

## Rodada anterior (v0.1)

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

## 2. Mapa da cidade (4 lotes por margem, lotes 46 × 52 m, rio no meio)

| Zona | Tema | Obras |
|---|---|---|
| A | Concreto armado | [x] Viga biapoiada · [ ] Pilar e flambagem · [ ] Laje maciça e nervurada · [ ] Sapata isolada |
| B | Estruturas de aço | [ ] Treliça de cobertura · [ ] Ligação parafusada e soldada · [ ] Pórtico de galpão |
| C | Pontes (no rio, sem lote) | [ ] Ponte estaiada da avenida · [ ] Ponte em vigas protendidas · [ ] Passarela em arco atirantado — as três já existem no rio; falta a sequência em corte |
| D | Edifícios altos | [ ] Vento e deslocamento lateral · [ ] Núcleo rígido e contraventamento |
| E | Laboratório de materiais | [x] Compressão do corpo de prova · [x] Tração da barra de aço · [ ] Abatimento (slump) |
| F | Patologias e reforço | [ ] Corrosão de armadura · [ ] Reforço com fibra de carbono |
| G | Madeira e alvenaria | [ ] Tesoura de telhado · [ ] Alvenaria estrutural |
| H | Central de concreto e aço | Abastece as obras (betoneira, carreta, basculante) |
| I | Pré-moldados | [ ] Protensão de viga pré-moldada · [ ] Içamento e transporte de vigas |

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

### E1 · Compressão do corpo de prova de concreto (v0.2)

| # | Etapa | Início | O que se vê |
|---|---|---|---|
| 1 | Moldagem | 0 s | molde 10 × 20 cm em corte, 2 camadas × 12 golpes, rasar o topo |
| 2 | Cura | 16 s | desmoldagem após 24 h, tanque de água, contador até 28 dias |
| 3 | Retificação | 28 s | disco retifica a face |
| 4 | Ensaio na prensa | 38 s | prato com rótula, força a 0,45 MPa/s, mostrador, curva σ × ε, fissuras verticais, ruptura em cone e cacos |
| 5 | Resultado do lote | 82 s | 6 exemplares em barras, fcm, s, fck,est |
| 6 | Leitura da curva | 96 s | pico ≈ 2‰, trecho pós-pico pontilhado, módulo secante |

**Valores adotados (exemplo):** exemplares 29,8 · 31,2 · 28,6 · **30,4** (o ensaiado) · 27,9 · 30,9 MPa; fcm = 29,8 MPa; s = 1,31 MPa; fck,est = fcm − 1,65·s = 27,6 MPa ≥ 25 → aceito. Força de ruptura 238,8 kN em 78,54 cm². Curva parabólica com pico em 2,1‰. Módulo secante (0,5 MPa a 30% fc) ≈ 26,5 GPa. A animação do carregamento é ~2,1× mais rápida que o ensaio real.

**Pendente:**
- [ ] A NBR 12655 usa outra fórmula para amostragem parcial com 6 exemplares (fck,est = 2·(f1+…+fm−1)/(m−1) − fm, com ψ6). Usei fcm − 1,65·s por ser mais didático. Trocar?
- [ ] Curva pós-pico é só referência (a prensa comum, com controle de força, não registra esse trecho). O texto diz isso; conferir redação.
- [ ] Moldagem: 2 camadas × 12 golpes para 10 × 20 cm (NBR 5738). Confirmar.

### E2 · Tração da barra de aço CA-50 φ16 (v0.2)

| # | Etapa | Início | O que se vê |
|---|---|---|---|
| 1 | Barra e marcação | 0 s | barra de 50 cm na bancada, marcas da base de medida 10φ = 160 mm |
| 2 | Fixação nas garras | 12 s | barra vai para a máquina universal, garras fecham, extensômetro |
| 3 | Regime elástico | 22 s | reta σ = E·ε (detalhe ampliado até 0,6%) |
| 4 | Escoamento | 36 s | patamar em fy, extensômetro sai |
| 5 | Encruamento e estricção | 48 s | close no pescoço, a barra afina, força nominal cai |
| 6 | Ruptura | 72 s | as duas partes se separam |
| 7 | Leitura do resultado | 80 s | partes encostadas, Lu entre as marcas, quadro NBR 7480 |

**Valores adotados (exemplo):** área 201,1 mm²; E = 210 GPa; fy = 560 MPa (Fy = 112,6 kN); fu = 680 MPa (Fu = 136,7 kN); fu/fy = 1,21; fim do patamar 1,5%; carga máxima em 11%; ruptura com 16% (Lu = 185,6 mm). Atende CA-50: fy ≥ 500, fu/fy ≥ 1,08, alongamento ≥ 8%.

**Pendente:**
- [ ] Alongamento medido em 10φ: confirmar se prefere 5φ ou outra base.
- [ ] O alongamento animado distribui a parte uniforme no trecho livre entre garras (simplificação).
- [ ] Incluir o ensaio de dobramento (a NBR 7480 também exige)? Pode virar a etapa extra ou uma obra E4.

## 4. Arquitetura

```
src/
  config.js        paleta, grade de lotes, zonas e obras
  calc/viga.js     cálculos PUROS da viga (testados em Node)
  core/engine.js   renderizador, luzes, câmera com voo, tema, rótulos 3D
  core/kit.js      materiais, caixas, pessoas articuladas, painéis de canvas, tempo
  world.js         ruas, lotes, placas, vinhetas
  core/obra.js     base de obra: relógio, ciclo, rótulos, câmera por etapa
  calc/ensaios.js  cálculos PUROS dos ensaios E1 e E2
  core/malha.js    malha viária PURA: cruzamentos, entradas dos lotes, rotas, faixa da direita
  vida.js          trânsito, pedestres, logística, gruas, placas e etiquetas clicáveis
  zones/viga.js    obra A1 (contrato abaixo)
  zones/lab.js     sala de laboratório em corte (compartilhada)
  zones/compressao.js, zones/tracao.js   obras E1 e E2
  ui/ui.js         índice, ficha da obra, linha do tempo, tour
  main.js          monta tudo e roda o laço
tests/viga.test.js, tests/ensaios.test.js, tests/malha.test.js
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
| D07 | Próxima obra (v0.1) | ⭐ E1 compressão, e também E2 tração ("continue") | fecham C25 e CA-50 da viga |
| D06 | Repositório | ⏳ `cidade-estrutural` ainda não existe no GitHub da sessão; entregue como bundle | ver próximos passos |

### Perguntas abertas

- **D11 · Próxima obra em corte** — ⭐ Ponte estaiada da avenida (C3: balanço sucessivo das aduelas, estais tensionados um a um) · Protensão no pátio (I1) seguida do içamento da viga na ponte (C2) · Abatimento E3. Ajustar: ___
- **D10 · Logística sincronizada** — ⭐ a betoneira chega à viga exatamente quando a obra entra na concretagem (mais didático) · deixar independente, como agora (mais simples). Ajustar: ___
- **D09 · Próxima obra** — ⭐ Abatimento (slump test, E3, fecha o laboratório) · Pilar e flambagem (A2) · Ponte estaiada (C3). Ajustar: ___
- **D08 · Tom do texto** — ⭐ leigo informado (como hoje) · estudante de engenharia com fórmulas · dois níveis com botão. Ajustar: ___

## 6. Banco de ideias

- Ciclo de dia e noite (postes, faróis, janelas acesas) e chuva interrompendo a concretagem.
- Ligar a logística ao relógio das obras: a betoneira chega quando a viga está na etapa de concretagem.
- Relatório do dia na central: m³ de concreto entregues, toneladas de aço, CPs ensaiados.
- Clicar num pedestre ou operário e ver o que ele faz (engenheiro, armador, laboratorista).
- Semáforos nos cruzamentos e carros parando para pedestres.

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
| Muitos objetos animados | trânsito e pessoas simples; medir fps no computador do usuário |
| Fontes offline | sem internet usa fontes do sistema (aparência um pouco diferente) |

## 8. Não verificado

- Desempenho (fps) em computador e celular reais.
- Toque e arrasto no celular real (testado só em tela simulada 390 × 844).
- Fontes do Google carregando (ambiente de teste sem internet).

## 9. Próximos passos

1. Usuário revisa as obras A1, E1 e E2 e responde as pendências.
2. Decidir D09 e fazer a próxima obra.
3. Criar o repositório `cidade-estrutural` vazio e enviar o bundle (instruções no README).

## 10. Changelog

| Versão | Data | Mudança |
|---|---|---|
| v0.5 | 06/11/2026 | Zona C = Pontes (rio, balsa de inspeção); nova zona I = Pré-moldados; carreta de vigas I → ponte em vigas |
| v0.4 | 06/11/2026 | Rio cortando a cidade, avenida central 2 × 2 faixas, marginais, 3 pontes reais (estaiada, vigas, arco), zona C pré-moldados, barcos; 20 testes |
| v0.3 | 06/11/2026 | Cidade viva: trânsito, pedestres, logística entre obras, central H, gruas, placas, seguir veículo, atalhos entre obras; 19 testes |
| v0.2 | 06/11/2026 | Obras E1 (compressão) e E2 (tração); base comum de obra; câmera por etapa; 14 testes |
| v0.1 | 06/11/2026 | Projeto criado; cidade com 8 zonas e vinhetas; obra A1 Viga biapoiada; 8 testes |
