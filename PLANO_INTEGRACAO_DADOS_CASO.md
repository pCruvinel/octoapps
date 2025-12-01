# Plano de Integração: Dados do Caso no Editor de Petições

## 🎯 Objetivo
Transformar os dados hardcoded do caso em uma integração dinâmica com o CRM, permitindo seleção de contatos, oportunidades e cálculos existentes.

## 📊 Análise da Situação Atual

### Dados Hardcoded Atuais
```typescript
const [caseData] = useState({
  client: 'João Silva',
  contract: '123456789',
  institution: 'Banco Exemplo S.A.',
  value: 'R$ 250.000,00',
});
```

### Estrutura de Dados Disponível

#### 1. Contatos (`contatos`)
- `nome_completo`, `cpf_cnpj`, `email`, `telefone_principal`
- Status: Ativo/Inativo/Lead/Cliente/Ex-Cliente
- Vinculado a usuário responsável

#### 2. Oportunidades (`oportunidades`)
- `titulo`, `contato_id`, `tipo_acao`, `valor_estimado`
- `numero_processo`, `origem`, `responsavel_id`
- Estágios do funil de vendas

#### 3. Cálculos Disponíveis
- **Cartões de Crédito** (`cartoes_credito`): `saldo_devedor`, `limite_total`, `instituicao`
- **Empréstimos** (`emprestimos`): `total_financiado`, `valor_parcela`, `credor`
- **Financiamentos** (`financiamentos`): `valor_bem`, `valor_financiado`, `contrato_num`

#### 4. Campos na Tabela Petições
- `cliente_nome`, `numero_contrato`, `instituicao_financeira`
- `valor_contrato`, `calculo_id`

## 🏗️ Plano de Integração

### Fase 1: Seleção de Contato (Cliente)

#### Interface
- **Campo**: "Selecionar Cliente" com dropdown de busca
- **Alternativa**: Campo de texto para cliente não cadastrado
- **Funcionalidade**: Busca em tempo real por nome/email/CPF

#### Implementação
```typescript
interface CaseData {
  // Seleção
  contatoId?: string; // ID do contato selecionado
  clienteManual?: string; // Nome manual se não selecionado

  // Dados preenchidos automaticamente
  client: string; // nome_completo do contato
  contract: string; // numero_contrato (se existir)
  institution: string; // instituicao_financeira (se existir)
  value: string; // valor_contrato (se existir)
}
```

#### Benefícios
- ✅ Dados consistentes com CRM
- ✅ Histórico completo do cliente
- ✅ Vinculação automática com oportunidades

### Fase 2: Vinculação com Oportunidade (Opcional)

#### Interface
- **Campo**: "Vincular a Oportunidade" (opcional)
- **Filtro**: Apenas oportunidades do cliente selecionado
- **Preenchimento**: Tipo de ação, valor estimado, etc.

#### Implementação
- Adicionar `oportunidade_id` na tabela petições
- Buscar oportunidades do contato selecionado
- Preencher dados automaticamente da oportunidade

### Fase 3: Integração com Cálculos

#### Interface
- **Campo**: "Vincular Cálculo" (opcional)
- **Tipos**: Cartão, Empréstimo, Financiamento
- **Filtro**: Apenas cálculos do cliente selecionado

#### Implementação
- Usar campo `calculo_id` existente
- Buscar cálculos por tipo e cliente
- Preencher dados financeiros automaticamente

### Fase 4: Modo Híbrido (Manual + Automático)

#### Interface
- **Abas/Seções**: "Seleção Automática" | "Preenchimento Manual"
- **Seleção Automática**: Campos dropdown para contato/oportunidade/cálculo
- **Preenchimento Manual**: Campos de texto livres (como hoje)

#### Estados
```typescript
type CaseDataMode = 'auto' | 'manual';

interface CaseData {
  mode: CaseDataMode;
  // Campos automáticos
  contatoId?: string;
  oportunidadeId?: string;
  calculoId?: string;
  // Campos manuais (fallback)
  client: string;
  contract: string;
  institution: string;
  value: string;
}
```

## 🔄 Fluxo de Dados

### 1. Seleção de Contato → Preenche Cliente
```
Contato Selecionado
    ↓
cliente_nome = contato.nome_completo
numero_contrato = contato.numero_contrato (se existir)
instituicao_financeira = contato.instituicao_financeira (se existir)
```

### 2. Seleção de Oportunidade → Preenche Tipo/Valor
```
Oportunidade Selecionada
    ↓
tipo_peticao = oportunidade.tipo_acao
valor_contrato = oportunidade.valor_estimado
numero_processo = oportunidade.numero_processo
```

### 3. Seleção de Cálculo → Preenche Dados Financeiros
```
Cálculo Selecionado
    ↓
valor_contrato = calculo.valor_total_devido
instituicao_financeira = calculo.credor
numero_contrato = calculo.contrato_num
```

## 🎨 Interface Proposta

### Layout Sugerido
```
┌─ Dados do Caso ──────────────────────────────┐
│  ┌─ Modo ──────────────┐  ┌─ Cliente ──────────┐  │
│  │ ○ Automático        │  │ [Buscar contato...] │  │
│  │ ● Manual           │  │                     │  │
│  └─────────────────────┘  └─────────────────────┘  │
│                                                   │
│  ┌─ Cliente ─────────────┬─ Contrato ──────────┐  │
│  │ João Silva           │ 123456789           │  │
│  └───────────────────────┴─────────────────────┘  │
│                                                   │
│  ┌─ Instituição ─────────┬─ Valor ─────────────┐  │
│  │ Banco Exemplo S.A.   │ R$ 250.000,00       │  │
│  └───────────────────────┴─────────────────────┘  │
│                                                   │
│  ┌─ Vinculações (Automático) ──────────────────┐  │
│  │ Oportunidade: Revisão Fin. #123            │  │
│  │ Cálculo: Cartão Santander #456             │  │
│  └─────────────────────────────────────────────┘  │
└───────────────────────────────────────────────────┘
```

## 📋 Implementação por Fases

### Fase 1: Seleção de Contato (MVP)
1. Adicionar dropdown de busca de contatos
2. Preencher dados automaticamente
3. Manter fallback manual

### Fase 2: Vinculação com Oportunidades
1. Adicionar campo de oportunidade (filtrado por contato)
2. Preencher tipo e valor da oportunidade

### Fase 3: Integração com Cálculos
1. Adicionar seleção de cálculo por tipo
2. Preencher dados financeiros detalhados

### Fase 4: Melhorias de UX
1. Busca inteligente
2. Sugestões automáticas
3. Validação de dados

## ✅ Benefícios Esperados

- **Consistência**: Dados sincronizados com CRM
- **Produtividade**: Preenchimento automático
- **Rastreabilidade**: Histórico completo por cliente
- **Precisão**: Redução de erros manuais
- **Integração**: Fluxo completo CRM → Petições

## 🚀 Recomendação

**Iniciar com Fase 1 (Seleção de Contato)** - Impacto imediato com implementação simples.

A seleção de contato resolve 80% dos casos de uso e estabelece a base para integrações futuras.