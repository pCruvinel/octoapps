# Database Migration: Contratos Revisionais

> **Data:** 2024-12-20  
> **Descrição:** Cria estrutura para persistência de Análise Prévia

## Como Executar

1. Acesse o [Supabase Dashboard](https://supabase.com/dashboard/project/hfmbkpnkjhxqjblpogsm)
2. Vá para **SQL Editor**
3. Cole o SQL abaixo e execute

---

## SQL Migration

```sql
-- =====================================================
-- Migration: Contratos Revisionais para Análise Prévia
-- =====================================================

-- 1. Criar Enums
CREATE TYPE modulo_calculo AS ENUM (
    'GERAL',
    'IMOBILIARIO', 
    'CARTAO'
);

CREATE TYPE status_contrato AS ENUM (
    'RASCUNHO',
    'ANALISE_PREVIA',
    'ANALISE_DETALHADA',
    'ARQUIVADO'
);

CREATE TYPE classificacao_viabilidade AS ENUM (
    'VIAVEL',
    'ATENCAO',
    'INVIAVEL'
);

-- 2. Tabela principal: Contratos Revisionais
CREATE TABLE contratos_revisionais (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    lead_id UUID, -- Opcional, sem FK por enquanto (leads table não existe ainda)
    
    modulo modulo_calculo NOT NULL,
    status status_contrato NOT NULL DEFAULT 'RASCUNHO',
    
    dados_step1 JSONB,
    dados_step2 JSONB,
    dados_step3 JSONB,
    
    nome_referencia TEXT,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Resultado da Análise Prévia
CREATE TABLE resultado_analise_previa (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    contrato_id UUID NOT NULL REFERENCES contratos_revisionais(id) ON DELETE CASCADE,
    
    taxa_contrato NUMERIC(10,6),
    taxa_media_bacen NUMERIC(10,6),
    sobretaxa_percentual NUMERIC(10,4),
    economia_estimada NUMERIC(18,2),
    nova_parcela_estimada NUMERIC(18,2),
    
    classificacao classificacao_viabilidade,
    detalhes_calculo JSONB,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. Índices
CREATE INDEX idx_contratos_user_id ON contratos_revisionais(user_id);
CREATE INDEX idx_contratos_status ON contratos_revisionais(status);
CREATE INDEX idx_contratos_modulo ON contratos_revisionais(modulo);
CREATE INDEX idx_resultado_contrato_id ON resultado_analise_previa(contrato_id);

-- 5. Trigger para updated_at
CREATE OR REPLACE FUNCTION update_contratos_revisionais_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_contratos_revisionais_timestamp
    BEFORE UPDATE ON contratos_revisionais
    FOR EACH ROW EXECUTE FUNCTION update_contratos_revisionais_timestamp();

-- 6. RLS Policies
ALTER TABLE contratos_revisionais ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own contratos" ON contratos_revisionais
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contratos" ON contratos_revisionais
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own contratos" ON contratos_revisionais
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own contratos" ON contratos_revisionais
    FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE resultado_analise_previa ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own resultados" ON resultado_analise_previa
    FOR SELECT USING (
        contrato_id IN (SELECT id FROM contratos_revisionais WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can insert own resultados" ON resultado_analise_previa
    FOR INSERT WITH CHECK (
        contrato_id IN (SELECT id FROM contratos_revisionais WHERE user_id = auth.uid())
    );

CREATE POLICY "Users can delete own resultados" ON resultado_analise_previa
    FOR DELETE USING (
        contrato_id IN (SELECT id FROM contratos_revisionais WHERE user_id = auth.uid())
    );

-- 7. Comentários
COMMENT ON TABLE contratos_revisionais IS 'Contratos sob revisão - armazena dados do wizard e status da análise';
COMMENT ON TABLE resultado_analise_previa IS 'Resultados da análise prévia para cada contrato';
```

---

## Estrutura das Tabelas

### `contratos_revisionais`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `user_id` | UUID | FK → auth.users |
| `lead_id` | UUID | FK → leads (opcional) |
| `modulo` | ENUM | GERAL, IMOBILIARIO, CARTAO |
| `status` | ENUM | RASCUNHO → ANALISE_PREVIA → ANALISE_DETALHADA |
| `dados_step1` | JSONB | Dados do Step 1 do wizard |
| `dados_step2` | JSONB | Dados do Step 2 do wizard |
| `dados_step3` | JSONB | Dados do Step 3 do wizard |
| `nome_referencia` | TEXT | Ex: "João - Veículo BB" |

### `resultado_analise_previa`
| Coluna | Tipo | Descrição |
|--------|------|-----------|
| `id` | UUID | PK |
| `contrato_id` | UUID | FK → contratos_revisionais |
| `taxa_contrato` | NUMERIC | Taxa do contrato (%) |
| `taxa_media_bacen` | NUMERIC | Taxa média Bacen (%) |
| `sobretaxa_percentual` | NUMERIC | Sobretaxa em % |
| `economia_estimada` | NUMERIC | R$ economia estimada |
| `classificacao` | ENUM | VIAVEL, ATENCAO, INVIAVEL |
| `detalhes_calculo` | JSONB | Detalhes para PDF |
