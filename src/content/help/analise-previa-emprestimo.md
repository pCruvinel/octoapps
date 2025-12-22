# Metodologia de Cálculo: Análise de Viabilidade (Empréstimo Pessoal)

Esta análise realizada tem caráter de **triagem técnica**, visando identificar indícios de abusividade na taxa de juros contratada em comparação com a média de mercado divulgada pelo Banco Central do Brasil (BACEN).

---

## 1. Fonte de Dados (BACEN)

Utilizamos a API oficial do Sistema Gerenciador de Séries Temporais (SGS) do Banco Central.

- **Série Utilizada**: 25442 - Taxa média de juros das operações de crédito com recursos livres - Pessoas físicas - Crédito pessoal não consignado.
- **Data de Referência**: Buscamos a taxa média vigente na data exata da assinatura do seu contrato.

> Importante: A comparação é feita sempre utilizando a taxa **ANUAL** (a.a.), pois ela reflete o Custo Efetivo Total e o efeito dos juros compostos.

---

## 2. Indicadores de Viabilidade

### Sobretaxa (Excesso de Juros)
Calculamos quanto a taxa do seu contrato está acima da média de mercado:

$$
\text{Sobretaxa (\%)} = \left( \frac{\text{Taxa Contrato (a.a.)} - \text{Taxa Mercado (a.a.)}}{\text{Taxa Mercado (a.a.)}} \right) \times 100
$$

- **Acima de 50%**: Consideramos **Viabilidade Alta** (Indício forte de abusividade conforme jurisprudência do STJ).
- **Entre 20% e 50%**: Consideramos **Atenção** (Pode haver viabilidade dependendo do perfil).
- **Abaixo de 20%**: Consideramos **Viabilidade Baixa** (Dentro da média de mercado).

### Economia Estimada
Recalculamos o financiamento substituindo a taxa do contrato pela taxa média de mercado, mantendo o mesmo prazo e sistema de amortização.

- **Economia Juros**: Diferença entre o total de juros pagos no contrato original e no cenário recalculado.
- **Economia Tarifas**: Soma das tarifas potencialmente indevidas (Venda Casada) que podem ser restituídas.

---

## 3. Pontuação (Score) de Viabilidade

O **Score** é uma nota de 0 a 100 que resume a viabilidade da ação revisional. Ele é calculado com base em múltiplos fatores:

| Fator                     | Peso   | Descrição                                                                 |
|---------------------------|--------|---------------------------------------------------------------------------|
| Sobretaxa                 | 50%    | Quanto maior a sobretaxa, maior a pontuação.                              |
| Economia Estimada         | 25%    | Economia total projetada em relação ao valor financiado.                  |
| Capitalização Diária      | 15%    | Se detectada, adiciona pontos por irregularidade.                         |
| Tarifas Abusivas          | 10%    | Presença de tarifas de venda casada (seguro, avaliação, etc.).            |

**Fórmula Simplificada:**
$$
\text{Score} = (0.5 \times P_{\text{sobretaxa}}) + (0.25 \times P_{\text{economia}}) + (0.15 \times P_{\text{capitalização}}) + (0.1 \times P_{\text{tarifas}})
$$

Onde cada $P$ é uma pontuação parcial normalizada de 0 a 100.

**Interpretação:**
- **80-100**: Viabilidade Alta (Ação fortemente recomendada).
- **50-79**: Atenção (Avaliar caso a caso).
- **0-49**: Viabilidade Baixa (Pode não compensar os custos).

---

## 4. Notas Técnicas

1. **Recálculo da Parcela**: Usamos o sistema PRICE ou SAC (conforme informado) para projetar como seria sua parcela se o banco tivesse cobrado a taxa justa média de mercado.
2. **Capitalização**: Verificamos se há indícios de capitalização diária de juros (método exponencial pro-rata dia), que onera o contrato injustificadamente.
