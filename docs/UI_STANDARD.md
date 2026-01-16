# UI Design Standards - OctoApps
***
*Deep Ocean Design System*

> **Última Atualização:** 2026-01-16  
> **Versão:** 2.2 - Deep Ocean (Logo Azuk & Semantic Colors)

---

## Paleta de Cores: Deep Ocean

A paleta "Deep Ocean" foi projetada para transmitir **profissionalismo**, **autoridade** e **modernidade**, alinhada com a identidade visual da Azuk/OctoApps.

### Filosofia

| Decisão | Justificativa |
|---------|---------------|
| **Primary Azul Royal** | Inspirado na identidade visual. Transmite confiança e seriedade. (HSL 221.2 83.2% 53.3%) |
| **Neutrals Slate** | Cinza com toque imperceptível de azul, harmoniza com a marca. |
| **Radius 0.5rem (8px)** | Sweet spot para software B2B - mais denso e "Enterprise". |
| **White Surfaces** | Sidebar, Topbar, e Cards agora usam branco (`#ffffff`) para uma interface limpa e unificada. |

### Variáveis CSS (Light Mode)

```css
/* Core */
--background: #ffffff;             /* Branco */
--foreground: 222.2 84% 4.9%;      /* Slate-950 */

/* Primary: Octo Blue */
--primary: 221.2 83.2% 53.3%;      /* #1657FF approx */
--primary-foreground: 210 40% 98%;

/* Sidebar: White (Integração com Topbar) */
--sidebar: #ffffff;
--sidebar-foreground: 222.2 84% 4.9%;
--sidebar-primary: 221.2 83.2% 53.3%;
--sidebar-border: 214.3 31.8% 91.4%; /* hsl(var(--border)) */

/* Radius: Enterprise */
--radius: 0.5rem;                  /* 8px */
```

### Cores de Gráficos (Semânticas)

| Variável | Uso | Cor |
|----------|-----|-----|
| `--chart-1` | Receita/Principal | Azul Marca (Octo Blue) |
| `--chart-2` | Lucro/Positivo | Teal/Verde Petróleo |
| `--chart-3` | Histórico | Azul Navy Escuro |
| `--chart-4` | Atenção/Pendente | Âmbar Dourado |
| `--chart-5` | Churn/Perda | Laranja Queimado |

---

## 1. Page Structure

### Standard Layout (Sidebar & Topbar)

A consistência visual entre Sidebar e Topbar é crítica para a experiência "Seamless".

*   **Background**: Ambos devem usar `bg-white` (ou `bg-background`).
*   **Borders**: `border-b` (Topbar) e `border-r` (Sidebar) devem usar `border-border`.
*   **Height**: O header da Sidebar e a Topbar devem ter exatamente `h-16` para alinhamento perfeito.
*   **Logo**: Uso obrigatório do SVG `src/assets/Logo azuk.svg` com altura `h-6`.

```tsx
// Sidebar Header
<div className="h-16 flex items-center px-6 border-b border-border bg-white">
  <img src={LogoAzuk} alt="Azuk" className="h-6" />
</div>

// Topbar
<header className="h-16 border-b border-border bg-white flex items-center justify-between px-4 lg:px-6">
  {/* Content */}
</header>
```

### Standard Page Header

Todas as páginas principais (Kanban, Calendar, Contacts) **DEVEM** seguir esta estrutura de cabeçalho:

```tsx
<div className="h-full flex flex-col">
  {/* Header Container */}
  <div className="px-4 pt-4 pb-2 lg:px-6 lg:pt-6 lg:pb-2 border-b border-border mb-6">
    <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
      {/* Left Side: Title + Description */}
      <div className="flex flex-col">
        <h1 className="text-foreground font-bold text-2xl whitespace-nowrap">
          Título da Página
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Descrição curta e objetiva
        </p>
      </div>

      {/* Right Side: Filters + Actions */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
        {/* Actions */}
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Novo Item
        </Button>
      </div>
    </div>
  </div>
  {/* Content */}
</div>
```

---

## 2. Components

### Colors & Semantic Variables

**PARE** de usar cores hardcoded. Use variáveis semânticas para garantir suporte a temas e consistência.

| Uso | ❌ Não use (Hardcoded) | ✅ Use (Semântico) |
|-----|----------------------|-------------------|
| **Fundo Principal** | `bg-white`, `bg-gray-50` | `bg-background` |
| **Fundo Secundário** | `bg-gray-100` | `bg-muted` |
| **Cartões/Painéis** | `bg-white` | `bg-card` |
| **Bordas** | `border-gray-200` | `border-border` |
| **Texto Principal** | `text-gray-900` | `text-foreground` |
| **Texto Apoio** | `text-gray-500` | `text-muted-foreground` |
| **Primary Action** | `bg-blue-600`, `bg-[#3D96FF]` | `bg-primary` |
| **Delete/Error** | `bg-red-500` | `bg-destructive` |

### Buttons & Actions

| Tipo | Variant | Uso |
|------|---------|-----|
| **Primary Action** | `default` | Salvar, Criar, Confirmar (puxa Octo Blue) |
| **Secondary/Cancel** | `outline` ou `ghost` | Cancelar, Voltar |
| **Destructive** | `destructive` | Excluir, Remover (vermelho profissional) |

### Visual Language

*   **Borders**: `border-border` uniformemente.
*   **Shadows**: `shadow-sm` para cards e inputs.
*   **Hover**: `hover:bg-primary/10` para itens interativos leves, `hover:bg-primary/90` para botões primários.

---

## 3. Typography

*   **Font**: Inter.
*   **Hierarchy**:
    *   H1: `text-2xl font-bold`
    *   H2: `text-xl font-semibold`
    *   Body: `text-sm text-foreground`
    *   Muted: `text-xs text-muted-foreground`

---

## 4. Scrollbars

Minimalistas, usando tokens do tema.

```css
.custom-scrollbar::-webkit-scrollbar { width: 6px; height: 6px; }
.custom-scrollbar::-webkit-scrollbar-thumb { @apply bg-slate-200 rounded-full; }
```

---

*Design System atualizado para refletir a nova identidade visual Azuk/OctoApps.*
