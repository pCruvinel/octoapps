import { DetalhadaPageData } from '../calculations/detalhada-page';
import { CalculoDetalhadoResponse } from '@/types/calculation.types';

export const mockFormData: Partial<DetalhadaPageData> = {
    credor: "Banco Exemplo S.A.",
    devedor: "João da Silva",
    numeroContrato: "123456789",
    tipoContrato: "Financiamento Veículo",
    valorFinanciado: 50000,
    dataContrato: "2023-01-15",
    dataPrimeiroVencimento: "2023-02-15",
    prazoMeses: 48,
    valorPrestacao: 1542.50,
    taxaMensalContrato: 1.89,
    taxaAnualContrato: 25.45,
    sistemaAmortizacao: "PRICE",
    capitalizacao: "MENSAL",
    usarTaxaBacen: true
};

export const mockDashboard = {
    kpis: {
        economiaTotal: 12540.32,
        parcelaOriginalValor: 1542.50,
        novaParcelaValor: 1150.25,
        taxaPraticada: 1.89,
        taxaMercado: 1.45,
        restituicaoSimples: 4500.20,
        restituicaoEmDobro: 9000.40,
        classificacaoAbuso: 'ALTA' as const
    },
    totais: {
        totalPagoBanco: 74040.00,
        totalJurosBanco: 24040.00,
        totalPagoRecalculado: 61499.68,
        totalJurosRecalculado: 11499.68,
        economiaTotal: 12540.32,
        sobretaxaPercentual: 30.5
    },
    evolucao: Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        saldoBanco: 50000 - (i * 1000),
        saldoRecalculado: 50000 - (i * 1200),
        diferenca: i * 200
    }))
};

export const mockResultado: CalculoDetalhadoResponse = {
    calculadoEm: new Date().toISOString(),
    tempoExecucaoMs: 150,
    versaoMotor: "1.0.0",
    resumo: {
        valorFinanciado: 50000,
        valorTotalPago: 74040,
        valorTotalDevido: 61499,
        diferencaTotal: 12541,
        restituicaoSimples: 4500,
        restituicaoDobro: 9000,
        economiaEstimada: 12541,
        taxaContratoAnual: 25.45,
        taxaMercadoAnual: 18.5,
        sobretaxaPercent: 30.5,
        isAbusivo: true
    },
    taxaSnapshot: {
        serieId: "123",
        serieCodigo: 123,
        valor: 1.45,
        dataReferencia: "2023-01",
        fonte: "BACEN",
        buscadoEm: new Date().toISOString()
    },
    apendices: {
        ap01: {
            tipo: 'AP01',
            titulo: 'Evolução Original',
            descricao: 'Cenário cobrado pelo banco',
            totais: {
                principal: 50000,
                totalCorrecao: 0,
                totalJuros: 24040,
                totalSeguros: 0,
                totalTarifas: 0,
                totalPago: 74040,
                totalDevido: 74040,
                totalDiferenca: 0,
                totalRestituir: 0
            },
            tabela: Array.from({ length: 5 }, (_, i) => ({
                mes: i + 1,
                data: `2023-0${i + 2}-15`,
                saldoAbertura: 50000 - (i * 1000),
                juros: 800,
                amortizacao: 742.50,
                saldoDevedor: 50000 - ((i + 1) * 1000),
                parcelaBase: 1542.50,
                parcelaTotal: 1542.50,
                diferenca: 0,
                diferencaAcumulada: 0,
                status: 'PROJETADO'
            }))
        },
        ap02: {
            tipo: 'AP02',
            titulo: 'Recálculo',
            descricao: 'Cenário recalculado',
            totais: {
                principal: 50000,
                totalCorrecao: 0,
                totalJuros: 11499,
                totalSeguros: 0,
                totalTarifas: 0,
                totalPago: 61499,
                totalDevido: 61499,
                totalDiferenca: 0,
                totalRestituir: 0
            },
            tabela: []
        },
        ap03: {
            tipo: 'AP03',
            titulo: 'Diferenças',
            descricao: 'Comparativo de valores',
            totais: {
                principal: 0,
                totalCorrecao: 0,
                totalJuros: 0,
                totalSeguros: 0,
                totalTarifas: 0,
                totalPago: 0,
                totalDevido: 0,
                totalDiferenca: 12541,
                totalRestituir: 12541
            },
            tabela: []
        }
    },
    flags: {
        capitalizacaoDiariaDetectada: false,
        anatocismoDetectado: true,
        tarifasIrregulares: false,
        segurosAbusivos: false,
        carenciaDetectada: false
    }
};
