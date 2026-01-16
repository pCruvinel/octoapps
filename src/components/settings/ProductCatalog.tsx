'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { 
    Plus, 
    Pencil, 
    Trash2, 
    Package, 
    Loader2,
    GripVertical,
    Percent
} from 'lucide-react';
import { toast } from 'sonner';
import { useProducts, ProductService, ProductServiceInsert, ProductServiceUpdate } from '@/hooks/useProducts';

/**
 * Componente para gerenciar o catálogo de produtos/serviços
 * Usado na tela de Settings para permitir configuração de produtos vendidos
 */
export function ProductCatalog() {
    const { 
        products, 
        loading, 
        createProduct, 
        updateProduct, 
        deleteProduct 
    } = useProducts();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductService | null>(null);
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);

    // Form state
    const [formData, setFormData] = useState<ProductServiceInsert>({
        name: '',
        description: '',
        default_fee_percentage: undefined,
        active: true,
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            default_fee_percentage: undefined,
            active: true,
        });
        setEditingProduct(null);
    };

    const handleOpenCreate = () => {
        resetForm();
        setIsDialogOpen(true);
    };

    const handleOpenEdit = (product: ProductService) => {
        setEditingProduct(product);
        setFormData({
            name: product.name,
            description: product.description || '',
            default_fee_percentage: product.default_fee_percentage ?? undefined,
            active: product.active,
        });
        setIsDialogOpen(true);
    };

    const handleOpenDelete = (productId: string) => {
        setProductToDelete(productId);
        setIsDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Nome do produto é obrigatório');
            return;
        }

        setSaving(true);
        try {
            if (editingProduct) {
                const updates: ProductServiceUpdate = {
                    name: formData.name,
                    description: formData.description || null,
                    default_fee_percentage: formData.default_fee_percentage ?? null,
                    active: formData.active,
                };
                const { error } = await updateProduct(editingProduct.id, updates);
                if (error) throw new Error(error);
                toast.success('Produto atualizado com sucesso!');
            } else {
                const { error } = await createProduct(formData);
                if (error) throw new Error(error);
                toast.success('Produto criado com sucesso!');
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao salvar produto');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!productToDelete) return;

        setSaving(true);
        try {
            const { error } = await deleteProduct(productToDelete, false); // soft delete
            if (error) throw new Error(error);
            toast.success('Produto removido com sucesso!');
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
        } catch (error) {
            toast.error(error instanceof Error ? error.message : 'Erro ao remover produto');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle className="flex items-center gap-2">
                        <Package className="w-5 h-5" />
                        Catálogo de Produtos/Serviços
                    </CardTitle>
                    <CardDescription>
                        Configure os produtos e serviços oferecidos pelo seu escritório
                    </CardDescription>
                </div>
                <Button onClick={handleOpenCreate} className="gap-2">
                    <Plus className="w-4 h-4" />
                    Novo Produto
                </Button>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-8 text-gray-500">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p>Nenhum produto cadastrado</p>
                        <p className="text-sm">Clique em "Novo Produto" para começar</p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-8"></TableHead>
                                <TableHead>Nome</TableHead>
                                <TableHead>Descrição</TableHead>
                                <TableHead className="text-center">% Honorários</TableHead>
                                <TableHead className="text-center">Status</TableHead>
                                <TableHead className="text-right">Ações</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {products.map((product) => (
                                <TableRow key={product.id}>
                                    <TableCell className="cursor-grab">
                                        <GripVertical className="w-4 h-4 text-gray-400" />
                                    </TableCell>
                                    <TableCell className="font-medium">{product.name}</TableCell>
                                    <TableCell className="text-gray-500 max-w-xs truncate">
                                        {product.description || '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        {product.default_fee_percentage ? (
                                            <Badge variant="outline" className="gap-1">
                                                <Percent className="w-3 h-3" />
                                                {product.default_fee_percentage}%
                                            </Badge>
                                        ) : '-'}
                                    </TableCell>
                                    <TableCell className="text-center">
                                        <Badge variant={product.active ? 'default' : 'secondary'}>
                                            {product.active ? 'Ativo' : 'Inativo'}
                                        </Badge>
                                    </TableCell>
                                    <TableCell className="text-right">
                                        <div className="flex justify-end gap-2">
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenEdit(product)}
                                            >
                                                <Pencil className="w-4 h-4" />
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                onClick={() => handleOpenDelete(product.id)}
                                                className="text-red-500 hover:text-red-600"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct ? 'Editar Produto' : 'Novo Produto'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingProduct 
                                ? 'Atualize as informações do produto'
                                : 'Preencha os dados do novo produto/serviço'
                            }
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Revisional Veículo"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                placeholder="Descrição do produto/serviço..."
                                value={formData.description || ''}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                rows={3}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="fee">Percentual de Honorários Padrão</Label>
                            <div className="relative">
                                <Input
                                    id="fee"
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="0.5"
                                    placeholder="Ex: 30"
                                    value={formData.default_fee_percentage ?? ''}
                                    onChange={(e) => setFormData({ 
                                        ...formData, 
                                        default_fee_percentage: e.target.value ? parseFloat(e.target.value) : undefined 
                                    })}
                                    className="pr-8"
                                />
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">%</span>
                            </div>
                            <p className="text-xs text-gray-500">
                                Este percentual será sugerido ao criar novas oportunidades
                            </p>
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="active">Ativo</Label>
                                <p className="text-xs text-gray-500">
                                    Produtos inativos não aparecem nas seleções
                                </p>
                            </div>
                            <Switch
                                id="active"
                                checked={formData.active}
                                onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            {editingProduct ? 'Atualizar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja remover este produto? 
                            Ele será marcado como inativo e não aparecerá mais nas seleções.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                            Cancelar
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={saving}>
                            {saving && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Remover
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </Card>
    );
}
