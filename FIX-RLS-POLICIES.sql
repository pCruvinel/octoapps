-- ============================================================================
-- FIX: Adicionar Políticas RLS Faltantes para UPDATE e DELETE
-- Execute este SQL no Supabase SQL Editor
-- URL: https://supabase.com/dashboard/project/uyeubtqxwrhpuafcpgtg/sql
-- ============================================================================

-- 1. DROP políticas antigas se existirem
DROP POLICY IF EXISTS "Users can update related amortizacao" ON financiamentos_amortizacao;
DROP POLICY IF EXISTS "Users can delete related amortizacao" ON financiamentos_amortizacao;
DROP POLICY IF EXISTS "Users can update related historico" ON financiamentos_historico;

-- 2. CREATE políticas de UPDATE para amortizacao
CREATE POLICY "Users can update related amortizacao"
  ON financiamentos_amortizacao FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM financiamentos f
      WHERE f.id = financiamento_id
      AND (f.criado_por = auth.uid() OR f.calculado_por = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM financiamentos f
      WHERE f.id = financiamento_id
      AND (f.criado_por = auth.uid() OR f.calculado_por = auth.uid())
    )
  );

-- 3. CREATE políticas de DELETE para amortizacao
CREATE POLICY "Users can delete related amortizacao"
  ON financiamentos_amortizacao FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM financiamentos f
      WHERE f.id = financiamento_id
      AND (f.criado_por = auth.uid() OR f.calculado_por = auth.uid())
    )
  );

-- 4. CREATE políticas de UPDATE para historico (caso precise)
CREATE POLICY "Users can update related historico"
  ON financiamentos_historico FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM financiamentos f
      WHERE f.id = financiamento_id
      AND (f.criado_por = auth.uid() OR f.calculado_por = auth.uid())
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM financiamentos f
      WHERE f.id = financiamento_id
      AND (f.criado_por = auth.uid() OR f.calculado_por = auth.uid())
    )
  );

-- 5. GRANT permissões completas
GRANT SELECT, INSERT, UPDATE, DELETE ON financiamentos_amortizacao TO authenticated;
GRANT SELECT, INSERT, UPDATE ON financiamentos_historico TO authenticated;

-- ============================================================================
-- VERIFICATION: Verificar todas as políticas
-- ============================================================================

-- Listar todas as políticas da tabela financiamentos_amortizacao
SELECT
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE tablename = 'financiamentos_amortizacao'
ORDER BY cmd, policyname;

-- Resultado Esperado:
-- DELETE | Users can delete related amortizacao
-- INSERT | Users can insert related amortizacao
-- SELECT | Users can view related amortizacao
-- UPDATE | Users can update related amortizacao

-- ============================================================================
-- TEST: Testar políticas (opcional)
-- ============================================================================

-- Verificar se o usuário logado consegue fazer operações
-- Substitua 'SEU_FINANCIAMENTO_ID' por um ID real

-- Test SELECT
SELECT COUNT(*) FROM financiamentos_amortizacao
WHERE financiamento_id = 'd44083c0-d522-42f9-944a-874788854220';

-- Test DELETE (deve deletar se for dono)
DELETE FROM financiamentos_amortizacao
WHERE financiamento_id = 'd44083c0-d522-42f9-944a-874788854220'
AND cenario = 'AP01';

-- Test INSERT (deve inserir se for dono)
INSERT INTO financiamentos_amortizacao (
  financiamento_id, mes, data, valor_original_parcela,
  valor_corrigido, juros, amortizacao, saldo_devedor, cenario
) VALUES (
  'd44083c0-d522-42f9-944a-874788854220', 1, '2024-01-01',
  1000, 1000, 100, 900, 99000, 'AP01'
);

-- Test UPDATE (deve atualizar se for dono)
UPDATE financiamentos_amortizacao
SET valor_original_parcela = 1100
WHERE financiamento_id = 'd44083c0-d522-42f9-944a-874788854220'
AND mes = 1 AND cenario = 'AP01';

-- ============================================================================
-- RESULTADO ESPERADO APÓS EXECUTAR ESTE SQL:
-- ✅ DELETE funciona e remove linhas antigas
-- ✅ INSERT funciona normalmente
-- ✅ UPSERT funciona como fallback
-- ✅ Sem mais erro 403 Forbidden
-- ============================================================================
