import { useMemo } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { MoreVertical, ExternalLink, Archive, Trash2 } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  TableFooter,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import type { Opportunity } from '@/types/opportunity';

interface OpportunitiesDataTableProps {
  opportunities: Opportunity[];
  loading?: boolean;
  onNavigate: (route: string, id?: string) => void;
  onEdit?: (opp: Opportunity) => void;
  onDelete?: (opp: Opportunity) => void;
  onArchive?: (opp: Opportunity) => void;
  etapas?: Array<{ id: string; nome: string; cor: string }>;
}

export function OpportunitiesDataTable({
  opportunities,
  loading = false,
  onNavigate,
  onEdit,
  onDelete,
  onArchive,
  etapas = [],
}: OpportunitiesDataTableProps) {

  const formatCurrency = (value: number | null | undefined) => {
    if (!value) return '-';
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return '-';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
    } catch {
      return '-';
    }
  };

  const getEtapa = (etapaId: string | null | undefined) => {
    if (!etapaId) return null;
    return etapas.find(e => e.id === etapaId);
  };

  // Sort opportunities by date (newest first)
  const sortedOpportunities = useMemo(() => {
    return [...opportunities].sort((a, b) => {
      const dateA = new Date(a.data_criacao || 0).getTime();
      const dateB = new Date(b.data_criacao || 0).getTime();
      return dateB - dateA;
    });
  }, [opportunities]);

  // Calculate totals
  const totals = useMemo(() => {
    return opportunities.reduce(
      (acc, opp) => ({
        count: acc.count + 1,
        valorProposta: acc.valorProposta + (opp.valor_proposta || 0),
        valorCausa: acc.valorCausa + (opp.valor_causa || 0),
      }),
      { count: 0, valorProposta: 0, valorCausa: 0 }
    );
  }, [opportunities]);

  if (loading) {
    return (
      <div className="border rounded-lg overflow-hidden bg-card">
        <div className="p-6 space-y-4">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="flex items-center gap-4">
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-4 w-[100px]" />
              <Skeleton className="h-4 w-[80px]" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (opportunities.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden bg-card p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">
          Nenhuma oportunidade encontrada
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden bg-card">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="w-[25%]">Oportunidade</TableHead>
            <TableHead className="w-[15%]">Contato</TableHead>
            <TableHead className="w-[12%]">Etapa</TableHead>
            <TableHead className="text-right w-[12%]">Valor Proposta</TableHead>
            <TableHead className="text-right w-[12%]">Valor Causa</TableHead>
            <TableHead className="w-[10%]">Responsável</TableHead>
            <TableHead className="w-[10%]">Criado em</TableHead>
            <TableHead className="w-12"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedOpportunities.map((opp) => {
            const etapa = getEtapa(opp.etapa_funil_id);
            return (
              <TableRow 
                key={opp.id} 
                className="group cursor-pointer hover:bg-muted/50"
                onClick={() => onNavigate('crm/oportunidade', opp.id)}
              >
                <TableCell className="font-medium text-foreground">
                  <div className="flex flex-col">
                    <span className="truncate max-w-[250px]">{opp.titulo}</span>
                    {opp.produto_servico && (
                      <span className="text-xs text-muted-foreground truncate">
                        {opp.produto_servico.name}
                      </span>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="truncate block max-w-[150px]">
                    {opp.contatos?.nome_completo || '-'}
                  </span>
                </TableCell>
                <TableCell>
                  {etapa ? (
                    <Badge
                      variant="outline"
                      style={{
                        backgroundColor: `${etapa.cor}20`,
                        color: etapa.cor,
                        borderColor: etapa.cor,
                      }}
                    >
                      {etapa.nome}
                    </Badge>
                  ) : (
                    <span className="text-muted-foreground">-</span>
                  )}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-foreground/80">
                  {formatCurrency(opp.valor_proposta)}
                </TableCell>
                <TableCell className="text-right font-mono text-sm text-foreground/80">
                  {formatCurrency(opp.valor_causa)}
                </TableCell>
                <TableCell className="text-muted-foreground">
                  <span className="truncate block max-w-[100px]">
                    {opp.responsavel?.nome_completo || '-'}
                  </span>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {formatDate(opp.data_criacao)}
                </TableCell>
                <TableCell onClick={(e) => e.stopPropagation()}>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => onNavigate('crm/oportunidade', opp.id)}>
                        <ExternalLink className="w-4 h-4 mr-2" />
                        Abrir Detalhes
                      </DropdownMenuItem>
                      {onArchive && (
                        <DropdownMenuItem onClick={() => onArchive(opp)}>
                          <Archive className="w-4 h-4 mr-2" />
                          Arquivar
                        </DropdownMenuItem>
                      )}
                      {onDelete && (
                        <DropdownMenuItem
                          onClick={() => onDelete(opp)}
                          className="text-red-600 dark:text-red-400"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
        <TableFooter>
          <TableRow className="bg-muted font-medium">
            <TableCell colSpan={3} className="text-foreground">
              <span className="font-semibold">{totals.count}</span>{' '}
              <span className="text-muted-foreground font-normal">
                {totals.count === 1 ? 'oportunidade' : 'oportunidades'}
              </span>
            </TableCell>
            <TableCell className="text-right font-mono text-sm text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.valorProposta)}
            </TableCell>
            <TableCell className="text-right font-mono text-sm text-foreground">
              {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totals.valorCausa)}
            </TableCell>
            <TableCell colSpan={3}></TableCell>
          </TableRow>
        </TableFooter>
      </Table>
    </div>
  );
}
