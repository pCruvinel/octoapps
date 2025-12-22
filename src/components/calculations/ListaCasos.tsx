'use client';

import * as React from 'react';
import { ColumnDef, SortingState } from '@tanstack/react-table';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { DataTable } from '../ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '../ui/dropdown-menu';
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
import {
    Plus,
    Search,
    MoreVertical,
    Play,
    FileText,
    Archive,
    Trash2,
    Calculator,
    Building,
    CreditCard,
    RefreshCw,
} from 'lucide-react';
import { toast } from 'sonner';
import { contratoRevisionalService, type ContratoWithResultado, type StatusContrato, type ModuloCalculo } from '@/services/contratoRevisionalService';
import { supabase } from '@/lib/supabase';

interface ListaCasosProps {
    onNavigate: (route: string, id?: string, data?: any) => void;
    initialData?: any[]; // Preloaded data from router loader
}

const STATUS_CONFIG: Record<StatusContrato, { label: string; color: string }> = {
    RASCUNHO: { label: 'Rascunho', color: 'bg-slate-100 text-slate-700' },
    ANALISE_PREVIA: { label: 'Análise Prévia', color: 'bg-amber-100 text-amber-800' },
    ANALISE_DETALHADA: { label: 'Detalhada', color: 'bg-emerald-100 text-emerald-800' },
    ARQUIVADO: { label: 'Arquivado', color: 'bg-slate-200 text-slate-500' },
};

const MODULO_CONFIG: Record<ModuloCalculo, { label: string; icon: React.ReactNode }> = {
    GERAL: { label: 'Empréstimos & Veículos', icon: <Calculator className="h-4 w-4" /> },
    IMOBILIARIO: { label: 'Imobiliário', icon: <Building className="h-4 w-4" /> },
    CARTAO: { label: 'Cartão', icon: <CreditCard className="h-4 w-4" /> },
};

export function ListaCasos({ onNavigate, initialData }: ListaCasosProps) {
    const [contratos, setContratos] = React.useState<ContratoWithResultado[]>(initialData || []);
    const [loading, setLoading] = React.useState(!initialData);
    const [userId, setUserId] = React.useState<string | null>(null);

    // Pagination
    const [page, setPage] = React.useState(1);
    const [totalCount, setTotalCount] = React.useState(0);
    const pageSize = 10;
    const totalPages = Math.ceil(totalCount / pageSize);

    // Filters (server-side)
    const [statusFilter, setStatusFilter] = React.useState<StatusContrato | 'TODOS'>('TODOS');
    const [searchQuery, setSearchQuery] = React.useState('');
    const [debouncedSearch, setDebouncedSearch] = React.useState('');

    // Sorting (server-side)
    const [sorting, setSorting] = React.useState<SortingState>([
        { id: 'updated_at', desc: true }
    ]);

    // Delete dialog
    const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
    const [contratoToDelete, setContratoToDelete] = React.useState<ContratoWithResultado | null>(null);

    // Debounce search input
    React.useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(searchQuery);
            setPage(1);
        }, 400);
        return () => clearTimeout(timer);
    }, [searchQuery]);

    // Get user on mount
    React.useEffect(() => {
        supabase.auth.getUser().then(({ data }) => {
            if (data.user) {
                setUserId(data.user.id);
            }
        });
    }, []);

    // Load data when filters/page/user/sorting change
    React.useEffect(() => {
        if (userId) {
            loadContratos(userId);
        }
    }, [userId, page, statusFilter, debouncedSearch, sorting]);

    const loadContratos = async (uid: string) => {
        setLoading(true);

        const orderBy = (sorting[0]?.id as 'updated_at' | 'created_at' | 'nome_referencia') || 'updated_at';
        const orderDirection = sorting[0]?.desc ? 'desc' : 'asc';

        const { data, count, error } = await contratoRevisionalService.listWithPagination(uid, {
            page,
            pageSize,
            status: statusFilter,
            search: debouncedSearch,
            orderBy,
            orderDirection,
        });
        if (error) {
            toast.error('Erro ao carregar casos');
            console.error(error);
        } else {
            setContratos(data || []);
            setTotalCount(count);
        }
        setLoading(false);
    };

    const handleRefresh = () => {
        if (userId) loadContratos(userId);
    };

    const handleStatusChange = (value: StatusContrato | 'TODOS') => {
        setStatusFilter(value);
        setPage(1);
    };

    const handleSortingChange = (newSorting: SortingState) => {
        setSorting(newSorting);
        setPage(1);
    };

    // Actions
    const handleResume = async (contrato: ContratoWithResultado) => {
        const { data: fullContrato, error } = await contratoRevisionalService.getById(contrato.id);
        if (error || !fullContrato) {
            toast.error('Erro ao carregar dados do contrato');
            return;
        }
        const initialData = {
            step1: fullContrato.dados_step1,
            step2: fullContrato.dados_step2,
            step3: fullContrato.dados_step3,
        };
        onNavigate('calc-wizard', fullContrato.id, {
            module: fullContrato.modulo,
            initialData,
            contratoId: fullContrato.id
        });
    };

    const handleViewReport = (contrato: ContratoWithResultado) => {
        if (contrato.status === 'ANALISE_DETALHADA') {
            onNavigate('calc-relatorio', contrato.id, { contrato });
        } else {
            toast.info('Análise detalhada não disponível.');
        }
    };

    const handleArchive = async (contrato: ContratoWithResultado) => {
        const { error } = await contratoRevisionalService.archive(contrato.id);
        if (error) {
            toast.error('Erro ao arquivar');
        } else {
            toast.success('Contrato arquivado');
            handleRefresh();
        }
    };

    const handleDeleteClick = (contrato: ContratoWithResultado) => {
        setContratoToDelete(contrato);
        setDeleteDialogOpen(true);
    };

    const handleConfirmDelete = async () => {
        if (!contratoToDelete) return;
        const { error } = await contratoRevisionalService.delete(contratoToDelete.id);
        if (error) {
            toast.error('Erro ao excluir');
        } else {
            toast.success('Contrato excluído');
            handleRefresh();
        }
        setDeleteDialogOpen(false);
        setContratoToDelete(null);
    };

    const formatDate = (isoDate: string | null) => {
        if (!isoDate) return '-';
        return new Date(isoDate).toLocaleDateString('pt-BR');
    };

    const formatCurrency = (value: number | null | undefined) => {
        if (!value) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    // Column definitions
    const columns: ColumnDef<ContratoWithResultado>[] = [
        {
            accessorKey: 'nome_referencia',
            header: 'Referência',
            enableSorting: true,
            cell: ({ row }) => (
                <span className="font-medium">
                    {row.original.nome_referencia || 'Sem nome'}
                </span>
            ),
        },
        {
            accessorKey: 'modulo',
            header: 'Módulo',
            enableSorting: false,
            cell: ({ row }) => {
                const config = MODULO_CONFIG[row.original.modulo];
                return (
                    <div className="flex items-center gap-2">
                        {config.icon}
                        <span className="text-sm">{config.label}</span>
                    </div>
                );
            },
        },
        {
            accessorKey: 'status',
            header: 'Status',
            enableSorting: false,
            cell: ({ row }) => {
                const config = STATUS_CONFIG[row.original.status];
                return (
                    <Badge className={`${config.color} rounded-md`}>
                        {config.label}
                    </Badge>
                );
            },
        },
        {
            id: 'economia',
            header: 'Economia Est.',
            enableSorting: false,
            cell: ({ row }) => {
                const resultado = row.original.resultado_analise_previa;
                if (!resultado) return '-';
                return (
                    <span className={resultado.economia_estimada && resultado.economia_estimada > 0 ? 'text-emerald-600 font-medium' : ''}>
                        {formatCurrency(resultado.economia_estimada)}
                    </span>
                );
            },
        },
        {
            accessorKey: 'updated_at',
            header: 'Atualizado',
            enableSorting: true,
            cell: ({ row }) => (
                <span className="text-slate-500">
                    {formatDate(row.original.updated_at)}
                </span>
            ),
        },
        {
            id: 'actions',
            header: '',
            enableSorting: false,
            cell: ({ row }) => {
                const contrato = row.original;
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {contrato.status !== 'ARQUIVADO' && contrato.status !== 'ANALISE_DETALHADA' && (
                                <DropdownMenuItem onClick={() => handleResume(contrato)}>
                                    <Play className="h-4 w-4 mr-2" />
                                    Retomar
                                </DropdownMenuItem>
                            )}
                            {contrato.status === 'ANALISE_DETALHADA' && (
                                <>
                                    <DropdownMenuItem onClick={() => handleResume(contrato)}>
                                        <Play className="h-4 w-4 mr-2" />
                                        Abrir / Editar
                                    </DropdownMenuItem>
                                    <DropdownMenuItem onClick={() => handleViewReport(contrato)}>
                                        <FileText className="h-4 w-4 mr-2" />
                                        Ver Relatório
                                    </DropdownMenuItem>
                                </>
                            )}
                            <DropdownMenuSeparator />
                            {contrato.status !== 'ARQUIVADO' && (
                                <DropdownMenuItem onClick={() => handleArchive(contrato)}>
                                    <Archive className="h-4 w-4 mr-2" />
                                    Arquivar
                                </DropdownMenuItem>
                            )}
                            <DropdownMenuItem
                                onClick={() => handleDeleteClick(contrato)}
                                className="text-red-600"
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                );
            },
        },
    ];

    // Module definitions
    const MODULES = [
        {
            id: 'GERAL',
            title: 'Empréstimos & Veículos',
            description: 'CDC, Consignados, Capital de Giro, Veículos',
            icon: Calculator,
            color: 'bg-blue-500',
            features: ['Tabela Price', 'Método de Gauss', 'Anatocismo'],
            series: ['25471', '20749'],
        },
        {
            id: 'IMOBILIARIO',
            title: 'Imobiliário (SFH/SFI)',
            description: 'Financiamentos habitacionais com TR, IPCA ou INPC',
            icon: Building,
            color: 'bg-emerald-500',
            features: ['SAC / SACRE', 'Correção Monetária', 'Seguros'],
            series: ['432'],
        },
        {
            id: 'CARTAO',
            title: 'Cartão de Crédito',
            description: 'RMC e recomposição de saldo devedor',
            icon: CreditCard,
            color: 'bg-purple-500',
            features: ['Grid de Faturas', 'Recálculo de Dívida'],
            comingSoon: true,
            series: [],
        },
    ];

    /*
    const MODULES: any[] = [];
    */

    const handleSelectModule = (moduleId: string) => {
        onNavigate('calc-wizard', undefined, { module: moduleId });
    };

    return (
        <div className="p-6 space-y-8">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-bold tracking-tight text-slate-900">Cálculos Revisionais</h1>
                <p className="text-muted-foreground mt-1">
                    Inicie um novo cálculo ou gerencie seus casos existentes
                </p>
            </div>

            {/* Section: Novo Cálculo (Cards) */}
            <div className="grid gap-6 md:grid-cols-3">
                {MODULES.map((module) => (
                    <div
                        key={module.id}
                        onClick={() => !module.comingSoon && handleSelectModule(module.id)}
                        className={`
                            relative group border rounded-xl p-5 transition-all
                            ${module.comingSoon
                                ? 'opacity-60 bg-slate-50 border-slate-200 cursor-not-allowed'
                                : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md cursor-pointer hover:-translate-y-1'
                            }
                        `}
                    >
                        {module.comingSoon && (
                            <div className="absolute top-3 right-3 z-10">
                                <Badge variant="secondary" className="text-xs">Em breve</Badge>
                            </div>
                        )}

                        <div className="flex items-start gap-4">
                            <div className={`w-12 h-12 rounded-lg ${module.color} flex items-center justify-center shrink-0 shadow-sm`}>
                                <module.icon className="h-6 w-6 text-white" />
                            </div>
                            <div className="space-y-1">
                                <h3 className="font-semibold text-slate-900">{module.title}</h3>
                                <p className="text-xs text-slate-500 leading-relaxed">
                                    {module.description}
                                </p>
                            </div>
                        </div>

                        {!module.comingSoon && (
                            <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between">
                                <div className="flex -space-x-1 overflow-hidden">
                                    {/* Feature Pills */}
                                    {module.features.slice(0, 2).map(f => (
                                        <span key={f} className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-600 mr-1">
                                            {f}
                                        </span>
                                    ))}
                                </div>
                                <span className="text-xs font-medium text-blue-600 group-hover:underline flex items-center">
                                    Iniciar <Play className="w-3 h-3 ml-1" />
                                </span>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            <div className="border-t border-slate-200" />

            {/* Section: Lista de Casos (Table) */}
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-slate-800 flex items-center gap-2">
                        <Archive className="w-5 h-5 text-slate-400" />
                        Casos Recentes
                    </h2>
                </div>

                {/* Filters & Actions */}
                <div className="flex flex-col gap-4 bg-slate-50/50 p-4 rounded-lg border border-slate-200">
                    <Tabs defaultValue="TODOS" value={statusFilter} onValueChange={(v) => handleStatusChange(v as StatusContrato | 'TODOS')} className="w-full">
                        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                            <TabsList className="h-9 w-full sm:w-auto">
                                <TabsTrigger value="TODOS" className="text-xs">Todos</TabsTrigger>
                                <TabsTrigger value="RASCUNHO" className="text-xs">Rascunhos</TabsTrigger>
                                <TabsTrigger value="ANALISE_PREVIA" className="text-xs">Análise</TabsTrigger>
                                <TabsTrigger value="ANALISE_DETALHADA" className="text-xs">Detalhados</TabsTrigger>
                                <TabsTrigger value="ARQUIVADO" className="text-xs">Arquivados</TabsTrigger>
                            </TabsList>

                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <div className="relative flex-1 sm:w-64">
                                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
                                    <Input
                                        placeholder="Buscar por cliente..."
                                        value={searchQuery}
                                        onChange={(e) => setSearchQuery(e.target.value)}
                                        className="pl-9 h-9 text-sm"
                                    />
                                </div>
                                <Button variant="outline" size="icon" className="h-9 w-9" onClick={handleRefresh} title="Atualizar">
                                    <RefreshCw className="h-3.5 w-3.5" />
                                </Button>
                            </div>
                        </div>
                    </Tabs>
                </div>

                {/* Data Table */}
                <div className="rounded-md border bg-white">
                    <DataTable
                        columns={columns}
                        data={contratos}
                        sorting={sorting}
                        onSortingChange={handleSortingChange}
                        isLoading={loading}
                        emptyState={
                            <div className="text-center py-12 text-slate-500">
                                <div className="bg-slate-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
                                    <Calculator className="h-8 w-8 text-slate-300" />
                                </div>
                                <h3 className="text-lg font-medium text-slate-900 mb-1">Nenhum caso encontrado</h3>
                                <p className="mb-4 text-sm text-slate-400 max-w-sm mx-auto">
                                    Seus cálculos revisionais aparecerão aqui. Inicie um novo cálculo selecionando um módulo acima.
                                </p>
                            </div>
                        }
                    />
                </div>

                {/* Pagination Footer */}
                <div className="flex items-center justify-between text-sm text-slate-500 px-2">
                    <span>{totalCount} registros</span>
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            disabled={page === 1}
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                        >
                            Anterior
                        </Button>
                        <span className="text-xs">Página {page} de {totalPages || 1}</span>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs"
                            disabled={page >= totalPages}
                            onClick={() => setPage(p => p + 1)}
                        >
                            Próximo
                        </Button>
                    </div>
                </div>
            </div>

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Confirmar Exclusão</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o caso "{contratoToDelete?.nome_referencia || 'Sem nome'}"?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={handleConfirmDelete} className="bg-red-600 hover:bg-red-700">
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    );
}
