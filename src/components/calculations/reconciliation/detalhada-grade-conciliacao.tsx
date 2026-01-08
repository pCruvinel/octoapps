'use client';

import * as React from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    getPaginationRowModel,
    useReactTable,
    type ColumnDef,
    type CellContext,
    type Row,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2, CheckCircle2, Clock, XCircle, RotateCcw, Download, Upload, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { toast } from 'sonner';

// Tipos para a linha de pagamento
export interface PaymentRow {
    n: number;
    vencimento: string;
    valorContrato: number;
    dataPagamentoReal: string;
    valorPagoReal: number;
    amortizacaoExtra: number;
    status: 'PAGO' | 'EM_ABERTO' | 'RENEGOCIADO' | 'ATRASO';
    isEdited: boolean;
    // Campos calculados (readonly) para transparência
    diasAtraso?: number;       // Dias entre vencimento e data de pagamento
    encargosApurados?: number; // Juros + multa calculados pelo sistema
}

interface DetalhadaGradeConciliacaoProps {
    data: PaymentRow[];
    onDataChange: (data: PaymentRow[]) => void;
    onRecalculate?: () => void;
    isLoading?: boolean;
}

// Status com cores e ícones - novo design com 4 ícones clicáveis
const STATUS_CONFIG = {
    PAGO: {
        label: 'Pago',
        color: 'text-emerald-600 dark:text-emerald-400',
        bgColor: 'bg-emerald-100 dark:bg-emerald-900/50',
        rowBg: 'bg-emerald-50/60 dark:bg-emerald-950/30',
        icon: CheckCircle2
    },
    EM_ABERTO: {
        label: 'Em Aberto',
        color: 'text-amber-600 dark:text-amber-400',
        bgColor: 'bg-amber-100 dark:bg-amber-900/50',
        rowBg: 'bg-amber-50/60 dark:bg-amber-950/30',
        icon: Clock
    },
    RENEGOCIADO: {
        label: 'Renegociado',
        color: 'text-purple-600 dark:text-purple-400',
        bgColor: 'bg-purple-100 dark:bg-purple-900/50',
        rowBg: 'bg-purple-50/60 dark:bg-purple-950/30',
        icon: RotateCcw
    },
    ATRASO: {
        label: 'Atraso',
        color: 'text-red-600 dark:text-red-400',
        bgColor: 'bg-red-100 dark:bg-red-900/50',
        rowBg: 'bg-red-50/60 dark:bg-red-950/30',
        icon: XCircle
    },
};



// Formatar moeda
function formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
}

// Formatar data
function formatDate(dateStr: string): string {
    if (!dateStr) return '-';
    const date = new Date(dateStr + 'T00:00:00');
    return date.toLocaleDateString('pt-BR');
}

// Células editáveis - Memoized for performance
const EditableDateCell = React.memo(function EditableDateCell({
    getValue,
    row,
    column,
    table
}: CellContext<PaymentRow, string>) {
    const initialValue = getValue();
    const [value, setValue] = React.useState(initialValue);
    const rowIndex = row.index;
    const columnId = column.id;

    const onBlur = React.useCallback(() => {
        if (value !== initialValue) {
            table.options.meta?.updateData(rowIndex, columnId, value);
        }
    }, [value, initialValue, table.options.meta, rowIndex, columnId]);

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <Input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlur}
            className="h-8 text-sm"
        />
    );
});

const EditableCurrencyCell = React.memo(function EditableCurrencyCell({
    getValue,
    row,
    column,
    table
}: CellContext<PaymentRow, number>) {
    const initialValue = getValue();
    const lastCommittedValue = React.useRef(initialValue);
    const rowIndex = row.index;
    const columnId = column.id;

    // Sync ref when table data changes
    React.useEffect(() => {
        lastCommittedValue.current = initialValue;
    }, [initialValue]);

    const handleChange = React.useCallback((newValue: number | undefined) => {
        const val = newValue ?? 0;
        // Only update if value actually changed
        if (val !== lastCommittedValue.current) {
            lastCommittedValue.current = val;
            table.options.meta?.updateData(rowIndex, columnId, val);
        }
    }, [table.options.meta, rowIndex, columnId]);

    return (
        <CurrencyInput
            value={initialValue}
            onChange={handleChange}
            className="h-8 text-sm"
        />
    );
});

// Novo seletor de status com 4 ícones clicáveis
const IconStatusSelector = React.memo(function IconStatusSelector({
    getValue,
    row,
    table
}: CellContext<PaymentRow, PaymentRow['status']>) {
    const value = getValue();
    const rowIndex = row.index;

    const handleChange = React.useCallback((newValue: PaymentRow['status']) => {
        table.options.meta?.updateData(rowIndex, 'status', newValue);
    }, [table.options.meta, rowIndex]);

    return (
        <div className="flex items-center gap-1">
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
                const isActive = value === key;
                const Icon = config.icon;

                return (
                    <button
                        key={key}
                        type="button"
                        onClick={() => handleChange(key as PaymentRow['status'])}
                        className={cn(
                            'p-1.5 rounded-md transition-all duration-150',
                            isActive
                                ? `${config.bgColor} ${config.color} ring-2 ring-current ring-offset-1`
                                : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-slate-800'
                        )}
                        title={config.label}
                    >
                        <Icon className="h-4 w-4" />
                    </button>
                );
            })}
        </div>
    );
});

// Column helper
const columnHelper = createColumnHelper<PaymentRow>();

// Definição das colunas
const columns = [
    columnHelper.display({
        id: 'select',
        header: ({ table }) => (
            <div className="flex items-center justify-center">
                <Checkbox
                    checked={table.getIsAllRowsSelected()}
                    onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
                    aria-label="Selecionar tudo"
                />
            </div>
        ),
        cell: ({ row, table }) => (
            <div
                className="flex items-center justify-center w-full h-full cursor-pointer py-1"
                onClick={(e) => {
                    e.stopPropagation();
                    table.options.meta?.handleRowClick(row, e);
                }}
                onPointerDown={(e) => {
                    // Only start drag on primary button
                    if (e.button === 0) {
                        e.preventDefault();
                        table.options.meta?.handleDragStart(row);
                    }
                }}
                onPointerEnter={() => {
                    table.options.meta?.handleDragEnter(row);
                }}
            >
                <Checkbox
                    checked={row.getIsSelected()}
                    className="pointer-events-none"
                    aria-label="Selecionar linha"
                />
            </div>
        ),
        size: 40,
    }),
    columnHelper.accessor('n', {
        header: 'Nº',
        cell: (info) => (
            <span className="font-mono text-sm text-slate-500">{info.getValue()}</span>
        ),
        size: 50,
    }),
    columnHelper.accessor('vencimento', {
        header: 'Vencimento',
        cell: (info) => (
            <span className="text-sm text-slate-600 dark:text-slate-400">{formatDate(info.getValue())}</span>
        ),
        size: 100,
    }),
    columnHelper.accessor('valorContrato', {
        header: 'Parcela (Contrato)',
        cell: (info) => (
            <span className="font-mono text-sm text-slate-600 dark:text-slate-400">{formatCurrency(info.getValue())}</span>
        ),
        size: 130,
    }),
    columnHelper.accessor('dataPagamentoReal', {
        header: 'Data Pgto Real',
        cell: EditableDateCell,
        size: 140,
    }),
    // Coluna calculada: Dias de Atraso (readonly) - calculado dinamicamente
    columnHelper.display({
        id: 'diasAtraso',
        header: 'Dias Atraso',
        cell: ({ row }) => {
            const venc = row.original.vencimento;
            const pgto = row.original.dataPagamentoReal;
            if (!venc || !pgto) return <span className="text-sm text-slate-400">-</span>;

            const vencDate = new Date(venc);
            const pgtoDate = new Date(pgto);
            const dias = Math.floor((pgtoDate.getTime() - vencDate.getTime()) / (1000 * 60 * 60 * 24));

            if (dias <= 0) return <span className="text-sm text-slate-400">-</span>;

            return (
                <span className={`font-mono text-sm ${dias > 30 ? 'text-red-600 font-medium' : 'text-amber-600'}`}>
                    {dias}d
                </span>
            );
        },
        size: 80,
    }),
    // Coluna calculada: Encargos Apurados (readonly) - calculado dinamicamente
    columnHelper.display({
        id: 'encargosApurados',
        header: 'Juros/Multa',
        cell: ({ row }) => {
            const venc = row.original.vencimento;
            const pgto = row.original.dataPagamentoReal;
            const valorContrato = row.original.valorContrato;

            if (!venc || !pgto || !valorContrato) return <span className="text-sm text-slate-400">-</span>;

            const vencDate = new Date(venc);
            const pgtoDate = new Date(pgto);
            const dias = Math.floor((pgtoDate.getTime() - vencDate.getTime()) / (1000 * 60 * 60 * 24));

            if (dias <= 0) return <span className="text-sm text-slate-400">-</span>;

            // Cálculo: 1% a.m. pro-rata + 2% multa fixa
            const jurosMora = valorContrato * (1 / 100) * (dias / 30);
            const multa = valorContrato * (2 / 100);
            const total = jurosMora + multa;

            return (
                <span className="font-mono text-sm text-orange-600">
                    {formatCurrency(total)}
                </span>
            );
        },
        size: 100,
    }),
    columnHelper.accessor('valorPagoReal', {
        header: 'Valor Pago Real',
        cell: EditableCurrencyCell,
        size: 160,
    }),
    columnHelper.accessor('amortizacaoExtra', {
        header: 'Amort. Extra',
        cell: EditableCurrencyCell,
        size: 140,
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: IconStatusSelector,
        size: 160,
    }),
];

// Extensão do meta type para TanStack Table
declare module '@tanstack/react-table' {
    interface TableMeta<TData> {
        updateData: (rowIndex: number, columnId: string, value: unknown) => void;
        handleRowClick: (row: Row<TData>, event: React.MouseEvent) => void;
        handleDragStart: (row: Row<TData>) => void;
        handleDragEnter: (row: Row<TData>) => void;
    }
}

export function DetalhadaGradeConciliacao({
    data,
    onDataChange,
    onRecalculate,
    isLoading = false,
}: DetalhadaGradeConciliacaoProps) {
    const [rowSelection, setRowSelection] = React.useState({});
    const lastSelectedId = React.useRef<string | null>(null);
    const isDragging = React.useRef(false);
    const dragTargetState = React.useRef(false);

    React.useEffect(() => {
        const handleMouseUp = () => {
            isDragging.current = false;
        };
        window.addEventListener('mouseup', handleMouseUp);
        return () => window.removeEventListener('mouseup', handleMouseUp);
    }, []);

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        getPaginationRowModel: getPaginationRowModel(),
        onRowSelectionChange: setRowSelection,
        initialState: {
            pagination: {
                pageSize: 30,
            },
        },
        state: {
            rowSelection,
        },
        meta: {
            updateData: (rowIndex: number, columnId: string, value: unknown) => {
                const newData = data.map((row, index) => {
                    if (index === rowIndex) {
                        return {
                            ...row,
                            [columnId]: value,
                            isEdited: true,
                        };
                    }
                    return row;
                });
                onDataChange(newData);

                // NOTE: Removed automatic recalculation
                // User must explicitly click "Gerar Resultado" button
            },
            handleRowClick: (row, event) => {
                const isSelected = row.getIsSelected();
                const targetState = !isSelected;

                if (event.shiftKey && lastSelectedId.current !== null) {
                    const start = Math.min(Number(lastSelectedId.current), row.index);
                    const end = Math.max(Number(lastSelectedId.current), row.index);

                    const newSelection = { ...rowSelection };
                    for (let i = start; i <= end; i++) {
                        // @ts-ignore
                        newSelection[i] = targetState; // Use target state of the clicked row
                    }
                    setRowSelection(newSelection);
                } else {
                    row.toggleSelected(targetState);
                    lastSelectedId.current = String(row.index);
                }
            },
            handleDragStart: (row) => {
                isDragging.current = true;
                const targetState = !row.getIsSelected();
                dragTargetState.current = targetState;
                row.toggleSelected(targetState);
                lastSelectedId.current = String(row.index);
            },
            handleDragEnter: (row) => {
                if (isDragging.current) {
                    const currentState = row.getIsSelected();
                    if (currentState !== dragTargetState.current) {
                        row.toggleSelected(dragTargetState.current);
                        lastSelectedId.current = String(row.index);
                    }
                }
            }
        },
    });

    const selectedCount = Object.keys(rowSelection).length;

    // Bulk actions
    const handleBulkSetStatus = (status: PaymentRow['status']) => {
        const selectedIndices = Object.keys(rowSelection).map(Number);
        const newData = data.map((row, index) => {
            if (selectedIndices.includes(index)) {
                return { ...row, status, isEdited: true };
            }
            return row;
        });
        onDataChange(newData);
        setRowSelection({});
        toast.success(`${selectedIndices.length} parcelas atualizadas`);
    };

    const handleResetEdits = () => {
        const newData = data.map(row => ({
            ...row,
            dataPagamentoReal: row.vencimento,
            valorPagoReal: row.valorContrato,
            amortizacaoExtra: 0,
            isEdited: false,
        }));
        onDataChange(newData);
        toast.success('Edições resetadas');
    };

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <div>
                        <CardTitle className="flex items-center gap-2">
                            Editor de Conciliação
                            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                        </CardTitle>
                        <CardDescription>
                            Edite as parcelas para refletir os pagamentos reais do cliente
                        </CardDescription>
                    </div>

                    <div className="flex items-center gap-2">
                        <Button variant="outline" size="sm" onClick={handleResetEdits}>
                            <RotateCcw className="h-4 w-4 mr-1" />
                            Resetar
                        </Button>
                    </div>
                </div>

                {/* Bulk Actions */}
                {selectedCount > 0 && (
                    <div className="flex items-center gap-3 mt-4 p-3 bg-blue-50 dark:bg-blue-950 rounded-lg">
                        <span className="text-sm text-blue-700 dark:text-blue-300">
                            {selectedCount} parcela(s) selecionada(s)
                        </span>
                        <div className="flex gap-2">
                            <Button size="sm" variant="secondary" onClick={() => handleBulkSetStatus('PAGO')}>
                                Marcar como Pago
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleBulkSetStatus('EM_ABERTO')}>
                                Marcar como Em Aberto
                            </Button>
                            <Button size="sm" variant="secondary" onClick={() => handleBulkSetStatus('ATRASO')}>
                                Marcar como Atraso
                            </Button>
                        </div>
                    </div>
                )}
            </CardHeader>

            <CardContent className="p-0">
                <div className="overflow-x-auto">
                    <table className="w-full border-collapse">
                        <thead>
                            {table.getHeaderGroups().map((headerGroup) => (
                                <tr key={headerGroup.id} className="border-b bg-slate-50 dark:bg-slate-800">
                                    {headerGroup.headers.map((header) => (
                                        <th
                                            key={header.id}
                                            className="px-3 py-2 text-left text-xs font-medium text-slate-500 uppercase tracking-wider"
                                            style={{ width: header.getSize() }}
                                        >
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(header.column.columnDef.header, header.getContext())}
                                        </th>
                                    ))}
                                </tr>
                            ))}
                        </thead>
                        <tbody>
                            {table.getRowModel().rows.map((row) => (
                                <tr
                                    key={row.id}
                                    className={cn(
                                        'border-b transition-colors',
                                        // Aplicar cor de fundo suave baseada no status
                                        STATUS_CONFIG[row.original.status]?.rowBg || 'bg-white dark:bg-slate-900',
                                        'hover:brightness-[0.97] dark:hover:brightness-110',
                                        row.original.isEdited && 'border-l-2 border-l-amber-500', // Edited indicator
                                        row.getIsSelected() && 'ring-2 ring-inset ring-blue-500' // Selection indicator
                                    )}
                                >
                                    {row.getVisibleCells().map((cell) => (
                                        <td key={cell.id} className="px-3 py-2">
                                            {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Footer com resumo e paginação */}
                <div className="border-t p-4 bg-slate-50 dark:bg-slate-800/50">
                    <div className="flex flex-col gap-4">
                        {/* Resumo */}
                        <div className="flex items-center justify-between text-sm">
                            <div className="flex items-center gap-6">
                                <div>
                                    <span className="text-slate-500">Total Parcelas:</span>{' '}
                                    <span className="font-medium">{data.length}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Editadas:</span>{' '}
                                    <span className="font-medium text-amber-600">{data.filter(r => r.isEdited).length}</span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Pagas:</span>{' '}
                                    <span className="font-medium text-emerald-600">{data.filter(r => r.status === 'PAGO').length}</span>
                                </div>
                            </div>
                            <div className="flex items-center gap-4">
                                <div>
                                    <span className="text-slate-500">Total Contrato:</span>{' '}
                                    <span className="font-mono font-medium">
                                        {formatCurrency(data.reduce((sum, r) => sum + (r.valorContrato || 0), 0))}
                                    </span>
                                </div>
                                <div>
                                    <span className="text-slate-500">Total Pago Real:</span>{' '}
                                    <span className="font-mono font-medium text-blue-600">
                                        {formatCurrency(data.filter(r => r.status === 'PAGO').reduce((sum, r) => sum + (r.valorPagoReal || 0), 0))}
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Paginação */}
                        <div className="flex items-center justify-between">
                            <span className="text-sm text-slate-500">
                                Página {table.getState().pagination.pageIndex + 1} de{' '}
                                {table.getPageCount()} ({data.length} parcelas)
                            </span>
                            <div className="flex items-center gap-1">
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => table.setPageIndex(0)}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <ChevronsLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => table.previousPage()}
                                    disabled={!table.getCanPreviousPage()}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => table.nextPage()}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <ChevronRight className="h-4 w-4" />
                                </Button>
                                <Button
                                    variant="outline"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => table.setPageIndex(table.getPageCount() - 1)}
                                    disabled={!table.getCanNextPage()}
                                >
                                    <ChevronsRight className="h-4 w-4" />
                                </Button>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
