'use client';

import { useState } from 'react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Plus, Search, MoreVertical, Home, CreditCard, DollarSign, FileText } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '../ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '../ui/alert-dialog';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../ui/dropdown-menu';
import { Badge } from '../ui/badge';
import { toast } from 'sonner@2.0.3';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

interface CalculationsListProps {
  onNavigate: (route: string, id?: string) => void;
}

export function CalculationsList({ onNavigate }: CalculationsListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedCaseId, setSelectedCaseId] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('');

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
    },
    {
      id: 'analise',
      title: 'Análise Prévia',
      description: 'Verifique a viabilidade financeira e jurídica do caso em poucos minutos.',
      icon: FileText,
      route: 'calc-analise'
    }
  ];

  const [calculations, setCalculations] = useState([
    { id: '1', clientName: 'Ana Silva', contract: '2024-C001', type: 'Financiamento Imobiliário', date: '08/09/2025', status: 'Pendente' },
    { id: '2', clientName: 'Pedro Santos', contract: '2024-C001', type: 'Empréstimos e Financiamentos', date: '08/09/2025', status: 'Em Análise' },
    { id: '3', clientName: 'Juliana Lima', contract: '2024-C001', type: 'Cartão de Crédito', date: '08/09/2025', status: 'Concluído' },
    { id: '4', clientName: 'Lucas Oliveira', contract: '2024-C001', type: 'Empréstimos e Financiamentos', date: '08/09/2025', status: 'Pendente' },
    { id: '5', clientName: 'Mariana Costa', contract: '2024-C001', type: 'Financiamento Imobiliário', date: '08/09/2025', status: 'Em Análise' },
    { id: '6', clientName: 'Carlos Ferreira', contract: '2024-C001', type: 'Cartão de Crédito', date: '08/09/2025', status: 'Concluído' },
    { id: '7', clientName: 'Patrícia Gomes', contract: '2024-C001', type: 'Empréstimos e Financiamentos', date: '08/09/2025', status: 'Pendente' },
    { id: '8', clientName: 'Bruno Rodrigues', contract: '2024-C001', type: 'Empréstimos e Financiamentos', date: '08/09/2025', status: 'Concluído' },
  ]);

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

  const handleOpenDelete = (id: string) => {
    setSelectedCaseId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleEdit = (id: string, type: string) => {
    const routes: Record<string, string> = {
      'Financiamento Imobiliário': 'calc-financiamento',
      'Cartão de Crédito': 'calc-cartao',
      'Empréstimos e Financiamentos': 'calc-emprestimos',
    };
    
    onNavigate(routes[type], id);
  };

  const handleConfirmDelete = () => {
    if (selectedCaseId) {
      setCalculations(prev => prev.filter(calc => calc.id !== selectedCaseId));
      toast.success('Caso excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedCaseId(null);
    }
  };

  const filteredCalculations = calculations.filter(calc =>
    calc.clientName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    calc.contract.includes(searchTerm) ||
    calc.type.toLowerCase().includes(searchTerm.toLowerCase())
  );

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
        <h2 className="text-gray-900 dark:text-white mb-4">Opções de Cálculo</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {calculationOptions.map(option => {
            const Icon = option.icon;
            return (
              <button
                key={option.id}
                onClick={() => onNavigate(option.route)}
                className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-lg p-4 text-left hover:shadow-md transition-shadow"
              >
                <div className="flex items-start gap-4 mb-3">
                  <div className="bg-blue-500 dark:bg-blue-600 rounded-lg p-3 shrink-0">
                    <Icon className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-gray-900 dark:text-white flex-1">
                    {option.title}
                  </h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
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
              {filteredCalculations.map(calc => (
                <TableRow key={calc.id}>
                  <TableCell>{calc.id}</TableCell>
                  <TableCell className="text-gray-900 dark:text-white">{calc.clientName}</TableCell>
                  <TableCell>{calc.contract}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{calc.type}</Badge>
                  </TableCell>
                  <TableCell>{calc.date}</TableCell>
                  <TableCell>
                    <Badge variant={calc.status === 'Concluído' ? 'default' : 'secondary'}>
                      {calc.status}
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
                        <DropdownMenuItem onClick={() => onNavigate('calc-analise', calc.id)}>
                          Visualizar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleEdit(calc.id, calc.type)}>
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          className="text-red-600 dark:text-red-400"
                          onClick={() => handleOpenDelete(calc.id)}
                        >
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>

      {filteredCalculations.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 dark:text-gray-400">
            Nenhum caso encontrado
          </p>
        </div>
      )}

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