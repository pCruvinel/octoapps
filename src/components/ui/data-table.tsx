'use client';

import * as React from 'react';
import {
    ColumnDef,
    SortingState,
    flexRender,
    getCoreRowModel,
    useReactTable,
} from '@tanstack/react-table';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DataTableProps<TData, TValue> {
    columns: ColumnDef<TData, TValue>[];
    data: TData[];
    sorting?: SortingState;
    onSortingChange?: (sorting: SortingState) => void;
    isLoading?: boolean;
    emptyState?: React.ReactNode;
}

export function DataTable<TData, TValue>({
    columns,
    data,
    sorting = [],
    onSortingChange,
    isLoading,
    emptyState,
}: DataTableProps<TData, TValue>) {
    const table = useReactTable({
        data,
        columns,
        getCoreRowModel: getCoreRowModel(),
        manualSorting: true,
        state: {
            sorting,
        },
        onSortingChange: (updater) => {
            const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
            onSortingChange?.(newSorting);
        },
    });

    return (
        <div className="rounded-lg border border-slate-200 overflow-hidden">
            <Table>
                <TableHeader className="bg-slate-50">
                    {table.getHeaderGroups().map((headerGroup) => (
                        <TableRow key={headerGroup.id} className="hover:bg-slate-50">
                            {headerGroup.headers.map((header) => {
                                const isSortable = header.column.getCanSort();
                                const sorted = header.column.getIsSorted();

                                return (
                                    <TableHead
                                        key={header.id}
                                        className={cn(
                                            'text-slate-600 font-semibold',
                                            isSortable && 'cursor-pointer select-none'
                                        )}
                                        onClick={isSortable ? header.column.getToggleSortingHandler() : undefined}
                                    >
                                        <div className="flex items-center gap-1">
                                            {header.isPlaceholder
                                                ? null
                                                : flexRender(
                                                    header.column.columnDef.header,
                                                    header.getContext()
                                                )}
                                            {isSortable && (
                                                <span className="ml-1">
                                                    {sorted === 'asc' ? (
                                                        <ArrowUp className="h-4 w-4 text-slate-900" />
                                                    ) : sorted === 'desc' ? (
                                                        <ArrowDown className="h-4 w-4 text-slate-900" />
                                                    ) : (
                                                        <ArrowUpDown className="h-4 w-4 text-slate-400" />
                                                    )}
                                                </span>
                                            )}
                                        </div>
                                    </TableHead>
                                );
                            })}
                        </TableRow>
                    ))}
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                <div className="flex items-center justify-center">
                                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-slate-300 border-t-blue-600" />
                                </div>
                            </TableCell>
                        </TableRow>
                    ) : table.getRowModel().rows?.length ? (
                        table.getRowModel().rows.map((row) => (
                            <TableRow
                                key={row.id}
                                data-state={row.getIsSelected() && 'selected'}
                                className="hover:bg-slate-50 transition-colors"
                            >
                                {row.getVisibleCells().map((cell) => (
                                    <TableCell key={cell.id}>
                                        {flexRender(cell.column.columnDef.cell, cell.getContext())}
                                    </TableCell>
                                ))}
                            </TableRow>
                        ))
                    ) : (
                        <TableRow>
                            <TableCell colSpan={columns.length} className="h-24 text-center">
                                {emptyState || 'Nenhum resultado encontrado.'}
                            </TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </div>
    );
}

// Helper to create sortable column header
export function SortableHeader({ children }: { children: React.ReactNode }) {
    return <span>{children}</span>;
}
