#!/usr/bin/env python3
"""
Script para buscar todas as taxas históricas do BACEN
Série 432: Financiamento Imobiliário - Aquisição de Imóveis

Requisitos:
    pip install requests

Como usar:
    python scripts/buscar-taxas-bacen.py
"""

import requests
import json
from datetime import datetime

def buscar_api_sgs():
    """Busca dados da API SGS (antiga)"""
    print("🔍 Buscando taxas via API SGS...")

    url = "https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados?formato=json"

    try:
        response = requests.get(url, timeout=30)
        response.raise_for_status()
        dados = response.json()

        print(f"✅ {len(dados)} registros encontrados!")

        # Processar dados
        registros = {}
        for item in dados:
            # Data vem como "DD/MM/YYYY"
            dia, mes, ano = item['data'].split('/')
            ano_mes = f"{ano}{mes}"

            taxa_percent = float(item['valor'])
            if taxa_percent <= 0:
                continue

            taxa_decimal = taxa_percent / 100
            taxa_anual = (1 + taxa_decimal) ** 12 - 1

            # Pegar última taxa do mês
            registros[ano_mes] = {
                'ano_mes': ano_mes,
                'ano': int(ano),
                'mes': int(mes),
                'taxa_mensal_percent': f"{taxa_percent:.6f}",
                'taxa_mensal_decimal': f"{taxa_decimal:.8f}",
                'taxa_anual_decimal': f"{taxa_anual:.8f}"
            }

        return sorted(registros.values(), key=lambda x: x['ano_mes'])

    except Exception as e:
        print(f"❌ Erro: {e}")
        return []

def gerar_sql(registros):
    """Gera arquivo SQL com os INSERTs"""
    if not registros:
        print("❌ Nenhum registro para processar")
        return

    sql = f"""-- =====================================================
-- TAXAS BACEN - Dados Reais da API SGS
-- Série 432: Financiamento Imobiliário
-- Gerado em: {datetime.now().strftime('%d/%m/%Y %H:%M:%S')}
-- Total de registros: {len(registros)}
-- Período: {registros[0]['ano_mes']} até {registros[-1]['ano_mes']}
-- =====================================================

INSERT INTO taxas_bacen_historico (ano_mes, ano, mes, taxa_mensal_percent, taxa_mensal_decimal, taxa_anual_decimal) VALUES
"""

    for i, r in enumerate(registros):
        sql += f"('{r['ano_mes']}', {r['ano']}, {r['mes']}, {r['taxa_mensal_percent']}, {r['taxa_mensal_decimal']}, {r['taxa_anual_decimal']})"
        sql += ",\n" if i < len(registros) - 1 else "\n"

    sql += """ON CONFLICT (ano_mes) DO UPDATE SET
  taxa_mensal_percent = EXCLUDED.taxa_mensal_percent,
  taxa_mensal_decimal = EXCLUDED.taxa_mensal_decimal,
  taxa_anual_decimal = EXCLUDED.taxa_anual_decimal,
  data_atualizacao = NOW();

-- Verificar
SELECT COUNT(*) as total FROM taxas_bacen_historico;
SELECT * FROM taxas_bacen_historico WHERE ano_mes = '201207'; -- Julho/2012
"""

    # Salvar arquivo
    filename = f"database/taxas_bacen_completo_{datetime.now().strftime('%Y-%m-%d')}.sql"
    with open(filename, 'w', encoding='utf-8') as f:
        f.write(sql)

    print(f"\n✅ Arquivo SQL gerado: {filename}")
    print(f"\n📊 Estatísticas:")
    print(f"  - Primeiro registro: {registros[0]['ano_mes']} ({registros[0]['taxa_mensal_percent']}% a.m.)")
    print(f"  - Último registro: {registros[-1]['ano_mes']} ({registros[-1]['taxa_mensal_percent']}% a.m.)")

    # Verificar julho/2012
    julho2012 = next((r for r in registros if r['ano_mes'] == '201207'), None)
    if julho2012:
        print(f"  - Julho/2012: {julho2012['taxa_mensal_percent']}% a.m. ✅")

    print(f"\n📋 Próximos passos:")
    print(f"1. Abra: {filename}")
    print(f"2. Copie todo o conteúdo")
    print(f"3. Execute no SQL Editor do Supabase")

if __name__ == "__main__":
    registros = buscar_api_sgs()
    if registros:
        gerar_sql(registros)
