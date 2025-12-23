# Migração: Reestruturação de Relacionamentos CRM

**Data:** 2025-12-23  
**Versão:** 1.0

## Descrição

Esta migração implementa as seguintes alterações:

1. Adiciona `categoria_contato` à tabela `contatos`  
2. Cria view `v_contatos_status` para calcular `status_atividade` automaticamente  
3. Adiciona `contato_id` e `oportunidade_id` à tabela `contratos_revisionais`

## Instruções

Execute o SQL abaixo no **Supabase Dashboard > SQL Editor** ou via CLI.

---

## SQL Script

```sql
-- ============================================================
-- PARTE 1: Alterações na tabela CONTATOS
-- ============================================================

-- 1.1 Adicionar coluna categoria_contato (LEAD, CLIENTE, EX_CLIENTE)
ALTER TABLE public.contatos 
ADD COLUMN IF NOT EXISTS categoria_contato text 
    CHECK (categoria_contato IN ('LEAD', 'CLIENTE', 'EX_CLIENTE'))
    DEFAULT 'LEAD';

-- 1.2 Migrar dados existentes de status_contato para categoria_contato
UPDATE public.contatos SET categoria_contato = 
    CASE 
        WHEN status_contato = 'Lead' THEN 'LEAD'
        WHEN status_contato IN ('Cliente', 'Ativo') THEN 'CLIENTE'
        WHEN status_contato IN ('Ex-Cliente', 'Inativo') THEN 'EX_CLIENTE'
        ELSE 'LEAD'
    END
WHERE categoria_contato IS NULL OR categoria_contato = 'LEAD';

-- 1.3 Criar view para status_atividade calculado automaticamente
-- Status baseado na última atualização:
--   ATIVO: < 90 dias
--   INATIVO: 90-180 dias  
--   ARQUIVADO: > 180 dias
CREATE OR REPLACE VIEW public.v_contatos_status AS
SELECT 
    c.*,
    CASE 
        WHEN c.data_atualizacao >= NOW() - INTERVAL '90 days' THEN 'ATIVO'
        WHEN c.data_atualizacao >= NOW() - INTERVAL '180 days' THEN 'INATIVO'
        ELSE 'ARQUIVADO'
    END AS status_atividade
FROM public.contatos c;

-- 1.4 Comentário para documentação
COMMENT ON COLUMN public.contatos.categoria_contato IS 'Categoria do contato: LEAD (prospect), CLIENTE (ativo), EX_CLIENTE (encerrado)';

-- ============================================================
-- PARTE 2: Alterações na tabela CONTRATOS_REVISIONAIS
-- ============================================================

-- 2.1 Adicionar FK para contatos
ALTER TABLE public.contratos_revisionais
ADD COLUMN IF NOT EXISTS contato_id uuid REFERENCES public.contatos(id) ON DELETE SET NULL;

-- 2.2 Adicionar FK para oportunidades
ALTER TABLE public.contratos_revisionais
ADD COLUMN IF NOT EXISTS oportunidade_id uuid REFERENCES public.oportunidades(id) ON DELETE SET NULL;

-- 2.3 Criar índices para performance em JOINs
CREATE INDEX IF NOT EXISTS idx_contratos_revisionais_contato_id 
ON public.contratos_revisionais(contato_id);

CREATE INDEX IF NOT EXISTS idx_contratos_revisionais_oportunidade_id 
ON public.contratos_revisionais(oportunidade_id);

-- 2.4 Comentários para documentação
COMMENT ON COLUMN public.contratos_revisionais.contato_id IS 'FK para contatos - permite criar contrato diretamente vinculado a um contato';
COMMENT ON COLUMN public.contratos_revisionais.oportunidade_id IS 'FK para oportunidades - permite criar contrato a partir de uma oportunidade do CRM';
```

---

## Migração Opcional de Dados Legados

Execute apenas se houver contratos com `lead_nome` preenchido que você deseja vincular automaticamente:

```sql
UPDATE public.contratos_revisionais cr
SET contato_id = c.id
FROM public.contatos c
WHERE cr.lead_nome IS NOT NULL 
  AND cr.contato_id IS NULL
  AND c.nome_completo = cr.lead_nome;
```

---

## Verificação Pós-Migração

```sql
-- Verificar nova coluna em contatos
SELECT id, nome_completo, categoria_contato FROM public.contatos LIMIT 5;

-- Verificar view de status
SELECT id, nome_completo, categoria_contato, status_atividade 
FROM public.v_contatos_status LIMIT 5;

-- Verificar novas colunas em contratos_revisionais
SELECT id, contato_id, oportunidade_id FROM public.contratos_revisionais LIMIT 5;
```
