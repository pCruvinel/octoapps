export interface RelatorioCompletoCabecalho {
  id: string;
  financiamento_calculo_id: string;
  data_geracao: string;
  valor_principal: number;
  total_juros_cobrado: number | null;
  total_juros_devido: number | null;
  diferenca_restituicao: number;
  total_taxas: number;
  valor_total_devido: number | null;
  valor_total_a_restituir: number;
  percentual_sobretaxa: number;
  financiamentos_calculo?: any; // Tipo do join
}

export interface RelatorioAmortizacaoParcela {
  id: string;
  relatorio_id: string;
  numero_parcela: number;
  data_vencimento: string;
  saldo_inicial: number;
  saldo_devedor: number;
  amortizacao: number;
  juros: number;
  juros_contrato: number;
  juros_media: number;
  pmt_original: number;
  total_parcela: number;
  saldo_final: number;
  diferenca_juros: number;
  restituicao_acumulada: number;
}

export interface RelatorioCompletoResponse {
  relatorio_id: string;
  cabecalho: RelatorioCompletoCabecalho;
  amortizacao: RelatorioAmortizacaoParcela[];
}
