'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import {
    ArrowLeft,
    Archive,
    Search,
    RotateCcw,
    Loader2,
    Calendar,
    User,
    DollarSign,
    Trash2,
} from 'lucide-react';
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '../ui/alert-dialog';
import { Badge } from '../ui/badge';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '../ui/table';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Opportunity } from '../../types/opportunity';

interface ArchivedOpportunitiesProps {
    onBack: () => void;
    onNavigate: (route: string, id?: string) => void;
}

export function ArchivedOpportunities({ onBack, onNavigate }: ArchivedOpportunitiesProps) {
    const { user } = useAuth();
    const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedOpp, setSelectedOpp] = useState<Opportunity | null>(null);
    const [isRestoreDialogOpen, setIsRestoreDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

    useEffect(() => {
        loadArchivedOpportunities();
    }, [user]);

    const loadArchivedOpportunities = async () => {
        try {
            setLoading(true);
            if (!user) {
                setOpportunities([]);
                return;
            }

            const { data, error } = await supabase
                .from('oportunidades')
                .select(`
          *,
          contatos:contato_id (
            id,
            nome_completo,
            email
          ),
          responsavel:responsavel_id (
            id,
            nome_completo,
            avatar_url
          )
        `)
                .eq('ativo', false)
                .or(`criado_por.eq.${user.id},responsavel_id.eq.${user.id}`)
                .order('data_atualizacao', { ascending: false });

            if (error) throw error;
            setOpportunities(data || []);
        } catch (error) {
            console.error('Error loading archived opportunities:', error);
            toast.error('Erro ao carregar oportunidades arquivadas');
        } finally {
            setLoading(false);
        }
    };

    const handleRestore = async () => {
        if (!selectedOpp) return;

        setActionLoading(true);
        try {
            const { error } = await supabase
                .from('oportunidades')
                .update({
                    ativo: true,
                    data_atualizacao: new Date().toISOString(),
                })
                .eq('id', selectedOpp.id);

            if (error) throw error;

            // Log activity
            supabase.from('log_atividades').insert({
                user_id: user?.id,
                acao: 'RESTAURAR_OPORTUNIDADE',
                entidade: 'oportunidades',
                entidade_id: selectedOpp.id,
                dados_anteriores: { ativo: false },
                dados_novos: { ativo: true },
            }).then(() => { }).catch(e => console.warn('Log failed:', e));

            toast.success('Oportunidade restaurada com sucesso!');
            setIsRestoreDialogOpen(false);
            setSelectedOpp(null);
            await loadArchivedOpportunities();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao restaurar oportunidade');
        } finally {
            setActionLoading(false);
        }
    };

    const handlePermanentDelete = async () => {
        if (!selectedOpp) return;

        setActionLoading(true);
        try {
            // Delete related data first
            await supabase.from('tarefas').delete().eq('oportunidade_id', selectedOpp.id);
            await supabase.from('log_atividades').delete().eq('entidade_id', selectedOpp.id);
            await supabase.from('comentarios_oportunidade').delete().eq('oportunidade_id', selectedOpp.id);
            await supabase.from('anexos_oportunidade').delete().eq('oportunidade_id', selectedOpp.id);

            const { error } = await supabase
                .from('oportunidades')
                .delete()
                .eq('id', selectedOpp.id);

            if (error) throw error;

            toast.success('Oportunidade excluída permanentemente!');
            setIsDeleteDialogOpen(false);
            setSelectedOpp(null);
            await loadArchivedOpportunities();
        } catch (error: any) {
            toast.error(error.message || 'Erro ao excluir oportunidade');
        } finally {
            setActionLoading(false);
        }
    };

    const formatCurrency = (val: number | null) =>
        new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val || 0);

    const formatDate = (dateStr: string) =>
        new Date(dateStr).toLocaleDateString('pt-BR');

    const filteredOpportunities = opportunities.filter(
        (opp) =>
            opp.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
            opp.contatos?.nome_completo?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50">
            <div className="max-w-6xl mx-auto p-4 lg:p-8">
                {/* Header */}
                <div className="mb-8">
                    <Button
                        variant="ghost"
                        onClick={onBack}
                        className="gap-2 mb-4 -ml-2"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar para o Kanban
                    </Button>

                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-3">
                                <Archive className="w-7 h-7 text-slate-600" />
                                Oportunidades Arquivadas
                            </h1>
                            <p className="text-slate-500 mt-1">
                                Oportunidades que foram arquivadas podem ser restauradas ou excluídas permanentemente
                            </p>
                        </div>

                        <div className="relative w-full sm:w-80">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <Input
                                placeholder="Buscar por título ou contato..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                    </div>
                </div>

                {/* Content */}
                <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
                        </div>
                    ) : filteredOpportunities.length === 0 ? (
                        <div className="text-center py-12">
                            <Archive className="w-12 h-12 text-slate-300 mx-auto mb-4" />
                            <p className="text-slate-500 mb-2">
                                {searchTerm
                                    ? 'Nenhuma oportunidade encontrada para esta busca'
                                    : 'Nenhuma oportunidade arquivada'}
                            </p>
                            <p className="text-sm text-slate-400">
                                Oportunidades arquivadas aparecerão aqui
                            </p>
                        </div>
                    ) : (
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Título</TableHead>
                                    <TableHead>Contato</TableHead>
                                    <TableHead>Valor</TableHead>
                                    <TableHead>Data Arquivamento</TableHead>
                                    <TableHead className="text-right">Ações</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredOpportunities.map((opp) => (
                                    <TableRow key={opp.id}>
                                        <TableCell>
                                            <div>
                                                <p className="font-medium text-slate-900">{opp.titulo}</p>
                                                {opp.tipo_acao && (
                                                    <Badge variant="secondary" className="mt-1 text-xs">
                                                        {opp.tipo_acao}
                                                    </Badge>
                                                )}
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <User className="w-4 h-4 text-slate-400" />
                                                <span className="text-slate-600">
                                                    {opp.contatos?.nome_completo || 'Sem contato'}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <DollarSign className="w-4 h-4 text-green-500" />
                                                <span className="text-slate-600">
                                                    {formatCurrency(opp.valor_estimado)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell>
                                            <div className="flex items-center gap-2">
                                                <Calendar className="w-4 h-4 text-slate-400" />
                                                <span className="text-slate-500 text-sm">
                                                    {formatDate(opp.data_atualizacao || opp.data_criacao)}
                                                </span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedOpp(opp);
                                                        setIsRestoreDialogOpen(true);
                                                    }}
                                                    className="gap-1"
                                                >
                                                    <RotateCcw className="w-4 h-4" />
                                                    Restaurar
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => {
                                                        setSelectedOpp(opp);
                                                        setIsDeleteDialogOpen(true);
                                                    }}
                                                    className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    )}
                </div>

                {/* Stats */}
                {!loading && opportunities.length > 0 && (
                    <div className="mt-4 text-sm text-slate-500">
                        {filteredOpportunities.length} oportunidade(s) arquivada(s)
                    </div>
                )}
            </div>

            {/* Restore Dialog */}
            <AlertDialog open={isRestoreDialogOpen} onOpenChange={setIsRestoreDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Restaurar Oportunidade</AlertDialogTitle>
                        <AlertDialogDescription>
                            Deseja restaurar a oportunidade{' '}
                            <strong>"{selectedOpp?.titulo}"</strong>?
                            <br />
                            <br />
                            Ela voltará a aparecer no Kanban principal.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRestore}
                            disabled={actionLoading}
                            className="bg-green-600 hover:bg-green-700"
                        >
                            {actionLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <RotateCcw className="mr-2 h-4 w-4" />
                            )}
                            Restaurar
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Permanent Delete Dialog */}
            <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle className="text-red-600">Excluir Permanentemente</AlertDialogTitle>
                        <AlertDialogDescription>
                            <span className="text-red-600 font-semibold">
                                ⚠️ Esta ação é irreversível!
                            </span>
                            <br />
                            <br />
                            Todos os dados relacionados serão excluídos:
                            <ul className="list-disc list-inside mt-2 text-slate-600">
                                <li>Tarefas vinculadas</li>
                                <li>Comentários</li>
                                <li>Anexos</li>
                                <li>Histórico de atividades</li>
                            </ul>
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel disabled={actionLoading}>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handlePermanentDelete}
                            disabled={actionLoading}
                            className="bg-red-600 hover:bg-red-700"
                        >
                            {actionLoading ? (
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            ) : (
                                <Trash2 className="mr-2 h-4 w-4" />
                            )}
                            Excluir Permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
