import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Plus, MoreVertical, Pencil, Trash2, Loader2, Package } from 'lucide-react';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

import { useProducts, type ProductService, type ProductServiceInsert } from '@/hooks/useProducts';

export const Route = createFileRoute('/_authenticated/crm/services')({
  component: ServicesPage,
});

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório'),
  description: z.string().optional(),
  default_fee_percentage: z.coerce.number().min(0, 'Mínimo 0%').max(100, 'Máximo 100%').optional().nullable(),
  active: z.boolean().default(true),
});

type FormValues = z.infer<typeof formSchema>;

function ServicesPage() {
  const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedService, setSelectedService] = useState<ProductService | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      default_fee_percentage: null,
      active: true,
    },
  });

  // Reset form when dialog closes or when editing a different service
  useEffect(() => {
    if (isDialogOpen && selectedService) {
      form.reset({
        name: selectedService.name,
        description: selectedService.description || '',
        default_fee_percentage: selectedService.default_fee_percentage,
        active: selectedService.active,
      });
    } else if (isDialogOpen && !selectedService) {
      form.reset({
        name: '',
        description: '',
        default_fee_percentage: null,
        active: true,
      });
    }
  }, [isDialogOpen, selectedService, form]);

  const handleOpenCreate = () => {
    setSelectedService(null);
    setIsDialogOpen(true);
  };

  const handleOpenEdit = (service: ProductService) => {
    setSelectedService(service);
    setIsDialogOpen(true);
  };

  const handleOpenDelete = (service: ProductService) => {
    setSelectedService(service);
    setIsDeleteDialogOpen(true);
  };

  const onSubmit = async (values: FormValues) => {
    setIsSubmitting(true);
    try {
      if (selectedService) {
        // Update existing
        const { error } = await updateProduct(selectedService.id, {
          name: values.name,
          description: values.description || null,
          default_fee_percentage: values.default_fee_percentage,
          active: values.active,
        });
        if (error) throw new Error(error);
        toast.success('Serviço atualizado com sucesso!');
      } else {
        // Create new
        const insertData: ProductServiceInsert = {
          name: values.name,
          description: values.description || null,
          default_fee_percentage: values.default_fee_percentage,
          active: values.active,
        };
        const { error } = await createProduct(insertData);
        if (error) throw new Error(error);
        toast.success('Serviço criado com sucesso!');
      }
      setIsDialogOpen(false);
      setSelectedService(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao salvar serviço');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedService) return;
    
    setIsSubmitting(true);
    try {
      const { error } = await deleteProduct(selectedService.id, true); // hard delete
      if (error) throw new Error(error);
      toast.success('Serviço excluído com sucesso!');
      setIsDeleteDialogOpen(false);
      setSelectedService(null);
    } catch (error: any) {
      toast.error(error.message || 'Erro ao excluir serviço');
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatPercentage = (value: number | null | undefined) => {
    if (value === null || value === undefined) return '-';
    return `${value}%`;
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="px-4 pt-4 pb-2 lg:px-6 lg:pt-6 lg:pb-2 border-b border-border mb-6">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
          <div className="flex flex-col">
            <h1 className="text-foreground font-bold text-2xl whitespace-nowrap">
              Catálogo de Serviços
            </h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gerencie os produtos e serviços oferecidos pelo escritório
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={handleOpenCreate}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Novo Serviço
            </Button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 lg:px-6 pb-6 flex-1 overflow-auto">
        <div className="border border-border rounded-lg overflow-hidden bg-card">
          {loading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-32" />
                  </div>
                  <Skeleton className="h-6 w-16" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="p-12 text-center">
              <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-foreground mb-2">
                Nenhum serviço cadastrado
              </h3>
              <p className="text-muted-foreground mb-4">
                Comece adicionando os serviços que seu escritório oferece
              </p>
              <Button onClick={handleOpenCreate} className="gap-2">
                <Plus className="w-4 h-4" />
                Adicionar primeiro serviço
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[40%]">Nome</TableHead>
                  <TableHead className="w-[30%]">Descrição</TableHead>
                  <TableHead className="text-right">Honorários (%)</TableHead>
                  <TableHead className="text-center">Status</TableHead>
                  <TableHead className="w-12"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {products.map((service) => (
                  <TableRow key={service.id} className="group">
                    <TableCell className="font-medium text-foreground">
                      {service.name}
                    </TableCell>
                    <TableCell className="text-muted-foreground truncate max-w-[200px]">
                      {service.description || '-'}
                    </TableCell>
                    <TableCell className="text-right font-mono text-gray-700 dark:text-gray-300">
                      {formatPercentage(service.default_fee_percentage)}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge
                        variant={service.active ? 'default' : 'secondary'}
                        className={service.active 
                          ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200' 
                          : 'bg-gray-100 text-gray-600'
                        }
                      >
                        {service.active ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </TableCell>
                    <TableCell>
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
                          <DropdownMenuItem onClick={() => handleOpenEdit(service)}>
                            <Pencil className="w-4 h-4 mr-2" />
                            Editar
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() => handleOpenDelete(service)}
                            className="text-red-600 dark:text-red-400"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Excluir
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedService ? 'Editar Serviço' : 'Novo Serviço'}
            </DialogTitle>
            <DialogDescription>
              {selectedService
                ? 'Atualize as informações do serviço'
                : 'Adicione um novo serviço ao catálogo'}
            </DialogDescription>
          </DialogHeader>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome *</FormLabel>
                    <FormControl>
                      <Input placeholder="Ex: Revisional de Veículo" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Descrição</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Descrição opcional do serviço..."
                        className="resize-none"
                        rows={3}
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="default_fee_percentage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Honorários Padrão (%)</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Input
                          type="number"
                          min={0}
                          max={100}
                          step={0.5}
                          placeholder="30"
                          className="pr-8"
                          {...field}
                          value={field.value ?? ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            field.onChange(val === '' ? null : parseFloat(val));
                          }}
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
                          %
                        </span>
                      </div>
                    </FormControl>
                    <FormDescription>
                      Percentual sugerido de honorários para este serviço
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="active"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>Serviço Ativo</FormLabel>
                      <FormDescription>
                        Serviços inativos não aparecem nas seleções
                      </FormDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setIsDialogOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Salvando...
                    </>
                  ) : selectedService ? (
                    'Salvar Alterações'
                  ) : (
                    'Criar Serviço'
                  )}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="text-red-600">Excluir Serviço</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir o serviço{' '}
              <strong>"{selectedService?.name}"</strong>?
              <br /><br />
              Esta ação não pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleConfirmDelete}
              disabled={isSubmitting}
              className="bg-red-600 hover:bg-red-700"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Excluindo...
                </>
              ) : (
                'Excluir'
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
