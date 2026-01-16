import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import { CalendarIcon, ChevronDown, X } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { useProducts, ProductService } from '@/hooks/useProducts';
import { DateRange } from 'react-day-picker';
import { ScrollArea } from '@/components/ui/scroll-area';

export interface KanbanFilters {
    dateRange?: DateRange;
    productIds?: string[];
    responsibleIds?: string[];
}

interface KanbanFiltersBarProps {
    filters: KanbanFilters;
    onFiltersChange: (filters: KanbanFilters) => void;
    responsibles?: Array<{ id: string; nome_completo: string }>;
}

/**
 * Barra de filtros avançados para o Kanban CRM
 * Permite filtrar por: 
 * - Período (Data)
 * - Produto/Serviço (Multi-select)
 * - Responsável (Multi-select)
 */
export function KanbanFiltersBar({ 
    filters, 
    onFiltersChange,
    responsibles = []
}: KanbanFiltersBarProps) {
    const { activeProducts, loading: loadingProducts } = useProducts();
    const [dateOpen, setDateOpen] = useState(false);
    const [productOpen, setProductOpen] = useState(false);
    const [responsibleOpen, setResponsibleOpen] = useState(false);

    const hasActiveFilters = filters.dateRange || 
        (filters.productIds && filters.productIds.length > 0) || 
        (filters.responsibleIds && filters.responsibleIds.length > 0);

    const handleProductToggle = (productId: string) => {
        const currentIds = filters.productIds || [];
        const newIds = currentIds.includes(productId)
            ? currentIds.filter(id => id !== productId)
            : [...currentIds, productId];
        
        onFiltersChange({
            ...filters,
            productIds: newIds.length > 0 ? newIds : undefined
        });
    };

    const handleResponsibleToggle = (responsibleId: string) => {
        const currentIds = filters.responsibleIds || [];
        const newIds = currentIds.includes(responsibleId)
            ? currentIds.filter(id => id !== responsibleId)
            : [...currentIds, responsibleId];
        
        onFiltersChange({
            ...filters,
            responsibleIds: newIds.length > 0 ? newIds : undefined
        });
    };

    const handleDateSelect = (range: DateRange | undefined) => {
        onFiltersChange({
            ...filters,
            dateRange: range
        });
    };

    const clearFilters = () => {
        onFiltersChange({});
    };

    const formatDateRange = () => {
        if (!filters.dateRange?.from) return 'Período';
        if (!filters.dateRange.to) {
            return format(filters.dateRange.from, 'dd/MM/yyyy', { locale: ptBR });
        }
        return `${format(filters.dateRange.from, 'dd/MM', { locale: ptBR })} - ${format(filters.dateRange.to, 'dd/MM', { locale: ptBR })}`;
    };

    const getProductLabel = () => {
        const count = filters.productIds?.length || 0;
        if (count === 0) return 'Serviços';
        if (count === 1) {
            const product = activeProducts.find(p => p.id === filters.productIds?.[0]);
            return product?.name || 'Serviços';
        }
        return `${count} serviços`;
    };

    const getResponsibleLabel = () => {
        const count = filters.responsibleIds?.length || 0;
        if (count === 0) return 'Responsável';
        if (count === 1) {
            const user = responsibles.find(r => r.id === filters.responsibleIds?.[0]);
            return user?.nome_completo || 'Responsável';
        }
        return `${count} responsáveis`;
    };

    return (
        <div className="flex items-center gap-2">

            {/* Date Range Filter */}
            <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 gap-2 bg-white dark:bg-gray-800 text-sm font-normal border-gray-200 shadow-sm hover:bg-gray-50",
                            filters.dateRange && "border-indigo-500 text-indigo-600 bg-indigo-50 hover:bg-indigo-50 hover:text-indigo-700"
                        )}
                    >
                        <CalendarIcon className="w-4 h-4 opacity-70" />
                        {formatDateRange()}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar
                        initialFocus
                        mode="range"
                        defaultMonth={filters.dateRange?.from}
                        selected={filters.dateRange}
                        onSelect={handleDateSelect}
                        numberOfMonths={2}
                        locale={ptBR}
                    />
                </PopoverContent>
            </Popover>

            {/* Product Multi-Select Filter */}
            <Popover open={productOpen} onOpenChange={setProductOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 gap-2 min-w-[140px] justify-between bg-white dark:bg-gray-800 text-sm font-normal border-gray-200 shadow-sm hover:bg-gray-50",
                            filters.productIds && filters.productIds.length > 0 && "border-indigo-500 text-indigo-600 bg-indigo-50 hover:bg-indigo-50 hover:text-indigo-700"
                        )}
                    >
                        <span className="truncate">{getProductLabel()}</span>
                        <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                    <div className="p-2 border-b">
                        <p className="text-xs text-gray-500 font-medium">Selecione os serviços</p>
                    </div>
                    <ScrollArea className="h-[200px]">
                        <div className="p-2 space-y-1">
                            {loadingProducts ? (
                                <p className="text-sm text-gray-500 p-2">Carregando...</p>
                            ) : activeProducts.length === 0 ? (
                                <p className="text-sm text-gray-500 p-2">Nenhum serviço cadastrado</p>
                            ) : (
                                activeProducts.map((product: ProductService) => (
                                    <label
                                        key={product.id}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm"
                                    >
                                        <Checkbox
                                            checked={filters.productIds?.includes(product.id) || false}
                                            onCheckedChange={() => handleProductToggle(product.id)}
                                        />
                                        <span className="truncate">{product.name}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                    {filters.productIds && filters.productIds.length > 0 && (
                        <div className="p-2 border-t">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-8 text-xs text-gray-500 hover:text-red-500"
                                onClick={() => onFiltersChange({ ...filters, productIds: undefined })}
                            >
                                Limpar seleção
                            </Button>
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            {/* Responsible Multi-Select Filter */}
            <Popover open={responsibleOpen} onOpenChange={setResponsibleOpen}>
                <PopoverTrigger asChild>
                    <Button
                        variant="outline"
                        size="sm"
                        className={cn(
                            "h-9 gap-2 min-w-[140px] justify-between bg-white dark:bg-gray-800 text-sm font-normal border-gray-200 shadow-sm hover:bg-gray-50",
                            filters.responsibleIds && filters.responsibleIds.length > 0 && "border-indigo-500 text-indigo-600 bg-indigo-50 hover:bg-indigo-50 hover:text-indigo-700"
                        )}
                    >
                        <span className="truncate">{getResponsibleLabel()}</span>
                        <ChevronDown className="w-4 h-4 opacity-50 shrink-0" />
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-[220px] p-0" align="start">
                    <div className="p-2 border-b">
                        <p className="text-xs text-gray-500 font-medium">Selecione os responsáveis</p>
                    </div>
                    <ScrollArea className="h-[200px]">
                        <div className="p-2 space-y-1">
                            {responsibles.length === 0 ? (
                                <p className="text-sm text-gray-500 p-2">Nenhum responsável</p>
                            ) : (
                                responsibles.map((user) => (
                                    <label
                                        key={user.id}
                                        className="flex items-center gap-2 p-2 rounded-md hover:bg-gray-100 cursor-pointer text-sm"
                                    >
                                        <Checkbox
                                            checked={filters.responsibleIds?.includes(user.id) || false}
                                            onCheckedChange={() => handleResponsibleToggle(user.id)}
                                        />
                                        <span className="truncate">{user.nome_completo}</span>
                                    </label>
                                ))
                            )}
                        </div>
                    </ScrollArea>
                    {filters.responsibleIds && filters.responsibleIds.length > 0 && (
                        <div className="p-2 border-t">
                            <Button
                                variant="ghost"
                                size="sm"
                                className="w-full h-8 text-xs text-gray-500 hover:text-red-500"
                                onClick={() => onFiltersChange({ ...filters, responsibleIds: undefined })}
                            >
                                Limpar seleção
                            </Button>
                        </div>
                    )}
                </PopoverContent>
            </Popover>

            {/* Clear All Filters */}
            {hasActiveFilters && (
                <Button
                    variant="ghost"
                    size="icon"
                    onClick={clearFilters}
                    className="h-9 w-9 text-gray-400 hover:text-red-500 hover:bg-red-50"
                    title="Limpar todos os filtros"
                >
                    <X className="w-4 h-4" />
                </Button>
            )}
        </div>
    );
}
