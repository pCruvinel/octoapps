
import { MoreVertical, Calendar, DollarSign, User, MessageSquare, Paperclip } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { Opportunity } from '@/types/opportunity';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export interface OpportunityCardProps {
    opportunity: Opportunity;
    onNavigate: (route: string, id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    canUpdate: boolean;
    canDelete: boolean;
}

export function OpportunityCard({ opportunity, onNavigate, onEdit, onDelete, canUpdate, canDelete }: OpportunityCardProps) {
    const formatCurrency = (value: number | null | undefined) => {
        if (!value) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL'
        }).format(value);
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('pt-BR');
    };

    // Helper to get initials
    const getInitials = (name: string) => {
        return name
            .split(' ')
            .map(n => n[0])
            .slice(0, 2)
            .join('')
            .toUpperCase();
    };

    // Placeholder for operation name logic (can be refined if we have a robust map)
    const getOperationLabel = (code: string | null | undefined) => {
        if (!code) return 'Sem Operação';
        // Simple mapping or just displaying the code nicely if it's readable
        // Ideal: Use useTiposOperacao hook to get label, but that's async/hook based.
        // Fallback: Display as is or mapping common ones if possible.
        // For now, let's display nicely formatted or check if it matches our options
        // Since we stored the code, we might want to map it back if we have the list.
        // Assuming we store readable string or code. If code, it might look like '20749'.
        // If the user selected from the new Select, they selected a CODE.
        // So we might see '20749'. We might want to Map this in frontend or store label in DB.
        // Given current constraints, I'll attempt to show a generic label or the code.
        return code;
    };

    return (
        <div
            className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer relative group flex flex-col gap-3"
            onClick={() => onNavigate('opportunity-details', opportunity.id)}
        >
            {/* Header: Operation Type */}
            <div className="flex items-start justify-between">
                <Badge variant="outline" className="text-xs font-semibold bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100">
                    {opportunity.tipo_acao || 'Geral'}
                </Badge>

                <div onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                                <MoreVertical className="w-4 h-4" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => onNavigate('opportunity-details', opportunity.id)}>
                                Visualizar
                            </DropdownMenuItem>
                            {canUpdate && (
                                <DropdownMenuItem onClick={() => onEdit(opportunity.id)}>
                                    Editar
                                </DropdownMenuItem>
                            )}
                            {canDelete && (
                                <DropdownMenuItem
                                    className="text-red-600 dark:text-red-400"
                                    onClick={() => onDelete(opportunity.id)}
                                >
                                    Excluir
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Center: Details */}
            <div className="space-y-2">
                {/* Contact */}
                <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                    <User className="w-4 h-4 text-gray-500" />
                    <span className="font-medium truncate text-sm">
                        {opportunity.contatos?.nome_completo || 'Sem contato'}
                    </span>
                </div>

                {/* Value */}
                <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-gray-500" />
                    <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                        {formatCurrency(opportunity.valor_estimado)}
                    </span>
                </div>

                {/* Date */}
                <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>Criado em {formatDate(opportunity.data_criacao)}</span>
                </div>
            </div>

            {/* Footer: Responsible & Stats */}
            <div className="pt-3 mt-1 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                {/* Responsible */}
                <div className="flex items-center gap-2" title={`Responsável: ${opportunity.responsavel?.nome_completo || 'N/A'}`}>
                    <Avatar className="h-6 w-6">
                        <AvatarImage src={opportunity.responsavel?.avatar_url || ''} />
                        <AvatarFallback className="text-[10px] bg-indigo-100 text-indigo-700">
                            {opportunity.responsavel?.nome_completo ? getInitials(opportunity.responsavel.nome_completo) : 'N/A'}
                        </AvatarFallback>
                    </Avatar>
                    <span className="text-xs text-slate-500 truncate max-w-[80px]">
                        {opportunity.responsavel?.nome_completo?.split(' ')[0]}
                    </span>
                </div>

                {/* Stats Icons */}
                <div className="flex items-center gap-3 text-gray-400">
                    <div className="flex items-center gap-1" title="Comentários">
                        <MessageSquare className="w-3.5 h-3.5" />
                        <span className="text-xs">0</span>
                    </div>
                    <div className="flex items-center gap-1" title="Arquivos">
                        <Paperclip className="w-3.5 h-3.5" />
                        <span className="text-xs">0</span>
                    </div>
                </div>
            </div>
        </div>
    );
}
