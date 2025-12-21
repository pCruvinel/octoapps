# UI Design Standards
***
*OctoApps Frontend Guidelines*

## 1. Page Structure

### Layout Pattern
All main pages should follow a consistent hierarchy:
1.  **Header Area**:
    -   **Title (H1)**: `text-2xl` or `text-3xl`, `font-bold`, `text-slate-900`.
    -   **Subtitle**: `text-muted-foreground` (slate-500), concise description.
    -   **Primary Action**: Located on the far right (e.g., "Create New", "Save").
    -   **Spacing**: `mb-6` or `mb-8`.

### Content Containers
-   **Cards**: Use `Card` from `shadcn/ui` for grouping related content.
    -   **Shadows**: Use `shadow-sm` for a subtle lift.
    -   **Borders**: `border-slate-200`.
-   **Tabs**: Use `Tabs` for switching between distinct modes (e.g., Input Methods, Filters).
    -   Center the main content when using Tabs if the content width is limited (e.g., Forms).

## 2. Components

### Filtering & Lists
-   **Tabs for Filters**: Use `Tabs` instead of Dropdowns when there are few (< 6) mutually exclusive categories (e.g., Status: All, Draft, Active, Archived).
-   **Tables**:
    -   Use `Table` component.
    -   Ensure row hover effects.
    -   Align numbers to the right (monetary values).

### Badges & Status
-   Use `Badge` for status indicators.
-   **Variants**:
    -   Use `variant="outline"` or `variant="secondary"` as a base.
    -   **Color Coding**:
        -   **Success/Done**: `bg-emerald-100 text-emerald-800`
        -   **Warning/Attention**: `bg-amber-100 text-amber-800`
        -   **Neutral/Draft**: `bg-slate-100 text-slate-700`
        -   **Destructive/Error**: `bg-red-100 text-red-800`

### Buttons
-   **Primary**: `default` variant (Solid block color).
-   **Secondary/Cancel**: `outline` or `ghost` variant.
-   **Icons**: Include icons (`lucide-react`) for clarity, usually on the left of the text (`mr-2`).

## 3. Typography
-   **Font**: Inter or system sans-serif.
-   **Hierarchy**:
    -   H1: `text-3xl font-bold tracking-tight`
    -   H2: `text-xl font-semibold`
    -   Body: `text-sm text-slate-600`
    -   Muted: `text-xs text-muted-foreground`

## 4. Example Structure (Triagem Rápida)

```tsx
<div className="max-w-4xl mx-auto">
  {/* Header */}
  <div className="mb-8">
     <h1 className="text-3xl font-bold">Page Title</h1>
     <p className="text-muted-foreground">Subtitle here</p>
  </div>

  {/* Navigation/Tabs */}
  <Tabs defaultValue="tab1">
     <TabsList>
        <TabsTrigger value="tab1">Tab 1</TabsTrigger>
        <TabsTrigger value="tab2">Tab 2</TabsTrigger>
     </TabsList>
     
     {/* Content */}
     <TabsContent value="tab1">
        <Card>...</Card>
     </TabsContent>
  </Tabs>
</div>
```
