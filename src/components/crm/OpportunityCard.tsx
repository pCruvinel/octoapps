
import { MoreVertical, Calendar, DollarSign, User } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { Opportunity } from '@/types/opportunity';

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

    return (
        <div
            className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow cursor-pointer relative group"
            onClick={() => onNavigate('opportunity-details', opportunity.id)}
        >
            <div className="flex items-start justify-between mb-3">
                <h4
                    className="text-sm text-gray-900 dark:text-white cursor-pointer hover:text-blue-600 dark:hover:text-blue-400"
                >
                    {opportunity.titulo}
                </h4>
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

            <div className="space-y-2 text-xs">
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <User className="w-3 h-3" />
                    <span>{opportunity.contatos?.nome_completo || 'Sem contato'}</span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <DollarSign className="w-3 h-3" />
                    <span className="text-green-600 dark:text-green-400">
                        {formatCurrency(opportunity.valor_estimado)}
                    </span>
                </div>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                    <Calendar className="w-3 h-3" />
                    <span>{formatDate(opportunity.data_criacao)}</span>
                </div>
            </div>

            <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
                <Badge variant="secondary" className="text-xs">
                    {opportunity.tipo_acao || 'Sem tipo'}
                </Badge>
            </div>
        </div>
    );
}
