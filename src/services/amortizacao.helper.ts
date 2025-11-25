/**
 * Helper Functions para Amortização
 *
 * Funções auxiliares para garantir operações atômicas e consistentes
 * nas tabelas de amortização, evitando erros de chave duplicada.
 */

import { supabase } from '@/lib/supabase';
import type { Database } from '@/lib/database.types';

type AmortizacaoInsert = Database['public']['Tables']['financiamentos_amortizacao']['Insert'];
export type Cenario = 'AP01' | 'AP05' | 'AP03';

/**
 * Estratégia de Save Seguro com Fallback Automático
 *
 * Esta função implementa uma estratégia robusta para salvar dados de amortização:
 * 1. Tenta DELETE + INSERT (mais eficiente)
 * 2. Se falhar com erro de chave duplicada, usa UPSERT
 * 3. Processa em batches para evitar timeout
 */
export async function safeSaveAmortizacao(
  financiamentoId: string,
  cenario: Cenario,
  rows: Omit<AmortizacaoInsert, 'financiamento_id' | 'cenario'>[],
  batchSize: number = 100
): Promise<{
  success: boolean;
  rowsSaved: number;
  strategy: 'delete-insert' | 'upsert';
  batches: number;
  errors: string[];
}> {
  const result = {
    success: false,
    rowsSaved: 0,
    strategy: 'delete-insert' as 'delete-insert' | 'upsert',
    batches: 0,
    errors: [] as string[],
  };

  try {

    // Step 1: Verificar se existem dados antigos
    const { data: existingRows, error: checkError } = await supabase
      .from('financiamentos_amortizacao')
      .select('id, mes')
      .eq('financiamento_id', financiamentoId)
      .eq('cenario', cenario);

    if (checkError) {
      console.error('❌ Error checking existing rows:', checkError);
      result.errors.push(`Check error: ${checkError.message}`);
    } else {
    }

    // Step 2: Deletar dados antigos
    const { error: deleteError, count: deletedCount } = await supabase
      .from('financiamentos_amortizacao')
      .delete({ count: 'exact' })
      .eq('financiamento_id', financiamentoId)
      .eq('cenario', cenario);

    if (deleteError) {
      console.error('❌ Delete error:', deleteError);
      result.errors.push(`Delete error: ${deleteError.message}`);
      // Não jogar erro - vamos tentar upsert mais tarde
    } else {
    }

    // Step 3: Preparar dados para inserção
    const rowsToInsert: AmortizacaoInsert[] = rows.map((row) => ({
      ...row,
      financiamento_id: financiamentoId,
      cenario,
    }));


    // Step 4: Processar em batches
    const totalBatches = Math.ceil(rowsToInsert.length / batchSize);
    let useUpsert = false;

    for (let i = 0; i < rowsToInsert.length; i += batchSize) {
      const batch = rowsToInsert.slice(i, i + batchSize);
      const batchNum = Math.floor(i / batchSize) + 1;
      result.batches++;


      // Tentar INSERT primeiro (mais eficiente)
      if (!useUpsert) {
        const { error: insertError } = await supabase
          .from('financiamentos_amortizacao')
          .insert(batch);

        if (insertError) {
          // Se erro de chave duplicada, mudar para UPSERT
          if (insertError.code === '23505') {
            console.warn(`⚠️  Duplicate key detected in batch ${batchNum}. Switching to UPSERT strategy...`);
            useUpsert = true;
            result.strategy = 'upsert';

            // Reprocessar este batch com UPSERT
            const { error: upsertError } = await supabase
              .from('financiamentos_amortizacao')
              .upsert(batch, {
                onConflict: 'financiamento_id,mes,cenario',
                ignoreDuplicates: false,
              });

            if (upsertError) {
              console.error(`❌ Upsert error in batch ${batchNum}:`, upsertError);
              result.errors.push(`Batch ${batchNum} upsert error: ${upsertError.message}`);
              throw new Error(`Failed to save batch ${batchNum}: ${upsertError.message}`);
            } else {
              result.rowsSaved += batch.length;
            }
          } else {
            // Outro tipo de erro
            console.error(`❌ Insert error in batch ${batchNum}:`, insertError);
            result.errors.push(`Batch ${batchNum} insert error: ${insertError.message}`);
            throw new Error(`Failed to insert batch ${batchNum}: ${insertError.message}`);
          }
        } else {
          result.rowsSaved += batch.length;
        }
      } else {
        // Já estamos em modo UPSERT
        const { error: upsertError } = await supabase
          .from('financiamentos_amortizacao')
          .upsert(batch, {
            onConflict: 'financiamento_id,mes,cenario',
            ignoreDuplicates: false,
          });

        if (upsertError) {
          console.error(`❌ Upsert error in batch ${batchNum}:`, upsertError);
          result.errors.push(`Batch ${batchNum} upsert error: ${upsertError.message}`);
          throw new Error(`Failed to upsert batch ${batchNum}: ${upsertError.message}`);
        } else {
          result.rowsSaved += batch.length;
        }
      }
    }

    result.success = true;

    return result;
  } catch (error) {
    console.error('❌ safeSaveAmortizacao failed:', error);
    result.success = false;
    result.errors.push(error instanceof Error ? error.message : String(error));
    throw error;
  }
}

/**
 * Validar dados de amortização antes de salvar
 */
export function validateAmortizacaoRows(
  rows: Omit<AmortizacaoInsert, 'financiamento_id' | 'cenario'>[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];

  if (!Array.isArray(rows)) {
    errors.push('Rows must be an array');
    return { valid: false, errors };
  }

  if (rows.length === 0) {
    // Tabela vazia é válida (pode ser um caso de delete apenas)
    return { valid: true, errors: [] };
  }

  // Verificar campos obrigatórios
  rows.forEach((row, index) => {
    if (typeof row.mes !== 'number' || row.mes < 1) {
      errors.push(`Row ${index}: 'mes' must be a positive number`);
    }

    if (!row.data || !/^\d{4}-\d{2}-\d{2}$/.test(row.data)) {
      errors.push(`Row ${index}: 'data' must be in YYYY-MM-DD format`);
    }

    if (typeof row.valor_corrigido !== 'number') {
      errors.push(`Row ${index}: 'valor_corrigido' must be a number`);
    }

    if (typeof row.saldo_devedor !== 'number') {
      errors.push(`Row ${index}: 'saldo_devedor' must be a number`);
    }
  });

  // Verificar duplicatas de mês
  const meses = rows.map(r => r.mes);
  const mesesUnicos = new Set(meses);
  if (meses.length !== mesesUnicos.size) {
    errors.push('Duplicate month values found in rows');
  }

  // Verificar ordem dos meses
  for (let i = 1; i < rows.length; i++) {
    if (rows[i].mes <= rows[i - 1].mes) {
      errors.push(`Rows must be ordered by month (issue at index ${i})`);
      break;
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Limpar todas as tabelas de amortização de um financiamento
 */
export async function clearAllAmortizacaoTables(
  financiamentoId: string
): Promise<{ deleted: number; errors: string[] }> {
  const result = {
    deleted: 0,
    errors: [] as string[],
  };

  for (const cenario of ['AP01', 'AP05', 'AP03'] as Cenario[]) {
    const { error, count } = await supabase
      .from('financiamentos_amortizacao')
      .delete({ count: 'exact' })
      .eq('financiamento_id', financiamentoId)
      .eq('cenario', cenario);

    if (error) {
      result.errors.push(`Error deleting ${cenario}: ${error.message}`);
    } else {
      result.deleted += count || 0;
    }
  }

  return result;
}
