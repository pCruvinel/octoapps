# Metodologia de Cálculo: Análise de Viabilidade (Veículos)

Esta análise tem caráter de **triagem técnica**, visando identificar indícios de abusividade no financiamento do seu veículo em comparação com a média de mercado divulgada pelo Banco Central do Brasil (BACEN).

---

## 1. Fonte de Dados (BACEN)

Utilizamos a API oficial do Sistema Gerenciador de Séries Temporais (SGS) do Banco Central.

- **Série Utilizada**: 20749 - Taxa média de juros das operações de crédito com recursos livres - Pessoas físicas - Aquisição de veículos.
- **Data de Referência**: Buscamos a taxa média vigente na data exata da assinatura do contrato.

---

## 2. Indicadores de Viabilidade

### 📉 Sobretaxa (Excesso de Juros)
Calculamos o percentual de taxa cobrado acima da média:

$$
\text{Sobretaxa} = \left( \frac{\text{Taxa Contrato (a.a.)} - \text{Taxa Mercado}}{\text{Taxa Mercado}} \right) \times 100
$$

- **Viabilidade Alta**: Sobretaxa superior a 50% (Jurisprudência dominante).
- **Atenção**: Sobretaxa entre 20% e 50%.
- **Baixa**: Sobretaxa inferior a 20%.

### 💰 Composição da Economia

1. **Redução de Juros**: Recálculo da parcela utilizando a taxa média de mercado (Série 20749).
2. **Restituição de Tarifas**:
   - **Tarifa de Avaliação**: Frequentemente abusiva se não houver laudo comprovado.
   - **Tarifa de Registro**: Pode ser questionada se o serviço não foi efetivamente prestado pelo banco.
   - **Seguro Prestamista**: Venda casada se imposto ao consumidor.

---

## 3. Detecção de Anomalias

O sistema verifica automaticamente:
- **Capitalização Diária**: Se o banco usou juros exponenciais diários (mais caros) em vez de mensais.
- **Juros de Carência**: Cobrança indevida de juros no período entre a liberação do crédito e o primeiro pagamento (se superior a 30 dias).
