# Edge Functions do Supabase

Este diretório contém as Edge Functions que rodam no Supabase.

## 📋 Funções Disponíveis

### `buscar-taxa-bacen`
Busca a taxa média de juros do BACEN para financiamento imobiliário, resolvendo problemas de CORS ao fazer a requisição no servidor.

**Entrada:**
```json
{
  "dataContrato": "2012-07-06"
}
```

**Saída:**
```json
{
  "success": true,
  "fonte": "OLINDA",
  "data": "201207",
  "taxaMediaMensal": 0.0059,
  "taxaMediaAnual": 0.0735,
  "taxaMediaMensalPercent": "0.5900",
  "taxaMediaAnualPercent": "7.35"
}
```

## 🚀 Como Fazer Deploy

### Pré-requisitos
1. Instalar Supabase CLI:
```bash
npm install -g supabase
```

2. Fazer login no Supabase:
```bash
supabase login
```

3. Linkar seu projeto:
```bash
supabase link --project-ref SEU_PROJECT_REF
```

### Deploy da Função

Para fazer deploy de uma função específica:
```bash
supabase functions deploy buscar-taxa-bacen
```

Para fazer deploy de todas as funções:
```bash
supabase functions deploy
```

### Testar Localmente

1. Iniciar o Supabase localmente:
```bash
supabase start
```

2. Servir a função localmente:
```bash
supabase functions serve buscar-taxa-bacen
```

3. Testar com curl:
```bash
curl -i --location --request POST 'http://localhost:54321/functions/v1/buscar-taxa-bacen' \
  --header 'Authorization: Bearer SEU_ANON_KEY' \
  --header 'Content-Type: application/json' \
  --data '{"dataContrato":"2012-07-06"}'
```

## 📝 Variáveis de Ambiente

Nenhuma variável de ambiente é necessária para esta função.

## 🔒 Segurança

- A função permite CORS de qualquer origem (`*`) para desenvolvimento
- Em produção, considere restringir o CORS para seu domínio específico

## 📚 Documentação

- [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- [Deno Deploy](https://deno.com/deploy)
