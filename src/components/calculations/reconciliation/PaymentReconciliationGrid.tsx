'use client';

import * as React from 'react';
import {
    createColumnHelper,
    flexRender,
    getCoreRowModel,
    useReactTable,
    type ColumnDef,
    type CellContext,
} from '@tanstack/react-table';
import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Loader2, CheckCircle2, Clock, XCircle, RotateCcw, Download, Upload } from 'lucide-react';
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
}

interface PaymentReconciliationGridProps {
    data: PaymentRow[];
    onDataChange: (data: PaymentRow[]) => void;
    onRecalculate?: () => void;
    isLoading?: boolean;
}

// Status com cores e ícones
const STATUS_CONFIG = {
    PAGO: { label: 'Pago', color: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900 dark:text-emerald-300', icon: CheckCircle2 },
    EM_ABERTO: { label: 'Em Aberto', color: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300', icon: Clock },
    RENEGOCIADO: { label: 'Renegociado', color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300', icon: RotateCcw },
    ATRASO: { label: 'Atraso', color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: XCircle },
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

// Células editáveis
function EditableDateCell({ getValue, row, column, table }: CellContext<PaymentRow, string>) {
    const initialValue = getValue();
    const [value, setValue] = React.useState(initialValue);

    const onBlur = () => {
        if (value !== initialValue) {
            table.options.meta?.updateData(row.index, column.id, value);
        }
    };

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <Input
            type="date"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onBlur={onBlur}
            className={cn(
                'h-8 text-sm',
                row.original.isEdited && column.id === 'dataPagamentoReal' && 'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
            )}
        />
    );
}

function EditableCurrencyCell({ getValue, row, column, table }: CellContext<PaymentRow, number>) {
    const initialValue = getValue();
    const [value, setValue] = React.useState(initialValue);

    const onBlur = () => {
        if (value !== initialValue) {
            table.options.meta?.updateData(row.index, column.id, value);
        }
    };

    React.useEffect(() => {
        setValue(initialValue);
    }, [initialValue]);

    return (
        <CurrencyInput
            value={value}
            onChange={(v) => setValue(v || 0)}
            onBlur={onBlur}
            className={cn(
                'h-8 text-sm',
                row.original.isEdited && (column.id === 'valorPagoReal' || column.id === 'amortizacaoExtra') &&
                'bg-amber-50 border-amber-200 dark:bg-amber-950 dark:border-amber-800'
            )}
        />
    );
}

function EditableStatusCell({ getValue, row, table }: CellContext<PaymentRow, PaymentRow['status']>) {
    const value = getValue();

    const handleChange = (newValue: PaymentRow['status']) => {
        table.options.meta?.updateData(row.index, 'status', newValue);
    };

    return (
        <Select value={value} onValueChange={handleChange}>
            <SelectTrigger className="h-8 text-xs w-[120px]">
                <SelectValue />
            </SelectTrigger>
            <SelectContent>
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                    <SelectItem key={key} value={key}>
                        <div className="flex items-center gap-2">
                            <config.icon className="h-3 w-3" />
                            {config.label}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}

// Column helper
const columnHelper = createColumnHelper<PaymentRow>();

// Definição das colunas
const columns = [
    columnHelper.display({
        id: 'select',
        header: ({ table }) => (
            <Checkbox
                checked={table.getIsAllRowsSelected()}
                onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
                aria-label="Selecionar tudo"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Selecionar linha"
            />
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
    columnHelper.accessor('valorPagoReal', {
        header: 'Valor Pago Real',
        cell: EditableCurrencyCell,
        size: 140,
    }),
    columnHelper.accessor('amortizacaoExtra', {
        header: 'Amort. Extra',
        cell: EditableCurrencyCell,
        size: 120,
    }),
    columnHelper.accessor('status', {
        header: 'Status',
        cell: EditableStatusCell,
        size: 130,
    }),
    columnHelper.display({
        id: 'edited',
        header: '',
        cell: ({ row }) => (
            row.original.isEdited ? (
                <Badge variant="outline" className="text-amber-600 border-amber-300 text-xs">
                    Editado
                </Badge>
            ) : null
        ),
        size: 70,
    }),
];

// Extensão do meta type para TanStack Table
declare module '@tanstack/react-table' {
    interface TableMeta<TData> {
        updateData: (rowIndex: number, columnId: string, value: unknown) => void;
    }
}

export function PaymentReconciliationGrid({
    data,
    onDataChange,
    onRecalculate,
    isLoading = false,
}: PaymentReconciliationGridProps) {
    const [rowSelection, setRowSelection] = React.useState({});

    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        onRowSelectionChange: setRowSelection,
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

                // Trigger recalculation in cascade
                if (onRecalculate) {
                    toast.info('Recalculando saldo devedor...', { duration: 1500 });
                    onRecalculate();
                }
            },
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
                            {table.getRowModel().rows.map((row, index) => (
                                <tr
                                    key={row.id}
                                    className={cn(
                                        'border-b hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors',
                                        row.original.isEdited && 'bg-amber-50/50 dark:bg-amber-950/30',
                                        row.getIsSelected() && 'bg-blue-50 dark:bg-blue-950/50'
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

                {/* Footer com resumo */}
                <div className="border-t p-4 bg-slate-50 dark:bg-slate-800/50">
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
                                    {formatCurrency(data.reduce((sum, r) => sum + r.valorContrato, 0))}
                                </span>
                            </div>
                            <div>
                                <span className="text-slate-500">Total Pago Real:</span>{' '}
                                <span className="font-mono font-medium text-blue-600">
                                    {formatCurrency(data.reduce((sum, r) => sum + r.valorPagoReal, 0))}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}
