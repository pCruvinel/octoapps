'use client';

import { useState, useEffect } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Search, MoreVertical, Home, CreditCard, DollarSign, FileText, Loader2 } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { financiamentosService } from '@/services/financiamentos.service';
import { cartoesService } from '@/services/cartoes.service';
import type { Database } from '@/lib/database.types';

type Financiamento = Database['public']['Tables']['financiamentos']['Row'];
type CartaoCredito = Database['public']['Tables']['cartoes_credito']['Row'];

// Union type for all calculation types
type Calculation = (Financiamento & { tipo: 'financiamento' }) | (CartaoCredito & { tipo: 'cartao' });

interface CalculationsListProps {
  onNavigate: (route: string, id?: string) => void;
}

export function CalculationsList({ onNavigate }: CalculationsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('');
  const [calculations, setCalculations] = useState<Calculation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  const calculationOptions = [
    {
      id: 'financiamento',
      title: 'Revisão de Financiamento Imobiliário',
      description: 'Analise seu financiamento imobiliário e identifique possíveis irregularidades.',
      icon: Home,
      route: 'calc-financiamento'
    },
    {
      id: 'cartao',
      title: 'Revisão de Cartão de Crédito',
      description: 'Verifique as taxas e encargos do seu cartão de crédito para garantir a conformidade.',
      icon: CreditCard,
      route: 'calc-cartao'
    },
    {
      id: 'emprestimos',
      title: 'Revisão Geral (Empréstimos e Financiamentos)',
      description: 'Revise empréstimos e financiamentos em geral para assegurar a transparência e justiça.',
      icon: DollarSign,
      route: 'calc-emprestimos'
    }
  ];

  // Load calculations from database on mount
  useEffect(() => {
    loadCalculations();
  }, []);

  const loadCalculations = async () => {
    try {
      setLoading(true);
      setError(null);

      // Load from all calculation tables in parallel
      const [financiamentosCalculos, cartoes] = await Promise.all([
        financiamentosService.getAllCalculos(), // Buscar de financiamentos_calculo
        cartoesService.getAll(),
      ]);

      // Tag each record with its type
      const allCalculations: Calculation[] = [
        ...financiamentosCalculos.map(f => ({ ...f, tipo: 'financiamento' as const })),
        ...cartoes.map(c => ({ ...c, tipo: 'cartao' as const })),
      ];

      // Ordenação já vem do banco de dados (created_at desc)
      setCalculations(allCalculations);
    } catch (err) {
      console.error('Error loading calculations:', err);
      setError('Erro ao carregar casos. Tente novamente.');
      toast.error('Erro ao carregar casos');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCalculation = () => {
    if (!selectedType) {
      toast.error('Selecione o tipo de cálculo');
      return;
    }

    const routes: Record<string, string> = {
      'Financiamento Imobiliário': 'calc-financiamento',
      'Cartão de Crédito': 'calc-cartao',
      'Empréstimos e Financiamentos': 'calc-emprestimos',
    };

    setIsDialogOpen(false);
    onNavigate(routes[selectedType]);
  };

  const handleOpenDelete = (calc: Calculation) => {
    setSelectedCaseId(calc.id);
    setSelectedType(calc.tipo);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (calc: Calculation) => {
    const routes: Record<string, string> = {
      'financiamento': 'calc-financiamento',
      'cartao': 'calc-cartao',
    };

    onNavigate(routes[calc.tipo], calc.id);
  };

  const handleView = async (calc: Calculation) => {
    try {
      // Load data based on calculation type
      if (calc.tipo === 'cartao') {
        // Load cartão data
        const cartao = await cartoesService.getById(calc.id);

        if (!cartao) {
          toast.error('Caso não encontrado');
          return;
        }

        // Check if calculation results exist
        if (!cartao.total_juros_cobrado || !cartao.diferenca_restituicao) {
          toast.warning('Este caso ainda não possui análise calculada. Redirecionando para edição...');
          onNavigate('calc-cartao', calc.id);
          return;
        }

        // Format data for AnalisePrevia component (UI unificada)
        const taxaMercado = 0.05; // 5% BACEN padrão (taxa média rotativo - mesmo valor do motor)
        const data = {
          saldoTotal: cartao.saldo_devedor,
          taxaMediaCobrada: cartao.juros_rotativo,
          taxaMercado: taxaMercado,
          sobretaxaPP: cartao.juros_rotativo - taxaMercado,
          totalJurosCobrado: cartao.total_juros_cobrado || 0,
          totalJurosDevido: cartao.total_juros_devido || 0,
          diferencaRestituicao: cartao.diferenca_restituicao || 0,
          totalEncargos: 0, // Encargos fixos (anuidade, seguro, tarifas)
          totalEncargosCobrados: cartao.total_juros_cobrado || 0,
          totalEncargosDevidos: cartao.total_juros_devido || 0,
          encargosAbusivos: cartao.encargos_abusivos || [],
          cetMensal: cartao.cet_mensal || cartao.taxa_efetiva_mensal || 0,
          cetAnual: cartao.cet_anual || cartao.taxa_efetiva_anual || 0,
          anatocismoDetectado: cartao.anatocismo_detectado || false,
          percentualAbuso: 0,
          mesesAnalise: 24,
          formatted: {
            saldoTotal: formatCurrency(cartao.saldo_devedor),
            taxaMediaCobrada: formatPercent(cartao.juros_rotativo),
            taxaMercado: formatPercent(taxaMercado),
            sobretaxaPP: formatPercent(cartao.juros_rotativo - taxaMercado),
            totalJurosCobrado: formatCurrency(cartao.total_juros_cobrado || 0),
            totalJurosDevido: formatCurrency(cartao.total_juros_devido || 0),
            diferencaRestituicao: formatCurrency(cartao.diferenca_restituicao || 0),
            totalEncargosCobrados: formatCurrency(cartao.total_juros_cobrado || 0),
            totalEncargosDevidos: formatCurrency(cartao.total_juros_devido || 0),
            cetMensal: formatPercent(cartao.cet_mensal || cartao.taxa_efetiva_mensal || 0),
            cetAnual: formatPercent(cartao.cet_anual || cartao.taxa_efetiva_anual || 0),
          },
        };

        // Navigate to unified analysis page (same as financiamento)
        onNavigate('calc-analise', calc.id, data);

      } else if (calc.tipo === 'financiamento') {
        // Load financiamento_calculo data
        const calculo = await financiamentosService.getCalculoById(calc.id);

        if (!calculo) {
          toast.error('Caso não encontrado');
          return;
        }

        // Check if calculation results exist (análise data)
        const analise = calculo.financiamentos_calculo_analise?.[0];
        if (!analise || !analise.diferenca_total_media) {
          toast.warning('Este caso ainda não possui análise calculada. Redirecionando para edição...');
          onNavigate('calc-financiamento', calc.id);
          return;
        }

        // Format data for AnalisePrevia component
        const data = {
          taxaContratoAM: analise.taxa_juros_mensal_contrato || 0,
          taxaMercadoAM: analise.taxa_media_mensal || 0,
          sobretaxaPP: analise.excesso_media || 0,
          reducaoEstimadaSimples: analise.diferenca_total_simples || 0,
          reducaoEstimadaMedia: analise.diferenca_total_media || 0,
          diferencaRestituicao: analise.diferenca_total_media || 0,
          horizonteMeses: 12,
          totalParcelas: calculo.numero_parcelas_total || 0,
          formatted: {
            taxaContratoAM: formatPercent(analise.taxa_juros_mensal_contrato || 0),
            taxaMercadoAM: formatPercent(analise.taxa_media_mensal || 0),
            sobretaxaPP: formatPercent(analise.excesso_media || 0),
            reducaoEstimadaSimples: formatCurrency(analise.diferenca_total_simples || 0),
            reducaoEstimadaMedia: formatCurrency(analise.diferenca_total_media || 0),
            diferencaRestituicao: formatCurrency(analise.diferenca_total_media || 0),
          },
        };

        // Navigate to financiamento analise page
        onNavigate('calc-analise', calc.id, data);
      }
    } catch (error) {
      console.error('Error loading case for view:', error);
      toast.error('Erro ao carregar dados do caso');
    }
  };

  // Helper functions for formatting
  const formatCurrency = (value: number): string => {
    return value.toLocaleString('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    });
  };

  const formatPercent = (value: number): string => {
    return (value * 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 4,
      maximumFractionDigits: 4,
    }) + '%';
  };

  const handleConfirmDelete = async () => {
    if (selectedCaseId && selectedType) {
      try {
        // Delete based on type (usar métodos específicos para cálculos)
        if (selectedType === 'financiamento') {
          await financiamentosService.softDeleteCalculo(selectedCaseId);
        } else if (selectedType === 'cartao') {
          await cartoesService.softDelete(selectedCaseId);
        }

        toast.success('Caso excluído com sucesso!');
        setIsDeleteDialogOpen(false);
        setSelectedCaseId(null);
        setSelectedType('');
        // Reload calculations
        await loadCalculations();
      } catch (err) {
        console.error('Error deleting calculation:', err);
        toast.error('Erro ao excluir caso');
      }
    }
  };

  // Helper: Format date from ISO to DD/MM/YYYY
  const formatDate = (isoDate: string): string => {
    const date = new Date(isoDate);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  // Helper: Get calculation type display name
  const getCalculationType = (calc: Calculation): string => {
    if (calc.tipo === 'cartao') {
      return 'Cartão de Crédito';
    }
    return 'Financiamento Imobiliário';
  };

  // Helper: Get contract number based on type
  const getContractNumber = (calc: Calculation): string => {
    if (calc.tipo === 'cartao') {
      return (calc as CartaoCredito).numero_cartao || 'N/A';
    }
    return (calc as Financiamento).contrato_num || 'N/A';
  };

  const filteredCalculations = calculations.filter(calc => {
    const searchLower = searchTerm.toLowerCase();
    const devedor = (calc.devedor || '').toLowerCase();
    const credor = (calc.credor || '').toLowerCase();

    // Common fields
    if (devedor.includes(searchLower) || credor.includes(searchLower)) {
      return true;
    }

    // Type-specific fields
    if (calc.tipo === 'financiamento') {
      const fin = calc as Financiamento;
      return (
        (fin.contrato_num && fin.contrato_num.toLowerCase().includes(searchLower)) ||
        (fin.numero_processo && fin.numero_processo.toLowerCase().includes(searchLower))
      );
    } else if (calc.tipo === 'cartao') {
      const cartao = calc as CartaoCredito;
      return (
        (cartao.numero_cartao && cartao.numero_cartao.toLowerCase().includes(searchLower)) ||
        (cartao.numero_processo && cartao.numero_processo.toLowerCase().includes(searchLower))
      );
    }

    return false;
  });

  // Paginação
  const totalPages = Math.ceil(filteredCalculations.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedCalculations = filteredCalculations.slice(startIndex, endIndex);

  // Reset para primeira página quando filtrar
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm]);

  return (
    <div className="p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2">Cálculo Revisional</h1>
        <p className="text-gray-600 dark:text-gray-400">
          Realize cálculos e revisões financeiras com precisão e segurança.
        </p>
      </div>

      {/* Opções de Cálculo */}
      <div className="mb-8">
        <h2 className="text-lg sm:text-xl text-gray-900 dark:text-white mb-4">Opções de Cálculo</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4">
          {calculationOptions.map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => onNavigate(option.route)}
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 sm:p-5 text-left hover:shadow-md hover:border-blue-300 dark:hover:border-blue-700 transition-all active:scale-95"
              >
                <div className="flex items-start gap-3 sm:gap-4 mb-2 sm:mb-3">
                  <div className="bg-blue-500 dark:bg-blue-600 rounded-lg p-2 sm:p-3 shrink-0">
                    <Icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
                  </div>
                  <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white flex-1 leading-tight">
                    {option.title}
                  </h3>
                </div>
                <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                  {option.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Lista de Casos */}
      <div className="mb-6">
        <h2 className="text-gray-900 dark:text-white mb-4">Lista de Casos</h2>
      </div>

      <div className="mb-6 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Pesquisar"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        <Button className="gap-2 w-full sm:w-auto">
          Buscar
        </Button>
      </div>

      <div className="border border-gray-200 dark:border-gray-800 rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ID</TableHead>
                <TableHead>Nome do Cliente</TableHead>
                <TableHead>Nº Contrato</TableHead>
                <TableHead>Tipo</TableHead>
                <TableHead>Data de Análise</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="w-12">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin text-gray-400" />
                      <span className="text-gray-500 dark:text-gray-400">Carregando casos...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredCalculations.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      Nenhum caso encontrado
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedCalculations.map(calc => (
                  <TableRow key={calc.id}>
                    <TableCell>{calc.id.substring(0, 8)}</TableCell>
                    <TableCell className="text-gray-900 dark:text-white">{calc.devedor}</TableCell>
                    <TableCell>{getContractNumber(calc)}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{getCalculationType(calc)}</Badge>
                    </TableCell>
                    <TableCell>{formatDate(calc.data_atualizacao || new Date().toISOString())}</TableCell>
                    <TableCell>
                      <Badge variant={calc.status === 'Concluído' ? 'default' : 'secondary'}>
                        {calc.status || 'Em Análise'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <button className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                            <MoreVertical className="w-4 h-4" />
                          </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleView(calc)}>
                            Visualizar
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleEdit(calc)}>
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-red-600 dark:text-red-400"
                            onClick={() => handleOpenDelete(calc)}
                          >
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Controles de Paginação */}
        {filteredCalculations.length > 0 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Mostrando {startIndex + 1} a {Math.min(endIndex, filteredCalculations.length)} de {filteredCalculations.length} casos
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                disabled={currentPage === 1}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              <span className="text-sm text-gray-600 dark:text-gray-400">
                Página {currentPage} de {totalPages}
              </span>
              <button
                onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                disabled={currentPage === totalPages}
                className="px-3 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Próxima
              </button>
            </div>
          </div>
        )}
      </div>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Caso</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza de que deseja excluir este caso? Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              Cancelar
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              className="bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}