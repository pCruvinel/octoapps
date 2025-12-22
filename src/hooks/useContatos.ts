import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface ContatoSimplificado {
    id: string;
    nome: string;
    cpf_cnpj?: string;
}

interface UseContatosOptions {
    apenasAtivos?: boolean;
    busca?: string;
}

/**
 * Hook para buscar contatos do Supabase para uso no CardIdentificacao.
 * Retorna lista simplificada com id e nome para o combobox.
 */
export function useContatos(options: UseContatosOptions = {}) {
    const { apenasAtivos = true, busca } = options;
    const [contatos, setContatos] = useState<ContatoSimplificado[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchContatos = async () => {
            setLoading(true);
            try {
                let query = supabase
                    .from('contatos')
                    .select('id, nome_completo, cpf_cnpj')
                    .order('nome_completo', { ascending: true });

                if (apenasAtivos) {
                    query = query.eq('ativo', true);
                }

                if (busca && busca.length >= 2) {
                    query = query.ilike('nome_completo', `%${busca}%`);
                }

                const { data, error: fetchError } = await query.limit(50);

                if (fetchError) throw fetchError;

                // Mapeia para formato simplificado
                const contatosSimplificados: ContatoSimplificado[] = (data || []).map(c => ({
                    id: c.id,
                    nome: c.nome_completo,
                    cpf_cnpj: c.cpf_cnpj,
                }));

                setContatos(contatosSimplificados);
            } catch (err) {
                console.error('[useContatos] Erro:', err);
                setError(err instanceof Error ? err.message : 'Erro ao buscar contatos');
            } finally {
                setLoading(false);
            }
        };

        fetchContatos();
    }, [apenasAtivos, busca]);

    /**
     * Cria um novo contato on-the-fly (apenas com nome).
     * Retorna o ID do contato criado.
     */
    const criarContato = async (nome: string): Promise<string | null> => {
        try {
            const { data, error } = await supabase
                .from('contatos')
                .insert({
                    nome_completo: nome,
                    tipo: 'PESSOA_FISICA',
                    ativo: true,
                })
                .select('id')
                .single();

            if (error) throw error;

            // Adiciona à lista local
            if (data) {
                setContatos(prev => [...prev, { id: data.id, nome }]);
                return data.id;
            }
            return null;
        } catch (err) {
            console.error('[useContatos] Erro ao criar contato:', err);
            return null;
        }
    };

    return {
        contatos,
        loading,
        error,
        criarContato,
    };
}
