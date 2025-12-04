# 🚀 Deploy da Edge Function - Buscar Taxa BACEN

## Resumo
Criamos uma **Edge Function no Supabase** que busca automaticamente a taxa média do BACEN sem problemas de CORS.

## 📁 Arquivos Criados

```
supabase/
├── config.toml                          # Configuração do Supabase
└── functions/
    ├── README.md                        # Documentação das funções
    └── buscar-taxa-bacen/
        └── index.ts                     # Função que busca taxa do BACEN
```

## 🎯 O Que a Função Faz

1. Recebe a data do contrato (formato: `YYYY-MM-DD`)
2. Tenta buscar a taxa na **API OLINDA** (mais moderna)
3. Se falhar, tenta a **API SGS** (antiga) como fallback
4. Retorna a taxa mensal e anual em formato decimal e percentual

## 📋 Passo a Passo para Deploy

### 1️⃣ Instalar Supabase CLI

```bash
npm install -g supabase
```

### 2️⃣ Fazer Login no Supabase

```bash
supabase login
```

Isso vai abrir o navegador para você fazer login.

### 3️⃣ Obter o Project Reference ID

1. Acesse: https://supabase.com/dashboard
2. Abra seu projeto **OctoApp**
3. Vá em **Settings** > **General**
4. Copie o **Reference ID** (algo como `abc123def456`)

### 4️⃣ Linkar o Projeto

```bash
cd "C:\Users\kassi\OneDrive\Área de Trabalho\DIZEVOLV KASSIO PROJETOS\OctoApp"
supabase link --project-ref SEU_PROJECT_REF
```

Substitua `SEU_PROJECT_REF` pelo ID que você copiou.

### 5️⃣ Fazer Deploy da Função

```bash
supabase functions deploy buscar-taxa-bacen
```

### 6️⃣ Verificar o Deploy

Após o deploy, você verá uma mensagem como:
```
Deployed Function buscar-taxa-bacen on project SEU_PROJECT_REF
URL: https://SEU_PROJECT_REF.supabase.co/functions/v1/buscar-taxa-bacen
```

## ✅ Testar a Função

### No Console do Navegador

Depois do deploy, teste direto no seu app:

1. Abra o app no navegador
2. Vá para Financiamento Imobiliário
3. Preencha os campos obrigatórios
4. Deixe os campos "Taxa Média" **vazios**
5. Clique em **"Iniciar Análise Prévia"**
6. Veja no console:
   ```
   🔍 Buscando taxa via Edge Function do Supabase...
   ✅ TAXA ENCONTRADA (via Edge Function):
      📡 Fonte: OLINDA
      📅 Data: 201207
      📊 Mensal: 0.5900% a.m.
      📊 Anual: 7.35% a.a.
   ```

### Com cURL (Opcional)

```bash
curl -i --location --request POST \
  'https://SEU_PROJECT_REF.supabase.co/functions/v1/buscar-taxa-bacen' \
  --header 'Authorization: Bearer SEU_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"dataContrato":"2012-07-06"}'
```

## 🔧 Solução de Problemas

### Erro: "Function not found"
- Verifique se fez o deploy: `supabase functions list`
- Faça deploy novamente: `supabase functions deploy buscar-taxa-bacen`

### Erro: "Unauthorized"
- Verifique se está usando a `ANON_KEY` correta
- Verifique no `.env.local` se a URL está correta

### Erro: "CORS"
- A Edge Function já tem CORS configurado (`Access-Control-Allow-Origin: *`)
- Se ainda tiver problema, verifique se a URL está correta

## 🎉 Resultado Final

Depois do deploy:
- ✅ Taxa é buscada **automaticamente** do BACEN
- ✅ Sem problemas de CORS
- ✅ Funciona em produção e desenvolvimento
- ✅ Fallback para preenchimento manual se a API falhar

## 📚 Próximos Passos

Após o deploy funcionar:
1. Teste com diferentes datas de contrato
2. Verifique se o formulário é preenchido automaticamente
3. Se funcionar, remova o campo manual (ou deixe como backup)

## 🆘 Precisa de Ajuda?

Se tiver problemas:
1. Verifique os logs: `supabase functions logs buscar-taxa-bacen`
2. Teste localmente primeiro: `supabase functions serve buscar-taxa-bacen`
3. Verifique a documentação: https://supabase.com/docs/guides/functions
