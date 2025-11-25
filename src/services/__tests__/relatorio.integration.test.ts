/**
 * Testes de Integração - Fluxo Completo de Geração de Relatório
 *
 * Testa o fluxo completo de gerar relatório a partir da edição de um caso,
 * incluindo cenários de sucesso e falha.
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { financiamentosService } from '../financiamentos.service';
import type { Database } from '@/lib/database.types';

type FinanciamentoInsert = Database['public']['Tables']['financiamentos']['Insert'];

describe('Fluxo Completo - Gerar Relatório a partir da Edição', () => {
  let testFinanciamentoId: string;

  const dadosBase: FinanciamentoInsert = {
    credor: 'Banco Teste Relatório',
    devedor: 'Cliente Teste Relatório',
    contrato_num: 'REL-TEST-001',
    tipo_contrato: 'Financiamento',
    valor_financiado: 302400.00,
    quantidade_parcelas: 360,
    data_primeira_parcela: '2018-06-21',
    sistema_amortizacao: 'SAC',
    indice_correcao: 'TR',
    taxa_mensal_contrato: 0.005654145387,
    taxa_mensal_mercado: 0.0062,
    horizonte_meses: 12,
    status: 'Rascunho',
  };

  beforeEach(async () => {
    // Criar um caso de teste
    const created = await financiamentosService.create(dadosBase);
    testFinanciamentoId = created.id;
  });

  afterEach(async () => {
    // Limpar dados de teste
    try {
      await financiamentosService.hardDelete(testFinanciamentoId);
    } catch (error) {
      // Ignorar erro se já foi deletado
    }
  });

  describe('Cenário 1: Primeiro Relatório (Caso Novo)', () => {
    it('deve gerar relatório pela primeira vez com sucesso', async () => {
      // Simular dados calculados
      const tabelaAP01 = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 1500.00,
        valor_corrigido: 1505.00,
        juros: 500.00,
        amortizacao: 840.00,
        saldo_devedor: 302400.00 - (840.00 * (i + 1)),
        mip: 62.54,
        dfi: 77.66,
        tca: 25.00,
        total_pago: 1505.00 + 62.54 + 77.66 + 25.00,
      }));

      const tabelaAP05 = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 1450.00,
        valor_corrigido: 1455.00,
        juros: 480.00,
        amortizacao: 840.00,
        saldo_devedor: 302400.00 - (840.00 * (i + 1)),
      }));

      const tabelaAP03 = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 0,
        valor_corrigido: 0,
        juros: 0,
        amortizacao: 0,
        saldo_devedor: 0,
        diferenca: 50.00,
      }));

      // Salvar tabelas (simulando o que handleGenerateReport faz)
      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', tabelaAP01);
      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP05', tabelaAP05);
      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP03', tabelaAP03);

      // Atualizar resultados calculados
      await financiamentosService.updateCalculatedResults(testFinanciamentoId, {
        taxa_contrato_am: 0.5654,
        taxa_mercado_am: 0.62,
        sobretaxa_pp: 0.0546,
        valor_total_pago: 20000.00,
        valor_total_devido: 18000.00,
        diferenca_restituicao: 2000.00,
      });

      // Atualizar status
      await financiamentosService.updateStatus(testFinanciamentoId, 'Concluído');

      // Verificações
      const financiamento = await financiamentosService.getById(testFinanciamentoId);
      expect(financiamento).toBeDefined();
      expect(financiamento?.status).toBe('Concluído');
      expect(financiamento?.valor_total_pago).toBe(20000.00);
      expect(financiamento?.diferenca_restituicao).toBe(2000.00);

      const ap01 = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      const ap05 = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP05');
      const ap03 = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP03');

      expect(ap01.length).toBe(12);
      expect(ap05.length).toBe(12);
      expect(ap03.length).toBe(12);
    }, 30000); // Timeout de 30s

    it('deve salvar todas as parcelas para horizonte completo (360 meses)', async () => {
      // Criar tabela com 360 parcelas
      const tabela360 = Array.from({ length: 360 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 1500.00,
        valor_corrigido: 1505.00,
        juros: 500.00,
        amortizacao: 840.00,
        saldo_devedor: Math.max(0, 302400.00 - (840.00 * (i + 1))),
      }));

      // Deve processar em batches sem timeout
      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', tabela360);

      const recuperada = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      expect(recuperada.length).toBe(360);
      expect(recuperada[0].mes).toBe(1);
      expect(recuperada[359].mes).toBe(360);
    }, 60000); // Timeout maior para 360 parcelas
  });

  describe('Cenário 2: Segundo Relatório (Caso Já Calculado) - CRÍTICO', () => {
    it('deve RE-gerar relatório para caso já calculado sem erro de chave duplicada', async () => {
      // PRIMEIRA GERAÇÃO
      const primeiraTabela = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 1500.00,
        valor_corrigido: 1505.00,
        juros: 500.00,
        amortizacao: 840.00,
        saldo_devedor: 302400.00 - (840.00 * (i + 1)),
      }));

      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', primeiraTabela);
      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP05', primeiraTabela);
      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP03', primeiraTabela.map(row => ({
        ...row,
        diferenca: 50.00,
      })));

      // Verificar primeira geração
      let ap01 = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      expect(ap01.length).toBe(12);
      expect(ap01[0].valor_original_parcela).toBe(1500.00);

      // SEGUNDA GERAÇÃO (com valores diferentes)
      const segundaTabela = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 2000.00, // VALOR DIFERENTE
        valor_corrigido: 2005.00,
        juros: 600.00,
        amortizacao: 840.00,
        saldo_devedor: 302400.00 - (840.00 * (i + 1)),
      }));

      // Esta operação NÃO PODE FALHAR com erro de chave duplicada
      await expect(
        financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', segundaTabela)
      ).resolves.not.toThrow();

      await expect(
        financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP05', segundaTabela)
      ).resolves.not.toThrow();

      await expect(
        financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP03', segundaTabela.map(row => ({
          ...row,
          diferenca: 100.00, // VALOR DIFERENTE
        })))
      ).resolves.not.toThrow();

      // Verificar que valores foram atualizados
      ap01 = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      const ap03 = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP03');

      expect(ap01.length).toBe(12);
      expect(ap01[0].valor_original_parcela).toBe(2000.00); // Valor atualizado
      expect(ap03[0].diferenca).toBe(100.00); // Valor atualizado
    }, 30000);

    it('deve permitir múltiplas gerações consecutivas sem erro', async () => {
      const tabela = Array.from({ length: 6 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 1500.00,
        valor_corrigido: 1505.00,
        juros: 500.00,
        amortizacao: 840.00,
        saldo_devedor: 302400.00 - (840.00 * (i + 1)),
      }));

      // Gerar 5 vezes seguidas
      for (let geracao = 1; geracao <= 5; geracao++) {
        const tabelaComVariacao = tabela.map(row => ({
          ...row,
          valor_original_parcela: 1500.00 + (geracao * 10), // Variar valor
        }));

        await expect(
          financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', tabelaComVariacao)
        ).resolves.not.toThrow();

        const recuperada = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
        expect(recuperada.length).toBe(6);
        expect(recuperada[0].valor_original_parcela).toBe(1500.00 + (geracao * 10));
      }
    }, 60000);
  });

  describe('Cenário 3: Mudança de Horizonte', () => {
    it('deve permitir mudar horizonte de 12 para 360 meses', async () => {
      // Primeira geração com 12 meses
      const tabela12 = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 1500.00,
        valor_corrigido: 1505.00,
        juros: 500.00,
        amortizacao: 840.00,
        saldo_devedor: 302400.00 - (840.00 * (i + 1)),
      }));

      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', tabela12);

      let ap01 = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      expect(ap01.length).toBe(12);

      // Segunda geração com 360 meses
      const tabela360 = Array.from({ length: 360 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 1500.00,
        valor_corrigido: 1505.00,
        juros: 500.00,
        amortizacao: 840.00,
        saldo_devedor: Math.max(0, 302400.00 - (840.00 * (i + 1))),
      }));

      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', tabela360);

      ap01 = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      expect(ap01.length).toBe(360);
    }, 60000);

    it('deve permitir mudar horizonte de 360 para 12 meses', async () => {
      // Primeira geração com 360 meses
      const tabela360 = Array.from({ length: 360 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 1500.00,
        valor_corrigido: 1505.00,
        juros: 500.00,
        amortizacao: 840.00,
        saldo_devedor: Math.max(0, 302400.00 - (840.00 * (i + 1))),
      }));

      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', tabela360);

      let ap01 = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      expect(ap01.length).toBe(360);

      // Segunda geração com apenas 12 meses
      const tabela12 = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 2000.00,
        valor_corrigido: 2005.00,
        juros: 600.00,
        amortizacao: 840.00,
        saldo_devedor: 302400.00 - (840.00 * (i + 1)),
      }));

      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', tabela12);

      ap01 = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      expect(ap01.length).toBe(12); // Deve ter deletado as 360 linhas antigas
    }, 60000);
  });

  describe('Cenário 4: Integridade dos Dados', () => {
    it('deve manter dados consistentes entre múltiplas gerações', async () => {
      // Primeira geração
      await financiamentosService.updateCalculatedResults(testFinanciamentoId, {
        taxa_contrato_am: 0.5654,
        taxa_mercado_am: 0.62,
        valor_total_pago: 20000.00,
      });

      let financiamento = await financiamentosService.getById(testFinanciamentoId);
      expect(financiamento?.valor_total_pago).toBe(20000.00);

      // Segunda geração com valores diferentes
      await financiamentosService.updateCalculatedResults(testFinanciamentoId, {
        valor_total_pago: 25000.00,
        diferenca_restituicao: 3000.00,
      });

      financiamento = await financiamentosService.getById(testFinanciamentoId);
      expect(financiamento?.valor_total_pago).toBe(25000.00);
      expect(financiamento?.diferenca_restituicao).toBe(3000.00);
      expect(financiamento?.taxa_contrato_am).toBe(0.5654); // Mantém valores não atualizados
    });

    it('deve atualizar status corretamente em cada geração', async () => {
      // Rascunho inicial
      let financiamento = await financiamentosService.getById(testFinanciamentoId);
      expect(financiamento?.status).toBe('Rascunho');

      // Primeira geração - Em Análise
      await financiamentosService.updateStatus(testFinanciamentoId, 'Em Análise');
      financiamento = await financiamentosService.getById(testFinanciamentoId);
      expect(financiamento?.status).toBe('Em Análise');

      // Segunda geração - Concluído
      await financiamentosService.updateStatus(testFinanciamentoId, 'Concluído');
      financiamento = await financiamentosService.getById(testFinanciamentoId);
      expect(financiamento?.status).toBe('Concluído');
    });
  });

  describe('Cenário 5: Performance e Batches', () => {
    it('deve processar 360 parcelas em batches de 100', async () => {
      const tabela360 = Array.from({ length: 360 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 1500.00,
        valor_corrigido: 1505.00,
        juros: 500.00,
        amortizacao: 840.00,
        saldo_devedor: Math.max(0, 302400.00 - (840.00 * (i + 1))),
      }));

      const startTime = Date.now();
      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', tabela360);
      const endTime = Date.now();

      const recuperada = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      expect(recuperada.length).toBe(360);

      // Deve completar em menos de 30 segundos
      expect(endTime - startTime).toBeLessThan(30000);
    }, 60000);
  });
});

describe('Edge Cases - Cenários Extremos', () => {
  it('deve lidar com tabela vazia (0 parcelas)', async () => {
    const financiamento = await financiamentosService.create({
      credor: 'Teste Vazio',
      devedor: 'Teste Vazio',
      valor_financiado: 100000.00,
      quantidade_parcelas: 0,
      data_primeira_parcela: '2024-01-01',
      sistema_amortizacao: 'SAC',
      indice_correcao: 'TR',
      taxa_mensal_contrato: 0.005,
      taxa_mensal_mercado: 0.004,
      status: 'Rascunho',
    });

    await expect(
      financiamentosService.saveAmortizacao(financiamento.id, 'AP01', [])
    ).resolves.not.toThrow();

    const recuperada = await financiamentosService.getAmortizacao(financiamento.id, 'AP01');
    expect(recuperada.length).toBe(0);

    // Cleanup
    await financiamentosService.hardDelete(financiamento.id);
  });

  it('deve lidar com valores monetários de alta precisão', async () => {
    const tabela = [{
      mes: 1,
      data: '2024-01-01',
      valor_original_parcela: 1234.56789012345, // 11 decimais
      valor_corrigido: 1234.56789012345,
      juros: 123.45678901234,
      amortizacao: 1111.11111111111,
      saldo_devedor: 98888.88888888889,
    }];

    const financiamento = await financiamentosService.create({
      credor: 'Teste Precisão',
      devedor: 'Teste Precisão',
      valor_financiado: 100000.00,
      quantidade_parcelas: 1,
      data_primeira_parcela: '2024-01-01',
      sistema_amortizacao: 'SAC',
      indice_correcao: 'TR',
      taxa_mensal_contrato: 0.005,
      taxa_mensal_mercado: 0.004,
      status: 'Rascunho',
    });

    await financiamentosService.saveAmortizacao(financiamento.id, 'AP01', tabela);

    const recuperada = await financiamentosService.getAmortizacao(financiamento.id, 'AP01');
    expect(recuperada[0].valor_original_parcela).toBeCloseTo(1234.57, 2);

    // Cleanup
    await financiamentosService.hardDelete(financiamento.id);
  });
});
