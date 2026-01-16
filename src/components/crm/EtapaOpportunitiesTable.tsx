import { useState, useMemo } from 'react';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    TableFooter,
} from '@/components/ui/table';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { 
    Search, 
    ArrowUpDown, 
    ArrowLeft, 
    ExternalLink,
    ChevronLeft,
    ChevronRight,
    ChevronsLeft,
    ChevronsRight
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { Opportunity } from '@/types/opportunity';
import type { EtapaFunil } from '@/types/funnel';

interface EtapaOpportunitiesTableProps {
    etapa: EtapaFunil;
    opportunities: Opportunity[];
    onBack: () => void;
    onSelectOpportunity: (id: string) => void;
}

type SortField = 'titulo' | 'valor_proposta' | 'data_criacao' | 'responsavel';
type SortDirection = 'asc' | 'desc';

/**
 * Tabela de oportunidades para visualização detalhada de uma etapa
 * Renderizada dentro do CRMKanban quando uma etapa é selecionada
 */
export function EtapaOpportunitiesTable({
    etapa,
    opportunities,
    onBack,
    onSelectOpportunity,
}: EtapaOpportunitiesTableProps) {
    const [search, setSearch] = useState('');
    const [sortField, setSortField] = useState<SortField>('titulo');
    const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10);

    // Reset pagination when search changes
    const handleSearchChange = (value: string) => {
        setSearch(value);
        setCurrentPage(1);
    };

    // Aplicar busca
    const filteredOpportunities = useMemo(() => {
        if (!search.trim()) return opportunities;
        const searchLower = search.toLowerCase();
        return opportunities.filter(opp =>
            opp.titulo.toLowerCase().includes(searchLower) ||
            opp.contatos?.nome_completo?.toLowerCase().includes(searchLower) ||
            opp.responsavel?.nome_completo?.toLowerCase().includes(searchLower)
        );
    }, [opportunities, search]);

    // Aplicar ordenação
    const sortedOpportunities = useMemo(() => {
        return [...filteredOpportunities].sort((a, b) => {
            let comparison = 0;

            switch (sortField) {
                case 'titulo':
                    comparison = a.titulo.localeCompare(b.titulo);
                    break;
                case 'valor_proposta':
                    comparison = (a.valor_proposta || 0) - (b.valor_proposta || 0);
                    break;
                case 'data_criacao':
                    comparison = new Date(a.data_criacao).getTime() - new Date(b.data_criacao).getTime();
                    break;
                case 'responsavel':
                    comparison = (a.responsavel?.nome_completo || '').localeCompare(b.responsavel?.nome_completo || '');
                    break;
            }

            return sortDirection === 'asc' ? comparison : -comparison;
        });
    }, [filteredOpportunities, sortField, sortDirection]);

    // Aplicar paginação
    const paginatedOpportunities = useMemo(() => {
        const startIndex = (currentPage - 1) * pageSize;
        return sortedOpportunities.slice(startIndex, startIndex + pageSize);
    }, [sortedOpportunities, currentPage, pageSize]);

    const totalPages = Math.ceil(sortedOpportunities.length / pageSize);

    // Calcular totais (da lista filtrada completa)
    const totals = useMemo(() => {
        return {
            count: sortedOpportunities.length,
            valorProposta: sortedOpportunities.reduce((sum, opp) => sum + (opp.valor_proposta || 0), 0),
        };
    }, [sortedOpportunities]);

    // Handler de ordenação
    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDirection(prev => prev === 'asc' ? 'desc' : 'asc');
        } else {
            setSortField(field);
            setSortDirection('asc');
        }
    };

    // Formatar moeda
    const formatCurrency = (value: number | null | undefined) => {
        if (!value) return '-';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
        }).format(value);
    };

    // Formatar data
    const formatDate = (dateStr: string) => {
        return new Date(dateStr).toLocaleDateString('pt-BR');
    };

    return (
        <div className="h-full flex flex-col bg-white rounded-lg border shadow-sm animate-in fade-in duration-300">
            {/* Header da Tabela */}
            <div className="p-4 border-b flex items-center justify-between gap-4 bg-slate-50/50 rounded-t-lg">
                <div className="flex items-center gap-4">
                    <Button
                        variant="ghost" 
                        size="sm"
                        onClick={onBack}
                        className="gap-2 text-slate-600 hover:text-slate-900"
                    >
                        <ArrowLeft className="w-4 h-4" />
                        Voltar
                    </Button>
                    
                    <div className="h-6 w-px bg-slate-200" />

                    <div className="flex items-center gap-3">
                        <div
                            className="w-4 h-4 rounded-full shadow-sm ring-1 ring-slate-100"
                            style={{ backgroundColor: etapa.cor || '#6366f1' }}
                        />
                        <div>
                            <h2 className="font-semibold text-slate-900 leading-none">
                                {etapa.nome}
                            </h2>
                            <span className="text-xs text-slate-500 mt-1 block">
                                {totals.count} oportunidades • Total: {formatCurrency(totals.valorProposta)}
                            </span>
                        </div>
                    </div>
                </div>

                <div className="relative w-full max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Buscar por nome, contato ou responsável..."
                        value={search}
                        onChange={(e) => handleSearchChange(e.target.value)}
                        className="pl-9 h-9 bg-white"
                    />
                </div>
            </div>

            {/* Conteúdo da Tabela */}
            <div className="flex-1 overflow-auto">
                <Table>
                    <TableHeader className="sticky top-0 bg-white shadow-sm z-10">
                        <TableRow className="hover:bg-transparent">
                            <TableHead className="w-[300px]">
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="-ml-3 h-8 font-medium"
                                    onClick={() => handleSort('titulo')}
                                >
                                    Oportunidade
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>Contato</TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="-ml-3 h-8 font-medium"
                                    onClick={() => handleSort('valor_proposta')}
                                >
                                    Valor
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="-ml-3 h-8 font-medium"
                                    onClick={() => handleSort('data_criacao')}
                                >
                                    Data
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead>
                                <Button
                                    variant="ghost"
                                    size="sm"
                                    className="-ml-3 h-8 font-medium"
                                    onClick={() => handleSort('responsavel')}
                                >
                                    Responsável
                                    <ArrowUpDown className="ml-2 h-3 w-3" />
                                </Button>
                            </TableHead>
                            <TableHead className="w-[50px]"></TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {paginatedOpportunities.length === 0 ? (
                            <TableRow>
                                <TableCell colSpan={6} className="text-center py-12">
                                    <div className="flex flex-col items-center gap-2 text-slate-500">
                                        <Search className="h-8 w-8 opacity-20" />
                                        <p>Nenhuma oportunidade encontrada nesta etapa</p>
                                        {opportunities.length > 0 && <p className="text-xs">Tente ajustar sua busca</p>}
                                    </div>
                                </TableCell>
                            </TableRow>
                        ) : (
                            paginatedOpportunities.map((opp) => (
                                <TableRow
                                    key={opp.id}
                                    className="cursor-pointer hover:bg-slate-50 group"
                                    onClick={() => onSelectOpportunity(opp.id)}
                                >
                                    <TableCell className="font-medium text-slate-900 group-hover:text-primary transition-colors">
                                        {opp.titulo}
                                    </TableCell>
                                    <TableCell>
                                        <div className="flex flex-col">
                                            <span className="text-sm text-slate-700">{opp.contatos?.nome_completo || '-'}</span>
                                            {opp.contatos?.email && (
                                                <span className="text-xs text-slate-400">{opp.contatos.email}</span>
                                            )}
                                        </div>
                                    </TableCell>
                                    <TableCell className="font-mono text-slate-700">
                                        {formatCurrency(opp.valor_proposta)}
                                    </TableCell>
                                    <TableCell className="text-slate-500">
                                        {formatDate(opp.data_criacao)}
                                    </TableCell>
                                    <TableCell>
                                        {opp.responsavel ? (
                                            <div className="flex items-center gap-2">
                                                 {opp.responsavel.avatar_url ? (
                                                    <img 
                                                        src={opp.responsavel.avatar_url} 
                                                        alt={opp.responsavel.nome_completo}
                                                        className="h-5 w-5 rounded-full object-cover"
                                                    />
                                                 ) : (
                                                    <div className="h-5 w-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-500 uppercase">
                                                        {opp.responsavel.nome_completo.substring(0, 2)}
                                                    </div>
                                                 )}
                                                <span className="text-sm text-slate-600">{opp.responsavel.nome_completo}</span>
                                            </div>
                                        ) : (
                                            <span className="text-slate-400">-</span>
                                        )}
                                    </TableCell>
                                    <TableCell>
                                        <ExternalLink className="h-4 w-4 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </div>

            {/* Footer com Paginação */}
            {sortedOpportunities.length > 0 && (
                <div className="border-t bg-slate-50/50 p-4 flex items-center justify-between rounded-b-lg">
                    
                    {/* Items per Page */}
                    <div className="flex items-center gap-2 text-sm text-slate-500 hidden sm:flex">
                        <span>Página {currentPage} de {totalPages}</span>
                        <div className="h-4 w-px bg-slate-200 mx-2" />
                        <span>Itens por página:</span>
                        <Select
                            value={String(pageSize)}
                            onValueChange={(val) => {
                                setPageSize(Number(val));
                                setCurrentPage(1);
                            }}
                        >
                            <SelectTrigger className="h-8 w-[70px]">
                                <SelectValue placeholder={pageSize} />
                            </SelectTrigger>
                            <SelectContent side="top">
                                {[10, 20, 50, 100].map(size => (
                                    <SelectItem key={size} value={String(size)}>
                                        {size}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Totais Mobile */}
                    <div className="sm:hidden text-xs text-slate-500">
                        {sortedOpportunities.length} itens
                    </div>

                    {/* Navigation Buttons */}
                    <div className="flex items-center gap-2">
                         <div className="flex w-[100px] items-center justify-center text-sm font-medium sm:hidden">
                            Pág. {currentPage} de {totalPages}
                        </div>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => setCurrentPage(1)}
                            disabled={currentPage === 1}
                        >
                            <span className="sr-only">Primeira página</span>
                            <ChevronsLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                            disabled={currentPage === 1}
                        >
                            <span className="sr-only">Página anterior</span>
                            <ChevronLeft className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="h-8 w-8 p-0"
                            onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                            disabled={currentPage === totalPages}
                        >
                            <span className="sr-only">Próxima página</span>
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                        <Button
                            variant="outline"
                            className="hidden h-8 w-8 p-0 lg:flex"
                            onClick={() => setCurrentPage(totalPages)}
                            disabled={currentPage === totalPages}
                        >
                            <span className="sr-only">Última página</span>
                            <ChevronsRight className="h-4 w-4" />
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
