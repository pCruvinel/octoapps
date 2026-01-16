# Project Structure - OctoApp

Este documento serve como um mapa para a arquitetura e organização de pastas do projeto **OctoApp**.

## 1. Diagrama de Árvore

```text
OctoApp/
├── docs/               # Documentação técnica, requisitos e esquemas
├── public/             # Ativos estáticos públicos
├── src/
│   ├── assets/         # Imagens, fontes e recursos estáticos
│   ├── components/     # Componentes React (Organizados por Features)
│   │   ├── auth/       # Login, registro, recuperação de senha
│   │   ├── calculations/ # Módulos de cálculos financeiros (Wizards, Listas)
│   │   ├── dashboard/    # Dashboards e Paineis Executivos
│   │   ├── layout/     # Sidebar, Header, Steppers
│   │   ├── ui/         # Componentes base (Shadcn/Radix)
│   │   └── ...         # Outras features (CRM, Contatos, Petições)
│   ├── constants/      # Valores constantes e enums
│   ├── hooks/          # Hooks customizados para lógica reutilizável
│   ├── lib/            # Instâncias de bibliotecas (Supabase, Adapters)
│   ├── services/       # Lógica de negócio e chamadas de API
│   │   └── calculationEngine/ # Motores de cálculo específicos
│   ├── types/          # Definições de tipos TypeScript
│   ├── utils/          # Funções utilitárias genéricas
│   ├── App.tsx         # Componente raiz
│   └── main.tsx        # Ponto de entrada da aplicação
├── supabase/           # Configurações locais e Edge Functions
├── vercel.json         # Configurações de deploy Vercel
├── vite.config.ts      # Configurações do bundler
└── package.json        # Dependências e scripts
```

## 2. Descrição das Pastas

- **`src/components/`**: O coração da interface. Dividido em subpastas por **Funcionalidade (Feature)**.
  - **`ui/`**: Componentes atômicos e genéricos (ex: `Button`, `Input`).
  - **Features (ex: `calculations/`)**: Componentes complexos que pertencem a um contexto específico de negócio.
- **`src/services/`**: Centraliza toda a integração com o Supabase e lógica de cálculo pesado. Não deve haver lógica complexa diretamente nos componentes.
- **`src/hooks/`**: Encapsula estados complexos e interações com serviços para manter os componentes limpos.
- **`src/lib/`**: Local de configuração de clientes externos (Supabase) e adaptadores para transformar dados do banco para o frontend.
- **`docs/`**: Documentação viva do projeto, incluindo fluxos de UX e esquemas de banco de dados.

## 3. Padrão Arquitetural

O projeto utiliza uma **Arquitetura Baseada em Funcionalidades (Feature-Based Architecture)** aliada a um **Design de Baixo Acoplamento** entre UI e Lógica.

- **Feature-Based**: Os componentes não são agrupados por tipo (ex: todas as tabelas em `/tables`), mas sim pelo que fazem no negócio (ex: todos os componentes de cálculo em `/calculations`).
- **Separation of Concerns**:
  - **Componentes**: Focam em apresentação e chamadas de hooks.
  - **Hooks**: Focam em gerenciar o estado local e orquestrar serviços.
  - **Services**: Focam em cálculos, processamento de dados e comunicação externa.

## 4. Regras de Organização

1. **Localização de Componentes**: Componentes exclusivos de uma feature devem ficar dentro da pasta dessa feature. Se um componente for usado em 2 ou mais lugares, deve ser promovido para uma pasta comum ou para `src/components/ui`.
2. **Naming Convention**:
   - Arquivos React (`.tsx`): PascalCase (ex: `UserAvatar.tsx`).
   - Hooks: `use` prefixado (ex: `useCalculation.ts`).
   - Services/Utils: camelCase (ex: `calculationAPI.service.ts`).
3. **Lógica de Dados**: Nunca realize cálculos complexos ou transformações pesadas dentro do `return` do componente. Utilize `services/` ou `utils/`.
4. **Tipagem**: Sempre prefira tipos centralizados em `src/types` ou gerados pelo Supabase em `src/lib/database.types.ts`.

---
*Este documento facilita o onboarding de novos desenvolvedores e ajuda a IA a manter a consistência do código.*
