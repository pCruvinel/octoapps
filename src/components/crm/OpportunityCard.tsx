import { useState, useEffect } from 'react';
import { MoreVertical, Calendar, DollarSign, User, MessageSquare, Paperclip, Archive, Trash2, Package } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { Opportunity } from '@/types/opportunity';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';

export interface OpportunityCardProps {
    opportunity: Opportunity;
    onNavigate: (route: string, id: string) => void;
    onEdit: (id: string) => void;
    onDelete: (id: string) => void;
    onArchive?: (id: string) => void;
    canUpdate: boolean;
    canDelete: boolean;
    commentCount?: number;
    attachmentCount?: number;
}

// Storage key for field configuration (must match OpportunityFieldsManager)
const STORAGE_KEY = 'octoapps_opportunity_card_fields';

interface FieldConfig {
    id: string;
    enabled: boolean;
}

// Get field visibility from localStorage
const getFieldVisibility = (): Record<string, boolean> => {
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            const fields: FieldConfig[] = JSON.parse(saved);
            return fields.reduce((acc, f) => ({ ...acc, [f.id]: f.enabled }), {});
        }
    } catch (e) {
        console.warn('Error loading field config:', e);
    }
    // Default visibility
    return {
        contato: true,
        valor_proposta: true, // Honorários
        valor_causa: true, // Dívida
        produto_servico: true,
        tipo_acao: false, // Legado, padrão false
        data_criacao: true,
        responsavel: true,
        origem: false,
        comentarios_count: true,
        anexos_count: true,
    };
};

export function OpportunityCard({ opportunity, onNavigate, onEdit, onDelete, onArchive, canUpdate, canDelete, commentCount = 0, attachmentCount = 0 }: OpportunityCardProps) {
    const [fieldVisibility, setFieldVisibility] = useState<Record<string, boolean>>(getFieldVisibility);

    // Listen for storage changes to update visibility in real-time
    useEffect(() => {
        const handleStorageChange = () => {
            setFieldVisibility(getFieldVisibility());
        };

        window.addEventListener('storage', handleStorageChange);
        // Also listen for focus to detect same-tab changes
        window.addEventListener('focus', handleStorageChange);

        return () => {
            window.removeEventListener('storage', handleStorageChange);
            window.removeEventListener('focus', handleStorageChange);
        };
    }, []);

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

    return (
        <div
            className="bg-white dark:bg-gray-800 p-4 rounded-xl border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all cursor-pointer relative group flex flex-col gap-3"
            onClick={() => onNavigate('opportunity-details', opportunity.id)}
        >
            {/* Header: Product & Operation Type */}
            <div className="flex flex-col gap-1 pr-6">
                {fieldVisibility.produto_servico && opportunity.produto_servico && (
                    <Badge variant="secondary" className="text-[10px] font-medium bg-indigo-50 text-indigo-700 hover:bg-indigo-100 w-fit">
                        {opportunity.produto_servico.name}
                    </Badge>
                )}
                {fieldVisibility.tipo_acao && opportunity.tipo_acao && (
                    <Badge variant="outline" className="text-[10px] font-normal text-gray-500 border-gray-200 w-fit">
                        {opportunity.tipo_acao}
                    </Badge>
                )}
            </div>

            {/* Actions Menu - Absolute & Hover only */}
            <div 
                onClick={(e) => e.stopPropagation()} 
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10"
            >
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors bg-white/50 backdrop-blur-sm dark:bg-gray-800/50">
                            <MoreVertical className="w-4 h-4" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                        <DropdownMenuItem 
                            onClick={() => onArchive?.(opportunity.id)}
                            className="text-gray-600 dark:text-gray-400 gap-2 cursor-pointer"
                        >
                            <Archive className="w-4 h-4" />
                            Arquivar
                        </DropdownMenuItem>
                        {canDelete && (
                            <DropdownMenuItem
                                className="text-red-600 dark:text-red-400 gap-2 cursor-pointer"
                                onClick={() => onDelete(opportunity.id)}
                            >
                                <Trash2 className="w-4 h-4" />
                                Excluir
                            </DropdownMenuItem>
                        )}
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Center: Details */}
            <div className="space-y-2">
                {/* Contact */}
                {fieldVisibility.contato && (
                    <div className="flex items-center gap-2 text-gray-900 dark:text-gray-100">
                        <User className="w-4 h-4 text-gray-500" />
                        <span className="font-medium truncate text-sm">
                            {opportunity.contatos?.nome_completo || 'Sem contato'}
                        </span>
                    </div>
                )}

                {/* Values */}
                {(fieldVisibility.valor_proposta || fieldVisibility.valor_causa) && (
                    <div className="flex items-center gap-2">
                        <DollarSign className="w-4 h-4 text-gray-500" />
                        <div className="flex flex-col">
                            {/* Valor Proposta (Honorários) */}
                            {fieldVisibility.valor_proposta && (
                                <span className="font-semibold text-emerald-600 dark:text-emerald-400 text-sm">
                                    {formatCurrency(opportunity.valor_proposta ?? opportunity.valor_estimado)}
                                </span>
                            )}
                            {/* Valor Causa (Dívida) */}
                            {fieldVisibility.valor_causa && opportunity.valor_causa && opportunity.valor_causa > 0 && (
                                <span className="text-xs text-gray-400" title="Valor da dívida">
                                    Dívida: {formatCurrency(opportunity.valor_causa)}
                                </span>
                            )}
                        </div>
                    </div>
                )}

                {/* Date */}
                {fieldVisibility.data_criacao && (
                    <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 text-xs">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>Criado em {formatDate(opportunity.data_criacao)}</span>
                    </div>
                )}
            </div>

            {/* Footer: Responsible & Stats */}
            <div className="pt-3 mt-1 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                {/* Responsible */}
                {fieldVisibility.responsavel && (
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
                )}
                {!fieldVisibility.responsavel && <div />}

                {/* Stats Icons */}
                <div className="flex items-center gap-3 text-gray-400">
                    {fieldVisibility.comentarios_count && (
                        <div className="flex items-center gap-1" title="Comentários">
                            <MessageSquare className="w-3.5 h-3.5" />
                            <span className="text-xs">{commentCount}</span>
                        </div>
                    )}
                    {fieldVisibility.anexos_count && (
                        <div className="flex items-center gap-1" title="Arquivos">
                            <Paperclip className="w-3.5 h-3.5" />
                            <span className="text-xs">{attachmentCount}</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
