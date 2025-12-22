# Metodologia de Cálculo: Análise Imobiliária (SFH/SFI)

Esta análise projeta a evolução do seu financiamento imobiliário comparando os parâmetros contratados com as médias de mercado e normas do Sistema Financeiro de Habitação (SFH).

---

## 1. Parâmetros Analisados

### Sistema de Amortização
O sistema verifica o comportamento da evolução do saldo devedor:
- **SAC**: Parcelas decrescentes (amortização constante). Mais vantajoso a longo prazo pois reduz o saldo mais rápido.
- **PRICE**: Parcelas fixas/crescentes. Gera saldo devedor mais alto e paga mais juros ao final.
- **SACRE**: Sistema híbrido utilizado pela CEF (crescente e depois decrescente).

### Correção Monetária
Identificamos o impacto do indexador na parcela:
- **TR (Taxa Referencial)**: Indexador padrão do SFH.
- **IPCA / IGPM**: Indexadores de inflação que podem elevar drasticamente o saldo devedor e a parcela em momentos de crise.

---

## 2. Seguros Habitacionais (Venda Casada)

Nos contratos habitacionais, os seguros são obrigatórios, mas a "Venda Casada" (obrigar a contratar a seguradora do banco) é ilegal.

- **MIP (Morte e Invalidez Permanente)**: Calculamos se a taxa aplicada condiz com a sua faixa etária. Taxas acima de 0.05% a.m. para jovens podem indicar abusividade.
- **DFI (Danos Físicos ao Imóvel)**: Deve ser proporcional ao valor da avaliação do imóvel.

---

## 3. Pontuação (Score) de Viabilidade

O **Score** é uma nota de 0 a 100 que resume a viabilidade da ação revisional. Ele é calculado com base em múltiplos fatores:

| Fator                     | Peso   | Descrição                                                                 |
|---------------------------|--------|---------------------------------------------------------------------------|
| Sobretaxa                 | 40%    | Quanto maior a sobretaxa sobre a taxa de mercado, maior a pontuação.      |
| Economia Estimada         | 30%    | Economia total projetada em relação ao valor financiado.                  |
| Tarifas Abusivas          | 20%    | Presença de tarifas de venda casada (seguro, avaliação, etc.).            |
| Indexador Prejudicial     | 10%    | Uso de IPCA/IGPM em vez de TR pode indicar maior risco ao consumidor.     |

**Fórmula Simplificada:**
$$
\text{Score} = (0.4 \times P_{\text{sobretaxa}}) + (0.3 \times P_{\text{economia}}) + (0.2 \times P_{\text{tarifas}}) + (0.1 \times P_{\text{indexador}})
$$

Onde cada $P$ é uma pontuação parcial normalizada de 0 a 100.

**Interpretação:**
- **80-100**: Viabilidade Alta (Ação fortemente recomendada).
- **50-79**: Atenção (Avaliar caso a caso).
- **0-49**: Viabilidade Baixa (Pode não compensar os custos).

---

## 4. Economia Projetada

A economia nesta análise vem de três frentes:

1. **Ajuste de Taxa de Juros**: Substituição da taxa do contrato pela média de mercado (Série BACEN 20773 para SFH ou 25497 para SFI).
2. **Expurgo de Tarifas (Momento Zero)**: Remoção de taxas de avaliação, análise jurídica e administração do saldo devedor inicial. Isso reduz a base de cálculo dos juros por 360 meses.
3. **Recálculo dos Seguros**: Simulação com taxas de mercado x taxas do banco.

> **Nota**: No financiamento imobiliário, pequenas reduções na taxa (% a.m.) geram economias gigantescas devido ao prazo longo (30-35 anos) e valor alto.
