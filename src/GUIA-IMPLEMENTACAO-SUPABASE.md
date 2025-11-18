# 📋 Guia de Implementação Completo - Supabase

## Sistema de Gestão Jurídica Integrado
### CRM + Tarefas + Projetos + Cálculos + Petições + Audiências

**Versão:** 2.0
**Data:** Janeiro 2025
**Autor:** Sistema OctoApps

---

## 🎯 Visão Geral do Sistema

### O que este sistema oferece

Este é um sistema completo de gestão para escritórios jurídicos que integra:

- **CRM Kanban** - Pipeline de oportunidades visual
- **Gestão de Contatos** - Clientes e leads com histórico completo
- **Projetos/Casos** - Gerenciamento de processos jurídicos
- **Tarefas** - Sistema avançado com checklist, recorrência e lembretes
- **Cálculos Revisionais** - Financiamentos, cartões e empréstimos
- **Geração de Petições** - Editor com templates dinâmicos
- **Audiências e Prazos** - Calendário jurídico com notificações
- **Time Tracking** - Controle de horas para honorários
- **Faturamento** - Gestão de honorários e pagamentos
- **Notificações em Tempo Real** - Sistema push integrado

---

## 📊 Estrutura do Banco de Dados

### 🗄️ Tabelas Principais (19 tabelas)

| # | Tabela | Descrição | Relacionamentos |
|---|--------|-----------|-----------------|
| 1 | `profiles` | Perfis de usuários | → `auth.users` |
| 2 | `roles` | Permissões e papéis | - |
| 3 | `user_roles` | Atribuição de roles | → `profiles`, `roles` |
| 4 | `contatos` | Clientes e leads | → `profiles` |
| 5 | `oportunidades` | Pipeline CRM | → `contatos`, `profiles` |
| 6 | `projetos` | Casos jurídicos | → `contatos`, `oportunidades` |
| 7 | `tarefas` ⭐ | Gestão de tarefas | → `projetos`, `contatos`, `oportunidades` |
| 8 | `comentarios` | Histórico e timeline | → Todas as entidades |
| 9 | `notificacoes` | Notificações em tempo real | → `profiles` |
| 10 | `tags` | Etiquetas reutilizáveis | - |
| 11 | `templates_tarefas` | Templates de tarefas | → `profiles` |
| 12 | `arquivos` | Gestão de uploads | → Todas as entidades |
| 13 | `calculos` | Cálculos revisionais | → `contatos`, `projetos` |
| 14 | `peticoes` | Petições jurídicas | → `projetos`, `contatos` |
| 15 | `templates_peticoes` | Templates de petições | → `profiles` |
| 16 | `audiencias` 🆕 | Audiências e prazos | → `projetos` |
| 17 | `time_entries` 🆕 | Controle de horas | → `profiles`, `tarefas`, `projetos` |
| 18 | `honorarios` 🆕 | Faturamento | → `projetos`, `contatos` |
| 19 | `configuracoes` 🆕 | Configurações do sistema | → `profiles` |
| 20 | `log_atividades` | Auditoria completa | → Todas as entidades |

---

## 🚀 Passo 1: Criar Projeto no Supabase

### 1.1 Configuração Inicial

1. Acesse [supabase.com](https://supabase.com) e faça login
2. Clique em **"New Project"**
3. Preencha:
   ```
   Nome do Projeto: gestao-juridica-producao
   Database Password: [SENHA FORTE - GUARDE COM SEGURANÇA!]
   Região: South America (São Paulo) - Melhor latência para Brasil
   Pricing Plan: Free (testes) | Pro ($25/mês) | Team ($599/mês)
   ```
4. Clique em **"Create new project"**
5. Aguarde ~2 minutos para provisionar

### 1.2 Anote suas Credenciais

Após a criação, vá em **Settings** > **API** e anote:

```env
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

⚠️ **NUNCA** exponha a `service_role` key no frontend!

---

## 🔧 Passo 2: Executar o Schema Principal

### 2.1 Executar SQL

1. No painel do Supabase, vá em **SQL Editor**
2. Clique em **"New Query"**
3. Abra o arquivo `database-schema.sql` deste projeto
4. **Copie TODO o conteúdo** (1300+ linhas)
5. Cole no editor SQL do Supabase
6. Clique em **"Run"** (ou Ctrl + Enter)
7. Aguarde a execução (~30-60 segundos)

### 2.2 Verificar Sucesso

Você deve ver a mensagem: **"Success. No rows returned"**

Vá em **Database** > **Tables** e confirme que existem **19 tabelas** criadas.

### 2.3 O que foi criado?

✅ **19 tabelas** principais
✅ **60+ índices** para performance
✅ **10+ triggers** para automações
✅ **20+ policies RLS** para segurança
✅ **4 views** prontas para uso
✅ **5 funções** auxiliares
✅ **Dados iniciais** (roles e tags)

---

## 🔐 Passo 3: Configurar Autenticação

### 3.1 Habilitar Providers

1. Vá em **Authentication** > **Providers**
2. Configure:

#### Email Provider (Obrigatório)
```
✅ Enable Email provider
Confirm email: Enabled (recomendado)
Secure email change: Enabled
```

#### Google Provider (Recomendado)
```
✅ Enable Google provider
Client ID: [SEU_CLIENT_ID]
Client Secret: [SEU_CLIENT_SECRET]
```

**Como obter credenciais Google:**
1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Crie um novo projeto
3. Vá em **APIs & Services** > **Credentials**
4. Crie **OAuth 2.0 Client ID**
5. Tipo: **Web application**
6. Authorized redirect URIs: `https://[SEU_PROJETO].supabase.co/auth/v1/callback`

#### Microsoft Provider (Opcional - Empresas)
Siga processo similar ao Google usando [Azure Portal](https://portal.azure.com)

### 3.2 Customizar Email Templates

1. Vá em **Authentication** > **Email Templates**
2. Personalize os templates:

#### Template: Confirm signup

```html
<h2>Bem-vindo ao Sistema de Gestão Jurídica</h2>
<p>Olá,</p>
<p>Clique no link abaixo para confirmar seu email e ativar sua conta:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Confirmar Email</a></p>
<p>Este link expira em 24 horas.</p>
<p>Se você não criou esta conta, ignore este email.</p>
<br>
<p style="color: #666; font-size: 12px;">Sistema de Gestão Jurídica | OctoApps</p>
```

#### Template: Reset Password

```html
<h2>Redefinição de Senha</h2>
<p>Olá,</p>
<p>Você solicitou a redefinição de senha. Clique no link abaixo:</p>
<p><a href="{{ .ConfirmationURL }}" style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">Redefinir Senha</a></p>
<p>Este link expira em 1 hora.</p>
<p>Se você não solicitou esta alteração, ignore este email.</p>
```

### 3.3 Configurar Políticas de Senha

1. Vá em **Authentication** > **Policies**
2. Configure:
   ```
   ✅ Minimum password length: 8 characters
   ✅ Require uppercase letter
   ✅ Require lowercase letter
   ✅ Require number
   □ Require special character (opcional)
   ```

### 3.4 Configurar URL de Redirecionamento

1. Vá em **Authentication** > **URL Configuration**
2. Adicione:
   ```
   Site URL: http://localhost:5173 (desenvolvimento)
   Site URL: https://seudominio.com (produção)

   Redirect URLs:
   - http://localhost:5173/**
   - https://seudominio.com/**
   ```

---

## 🗂️ Passo 4: Configurar Storage (Arquivos)

### 4.1 Criar Buckets

1. Vá em **Storage**
2. Clique em **"New bucket"**

Crie os seguintes buckets:

#### Bucket 1: `tarefas-anexos`
```yaml
Nome: tarefas-anexos
Public: false (privado)
File size limit: 10 MB
Allowed MIME types:
  - application/pdf
  - image/jpeg
  - image/png
  - image/webp
  - application/msword
  - application/vnd.openxmlformats-officedocument.wordprocessingml.document
  - application/vnd.ms-excel
  - application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
```

#### Bucket 2: `contratos-ocr`
```yaml
Nome: contratos-ocr
Public: false
File size limit: 25 MB
Allowed MIME types:
  - application/pdf
  - image/*
```

#### Bucket 3: `peticoes-documentos`
```yaml
Nome: peticoes-documentos
Public: false
File size limit: 15 MB
Allowed MIME types:
  - application/pdf
  - application/msword
  - application/vnd.openxmlformats-officedocument.wordprocessingml.document
```

#### Bucket 4: `avatares` (Opcional)
```yaml
Nome: avatares
Public: true (público)
File size limit: 2 MB
Allowed MIME types:
  - image/jpeg
  - image/png
  - image/webp
```

### 4.2 Configurar Políticas de Storage

Execute no **SQL Editor**:

```sql
-- =====================================================
-- POLÍTICAS DE STORAGE
-- =====================================================

-- Política para upload de arquivos (INSERT)
CREATE POLICY "Usuários autenticados podem fazer upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id IN ('tarefas-anexos', 'contratos-ocr', 'peticoes-documentos', 'avatares')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para leitura de arquivos (SELECT)
CREATE POLICY "Usuários podem ver seus próprios arquivos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id IN ('tarefas-anexos', 'contratos-ocr', 'peticoes-documentos')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para deletar arquivos (DELETE)
CREATE POLICY "Usuários podem deletar seus próprios arquivos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id IN ('tarefas-anexos', 'contratos-ocr', 'peticoes-documentos')
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política para arquivos públicos (avatares)
CREATE POLICY "Avatares são públicos"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'avatares');
```

### 4.3 Estrutura de Pastas

Ao fazer upload, organize os arquivos assim:

```
bucket/
├── {user_id}/
│   ├── tarefas/
│   │   └── {tarefa_id}/
│   │       └── arquivo.pdf
│   ├── contratos/
│   │   └── {contrato_id}/
│   │       └── contrato.pdf
│   └── peticoes/
│       └── {peticao_id}/
│           └── peticao.docx
```

Exemplo de upload no frontend:

```typescript
const uploadFile = async (file: File, tarefaId: string) => {
  const userId = supabase.auth.user()?.id;
  const fileName = `${userId}/tarefas/${tarefaId}/${file.name}`;

  const { data, error } = await supabase.storage
    .from('tarefas-anexos')
    .upload(fileName, file);

  if (error) throw error;

  // Salvar referência no banco
  const { data: arquivo } = await supabase
    .from('arquivos')
    .insert({
      nome: file.name,
      nome_original: file.name,
      tipo_mime: file.type,
      tamanho: file.size,
      url: data.path,
      caminho_storage: fileName,
      bucket_name: 'tarefas-anexos',
      tarefa_id: tarefaId,
      enviado_por: userId
    });
};
```

---

## 📊 Passo 5: Criar Usuários e Perfis

### 5.1 Criar Primeiro Usuário (Admin)

1. Vá em **Authentication** > **Users**
2. Clique em **"Add user"** > **"Create new user"**
3. Preencha:
   ```
   Email: admin@suaempresa.com
   Password: [SENHA TEMPORÁRIA]
   ✅ Auto Confirm User
   ```
4. Clique em **"Create user"**
5. **Copie o UUID** do usuário criado

### 5.2 Criar Perfil do Admin

Execute no **SQL Editor**:

```sql
-- IMPORTANTE: Substitua 'UUID_DO_USER' pelo UUID copiado acima

-- Criar perfil
INSERT INTO profiles (id, email, nome_completo, cpf, telefone, cargo, persona, ativo)
VALUES (
  'UUID_DO_USER', -- ⚠️ SUBSTITUA AQUI
  'admin@suaempresa.com',
  'Administrador do Sistema',
  '000.000.000-00',
  '(11) 99999-9999',
  'Administrador',
  'Ana Admin',
  true
);

-- Atribuir role de Administrador
INSERT INTO user_roles (user_id, role_id)
VALUES (
  'UUID_DO_USER', -- ⚠️ SUBSTITUA AQUI
  (SELECT id FROM roles WHERE nome = 'Administrador')
);
```

### 5.3 Criar Usuários de Teste

Repita o processo acima para criar:

#### Usuário Perito (Diego)
```sql
INSERT INTO profiles (id, email, nome_completo, cpf, telefone, cargo, persona, ativo)
VALUES (
  'UUID_DO_DIEGO',
  'diego.perito@suaempresa.com',
  'Diego Perito Silva',
  '111.111.111-11',
  '(11) 98888-8888',
  'Perito Judicial',
  'Diego Perito',
  true
);

INSERT INTO user_roles (user_id, role_id)
VALUES (
  'UUID_DO_DIEGO',
  (SELECT id FROM roles WHERE nome = 'Perito')
);
```

#### Usuária Advogada (Maria)
```sql
INSERT INTO profiles (id, email, nome_completo, cpf, telefone, cargo, persona, ativo)
VALUES (
  'UUID_DA_MARIA',
  'maria.advogada@suaempresa.com',
  'Maria Advogada Costa',
  '222.222.222-22',
  '(11) 97777-7777',
  'Advogada',
  'Maria Advogada',
  true
);

INSERT INTO user_roles (user_id, role_id)
VALUES (
  'UUID_DA_MARIA',
  (SELECT id FROM roles WHERE nome = 'Advogado')
);
```

---

## 🧪 Passo 6: Inserir Dados de Teste

Execute no **SQL Editor**:

```sql
-- =====================================================
-- DADOS DE TESTE
-- =====================================================

-- Inserir contatos de exemplo
INSERT INTO contatos (tipo, nome_completo, cpf_cnpj, email, telefone_principal, status_contato, responsavel_id, criado_por)
VALUES
  (
    'Pessoa Física',
    'João Silva Santos',
    '123.456.789-00',
    'joao.silva@email.com',
    '(11) 98765-4321',
    'Cliente',
    (SELECT id FROM profiles WHERE email = 'admin@suaempresa.com'),
    (SELECT id FROM profiles WHERE email = 'admin@suaempresa.com')
  ),
  (
    'Pessoa Física',
    'Maria Oliveira Costa',
    '987.654.321-00',
    'maria.oliveira@email.com',
    '(11) 91234-5678',
    'Lead',
    (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com'),
    (SELECT id FROM profiles WHERE email = 'admin@suaempresa.com')
  ),
  (
    'Pessoa Jurídica',
    'Empresa XPTO Ltda',
    '12.345.678/0001-90',
    'contato@xpto.com.br',
    '(11) 3333-4444',
    'Cliente',
    (SELECT id FROM profiles WHERE email = 'admin@suaempresa.com'),
    (SELECT id FROM profiles WHERE email = 'admin@suaempresa.com')
  );

-- Inserir oportunidades no CRM
INSERT INTO oportunidades (titulo, contato_id, tipo_acao, estagio, valor_estimado, probabilidade, responsavel_id, criado_por)
VALUES
  (
    'Revisional Financiamento Imobiliário - João Silva',
    (SELECT id FROM contatos WHERE nome_completo = 'João Silva Santos'),
    'Financiamento Imobiliário',
    'qualification',
    15000.00,
    70,
    (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com'),
    (SELECT id FROM profiles WHERE email = 'admin@suaempresa.com')
  ),
  (
    'Análise Cartão de Crédito - Maria Oliveira',
    (SELECT id FROM contatos WHERE nome_completo = 'Maria Oliveira Costa'),
    'Cartão de Crédito',
    'lead',
    8000.00,
    30,
    (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com'),
    (SELECT id FROM profiles WHERE email = 'admin@suaempresa.com')
  );

-- Inserir projeto/caso
INSERT INTO projetos (
  numero_processo,
  titulo,
  descricao,
  contato_id,
  oportunidade_id,
  tipo_projeto,
  status,
  prioridade,
  valor_causa,
  data_inicio,
  responsavel_id,
  criado_por
)
VALUES (
  '0001234-56.2025.8.26.0100',
  'Revisional Financiamento - João Silva',
  'Ação revisional de contrato de financiamento imobiliário com identificação de juros abusivos e anatocismo.',
  (SELECT id FROM contatos WHERE nome_completo = 'João Silva Santos'),
  (SELECT id FROM oportunidades WHERE titulo LIKE 'Revisional Financiamento%' LIMIT 1),
  'Revisional',
  'Em Andamento',
  'Alta',
  45000.00,
  CURRENT_DATE,
  (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com'),
  (SELECT id FROM profiles WHERE email = 'admin@suaempresa.com')
);

-- Inserir tarefas
INSERT INTO tarefas (
  titulo,
  descricao,
  tipo,
  status,
  prioridade,
  responsavel_id,
  projeto_id,
  data_vencimento,
  criado_por
)
VALUES
  (
    'Analisar contrato de financiamento',
    'Realizar análise técnica completa do contrato fornecido pelo cliente para identificar cláusulas abusivas, juros capitalizados e possíveis irregularidades contratuais.',
    'Tarefa',
    'Em Andamento',
    'Alta',
    (SELECT id FROM profiles WHERE email = 'diego.perito@suaempresa.com'),
    (SELECT id FROM projetos WHERE numero_processo = '0001234-56.2025.8.26.0100'),
    NOW() + INTERVAL '3 days',
    (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com')
  ),
  (
    'Agendar reunião com cliente',
    'Marcar reunião presencial ou online para apresentar análise preliminar e discutir próximos passos do processo.',
    'Reunião',
    'Pendente',
    'Média',
    (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com'),
    (SELECT id FROM projetos WHERE numero_processo = '0001234-56.2025.8.26.0100'),
    NOW() + INTERVAL '5 days',
    (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com')
  ),
  (
    'Elaborar petição inicial',
    'Redigir petição inicial da ação revisional com base nos cálculos e análises técnicas realizadas.',
    'Documento',
    'Pendente',
    'Alta',
    (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com'),
    (SELECT id FROM projetos WHERE numero_processo = '0001234-56.2025.8.26.0100'),
    NOW() + INTERVAL '10 days',
    (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com')
  );

-- Inserir comentários
INSERT INTO comentarios (tipo, conteudo, tarefa_id, autor_id)
VALUES
  (
    'comentario',
    'Cliente forneceu documentação completa. Iniciando análise detalhada dos juros cobrados. Identifiquei capitalização mensal nos primeiros 12 meses.',
    (SELECT id FROM tarefas WHERE titulo LIKE 'Analisar contrato%' LIMIT 1),
    (SELECT id FROM profiles WHERE email = 'diego.perito@suaempresa.com')
  ),
  (
    'historico',
    'Tarefa criada automaticamente a partir do projeto.',
    (SELECT id FROM tarefas WHERE titulo LIKE 'Analisar contrato%' LIMIT 1),
    (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com')
  );

-- Inserir audiência futura
INSERT INTO audiencias (
  projeto_id,
  tipo,
  titulo,
  descricao,
  data_hora,
  local,
  participantes_ids,
  status,
  criado_por
)
VALUES (
  (SELECT id FROM projetos WHERE numero_processo = '0001234-56.2025.8.26.0100'),
  'Audiência',
  'Audiência de Conciliação',
  'Primeira audiência de tentativa de conciliação com o banco. Levar toda documentação e cálculos.',
  NOW() + INTERVAL '30 days',
  'Fórum Central - Sala 403',
  ARRAY[(SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com')],
  'Agendado',
  (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com')
);

-- Inserir cálculo revisional
INSERT INTO calculos (
  tipo,
  contato_id,
  projeto_id,
  dados_contrato,
  resultado_calculo,
  economia_estimada,
  status,
  calculado_por,
  criado_por
)
VALUES (
  'Financiamento Imobiliário',
  (SELECT id FROM contatos WHERE nome_completo = 'João Silva Santos'),
  (SELECT id FROM projetos WHERE numero_processo = '0001234-56.2025.8.26.0100'),
  '{"valor_financiado": 300000, "prazo_meses": 360, "taxa_aplicada": 0.95, "data_contratacao": "2020-01-15"}'::jsonb,
  '{"valor_pago": 180000, "valor_devido_correto": 145000, "economia": 35000, "divergencias": ["Capitalização mensal detectada", "Taxa acima do CDC"]}'::jsonb,
  35000.00,
  'Concluído',
  (SELECT id FROM profiles WHERE email = 'diego.perito@suaempresa.com'),
  (SELECT id FROM profiles WHERE email = 'maria.advogada@suaempresa.com')
);

COMMIT;
```

---

## 🔔 Passo 7: Configurar Realtime (Notificações)

### 7.1 Habilitar Realtime nas Tabelas

1. Vá em **Database** > **Replication**
2. Clique em **"Add Table"**
3. Selecione as tabelas:
   - ✅ `notificacoes`
   - ✅ `tarefas`
   - ✅ `comentarios`
   - ✅ `oportunidades`
4. Para cada tabela, configure:
   ```
   ✅ Enable Realtime
   Replication: Enabled
   ```

### 7.2 Implementar no Frontend

```typescript
// lib/supabase-realtime.ts
import { supabase } from './supabase';
import { toast } from 'sonner';

export const setupRealtimeNotifications = (userId: string) => {
  const channel = supabase
    .channel('notificacoes-realtime')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'notificacoes',
        filter: `user_id=eq.${userId}`
      },
      (payload) => {
        const notificacao = payload.new;

        // Exibir toast
        toast(notificacao.titulo, {
          description: notificacao.mensagem,
          duration: 5000,
          action: notificacao.link_entidade ? {
            label: 'Ver',
            onClick: () => {
              // Navegar para a entidade
              window.location.href = `/app/${notificacao.tipo}/${notificacao.link_entidade}`;
            }
          } : undefined
        });

        // Tocar som (opcional)
        const audio = new Audio('/notification.mp3');
        audio.play();
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
};

// Usar no componente principal
useEffect(() => {
  const user = supabase.auth.user();
  if (user) {
    const cleanup = setupRealtimeNotifications(user.id);
    return cleanup;
  }
}, []);
```

### 7.3 Subscription para Tarefas

```typescript
// Hook personalizado para tarefas em tempo real
export const useRealtimeTasks = (userId: string) => {
  const [tasks, setTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Buscar tarefas iniciais
    const fetchTasks = async () => {
      const { data } = await supabase
        .from('tarefas')
        .select('*')
        .eq('responsavel_id', userId)
        .order('data_vencimento', { ascending: true });

      setTasks(data || []);
    };

    fetchTasks();

    // Configurar subscription
    const channel = supabase
      .channel('tarefas-updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'tarefas',
          filter: `responsavel_id=eq.${userId}`
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as Task]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t =>
              t.id === payload.new.id ? payload.new as Task : t
            ));
          } else if (payload.eventType === 'DELETE') {
            setTasks(prev => prev.filter(t => t.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId]);

  return tasks;
};
```

---

## ⏰ Passo 8: Configurar Cron Jobs (Edge Functions)

### 8.1 Instalar Supabase CLI

```bash
# Instalar globalmente
npm install -g supabase

# Ou usar npx
npx supabase --version
```

### 8.2 Criar Edge Function para Lembretes

```bash
# Criar função
npx supabase functions new notificar-prazos-proximos
```

Edite o arquivo gerado em `supabase/functions/notificar-prazos-proximos/index.ts`:

```typescript
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

serve(async (req) => {
  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Chamar função SQL
    const { data, error } = await supabase.rpc('notificar_prazos_proximos');

    if (error) throw error;

    // Notificar audiências
    const { data: audiencias, error: audienciasError } = await supabase
      .rpc('notificar_audiencias_proximas');

    if (audienciasError) throw audienciasError;

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Notificações de prazos enviadas com sucesso',
        tarefas: data,
        audiencias: audiencias
      }),
      {
        headers: { "Content-Type": "application/json" },
        status: 200
      }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" }
      }
    );
  }
});
```

### 8.3 Deploy da Edge Function

```bash
# Fazer login
npx supabase login

# Linkar ao projeto
npx supabase link --project-ref SEU_PROJECT_ID

# Deploy
npx supabase functions deploy notificar-prazos-proximos
```

### 8.4 Agendar Execução com Cron-job.org

1. Acesse [cron-job.org](https://cron-job.org) (gratuito)
2. Crie uma conta
3. Clique em **"Create Cronjob"**
4. Configure:
   ```
   Title: Notificar Prazos Próximos
   URL: https://SEU_PROJETO.supabase.co/functions/v1/notificar-prazos-proximos
   Schedule: Every hour (0 * * * *)

   Headers:
   Authorization: Bearer SEU_ANON_KEY
   ```
5. Salve

### 8.5 Alternativa: GitHub Actions

Crie `.github/workflows/cron-notificacoes.yml`:

```yaml
name: Notificações Agendadas

on:
  schedule:
    - cron: '0 * * * *' # A cada hora

jobs:
  notify:
    runs-on: ubuntu-latest
    steps:
      - name: Chamar Edge Function
        run: |
          curl -X POST \
            https://${{ secrets.SUPABASE_PROJECT_ID }}.supabase.co/functions/v1/notificar-prazos-proximos \
            -H "Authorization: Bearer ${{ secrets.SUPABASE_ANON_KEY }}"
```

---

## 🔍 Passo 9: Testar Conexão e Integração

### 9.1 Configurar Variáveis de Ambiente

Crie `.env.local` na raiz do projeto:

```env
# Supabase
VITE_SUPABASE_URL=https://xxxxxxxxxxxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...

# Opcional: Google OAuth
VITE_GOOGLE_CLIENT_ID=seu-client-id.apps.googleusercontent.com

# Opcional: Microsoft OAuth
VITE_MICROSOFT_CLIENT_ID=seu-client-id
```

### 9.2 Criar Cliente Supabase

```typescript
// src/lib/supabase.ts
import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Variáveis de ambiente do Supabase não configuradas!');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true
  }
});
```

### 9.3 Gerar TypeScript Types

```bash
# Instalar gerador
npm install supabase@latest --save-dev

# Gerar types
npx supabase gen types typescript --project-id SEU_PROJECT_ID > src/lib/database.types.ts
```

### 9.4 Teste de Conexão

```typescript
// src/lib/test-connection.ts
import { supabase } from './supabase';

export const testConnection = async () => {
  console.log('🔍 Testando conexão com Supabase...');

  try {
    // Teste 1: Buscar tarefas
    const { data: tarefas, error: tarefasError } = await supabase
      .from('tarefas')
      .select('*')
      .limit(5);

    if (tarefasError) throw tarefasError;
    console.log('✅ Tarefas:', tarefas.length, 'encontradas');

    // Teste 2: Buscar oportunidades
    const { data: oportunidades, error: opError } = await supabase
      .from('oportunidades')
      .select('*')
      .limit(5);

    if (opError) throw opError;
    console.log('✅ Oportunidades:', oportunidades.length, 'encontradas');

    // Teste 3: Buscar contatos
    const { data: contatos, error: contatosError } = await supabase
      .from('contatos')
      .select('*')
      .limit(5);

    if (contatosError) throw contatosError;
    console.log('✅ Contatos:', contatos.length, 'encontrados');

    // Teste 4: Verificar usuário autenticado
    const { data: { user } } = await supabase.auth.getUser();
    console.log('✅ Usuário:', user ? user.email : 'Não autenticado');

    console.log('🎉 Conexão OK! Todas as tabelas acessíveis.');
    return true;
  } catch (error) {
    console.error('❌ Erro na conexão:', error);
    return false;
  }
};
```

Chame em `App.tsx`:

```typescript
import { testConnection } from './lib/test-connection';

useEffect(() => {
  testConnection();
}, []);
```

---

## 📈 Passo 10: Monitoramento e Manutenção

### 10.1 Configurar Backups Automáticos

1. Vá em **Settings** > **Database** > **Backups**
2. Planos disponíveis:
   - **Free**: Backups diários (7 dias de retenção)
   - **Pro**: Backups a cada 6h (30 dias de retenção)
   - **Team**: Backups por hora (90 dias de retenção)

### 10.2 Monitorar Performance

1. Vá em **Database** > **Query Performance**
2. Identifique queries lentas (> 100ms)
3. Adicione índices conforme necessário:

```sql
-- Exemplo: Índice para busca de tarefas atrasadas
CREATE INDEX idx_tarefas_atrasadas_custom
ON tarefas(responsavel_id, data_vencimento)
WHERE status NOT IN ('Concluída', 'Cancelada')
AND data_vencimento < NOW();
```

### 10.3 Revisar Logs

1. **Logs** > **Postgres Logs**: Erros do banco
2. **Logs** > **API Logs**: Requisições à API (últimas 7 dias)
3. **Logs** > **Auth Logs**: Tentativas de login
4. **Logs** > **Realtime Logs**: Conexões websocket

### 10.4 Métricas Importantes

Acompanhe no painel:

- **Database Size**: < 500 MB (Free) | < 8 GB (Pro)
- **API Requests**: < 500k/mês (Free) | < 5M/mês (Pro)
- **Storage**: < 1 GB (Free) | < 100 GB (Pro)
- **Egress**: < 2 GB/mês (Free) | < 200 GB/mês (Pro)

---

## 🛡️ Boas Práticas de Segurança

### ✅ DO's (Faça)

- ✅ Use Row Level Security (RLS) em TODAS as tabelas
- ✅ Valide dados no backend (constraints, triggers)
- ✅ Use prepared statements (Supabase faz automaticamente)
- ✅ Implemente rate limiting para APIs públicas
- ✅ Faça backups regulares (automatize!)
- ✅ Monitore logs de autenticação diariamente
- ✅ Use HTTPS sempre (Supabase força isso)
- ✅ Rotacione chaves a cada 6 meses
- ✅ Teste RLS policies regularmente
- ✅ Use variáveis de ambiente (nunca hardcode keys)

### ❌ DON'Ts (Não Faça)

- ❌ NUNCA exponha a `service_role` key no frontend
- ❌ Não desabilite RLS em produção
- ❌ Não armazene senhas em texto plano
- ❌ Não confie apenas em validação frontend
- ❌ Não ignore erros de CORS
- ❌ Não faça queries sem índices em produção
- ❌ Não armazene dados sensíveis sem criptografia
- ❌ Não use SELECT * em produção (especifique colunas)
- ❌ Não ignore limites de rate (implemente throttling)

---

## 🚀 Otimizações Avançadas

### Índices Compostos Personalizados

```sql
-- Tarefas do usuário por status e vencimento
CREATE INDEX idx_tarefas_user_status_vencimento_custom
ON tarefas(responsavel_id, status, data_vencimento DESC)
WHERE ativo = true;

-- Notificações não lidas recentes
CREATE INDEX idx_notificacoes_user_nao_lidas_recentes
ON notificacoes(user_id, data_criacao DESC)
WHERE lida = false;

-- Projetos ativos com prazo próximo
CREATE INDEX idx_projetos_ativos_prazo_proximo
ON projetos(responsavel_id, data_prazo)
WHERE status IN ('Em Andamento', 'Em Análise') AND ativo = true;
```

### Particionamento (Plano Pro+)

Para tabelas com milhões de registros:

```sql
-- Particionar log_atividades por mês
CREATE TABLE log_atividades_2025_01 PARTITION OF log_atividades
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE log_atividades_2025_02 PARTITION OF log_atividades
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

-- Criar automaticamente via função
CREATE OR REPLACE FUNCTION criar_particao_log_mensal()
RETURNS void AS $$
DECLARE
  inicio DATE := DATE_TRUNC('month', CURRENT_DATE);
  fim DATE := inicio + INTERVAL '1 month';
  nome_tabela TEXT := 'log_atividades_' || TO_CHAR(inicio, 'YYYY_MM');
BEGIN
  EXECUTE format(
    'CREATE TABLE IF NOT EXISTS %I PARTITION OF log_atividades FOR VALUES FROM (%L) TO (%L)',
    nome_tabela, inicio, fim
  );
END;
$$ LANGUAGE plpgsql;
```

### Materialized Views para Dashboards

```sql
-- View materializada para métricas do dashboard
CREATE MATERIALIZED VIEW mv_dashboard_metricas AS
SELECT
  responsavel_id,
  COUNT(*) FILTER (WHERE status = 'Pendente') as pendentes,
  COUNT(*) FILTER (WHERE status = 'Em Andamento') as em_andamento,
  COUNT(*) FILTER (WHERE status = 'Concluída') as concluidas,
  COUNT(*) FILTER (WHERE data_vencimento < NOW()) as atrasadas,
  AVG(tempo_gasto) as tempo_medio_conclusao
FROM tarefas
WHERE ativo = true
GROUP BY responsavel_id;

-- Criar índice na view
CREATE UNIQUE INDEX ON mv_dashboard_metricas(responsavel_id);

-- Atualizar a cada hora (via cron job)
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_dashboard_metricas;
```

---

## 📞 Suporte e Recursos

### Documentação Oficial

- [Supabase Docs](https://supabase.com/docs)
- [PostgreSQL Docs](https://www.postgresql.org/docs/)
- [Row Level Security Guide](https://supabase.com/docs/guides/auth/row-level-security)
- [Realtime Guide](https://supabase.com/docs/guides/realtime)
- [Storage Guide](https://supabase.com/docs/guides/storage)

### Comunidade

- [Discord Supabase](https://discord.supabase.com)
- [GitHub Discussions](https://github.com/supabase/supabase/discussions)
- [Stack Overflow](https://stackoverflow.com/questions/tagged/supabase)
- [Reddit r/Supabase](https://www.reddit.com/r/Supabase/)

### Planos e Preços (2025)

| Recurso | Free | Pro | Team | Enterprise |
|---------|------|-----|------|------------|
| **Preço** | $0 | $25/mês | $599/mês | Custom |
| **Database** | 500 MB | 8 GB | 32 GB | Unlimited |
| **Storage** | 1 GB | 100 GB | 100 GB | Custom |
| **Bandwidth** | 2 GB | 200 GB | 200 GB | Custom |
| **API Requests** | 500k | 5M | 5M | Unlimited |
| **Backups** | 7 dias | 30 dias | 90 dias | Custom |
| **Support** | Community | Email | Priority | Dedicated |

---

## ✅ Checklist Final de Produção

Antes de ir para produção, verifique:

### Backend
- [ ] Schema executado com sucesso (19 tabelas)
- [ ] RLS habilitado em todas as tabelas
- [ ] Políticas RLS testadas para cada role
- [ ] Índices criados e otimizados
- [ ] Triggers funcionando corretamente
- [ ] Views criadas e testadas
- [ ] Dados iniciais (seed) inseridos

### Autenticação
- [ ] Email provider configurado
- [ ] Templates de email personalizados
- [ ] Google OAuth configurado (opcional)
- [ ] Políticas de senha definidas
- [ ] URLs de redirecionamento corretas

### Storage
- [ ] Buckets criados (3-4 buckets)
- [ ] Políticas de storage configuradas
- [ ] Limites de tamanho definidos
- [ ] MIME types restritos

### Usuários e Permissões
- [ ] Usuário admin criado
- [ ] Roles configuradas (5 roles)
- [ ] Usuários de teste criados
- [ ] Permissões testadas por role

### Realtime
- [ ] Replication habilitada nas tabelas
- [ ] Subscriptions testadas no frontend
- [ ] Notificações funcionando

### Cron Jobs
- [ ] Edge Functions criadas
- [ ] Functions deployadas
- [ ] Cron jobs agendados
- [ ] Testes de execução realizados

### Monitoramento
- [ ] Backups automáticos configurados
- [ ] Logs sendo revisados
- [ ] Métricas de uso acompanhadas
- [ ] Alertas configurados (opcional)

### Segurança
- [ ] Service role key NUNCA exposta
- [ ] Variáveis de ambiente configuradas
- [ ] HTTPS forçado
- [ ] RLS testado em todos os cenários
- [ ] Validações no backend

### Performance
- [ ] Queries otimizadas (< 100ms)
- [ ] Índices adicionados onde necessário
- [ ] Pagination implementada
- [ ] Cache configurado (opcional)

### Documentação
- [ ] README atualizado
- [ ] Guia de deploy criado
- [ ] Variáveis de ambiente documentadas
- [ ] Procedures de backup documentados

---

## 🎉 Conclusão

Parabéns! Você configurou com sucesso um sistema completo de gestão jurídica com:

✅ **19 tabelas** perfeitamente estruturadas
✅ **60+ índices** para performance máxima
✅ **RLS completo** em todas as tabelas
✅ **Realtime** para notificações instantâneas
✅ **Storage** organizado com políticas granulares
✅ **Cron jobs** para automações
✅ **Backups** automáticos
✅ **Monitoramento** ativo

### 🚀 Próximos Passos

1. **Integrar o Frontend React** com as queries do Supabase
2. **Criar hooks personalizados** para cada entidade (useTasks, useProjects, etc)
3. **Implementar autenticação** com Supabase Auth
4. **Adicionar validações** usando Zod ou Yup
5. **Criar testes automatizados** (Jest + React Testing Library)
6. **Deploy em produção** (Vercel/Netlify + Supabase)

---

**Desenvolvido com ❤️ para OctoApps**
**Versão:** 2.0 | **Data:** Janeiro 2025

Se encontrar problemas ou tiver dúvidas, consulte a [documentação oficial do Supabase](https://supabase.com/docs) ou abra uma issue no repositório do projeto.

**Bom desenvolvimento! 🚀**
