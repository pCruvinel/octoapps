/** @deprecated Componente depreciado. Utilizar a nova estrutura em tabs (CalculationPage/DataEntryTab) */
'use client';

import * as React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { CurrencyInput } from '@/components/ui/currency-input';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Receipt, Plus, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Step3_RevisaoProps {
    defaultValues?: any;
    onDataChange?: (data: any) => void;
    onValidationChange?: (isValid: boolean) => void;
}

// Lista de tarifas pré-definidas (chips de seleção rápida)
const TARIFAS_RAPIDAS = [
    { id: 'tac', label: 'TAC', nome: 'TAC (Tarifa de Abertura de Crédito)' },
    { id: 'tec', label: 'TEC', nome: 'TEC (Tarifa de Emissão de Carnê)' },
    { id: 'seguroPrestamista', label: 'Seguro', nome: 'Seguro Prestamista' },
    { id: 'seguroAuto', label: 'Seguro', nome: 'Seguro Auto' },
    { id: 'tarifa', label: 'Tarifa', nome: 'Tarifa Administrativa' },
    { id: 'avaliacao', label: 'Avaliação', nome: 'Avaliação do Bem' },
    { id: 'registro', label: 'Registro', nome: 'Registro de Contrato' },
    { id: 'iof', label: 'IOF', nome: 'IOF Financiado' },
] as const;

type TarifaId = string;

interface TarifaSelecionada {
    id: TarifaId;
    nome: string;
    valor: number;
    expurgar: boolean;
}

export function Step3_Revisao({
    defaultValues,
    onDataChange,
    onValidationChange,
}: Step3_RevisaoProps) {
    const [tarifasSelecionadas, setTarifasSelecionadas] = React.useState<TarifaSelecionada[]>(() => {
        if (defaultValues?.tarifas) {
            const tarifas: TarifaSelecionada[] = [];
            Object.entries(defaultValues.tarifas).forEach(([id, valor]) => {
                if (valor && (valor as number) > 0) {
                    const tarifaInfo = TARIFAS_RAPIDAS.find(t => t.id === id);
                    tarifas.push({
                        id,
                        nome: tarifaInfo?.nome || id,
                        valor: valor as number,
                        expurgar: true,
                    });
                }
            });
            return tarifas;
        }
        return [];
    });

    const [customTarifaNome, setCustomTarifaNome] = React.useState('');
    const [dialogOpen, setDialogOpen] = React.useState(false);

    // Store callbacks in refs to avoid dependency issues
    const onValidationChangeRef = React.useRef(onValidationChange);
    const onDataChangeRef = React.useRef(onDataChange);

    React.useEffect(() => {
        onValidationChangeRef.current = onValidationChange;
        onDataChangeRef.current = onDataChange;
    });

    // Notify parent of validity (only once on mount)
    React.useEffect(() => {
        onValidationChangeRef.current?.(true);
    }, []);

    // Notify parent of data changes
    React.useEffect(() => {
        const tarifasObj: Record<string, number> = {};
        const tarifasArray = tarifasSelecionadas
            .filter(t => t.expurgar)
            .map(t => ({
                tipo: t.id,
                nome: t.nome,
                valor: t.valor,
                expurgar: t.expurgar,
            }));

        tarifasSelecionadas.forEach(t => {
            tarifasObj[t.id] = t.valor;
        });

        onDataChangeRef.current?.({
            tarifas: tarifasObj,
            tarifasArray,
            totalExpurgo: tarifasSelecionadas
                .filter(t => t.expurgar)
                .reduce((acc, t) => acc + t.valor, 0),
        });
    }, [tarifasSelecionadas]);

    const handleAddTarifa = (tarifaId: string, nome: string) => {
        if (!tarifasSelecionadas.find(t => t.id === tarifaId)) {
            setTarifasSelecionadas(prev => [
                ...prev,
                { id: tarifaId, nome, valor: 0, expurgar: true }
            ]);
        }
    };

    const handleRemoveTarifa = (tarifaId: string) => {
        setTarifasSelecionadas(prev => prev.filter(t => t.id !== tarifaId));
    };

    const handleValorChange = (tarifaId: string, valor: number) => {
        setTarifasSelecionadas(prev =>
            prev.map(t => t.id === tarifaId ? { ...t, valor } : t)
        );
    };

    const handleExpurgarChange = (tarifaId: string, expurgar: boolean) => {
        setTarifasSelecionadas(prev =>
            prev.map(t => t.id === tarifaId ? { ...t, expurgar } : t)
        );
    };

    const handleAddCustomTarifa = () => {
        if (customTarifaNome.trim()) {
            const id = `custom_${Date.now()}`;
            setTarifasSelecionadas(prev => [
                ...prev,
                { id, nome: customTarifaNome.trim(), valor: 0, expurgar: true }
            ]);
            setCustomTarifaNome('');
            setDialogOpen(false);
        }
    };

    const tarifasNaoSelecionadas = TARIFAS_RAPIDAS.filter(
        t => !tarifasSelecionadas.find(s => s.id === t.id)
    );

    const totalExpurgo = tarifasSelecionadas
        .filter(t => t.expurgar)
        .reduce((acc, t) => acc + t.valor, 0);

    return (
        <div className="space-y-6">
            <Card>
                <CardHeader className="pb-4">
                    <div className="flex items-center gap-2">
                        <Receipt className="h-5 w-5 text-slate-600" />
                        <CardTitle>Tarifas e Encargos</CardTitle>
                    </div>
                    <CardDescription>
                        Adicione as tarifas cobradas e marque quais devem ser expurgadas do cálculo
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Chips de seleção rápida */}
                    <div className="flex flex-wrap gap-2">
                        {tarifasNaoSelecionadas.map((tarifa) => (
                            <Button
                                key={tarifa.id}
                                variant="outline"
                                size="sm"
                                className="gap-1 h-8 text-sm font-normal"
                                onClick={() => handleAddTarifa(tarifa.id, tarifa.nome)}
                            >
                                <Plus className="h-3 w-3" />
                                {tarifa.label}
                            </Button>
                        ))}
                    </div>

                    {/* Lista de tarifas selecionadas */}
                    {tarifasSelecionadas.length > 0 && (
                        <div className="space-y-3">
                            {tarifasSelecionadas.map((tarifa) => (
                                <div
                                    key={tarifa.id}
                                    className="flex items-center gap-4 p-3 rounded-lg border bg-white"
                                >
                                    {/* Toggle Switch */}
                                    <Switch
                                        checked={tarifa.expurgar}
                                        onCheckedChange={(checked) =>
                                            handleExpurgarChange(tarifa.id, checked)
                                        }
                                        className="data-[state=checked]:bg-red-500"
                                    />

                                    {/* Nome da tarifa */}
                                    <div className="flex-1 min-w-0">
                                        <Input
                                            value={tarifa.nome}
                                            onChange={(e) => {
                                                setTarifasSelecionadas(prev =>
                                                    prev.map(t => t.id === tarifa.id
                                                        ? { ...t, nome: e.target.value }
                                                        : t
                                                    )
                                                );
                                            }}
                                            className="border-0 bg-transparent p-0 h-auto text-base focus-visible:ring-0"
                                        />
                                    </div>

                                    {/* Input de valor */}
                                    <div className="w-32">
                                        <CurrencyInput
                                            value={tarifa.valor}
                                            onChange={(val) => handleValorChange(tarifa.id, val || 0)}
                                            className="h-9 text-right"
                                        />
                                    </div>

                                    {/* Botão deletar */}
                                    <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-8 w-8 text-slate-400 hover:text-red-500"
                                        onClick={() => handleRemoveTarifa(tarifa.id)}
                                    >
                                        <Trash2 className="h-4 w-4" />
                                    </Button>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Botão adicionar tarifa customizada */}
                    <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                        <DialogTrigger asChild>
                            <Button
                                variant="outline"
                                className="w-full gap-2 border-dashed"
                            >
                                <Plus className="h-4 w-4" />
                                Adicionar Tarifa Customizada
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>Adicionar Tarifa Customizada</DialogTitle>
                            </DialogHeader>
                            <div className="py-4">
                                <Label htmlFor="custom-tarifa">Nome da Tarifa</Label>
                                <Input
                                    id="custom-tarifa"
                                    value={customTarifaNome}
                                    onChange={(e) => setCustomTarifaNome(e.target.value)}
                                    placeholder="Ex: Taxa de Vistoria"
                                    className="mt-2"
                                />
                            </div>
                            <DialogFooter>
                                <DialogClose asChild>
                                    <Button variant="outline">Cancelar</Button>
                                </DialogClose>
                                <Button onClick={handleAddCustomTarifa}>
                                    Adicionar
                                </Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </CardContent>
            </Card>

            {/* Resumo (só aparece se houver tarifas) */}
            {tarifasSelecionadas.length > 0 && (
                <Card className="bg-amber-50 border-amber-200">
                    <CardContent className="pt-6">
                        <div className="flex items-center justify-between">
                            <span className="text-amber-800 font-medium">
                                Total de tarifas a expurgar:
                            </span>
                            <span className="text-2xl font-bold text-amber-900">
                                {new Intl.NumberFormat('pt-BR', {
                                    style: 'currency',
                                    currency: 'BRL'
                                }).format(totalExpurgo)}
                            </span>
                        </div>
                    </CardContent>
                </Card>
            )}
        </div>
    );
}


