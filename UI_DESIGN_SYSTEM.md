# UI Design System - OctoApp

Este documento define os padrões visuais, tokens de design e componentes de interface do projeto **OctoApp**. Siga estas diretrizes ao criar novas telas ou componentes.

## 1. Tipografia
O projeto utiliza a fonte **Inter** como padrão para legibilidade e clareza.

- **Fonte Sans (Padrão):** `"Inter", ui-sans-serif, system-ui, ...`
- **Fonte Mono:** `ui-monospace, SFMono-Regular, ...`
- **Tamanhos Base:** Segue a escala padrão do Tailwind CSS (`text-sm`, `text-base`, `text-lg`, etc.).

## 2. Paleta de Cores
As cores são gerenciadas via variáveis CSS no `index.css` e integradas ao tema do Tailwind. O projeto está travado em **Light Mode**.

| Token | Código (HEX/HSL) | Descrição |
| :--- | :--- | :--- |
| `--background` | `#ffffff` | Fundo principal da página |
| `--foreground` | `#0a0a0a` | Texto principal |
| `--primary` | `#171717` | Cor destaque para botões e elementos chave |
| `--primary-foreground` | `#fafafa` | Texto sobre fundo primário |
| `--secondary` | `#f5f5f5` | Elementos de segundo nível |
| `--muted` | `#f5f5f5` | Cores suaves para estados desabilitados/texto secundário |
| `--muted-foreground`| `#737373` | Texto discreto |
| `--destructive` | `#dc2626` | Erros e ações críticas |
| `--border` | `#e5e5e5` | Bordas de componentes e separadores |

## 3. Componentes Base (Shadcn UI)
O projeto utiliza a biblioteca **Shadcn UI** (baseada em Radix UI). Antes de criar um componente do zero, verifique se ele já existe em `src/components/ui`.

### Exemplo de Uso:
```tsx
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export function Exemplo() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Título</CardTitle>
      </CardHeader>
      <CardContent>
        <Button variant="default">Ação principal</Button>
      </CardContent>
    </Card>
  );
}
```

### Lista de Componentes Disponíveis:
- **Formulários:** `Input`, `Select`, `Checkbox`, `RadioGroup`, `Switch`, `Textarea`, `Form`.
- **Feedback:** `Sonner` (Toast), `Progress`, `Skeleton`, `Alert`, `AlertDialog`.
- **Layout:** `Card`, `Tabs`, `Separator`, `ScrollArea`, `Resizable`.
- **Navegação:** `Sidebar`, `Breadcrumb`, `Pagination`, `Tabs`, `Stepper`.
- **Específicos OctoApp:** `CurrencyInput`, `PercentInput`, `DatePicker`.

## 4. Bibliotecas de Design e Ícones
- **Ícones:** [Lucide React](https://lucide.dev/) (Padrão para todo o projeto).
- **Framework CSS:** Tailwind CSS 4 (com nova sintaxe de tema inline).
- **Gráficos:** Recharts.
- **Tabelas:** TanStack Table v8.

---
*Mantenha este documento atualizado ao adicionar novos tokens ou componentes globais.*
