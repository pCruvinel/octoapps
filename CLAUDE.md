# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**OctoApps** is a legal platform for Brazilian law firms specializing in banking law. It provides revisional calculations for financial contracts (loans, mortgages, credit cards), CRM with Kanban boards, and legal petition generation.

**Stack**: React 18.3 + TypeScript + Vite 6.3 + Supabase (PostgreSQL) + TailwindCSS 4 + Radix UI

## Development Commands

```bash
# Development
npm run dev              # Start dev server on localhost:3000 (auto-opens)

# Testing
npm run test             # Run Vitest in watch mode
npm run test:ui          # Run tests with UI
npm run test:coverage    # Generate coverage report

# Build
npm run build            # Production build to /build directory
```

## Environment Setup

Required environment variables in `.env.local`:
```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_key
```

The Supabase client is initialized in `src/lib/supabase.ts` and will throw an error if these are missing.

## Architecture Overview

### Routing & Navigation

**No React Router**: The app uses a custom routing system in `App.tsx` with state-based navigation:
- `currentRoute` state manages the active view
- `navigate(route, id?, data?)` function handles transitions
- Route data can be passed via the `routeData` state parameter

When creating navigation links or implementing new views, use the `navigate` callback pattern passed down as props.

### Authentication Flow

Authentication is managed via `useAuth` hook (`src/hooks/useAuth.ts`):
- Supabase Auth for login/signup/password reset
- Automatic token refresh (checks every 60s)
- User profiles stored in `profiles` table
- Role-based access via `user_roles` table
- `hasRole(roleName)` and `isAdmin()` helper methods available

**Important**: Always check `loading` state before rendering auth-dependent content.

### Module Structure (3 Vertical Modules)

The calculation system is organized into three main modules:

1. **GERAL** (`modulo_calculo = 'GERAL'`): Personal loans, vehicle financing, general CDC
2. **IMOBILIARIO** (`modulo_calculo = 'IMOBILIARIO'`): Real estate financing (SFH/SFI)
3. **CARTAO** (`modulo_calculo = 'CARTAO'`): Credit card revolving credit (RMC)

Each module has:
- Dedicated Zod schemas in `src/schemas/modulo*.schema.ts`
- Strategy pattern implementation in `src/services/calculationEngine/strategies/`
- Specific UI components in `src/components/calculations/`

### Calculation Engine (Strategy Pattern)

Located in `src/services/calculationEngine/`:
- **Factory Pattern**: `createCalculationStrategy(module)` returns the appropriate strategy
- **Decimal.js**: ALL financial calculations MUST use `Decimal` class (never floats)
- **Strategies**: Each module has a dedicated strategy class extending `BaseStrategy`
  - `EmprestimoStrategy` - GERAL module
  - `ImobiliarioStrategy` - IMOBILIARIO module
  - `CartaoRMCStrategy` - CARTAO module

**Critical**: Financial precision is mandatory. Use `Decimal` for all monetary values and interest rate calculations.

### Calculation Wizard Flow

The wizard (`src/components/calculations/wizard/`) follows this flow:

```
1. Module Selection (ModuleSelection.tsx)
   ↓
2. Wizard Steps (CalculationWizard component)
   - Data Input (form based on module schema)
   - OCR/Upload (optional document extraction)
   - Configuration (expurgos, teses jurídicas)
   - Review
   ↓
3. Results Dashboard (ResultsDashboard)
   ↓
4. Laudo Export (PDF/DOCX via laudoExport.service.ts)
```

Data flows through adapters in `src/lib/calculationAdapters.ts` to convert between wizard formats and database schemas.

### Database Tables (Key Entities)

**Calculations**:
- `contratos_revisionais` - Main calculation registry (parent table)
- `emprestimos` - Loan-specific data (modulo: GERAL)
- `financiamentos` - Real estate data (modulo: IMOBILIARIO)
- `cartoes` - Credit card data (modulo: CARTAO)
- `calculation_results` - Computed results with audit snapshot
- `fluxo_caixa` - Cash flow records (tipo: 'original' | 'revisado')

**CRM**:
- `contatos` - Contacts/clients
- `oportunidades` - CRM opportunities
- `etapas_funil` - Funnel stages (customizable)
- `tarefas` - Tasks linked to opportunities

**System**:
- `profiles` - User profiles (auto-created on signup)
- `roles` + `user_roles` - Role-based permissions
- `user_permissions` - Granular permissions system
- `taxas_bacen` - Cached BACEN interest rates

### BACEN Rate Integration

The system fetches historical interest rates from Brazil's Central Bank (BACEN):
- **Edge Function**: `supabase/functions/buscar-taxa-bacen/` queries SGS API
- **Local Cache**: Rates stored in `taxas_bacen` table
- **Daily Sync**: Should use pg_cron for nightly sync (not yet implemented)
- **Scripts**: `scripts/seed-bacen-rates.ts` for manual seeding

**Important**: Frontend should NEVER call BACEN directly - always query local cache.

### Forms & Validation

All forms use React Hook Form + Zod:
- Form schemas in `src/schemas/` directory
- Custom inputs: `currency-input.tsx`, `percent-input.tsx`, `date-picker.tsx`
- Use `@hookform/resolvers` with Zod schemas for validation

### State Management

**No Redux/Zustand**: State is managed via:
- React hooks (useState, useEffect)
- Custom hooks in `src/hooks/`
- Supabase real-time subscriptions where needed
- Props drilling with `onNavigate` callbacks

### UI Components

shadcn/ui components in `src/components/ui/`:
- 51 Radix UI-based components
- Customized with Tailwind variants
- Use `@/` path alias for imports
- Theme switching via document class (`dark` class on `<html>`)

**Custom Components**:
- `Stepper` - Multi-step wizard navigation
- `CurrencyInput` - Brazilian Real (R$) formatted input
- `PercentInput` - Percentage input with validation

### Export System

Two export services:
1. **export.service.ts**: Generic export utility
2. **laudoExport.service.ts**: Legal report (laudo pericial) export
   - PDF via jsPDF
   - DOCX via docx library
   - Includes calculation tables, charts, legal thesis

### OCR/Document Extraction

OCR functionality in `src/services/ocr.service.ts`:
- Supports Gemini, Mistral, or N8N providers (via `ocr_provider` enum)
- Extracts contract data from uploaded PDFs
- Results stored in database with confidence scores
- Status tracking: SUCCESS, PARTIAL, FAILED, TIMEOUT

Settings configurable in `src/components/settings/OCRSettingsPage.tsx`

## Coding Patterns & Conventions

### TypeScript
- Strict mode enabled
- Database types auto-generated in `src/lib/database.types.ts` (28KB)
- Use explicit types from `src/types/` directory
- Prefer interfaces for props, types for data structures

### Financial Calculations
```typescript
import { Decimal } from 'decimal.js';

// ✅ Correct
const interest = new Decimal(taxaJuros).div(100);
const payment = principal.times(interest);

// ❌ Never do this
const payment = principal * (taxaJuros / 100);
```

### Database Queries
```typescript
// Always handle loading and error states
const { data, error, loading } = await supabase
  .from('table')
  .select('*')
  .eq('id', id)
  .single();

if (error) throw error;
```

### Navigation Pattern
```typescript
// Component receiving onNavigate
interface Props {
  onNavigate: (route: string, id?: string, data?: any) => void;
}

// Usage
onNavigate('calc-wizard', undefined, {
  module: 'GERAL',
  initialData: extractedData
});
```

## Key Business Rules

### Abusiveness Detection (Taxa Média)
- Compare contract rate against BACEN average rate for contract date
- Formula: `contractRate > bacenRate * 1.5` (configurable threshold)
- Uses time-series data from `taxas_bacen` table

### Capitalization Types
- **MONTHLY**: Standard monthly compounding
- **DAILY**: Exponential daily compounding using formula: `(1 + i_mensal)^(dias/30) - 1`
- **Critical**: Never use simple proportion for daily rates

### Amortization Systems
- **PRICE**: Fixed installments (French system)
- **SAC**: Decreasing installments (constant amortization)
- **SACRE**: Hybrid system for real estate
- **GAUSS_SIMPLES**: Legal thesis (simple interest, no compounding)

### Legal Theses (Teses Jurídicas)
System supports multiple revisional theses:
- Expurgo de tarifas (fee removal): TAC, insurance, registration
- Juros simples vs. compostos (simple vs. compound interest)
- Capitalização diária abusiva (abusive daily capitalization)
- Taxa média BACEN (average rate substitution)

## Testing Strategy

Tests use Vitest + Testing Library:
- Unit tests for utilities: `src/utils/*.test.ts`
- Service tests were in `src/services/__tests__/` (currently deleted, need recreation)
- Focus on financial calculation accuracy
- Use Decimal.js in test assertions for precision

## Documentation References

### Source of Truth (`/docs`)

Before writing code or proposing changes, **ALWAYS** consult:

**Core Documentation:**
| File | Purpose |
|------|---------|
| `PRD.md` | Product vision and high-level requirements |
| `REQUISITOS.md` | Business rules, RN-* rules, functional requirements |
| `TECH_STACK.md` | Technology versions and dependencies |
| `PROJECT_STRUCTURE.md` | Directory organization and architecture |
| `DATABASE_SCHEMA.md` | Complete DB schema (auto-generated from Supabase) |

**Calculation Engine (`/docs/calculo-revisional/`):**
| File | Purpose |
|------|---------|
| `MODULOS.md` | Overview of 3 modules (GERAL, IMOBILIARIO, CARTAO) |
| `MODULO_CALCULO_REVISIONAL.md` | Detailed engine specification |
| `especificacao_tecnica.md` | Financial formulas (SAC, PRICE, GAUSS), capitalization rules |
| `ux.md` | Wizard UX specifications and user flows |
| `apendices.md` | Technical appendices and legal references |

**OCR & Migrations:**
| File | Purpose |
|------|---------|
| `OCR.md` | OCR system architecture (Gemini/Mistral/N8N providers) |
| `OCR_MIGRATION.md` | OCR system migration guide |
| `MIGRATION_CONTRATOS_REVISIONAIS.md` | Contract architecture migration V2→V3 |

> **GOLDEN RULE**: If your code change modifies business logic, DB structure, or UI flow, **UPDATE THE CORRESPONDING .md FILE IMMEDIATELY** to keep docs in sync.

**Figma Design**: https://www.figma.com/design/ruHUbwHKCgRu2Mh4ln0g1w/Octoapps

## Common Pitfalls

1. **Float Precision**: Always use Decimal.js, never JavaScript numbers for calculations
2. **Auth State**: Check `loading` before rendering protected routes
3. **Navigation**: Don't use browser history - use the `navigate` function
4. **BACEN Rates**: Query local cache, never hit external API from frontend
5. **Module Types**: Respect enum constraints (`modulo_calculo`, `calculation_type_enum`)
6. **Date Formatting**: Brazil uses DD/MM/YYYY format, not MM/DD/YYYY
7. **Currency**: All monetary values use Brazilian Real (R$) with 2 decimal places

## Path Aliases

```typescript
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import type { Calculation } from '@/types/calculation.types';
```

The `@` alias points to `src/` directory (configured in `vite.config.ts` and `tsconfig.json`).

## Development Tips

- **Hot Reload**: Vite HMR is fast; changes reflect instantly
- **Type Safety**: `database.types.ts` is auto-generated from Supabase; regenerate if schema changes
- **Debugging**: Use React DevTools; state is local and visible in component tree
- **Database**: Access Supabase dashboard for direct table inspection
- **Logs**: Check browser console for Supabase query errors

## Migration Notes

The project is transitioning to v3 architecture:
- Old test files removed (need recreation with new engine)
- Legacy calculation components still exist alongside wizard
- Some routes marked DEPRECATED in `App.tsx` (e.g., `calc-analise-cartao`)
- Migration script available: `scripts/migrate-v3-calculations.ts`