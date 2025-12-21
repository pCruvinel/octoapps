'use client';

import * as React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Car, Home, CreditCard, Calculator, ArrowRight } from 'lucide-react';

interface ModuleSelectionProps {
    onNavigate: (route: string, id?: string, data?: any) => void;
}

const MODULES = [
    {
        id: 'GERAL',
        title: 'Empréstimos & Veículos',
        description: 'CDC, Consignados (INSS, Privado, Público), Capital de Giro, Financiamento de Veículos',
        icon: Car,
        color: 'bg-blue-500',
        features: ['Tabela Price', 'Método de Gauss', 'Detecção de Anatocismo'],
        series: ['25471', '20749', '25464'],
    },
    {
        id: 'IMOBILIARIO',
        title: 'Imobiliário (SFH/SFI)',
        description: 'Financiamentos habitacionais com correção monetária TR, IPCA ou INPC',
        icon: Home,
        color: 'bg-emerald-500',
        features: ['SAC / SACRE', 'Correção Monetária', 'Seguros MIP/DFI'],
        series: ['432'],
    },
    {
        id: 'CARTAO',
        title: 'Cartão de Crédito',
        description: 'RMC (Reserva de Margem Consignável) e recomposição de saldo devedor',
        icon: CreditCard,
        color: 'bg-purple-500',
        features: ['Grid de Faturas', 'Juros Compostos', 'Recomposição de Saldo'],
        series: ['25471'],
        comingSoon: true,
    },
];

export function ModuleSelection({ onNavigate }: ModuleSelectionProps) {
    const handleSelectModule = (moduleId: string) => {
        // Navigate to wizard with module data
        onNavigate('calc-wizard', undefined, { module: moduleId });
    };

    return (
        <div className="min-h-screen bg-slate-50">
            {/* Header */}
            <div className="border-b bg-white sticky top-0 z-10">
                <div className="container max-w-6xl mx-auto px-4 py-4">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => onNavigate('calculations')}>
                            <ArrowLeft className="h-5 w-5" />
                        </Button>
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <Calculator className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h1 className="text-xl font-semibold text-slate-900">
                                    Novo Cálculo Revisional
                                </h1>
                                <p className="text-sm text-slate-500">
                                    Selecione o tipo de contrato para iniciar
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="container max-w-6xl mx-auto px-4 py-8">
                <div className="grid gap-6 md:grid-cols-3">
                    {MODULES.map((module) => (
                        <Card
                            key={module.id}
                            className={`relative overflow-hidden transition-all hover:shadow-lg ${module.comingSoon ? 'opacity-70' : 'cursor-pointer hover:-translate-y-1'}`}
                            onClick={() => !module.comingSoon && handleSelectModule(module.id)}
                        >
                            {module.comingSoon && (
                                <div className="absolute top-3 right-3">
                                    <Badge variant="secondary">Em breve</Badge>
                                </div>
                            )}

                            <CardHeader className="pb-2">
                                <div className={`w-12 h-12 rounded-xl ${module.color} flex items-center justify-center mb-3`}>
                                    <module.icon className="h-6 w-6 text-white" />
                                </div>
                                <CardTitle className="text-lg">{module.title}</CardTitle>
                                <CardDescription className="text-sm">
                                    {module.description}
                                </CardDescription>
                            </CardHeader>

                            <CardContent>
                                <div className="space-y-3">
                                    <div>
                                        <p className="text-xs font-medium text-slate-500 mb-1">Funcionalidades</p>
                                        <div className="flex flex-wrap gap-1">
                                            {module.features.map((feat) => (
                                                <Badge key={feat} variant="outline" className="text-xs">
                                                    {feat}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    <div>
                                        <p className="text-xs font-medium text-slate-500 mb-1">Séries Bacen</p>
                                        <div className="flex gap-1">
                                            {module.series.map((s) => (
                                                <Badge key={s} className="bg-slate-100 text-slate-600 text-xs">
                                                    #{s}
                                                </Badge>
                                            ))}
                                        </div>
                                    </div>

                                    {!module.comingSoon && (
                                        <Button className="w-full mt-2" size="sm">
                                            Iniciar Cálculo
                                            <ArrowRight className="h-4 w-4 ml-1" />
                                        </Button>
                                    )}
                                </div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Info Section */}
                <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-100">
                    <h3 className="font-medium text-blue-900 mb-2">💡 Como funciona?</h3>
                    <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                        <li>Selecione o módulo correspondente ao tipo de contrato</li>
                        <li>Preencha os dados do contrato no wizard passo-a-passo</li>
                        <li>Visualize a análise prévia instantânea</li>
                        <li>Exporte o laudo completo em PDF</li>
                    </ol>
                </div>
            </div>
        </div>
    );
}
