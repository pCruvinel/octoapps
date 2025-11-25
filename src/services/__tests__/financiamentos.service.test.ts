/**
 * Testes Unitários - FinanciamentosService
 *
 * Testa todas as operações CRUD do serviço de financiamentos
 */

import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { financiamentosService } from '../financiamentos.service';
import type { Database } from '@/lib/database.types';

type FinanciamentoInsert = Database['public']['Tables']['financiamentos']['Insert'];

describe('FinanciamentosService - CRUD Operations', () => {
  let testFinanciamentoId: string;

  // Dados de teste baseados no TESTE-REAL.md
  const dadosTeste: FinanciamentoInsert = {
    credor: 'Banco Teste S.A.',
    devedor: 'João da Silva',
    contrato_num: 'TESTE-001',
    tipo_contrato: 'Financiamento',
    valor_bem: 432000.00,
    entrada: 129600.00,
    valor_financiado: 302400.00,
    quantidade_parcelas: 360,
    data_primeira_parcela: '2018-06-21',
    data_contrato: '2018-05-21',
    sistema_amortizacao: 'SAC',
    indice_correcao: 'TR',
    taxa_mensal_contrato: 0.005654145387,
    taxa_anual_contrato: 0.07,
    taxa_mensal_mercado: 0.0062,
    mip_primeira_parcela: 62.54,
    dfi_primeira_parcela: 77.66,
    tca_primeira_parcela: 25.00,
    multa_primeira_parcela: 0,
    mora_primeira_parcela: 0,
    horizonte_meses: 12,
    status: 'Rascunho',
  };

  describe('CREATE - Criar Financiamento', () => {
    it('deve criar um novo financiamento com sucesso', async () => {
      const created = await financiamentosService.create(dadosTeste);

      expect(created).toBeDefined();
      expect(created.id).toBeDefined();
      expect(created.credor).toBe(dadosTeste.credor);
      expect(created.devedor).toBe(dadosTeste.devedor);
      expect(created.valor_financiado).toBe(dadosTeste.valor_financiado);
      expect(created.status).toBe('Rascunho');
      expect(created.excluido).toBe(false);

      // Salvar ID para próximos testes
      testFinanciamentoId = created.id;
    }, 10000); // Timeout de 10s para operações de banco

    it('deve rejeitar criação sem campos obrigatórios', async () => {
      const dadosIncompletos = {
        credor: 'Teste',
        // devedor ausente (obrigatório)
      } as any;

      await expect(
        financiamentosService.create(dadosIncompletos)
      ).rejects.toThrow();
    });
  });

  describe('READ - Ler Financiamento', () => {
    it('deve buscar financiamento por ID', async () => {
      const financiamento = await financiamentosService.getById(testFinanciamentoId);

      expect(financiamento).toBeDefined();
      expect(financiamento?.id).toBe(testFinanciamentoId);
      expect(financiamento?.credor).toBe(dadosTeste.credor);
      expect(financiamento?.devedor).toBe(dadosTeste.devedor);
    });

    it('deve retornar null para ID inexistente', async () => {
      const financiamento = await financiamentosService.getById('00000000-0000-0000-0000-000000000000');
      expect(financiamento).toBeNull();
    });

    it('deve listar todos os financiamentos', async () => {
      const lista = await financiamentosService.getAll();

      expect(Array.isArray(lista)).toBe(true);
      expect(lista.length).toBeGreaterThan(0);

      const nossoTeste = lista.find(f => f.id === testFinanciamentoId);
      expect(nossoTeste).toBeDefined();
    });

    it('deve filtrar por status', async () => {
      const rascunhos = await financiamentosService.getAll({ status: 'Rascunho' });

      expect(Array.isArray(rascunhos)).toBe(true);
      rascunhos.forEach(f => {
        expect(f.status).toBe('Rascunho');
      });
    });

    it('deve filtrar por devedor', async () => {
      const resultado = await financiamentosService.getAll({ devedor: 'João' });

      expect(Array.isArray(resultado)).toBe(true);
      const nossoTeste = resultado.find(f => f.devedor === 'João da Silva');
      expect(nossoTeste).toBeDefined();
    });

    it('deve buscar com pesquisa geral', async () => {
      const resultado = await financiamentosService.getAll({ search: 'TESTE-001' });

      expect(Array.isArray(resultado)).toBe(true);
      const nossoTeste = resultado.find(f => f.contrato_num === 'TESTE-001');
      expect(nossoTeste).toBeDefined();
    });
  });

  describe('UPDATE - Atualizar Financiamento', () => {
    it('deve atualizar campos do financiamento', async () => {
      const updated = await financiamentosService.update(
        testFinanciamentoId,
        {
          observacoes: 'Teste de atualização',
          status: 'Em Análise',
        }
      );

      expect(updated).toBeDefined();
      expect(updated.observacoes).toBe('Teste de atualização');
      expect(updated.status).toBe('Em Análise');
    });

    it('deve atualizar status independentemente', async () => {
      await financiamentosService.updateStatus(testFinanciamentoId, 'Concluído');

      const financiamento = await financiamentosService.getById(testFinanciamentoId);
      expect(financiamento?.status).toBe('Concluído');
    });

    it('deve atualizar resultados calculados', async () => {
      await financiamentosService.updateCalculatedResults(testFinanciamentoId, {
        taxa_contrato_am: 0.5654,
        taxa_mercado_am: 0.62,
        sobretaxa_pp: 0.0546,
        diferenca_restituicao: 1234.56,
      });

      const financiamento = await financiamentosService.getById(testFinanciamentoId);
      expect(financiamento?.taxa_contrato_am).toBeCloseTo(0.5654, 4);
      expect(financiamento?.diferenca_restituicao).toBeCloseTo(1234.56, 2);
    });
  });

  describe('AMORTIZATION - Tabelas de Amortização', () => {
    it('deve salvar tabela de amortização AP01', async () => {
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

      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', tabelaAP01);

      const recuperada = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      expect(recuperada.length).toBe(12);
      expect(recuperada[0].mes).toBe(1);
      expect(recuperada[0].cenario).toBe('AP01');
    });

    it('deve salvar tabela de amortização AP05', async () => {
      const tabelaAP05 = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 1450.00,
        valor_corrigido: 1455.00,
        juros: 480.00,
        amortizacao: 840.00,
        saldo_devedor: 302400.00 - (840.00 * (i + 1)),
      }));

      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP05', tabelaAP05);

      const recuperada = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP05');
      expect(recuperada.length).toBe(12);
      expect(recuperada[0].cenario).toBe('AP05');
    });

    it('deve salvar tabela comparativa AP03', async () => {
      const tabelaAP03 = Array.from({ length: 12 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 0,
        valor_corrigido: 0,
        juros: 0,
        amortizacao: 0,
        saldo_devedor: 0,
        diferenca: 50.00, // Diferença entre AP01 e AP05
      }));

      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP03', tabelaAP03);

      const recuperada = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP03');
      expect(recuperada.length).toBe(12);
      expect(recuperada[0].cenario).toBe('AP03');
      expect(recuperada[0].diferenca).toBe(50.00);
    });

    it('deve buscar financiamento completo com todas amortizações', async () => {
      const completo = await financiamentosService.getCompleto(testFinanciamentoId);

      expect(completo).toBeDefined();
      expect(completo?.amortizacao_ap01).toBeDefined();
      expect(completo?.amortizacao_ap05).toBeDefined();
      expect(completo?.amortizacao_ap03).toBeDefined();
      expect(completo?.amortizacao_ap01?.length).toBe(12);
      expect(completo?.amortizacao_ap05?.length).toBe(12);
      expect(completo?.amortizacao_ap03?.length).toBe(12);
    });

    it('deve substituir tabela existente ao salvar novamente', async () => {
      const novaTabela = Array.from({ length: 6 }, (_, i) => ({
        mes: i + 1,
        data: new Date(2018, 5 + i, 21).toISOString().split('T')[0],
        valor_original_parcela: 2000.00,
        valor_corrigido: 2005.00,
        juros: 600.00,
        amortizacao: 840.00,
        saldo_devedor: 302400.00 - (840.00 * (i + 1)),
      }));

      await financiamentosService.saveAmortizacao(testFinanciamentoId, 'AP01', novaTabela);

      const recuperada = await financiamentosService.getAmortizacao(testFinanciamentoId, 'AP01');
      expect(recuperada.length).toBe(6); // Agora só tem 6 meses
      expect(recuperada[0].valor_original_parcela).toBe(2000.00);
    });
  });

  describe('UTILITY - Métodos Auxiliares', () => {
    it('deve verificar se financiamento existe', async () => {
      const existe = await financiamentosService.exists(testFinanciamentoId);
      expect(existe).toBe(true);

      const naoExiste = await financiamentosService.exists('00000000-0000-0000-0000-000000000000');
      expect(naoExiste).toBe(false);
    });

    it('deve contar financiamentos', async () => {
      const total = await financiamentosService.count();
      expect(total).toBeGreaterThan(0);

      const rascunhos = await financiamentosService.count({ status: 'Rascunho' });
      expect(rascunhos).toBeGreaterThanOrEqual(0);
    });
  });

  describe('SOFT DELETE - Exclusão Lógica', () => {
    it('deve fazer soft delete do financiamento', async () => {
      await financiamentosService.softDelete(testFinanciamentoId);

      // Não deve aparecer na listagem normal
      const lista = await financiamentosService.getAll();
      const encontrado = lista.find(f => f.id === testFinanciamentoId);
      expect(encontrado).toBeUndefined();

      // Mas ainda existe no banco (com excluido=true)
      // Para verificar, precisaríamos de uma query raw ou método específico
    });

    it('deve restaurar financiamento excluído', async () => {
      await financiamentosService.restore(testFinanciamentoId);

      // Agora deve aparecer novamente
      const financiamento = await financiamentosService.getById(testFinanciamentoId);
      expect(financiamento).toBeDefined();
      expect(financiamento?.excluido).toBe(false);
    });

    it('deve fazer hard delete permanente (USE COM CUIDADO)', async () => {
      // Este é o último teste - vai deletar de verdade
      await financiamentosService.hardDelete(testFinanciamentoId);

      const financiamento = await financiamentosService.getById(testFinanciamentoId);
      expect(financiamento).toBeNull();
    });
  });
});

describe('FinanciamentosService - Edge Cases', () => {
  it('deve lidar com lista vazia corretamente', async () => {
    const resultado = await financiamentosService.getAll({ devedor: 'NOME_QUE_NAO_EXISTE_XYZ123' });
    expect(Array.isArray(resultado)).toBe(true);
    expect(resultado.length).toBe(0);
  });

  it('deve lidar com valores decimais de alta precisão', async () => {
    const dados = {
      credor: 'Teste Precisão',
      devedor: 'Teste Precisão',
      valor_financiado: 100000.00,
      quantidade_parcelas: 360,
      data_primeira_parcela: '2024-01-01',
      sistema_amortizacao: 'SAC' as const,
      indice_correcao: 'TR' as const,
      taxa_mensal_contrato: 0.005654145387123, // 12 decimais
      taxa_mensal_mercado: 0.004512789654321,
      status: 'Rascunho' as const,
    };

    const created = await financiamentosService.create(dados);
    expect(created.taxa_mensal_contrato).toBeCloseTo(0.005654145387, 12);

    // Cleanup
    await financiamentosService.hardDelete(created.id);
  });

  it('deve lidar com datas futuras', async () => {
    const dados = {
      credor: 'Teste Futuro',
      devedor: 'Teste Futuro',
      valor_financiado: 100000.00,
      quantidade_parcelas: 360,
      data_primeira_parcela: '2030-01-01', // Futuro
      sistema_amortizacao: 'SAC' as const,
      indice_correcao: 'TR' as const,
      taxa_mensal_contrato: 0.005,
      taxa_mensal_mercado: 0.004,
      status: 'Rascunho' as const,
    };

    const created = await financiamentosService.create(dados);
    expect(created.data_primeira_parcela).toBe('2030-01-01');

    // Cleanup
    await financiamentosService.hardDelete(created.id);
  });
});
