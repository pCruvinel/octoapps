'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
    Plus,
    Trash2,
    CheckCircle,
    AlertCircle,
    Clock,
    AlertTriangle,
    Download
} from 'lucide-react';
import { DatePicker } from '@/components/ui/date-picker';
import { CurrencyInput } from '@/components/ui/currency-input';
import type { PaymentRecord } from '@/utils/financialCalculations';
import { formatCurrency } from '@/lib/formatters';

interface HistoricoPagamentosProps {
    tabelaAmortizacao: Array<{
        parcela: number;
        dataVencimento: string;
        prestacao: number;
    }>;
    pagamentos: PaymentRecord[];
    onPagamentosChange: (pagamentos: PaymentRecord[]) => void;
    readOnly?: boolean;
}

const statusConfig = {
    PAGA: { label: 'Paga', variant: 'default' as const, icon: CheckCircle, color: 'text-green-600' },
    ABERTA: { label: 'Em Aberto', variant: 'secondary' as const, icon: Clock, color: 'text-slate-600' },
    ATRASADA: { label: 'Atrasada', variant: 'destructive' as const, icon: AlertCircle, color: 'text-red-600' },
    PARCIAL: { label: 'Parcial', variant: 'outline' as const, icon: AlertTriangle, color: 'text-amber-600' },
};

export function HistoricoPagamentos({
    tabelaAmortizacao,
    pagamentos,
    onPagamentosChange,
    readOnly = false,
}: HistoricoPagamentosProps) {
    const [editingParcela, setEditingParcela] = React.useState<number | null>(null);
    const [tempData, setTempData] = React.useState<{ data: string; valor: number }>({ data: '', valor: 0 });

    // Resumo
    const resumo = React.useMemo(() => {
        const pagas = pagamentos.filter((p) => p.status === 'PAGA').length;
        const atrasadas = pagamentos.filter((p) => p.status === 'ATRASADA').length;
        const abertas = pagamentos.filter((p) => p.status === 'ABERTA').length;
        const parciais = pagamentos.filter((p) => p.status === 'PARCIAL').length;
        const totalPago = pagamentos.reduce((sum, p) => sum + (p.valorPago || 0), 0);
        const totalDevido = pagamentos.reduce((sum, p) => sum + p.valorDevido, 0);
        const totalMora = pagamentos.reduce((sum, p) => sum + (p.jurosMora || 0) + (p.multa || 0), 0);

        return { pagas, atrasadas, abertas, parciais, totalPago, totalDevido, totalMora };
    }, [pagamentos]);

    const handleRegistrarPagamento = (parcela: number) => {
        const parcelaData = tabelaAmortizacao.find((p) => p.parcela === parcela);
        if (!parcelaData) return;

        setEditingParcela(parcela);
        setTempData({
            data: new Date().toISOString().split('T')[0],
            valor: parcelaData.prestacao
        });
    };

    const handleSalvarPagamento = () => {
        if (!editingParcela) return;

        const parcelaData = tabelaAmortizacao.find((p) => p.parcela === editingParcela);
        if (!parcelaData) return;

        const dataVenc = new Date(parcelaData.dataVencimento);
        const dataPag = new Date(tempData.data);
        const diasAtraso = Math.max(0, Math.ceil((dataPag.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24)));

        const novoPagamento: PaymentRecord = {
            parcela: editingParcela,
            valorDevido: parcelaData.prestacao,
            dataVencimento: parcelaData.dataVencimento,
            status: tempData.valor >= parcelaData.prestacao ? 'PAGA' : 'PARCIAL',
            dataPagamento: tempData.data,
            valorPago: tempData.valor,
            diasAtraso,
            jurosMora: diasAtraso > 0 ? parcelaData.prestacao * (0.12 / 365) * diasAtraso : 0,
            multa: diasAtraso > 0 ? parcelaData.prestacao * 0.02 : 0,
        };

        const updated = pagamentos.map((p) =>
            p.parcela === editingParcela ? novoPagamento : p
        );

        onPagamentosChange(updated);
        setEditingParcela(null);
    };

    const handleRemoverPagamento = (parcela: number) => {
        const parcelaData = tabelaAmortizacao.find((p) => p.parcela === parcela);
        if (!parcelaData) return;

        const dataVenc = new Date(parcelaData.dataVencimento);
        const hoje = new Date();
        const isAtrasada = hoje > dataVenc;

        const pagamentoVazio: PaymentRecord = {
            parcela,
            valorDevido: parcelaData.prestacao,
            dataVencimento: parcelaData.dataVencimento,
            status: isAtrasada ? 'ATRASADA' : 'ABERTA',
            diasAtraso: isAtrasada ? Math.ceil((hoje.getTime() - dataVenc.getTime()) / (1000 * 60 * 60 * 24)) : 0,
        };

        const updated = pagamentos.map((p) =>
            p.parcela === parcela ? pagamentoVazio : p
        );

        onPagamentosChange(updated);
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Histórico de Pagamentos
                </CardTitle>
                <CardDescription>
                    Registre os pagamentos realizados para cálculo preciso de indébito
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                {/* Resumo */}
                <div className="grid grid-cols-4 gap-4">
                    <div className="bg-green-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-green-600">{resumo.pagas}</p>
                        <p className="text-xs text-green-700">Pagas</p>
                    </div>
                    <div className="bg-red-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-red-600">{resumo.atrasadas}</p>
                        <p className="text-xs text-red-700">Atrasadas</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-slate-600">{resumo.abertas}</p>
                        <p className="text-xs text-slate-700">Em Aberto</p>
                    </div>
                    <div className="bg-blue-50 rounded-lg p-3 text-center">
                        <p className="text-2xl font-bold text-blue-600">{formatCurrency(resumo.totalPago)}</p>
                        <p className="text-xs text-blue-700">Total Pago</p>
                    </div>
                </div>

                {/* Tabela de Pagamentos */}
                <div className="border rounded-lg overflow-hidden">
                    <Table>
                        <TableHeader>
                            <TableRow className="bg-slate-50">
                                <TableHead className="w-16">#</TableHead>
                                <TableHead>Vencimento</TableHead>
                                <TableHead>Valor</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Pagamento</TableHead>
                                <TableHead>Mora/Multa</TableHead>
                                <TableHead className="w-24">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pagamentos.slice(0, 12).map((p) => {
                                const config = statusConfig[p.status];
                                const Icon = config.icon;
                                const isEditing = editingParcela === p.parcela;

                                return (
                                    <TableRow key={p.parcela} className={isEditing ? 'bg-blue-50' : ''}>
                                        <TableCell className="font-medium">{p.parcela}</TableCell>
                                        <TableCell>{new Date(p.dataVencimento).toLocaleDateString('pt-BR')}</TableCell>
                                        <TableCell>{formatCurrency(p.valorDevido)}</TableCell>
                                        <TableCell>
                                            <Badge variant={config.variant} className="gap-1">
                                                <Icon className="h-3 w-3" />
                                                {config.label}
                                            </Badge>
                                        </TableCell>
                                        <TableCell>
                                            {isEditing ? (
                                                <div className="flex gap-2">
                                                    <DatePicker
                                                        value={tempData.data}
                                                        onChange={(val) => setTempData({ ...tempData, data: val || '' })}
                                                        className="w-32"
                                                    />
                                                    <CurrencyInput
                                                        value={tempData.valor}
                                                        onChange={(val) => setTempData({ ...tempData, valor: val || 0 })}
                                                        className="w-28"
                                                    />
                                                </div>
                                            ) : (
                                                p.dataPagamento ? (
                                                    <span className="text-sm">
                                                        {new Date(p.dataPagamento).toLocaleDateString('pt-BR')}
                                                        {' - '}
                                                        {formatCurrency(p.valorPago || 0)}
                                                    </span>
                                                ) : (
                                                    <span className="text-slate-400">-</span>
                                                )
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {(p.jurosMora || 0) + (p.multa || 0) > 0 ? (
                                                <span className="text-red-600 text-sm">
                                                    {formatCurrency((p.jurosMora || 0) + (p.multa || 0))}
                                                </span>
                                            ) : (
                                                <span className="text-slate-400">-</span>
                                            )}
                                        </TableCell>
                                        <TableCell>
                                            {!readOnly && (
                                                <div className="flex gap-1">
                                                    {isEditing ? (
                                                        <>
                                                            <Button
                                                                size="sm"
                                                                variant="default"
                                                                onClick={handleSalvarPagamento}
                                                            >
                                                                Salvar
                                                            </Button>
                                                            <Button
                                                                size="sm"
                                                                variant="ghost"
                                                                onClick={() => setEditingParcela(null)}
                                                            >
                                                                ✕
                                                            </Button>
                                                        </>
                                                    ) : p.status === 'PAGA' || p.status === 'PARCIAL' ? (
                                                        <Button
                                                            size="sm"
                                                            variant="ghost"
                                                            onClick={() => handleRemoverPagamento(p.parcela)}
                                                        >
                                                            <Trash2 className="h-4 w-4 text-red-500" />
                                                        </Button>
                                                    ) : (
                                                        <Button
                                                            size="sm"
                                                            variant="outline"
                                                            onClick={() => handleRegistrarPagamento(p.parcela)}
                                                        >
                                                            <Plus className="h-4 w-4 mr-1" />
                                                            Pagar
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                );
                            })}
                        </TableBody>
                    </Table>
                </div>

                {pagamentos.length > 12 && (
                    <p className="text-center text-sm text-slate-500">
                        Exibindo 12 de {pagamentos.length} parcelas
                    </p>
                )}
            </CardContent>
        </Card>
    );
}
