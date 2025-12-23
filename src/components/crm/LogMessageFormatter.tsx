
import { ActivityLog } from '@/types/activity-log';
import { ArrowRight, Calendar, CheckCircle, FileText, MessageSquare, Paperclip, Plus, Trash2, Edit, MoveRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface LogMessageFormatterProps {
    log: ActivityLog;
}

export function LogMessageFormatter({ log }: LogMessageFormatterProps) {
    const { acao, dados_anteriores, dados_novos } = log;

    const formatCurrency = (val: any) => {
        if (!val) return 'R$ 0,00';
        return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Number(val));
    };

    const renderContent = () => {
        switch (acao) {
            case 'CRIAR_OPORTUNIDADE':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-800">Criou a oportunidade</p>
                        <div className="text-xs text-slate-500 flex flex-wrap gap-2">
                            {dados_novos?.valor_estimado && <span>Valor inicial: {formatCurrency(dados_novos.valor_estimado)}</span>}
                            {dados_novos?.etapa && <span>• Na etapa: {dados_novos.etapa}</span>}
                            {dados_novos?.origem && <span>• Origem: {dados_novos.origem}</span>}
                        </div>
                    </div>
                );

            case 'EDITAR_OPORTUNIDADE':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-800">Atualizou informações</p>
                        <ul className="text-xs text-slate-600 space-y-1 bg-slate-50 p-2 rounded border border-slate-100">
                            {Object.keys(dados_novos || {}).map((key) => {
                                const valorAntigo = dados_anteriores?.[key];
                                const valorNovo = dados_novos?.[key];

                                // Ignorar se valores forem iguais ou vazios (opcional)
                                if (valorAntigo === valorNovo) return null;

                                let label = key;
                                let displayAntigo = String(valorAntigo || 'Vazio');
                                let displayNovo = String(valorNovo || 'Vazio');

                                // Formatação específica por campo
                                if (key === 'valor_estimado') {
                                    label = 'Valor';
                                    displayAntigo = formatCurrency(valorAntigo);
                                    displayNovo = formatCurrency(valorNovo);
                                } else if (key === 'tipo_acao') {
                                    label = 'Operação';
                                } else if (key === 'responsavel') {
                                    label = 'Responsável';
                                } else if (key === 'titulo') {
                                    label = 'Título';
                                }

                                return (
                                    <li key={key} className="flex items-center gap-1">
                                        <span className="font-semibold">{label}:</span>
                                        <span className="line-through text-slate-400">{displayAntigo}</span>
                                        <ArrowRight className="w-3 h-3 text-slate-400" />
                                        <span className="text-blue-600 font-medium">{displayNovo}</span>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                );

            case 'MOVER_OPORTUNIDADE':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            Moveu de fase <MoveRight className="w-4 h-4 text-slate-400" /> {dados_novos?.etapa}
                        </p>
                        <p className="text-xs text-slate-500">Anterior: {dados_anteriores?.etapa}</p>
                    </div>
                );

            case 'ADICIONAR_COMENTARIO':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            <MessageSquare className="w-3 h-3 text-blue-500" /> Adicionou um comentário
                        </p>
                        <p className="text-xs text-slate-600 italic">"{dados_novos?.texto}"</p>
                    </div>
                );

            case 'AGENDAR_INTERACAO':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-orange-500" /> Agendou uma interação
                        </p>
                        <div className="text-xs text-slate-600">
                            <span className="font-semibold">{dados_novos?.tipo}:</span> {dados_novos?.titulo}
                            <span className="block text-slate-500">Para: {dados_novos?.data}</span>
                        </div>
                    </div>
                );

            case 'ANEXAR_ARQUIVO':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            <Paperclip className="w-3 h-3 text-indigo-500" /> Anexou arquivo
                        </p>
                        <p className="text-xs text-slate-600 underline decoration-slate-300">
                            {dados_novos?.arquivo} <span className="text-slate-400 no-underline">({dados_novos?.tamanho})</span>
                        </p>
                    </div>
                );

            case 'EXCLUIR_ANEXO':
                return (
                    <div className="space-y-1">
                        <p className="text-sm font-medium text-slate-800 flex items-center gap-1">
                            <Trash2 className="w-3 h-3 text-red-500" /> Removeu anexo
                        </p>
                        <p className="text-xs text-slate-500 line-through">{dados_anteriores?.arquivo}</p>
                    </div>
                );

            default:
                return (
                    <div className="text-xs text-slate-500">
                        <p className="font-medium">{acao}</p>
                        {dados_novos && <pre className="mt-1 bg-slate-50 p-1 rounded overflow-hidden text-[10px]">{JSON.stringify(dados_novos)}</pre>}
                    </div>
                );
        }
    };

    return (
        <div className="w-full">
            {renderContent()}
        </div>
    );
}
