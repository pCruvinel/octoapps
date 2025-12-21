/**
 * Database Migration Script - v3.0 Calculation Module
 * 
 * Run this script to apply the v3.0 schema updates to your Supabase database.
 * 
 * Usage: npx ts-node scripts/migrate-v3-calculations.ts
 */

import { createClient } from '@supabase/supabase-js';

// Load from environment or use hardcoded values for migration
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://uyeubtqxwrhpuafcpgtg.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // Needs service role for DDL

if (!supabaseServiceKey) {
    console.error('❌ SUPABASE_SERVICE_ROLE_KEY is required for migrations');
    console.log('\nTo run migrations:');
    console.log('1. Go to Supabase Dashboard → Settings → API');
    console.log('2. Copy "service_role" key (NOT anon key)');
    console.log('3. Run: SUPABASE_SERVICE_ROLE_KEY=your_key npx ts-node scripts/migrate-v3-calculations.ts');
    console.log('\n⚠️ Alternatively, copy the SQL below and run in Supabase SQL Editor:\n');

    // Print migration SQL for manual execution
    console.log(MIGRATION_SQL);
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// ============================================================================
// MIGRATION SQL
// ============================================================================

const MIGRATION_SQL = `
-- ============================================================================
-- MIGRATION v3.0: Calculation Module Schema Updates
-- Date: 2025-12-17
-- ============================================================================

-- MIGRATION 1: Capitalização e Conciliação
ALTER TABLE public.calculation_inputs 
ADD COLUMN IF NOT EXISTS capitalization_mode text DEFAULT 'MONTHLY' 
  CHECK (capitalization_mode IN ('MONTHLY', 'DAILY'));

ALTER TABLE public.calculation_inputs 
ADD COLUMN IF NOT EXISTS payment_reconciliation jsonb DEFAULT '[]'::jsonb;

ALTER TABLE public.calculation_inputs 
ADD COLUMN IF NOT EXISTS abuse_threshold numeric DEFAULT 1.5;

-- MIGRATION 2: Configuração de Inadimplência
ALTER TABLE public.calculation_inputs
ADD COLUMN IF NOT EXISTS default_fine_percent numeric DEFAULT 2.0;

ALTER TABLE public.calculation_inputs
ADD COLUMN IF NOT EXISTS default_interest_percent numeric DEFAULT 1.0;

ALTER TABLE public.calculation_inputs
ADD COLUMN IF NOT EXISTS default_fine_base text DEFAULT 'PRINCIPAL'
  CHECK (default_fine_base IN ('PRINCIPAL', 'TOTAL_INSTALLMENT'));

-- MIGRATION 3: Cadeia de Contratos
ALTER TABLE public.calculations
ADD COLUMN IF NOT EXISTS parent_calculation_id uuid 
  REFERENCES public.calculations(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_calculations_parent_id 
ON public.calculations(parent_calculation_id) 
WHERE parent_calculation_id IS NOT NULL;

-- MIGRATION 4: Snapshot de Auditoria Expandido
ALTER TABLE public.calculation_results
ADD COLUMN IF NOT EXISTS rates_snapshot jsonb DEFAULT '{}'::jsonb;

ALTER TABLE public.calculation_results
ADD COLUMN IF NOT EXISTS scenarios jsonb DEFAULT '{}'::jsonb;

-- MIGRATION 5: Feriados Nacionais
CREATE TABLE IF NOT EXISTS public.feriados_nacionais (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  data date NOT NULL UNIQUE,
  nome text NOT NULL,
  tipo text DEFAULT 'NACIONAL' CHECK (tipo IN ('NACIONAL', 'ESTADUAL', 'MUNICIPAL')),
  created_at timestamptz DEFAULT now()
);

-- Inserir feriados 2024-2026
INSERT INTO public.feriados_nacionais (data, nome, tipo) VALUES
('2024-01-01', 'Confraternização Universal', 'NACIONAL'),
('2024-04-21', 'Tiradentes', 'NACIONAL'),
('2024-05-01', 'Dia do Trabalhador', 'NACIONAL'),
('2024-09-07', 'Independência do Brasil', 'NACIONAL'),
('2024-10-12', 'Nossa Senhora Aparecida', 'NACIONAL'),
('2024-11-02', 'Finados', 'NACIONAL'),
('2024-11-15', 'Proclamação da República', 'NACIONAL'),
('2024-12-25', 'Natal', 'NACIONAL'),
('2025-01-01', 'Confraternização Universal', 'NACIONAL'),
('2025-04-21', 'Tiradentes', 'NACIONAL'),
('2025-05-01', 'Dia do Trabalhador', 'NACIONAL'),
('2025-09-07', 'Independência do Brasil', 'NACIONAL'),
('2025-10-12', 'Nossa Senhora Aparecida', 'NACIONAL'),
('2025-11-02', 'Finados', 'NACIONAL'),
('2025-11-15', 'Proclamação da República', 'NACIONAL'),
('2025-12-25', 'Natal', 'NACIONAL'),
('2026-01-01', 'Confraternização Universal', 'NACIONAL'),
('2026-04-21', 'Tiradentes', 'NACIONAL'),
('2026-05-01', 'Dia do Trabalhador', 'NACIONAL'),
('2026-09-07', 'Independência do Brasil', 'NACIONAL'),
('2026-10-12', 'Nossa Senhora Aparecida', 'NACIONAL'),
('2026-11-02', 'Finados', 'NACIONAL'),
('2026-11-15', 'Proclamação da República', 'NACIONAL'),
('2026-12-25', 'Natal', 'NACIONAL')
ON CONFLICT (data) DO NOTHING;

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_calculation_inputs_capitalization 
ON public.calculation_inputs(capitalization_mode);

CREATE INDEX IF NOT EXISTS idx_feriados_data 
ON public.feriados_nacionais(data);

SELECT 'Migration v3.0 completed successfully!' as status;
`;

// ============================================================================
// MIGRATION EXECUTION
// ============================================================================

async function runMigrations() {
    console.log('🚀 Starting v3.0 Calculation Module Migrations...\n');

    try {
        // Execute migration SQL
        const { data, error } = await supabase.rpc('exec_sql', { sql: MIGRATION_SQL });

        if (error) {
            // If exec_sql doesn't exist, we need to run migrations manually
            console.error('❌ Could not execute migrations via RPC:', error.message);
            console.log('\n📋 Please run the following SQL in Supabase SQL Editor:\n');
            console.log(MIGRATION_SQL);
            return;
        }

        console.log('✅ Migrations completed successfully!');
        console.log(data);

    } catch (err) {
        console.error('❌ Migration failed:', err);
        console.log('\n📋 Please run the following SQL in Supabase SQL Editor:\n');
        console.log(MIGRATION_SQL);
    }
}

// Export for use in other scripts
export { MIGRATION_SQL };

// Run if called directly
runMigrations();
