# Migration: create_ocr_tables
# Created at: 2024-12-19

```sql
-- 1. OCR Settings Table
CREATE TABLE IF NOT EXISTS public.ocr_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Gemini Configuration
    gemini_api_key_encrypted TEXT,
    gemini_model TEXT DEFAULT 'gemini-1.5-flash',
    gemini_enabled BOOLEAN DEFAULT true,
    
    -- Mistral Configuration  
    mistral_api_key_encrypted TEXT,
    mistral_model TEXT DEFAULT 'pixtral-12b-2409',
    mistral_enabled BOOLEAN DEFAULT true,
    
    -- Global Settings
    fallback_enabled BOOLEAN DEFAULT true,
    timeout_seconds INTEGER DEFAULT 60,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one setting per user
    UNIQUE(user_id)
);

-- RLS Policies for ocr_settings
ALTER TABLE public.ocr_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own settings"
    ON public.ocr_settings FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own settings"
    ON public.ocr_settings FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own settings"
    ON public.ocr_settings FOR UPDATE
    USING (auth.uid() = user_id);

-- Trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_ocr_settings_updated_at ON public.ocr_settings;
CREATE TRIGGER update_ocr_settings_updated_at
    BEFORE UPDATE ON public.ocr_settings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();


-- 2. OCR Field Configs Table
-- Create ENUM if not exists
DO $$ BEGIN
    CREATE TYPE public.ocr_category AS ENUM (
        'EMPRESTIMOS_VEICULOS',
        'IMOBILIARIO', 
        'CARTAO_CREDITO'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.ocr_field_configs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    
    category public.ocr_category NOT NULL,
    field_key TEXT NOT NULL,
    field_label TEXT NOT NULL,
    field_type TEXT DEFAULT 'text', -- text, number, date, boolean
    is_required BOOLEAN DEFAULT false,
    is_enabled BOOLEAN DEFAULT true,
    extraction_hint TEXT,
    display_order INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    UNIQUE(user_id, category, field_key)
);

-- RLS Policies for ocr_field_configs
ALTER TABLE public.ocr_field_configs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own field configs"
    ON public.ocr_field_configs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can manage own field configs"
    ON public.ocr_field_configs FOR ALL
    USING (auth.uid() = user_id);


-- 3. OCR Logs Table
-- Create ENUMs for logs
DO $$ BEGIN
    CREATE TYPE public.ocr_provider AS ENUM ('GEMINI', 'MISTRAL', 'N8N');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE public.ocr_status AS ENUM ('SUCCESS', 'PARTIAL', 'FAILED', 'TIMEOUT');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

CREATE TABLE IF NOT EXISTS public.ocr_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    
    -- Request Info
    file_name TEXT NOT NULL,
    file_size_bytes INTEGER,
    category public.ocr_category NOT NULL,
    
    -- Response Info
    provider_used public.ocr_provider NOT NULL,
    status public.ocr_status NOT NULL,
    extracted_fields JSONB,
    fields_found INTEGER DEFAULT 0,
    fields_missing TEXT[],
    
    -- Performance & Cost
    processing_time_ms INTEGER,
    tokens_input INTEGER,
    tokens_output INTEGER,
    estimated_cost_usd NUMERIC(10, 6),
    
    -- Error Handling
    error_message TEXT,
    fallback_triggered BOOLEAN DEFAULT false,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies for ocr_logs
ALTER TABLE public.ocr_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own logs"
    ON public.ocr_logs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own logs"
    ON public.ocr_logs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

-- Index for analytics
CREATE INDEX IF NOT EXISTS idx_ocr_logs_user_date ON public.ocr_logs(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ocr_logs_status ON public.ocr_logs(status);
```
