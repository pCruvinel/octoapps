import { createFileRoute } from '@tanstack/react-router';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Plus,
    Pencil,
    Trash2,
    Package,
    Loader2,
    GripVertical,
    Tags,
    Settings2,
} from 'lucide-react';
import { toast } from 'sonner';
import {
    useProducts,
    ProductService,
    ProductServiceInsert,
    ProductServiceUpdate,
} from '@/hooks/useProducts';
import {
    useServiceCategories,
} from '@/hooks/useServiceCategories';

export const Route = createFileRoute('/_authenticated/crm/services')({
    component: ServicesPage,
});

// Categorias padrão de serviços
const CATEGORIAS = [
    'Revisional',
    'Emprestimo Pessoal',
    'Financiamento Veícular',
    'Financiamento Imobiliário',
    'Cartão de Crédito',
    'Consultoria',
    'Outros',
];

function ServicesPage() {
    const {
        products,
        loading,
        createProduct,
        updateProduct,
        deleteProduct,
    } = useProducts();

    const {
        categories,
        createCategory,
        deleteCategory,
    } = useServiceCategories();

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState<ProductService | null>(
        null
    );
    const [productToDelete, setProductToDelete] = useState<string | null>(null);
    const [saving, setSaving] = useState(false);
    const [categoryFilter, setCategoryFilter] = useState<string>('all');
    const [newCategoryName, setNewCategoryName] = useState('');

    // Form state
    const [formData, setFormData] = useState<
        ProductServiceInsert & { category?: string }
    >({
        name: '',
        description: '',
        default_fee_percentage: undefined,
        active: true,
        category: '',
    });

    const resetForm = () => {
        setFormData({
            name: '',
            description: '',
            default_fee_percentage: undefined,
            active: true,
            category: '',
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
            default_fee_percentage:
                product.default_fee_percentage ?? undefined,
            active: product.active,
            category: (product as any).category || '',
        });
        setIsDialogOpen(true);
    };

    const handleOpenDelete = (productId: string) => {
        setProductToDelete(productId);
        setIsDeleteDialogOpen(true);
    };

    const handleSave = async () => {
        if (!formData.name.trim()) {
            toast.error('Nome do serviço é obrigatório');
            return;
        }

        setSaving(true);
        try {
            if (editingProduct) {
                const updates: ProductServiceUpdate = {
                    name: formData.name,
                    description: formData.description || null,
                    category: formData.category || null,
                    default_fee_percentage:
                        formData.default_fee_percentage ?? null,
                    active: formData.active,
                };
                const { error } = await updateProduct(
                    editingProduct.id,
                    updates
                );
                if (error) throw new Error(error);
                toast.success('Serviço atualizado com sucesso!');
            } else {
                const { error } = await createProduct(formData);
                if (error) throw new Error(error);
                toast.success('Serviço criado com sucesso!');
            }
            setIsDialogOpen(false);
            resetForm();
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Erro ao salvar serviço'
            );
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
            toast.success('Serviço removido com sucesso!');
            setIsDeleteDialogOpen(false);
            setProductToDelete(null);
        } catch (error) {
            toast.error(
                error instanceof Error ? error.message : 'Erro ao remover serviço'
            );
        } finally {
            setSaving(false);
        }
    };

    // Filter products by category
    const filteredProducts =
        categoryFilter === 'all'
            ? products
            : products.filter((p) => (p as any).category === categoryFilter);

    // All unique categories from products + custom categories
    const allCategories = [
        ...CATEGORIAS,
        ...categories.map((c) => c.name),
    ].filter((v, i, a) => a.indexOf(v) === i); // unique

    const handleAddCategory = async () => {
        if (!newCategoryName.trim()) {
            toast.error('Nome da categoria é obrigatório');
            return;
        }
        setSaving(true);
        try {
            const { error } = await createCategory({
                name: newCategoryName.trim(),
            });
            if (error) throw new Error(error);
            toast.success('Categoria criada!');
            setNewCategoryName('');
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Erro ao criar categoria'
            );
        } finally {
            setSaving(false);
        }
    };

    const handleDeleteCategory = async (id: string) => {
        try {
            const { error } = await deleteCategory(id);
            if (error) throw new Error(error);
            toast.success('Categoria removida!');
        } catch (err) {
            toast.error(
                err instanceof Error ? err.message : 'Erro ao remover categoria'
            );
        }
    };

    return (
        <div className="h-full flex flex-col">
            {/* Standard Page Header */}
            <div className="px-4 pt-4 pb-2 lg:px-6 lg:pt-6 lg:pb-2 border-b border-border">
                <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
                    {/* Left Side: Title + Description */}
                    <div className="flex flex-col">
                        <h1 className="text-foreground font-bold text-2xl whitespace-nowrap">
                            Catálogo de Serviços
                        </h1>
                        <p className="text-muted-foreground text-sm mt-1">
                            Gerencie os produtos e serviços que seu escritório oferece.
                        </p>
                    </div>

                    {/* Right Side: Filters + Actions */}
                    <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 w-full xl:w-auto">
                        {/* Category Filter */}
                        <Select
                            value={categoryFilter}
                            onValueChange={setCategoryFilter}
                        >
                            <SelectTrigger className="w-[180px] bg-background">
                                <Tags className="w-4 h-4 mr-2" />
                                <SelectValue placeholder="Filtrar categoria" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">
                                    Todas categorias
                                </SelectItem>
                                {allCategories.map((cat) => (
                                    <SelectItem key={cat} value={cat}>
                                        {cat}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>

                        {/* Manage Categories Button */}
                        <Button
                            variant="outline"
                            onClick={() => setIsCategoryDialogOpen(true)}
                            className="gap-2 bg-background"
                        >
                            <Settings2 className="w-4 h-4" />
                            Categorias
                        </Button>

                        {/* New Service Button */}
                        <Button onClick={handleOpenCreate} className="gap-2">
                            <Plus className="w-4 h-4" />
                            Novo Serviço
                        </Button>
                    </div>
                </div>
            </div>

            {/* Content Area */}
            <div className="flex-1 overflow-auto p-4 lg:p-6 bg-muted/10">
                {loading ? (
                    <div className="flex items-center justify-center py-8">
                        <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="text-center py-16 text-gray-500 bg-background rounded-md border border-dashed">
                        <Package className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                        <p className="text-lg font-medium">
                            Nenhum serviço cadastrado
                        </p>
                        <p className="text-sm text-muted-foreground">
                            Clique em "Novo Serviço" para começar
                        </p>
                    </div>
                ) : (
                    <div className="rounded-md border bg-background">
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead className="w-8"></TableHead>
                                    <TableHead>Nome</TableHead>
                                    <TableHead>Categoria</TableHead>
                                    <TableHead>Descrição</TableHead>

                                    <TableHead className="text-center">
                                        Status
                                    </TableHead>
                                    <TableHead className="text-right">
                                        Ações
                                    </TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredProducts.map((product) => (
                                    <TableRow key={product.id}>
                                        <TableCell className="cursor-grab">
                                            <GripVertical className="w-4 h-4 text-gray-400" />
                                        </TableCell>
                                        <TableCell className="font-medium">
                                            {product.name}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground">
                                            {(product as any).category || '-'}
                                        </TableCell>
                                        <TableCell className="text-muted-foreground max-w-xs truncate">
                                            {product.description || '-'}
                                        </TableCell>

                                        <TableCell className="text-center">
                                            <Badge
                                                variant={
                                                    product.active
                                                        ? 'default'
                                                        : 'secondary'
                                                }
                                            >
                                                {product.active
                                                    ? 'Ativo'
                                                    : 'Inativo'}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="text-right">
                                            <div className="flex justify-end gap-2">
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleOpenEdit(product)
                                                    }
                                                >
                                                    <Pencil className="w-4 h-4" />
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="icon"
                                                    onClick={() =>
                                                        handleOpenDelete(
                                                            product.id
                                                        )
                                                    }
                                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                )}
            </div>

            {/* Create/Edit Dialog */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingProduct
                                ? 'Editar Serviço'
                                : 'Novo Serviço'}
                        </DialogTitle>
                        <DialogDescription>
                            {editingProduct
                                ? 'Atualize as informações do serviço'
                                : 'Preencha os dados do novo serviço'}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="name">Nome *</Label>
                            <Input
                                id="name"
                                placeholder="Ex: Revisional Veículo"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        name: e.target.value,
                                    })
                                }
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="category">Categoria</Label>
                            <Select
                                value={formData.category || ''}
                                onValueChange={(value) =>
                                    setFormData({
                                        ...formData,
                                        category: value,
                                    })
                                }
                            >
                                <SelectTrigger id="category">
                                    <SelectValue placeholder="Selecione a categoria" />
                                </SelectTrigger>
                                <SelectContent>
                                    {CATEGORIAS.map((cat) => (
                                        <SelectItem key={cat} value={cat}>
                                            {cat}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="description">Descrição</Label>
                            <Textarea
                                id="description"
                                placeholder="Descrição do serviço..."
                                value={formData.description || ''}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        description: e.target.value,
                                    })
                                }
                                rows={3}
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label htmlFor="active">Ativo</Label>
                                <p className="text-xs text-gray-500">
                                    Serviços inativos não aparecem nas
                                    seleções
                                </p>
                            </div>
                            <Switch
                                id="active"
                                checked={formData.active}
                                onCheckedChange={(checked) =>
                                    setFormData({
                                        ...formData,
                                        active: checked,
                                    })
                                }
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            {saving && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            {editingProduct ? 'Atualizar' : 'Criar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete Confirmation Dialog */}
            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={setIsDeleteDialogOpen}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirmar Exclusão</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja remover este serviço? Ele
                            será marcado como inativo e não aparecerá mais
                            nas seleções.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsDeleteDialogOpen(false)}
                        >
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDelete}
                            disabled={saving}
                        >
                            {saving && (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                            )}
                            Remover
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Category Management Dialog */}
            <Dialog
                open={isCategoryDialogOpen}
                onOpenChange={setIsCategoryDialogOpen}
            >
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Tags className="w-5 h-5" />
                            Gerenciar Categorias
                        </DialogTitle>
                        <DialogDescription>
                            Crie e gerencie categorias personalizadas para
                            seus serviços.
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        {/* Add new category */}
                        <div className="flex gap-2">
                            <Input
                                placeholder="Nova categoria..."
                                value={newCategoryName}
                                onChange={(e) =>
                                    setNewCategoryName(e.target.value)
                                }
                                onKeyDown={(e) =>
                                    e.key === 'Enter' && handleAddCategory()
                                }
                            />
                            <Button
                                onClick={handleAddCategory}
                                disabled={saving}
                                size="icon"
                            >
                                {saving ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                ) : (
                                    <Plus className="w-4 h-4" />
                                )}
                            </Button>
                        </div>

                        {/* Default categories */}
                        <div className="space-y-2">
                            <Label className="text-xs text-muted-foreground">
                                Categorias Padrão
                            </Label>
                            <div className="flex flex-wrap gap-2">
                                {CATEGORIAS.map((cat) => (
                                    <Badge key={cat} variant="secondary">
                                        {cat}
                                    </Badge>
                                ))}
                            </div>
                        </div>

                        {/* Custom categories */}
                        {categories.length > 0 && (
                            <div className="space-y-2">
                                <Label className="text-xs text-muted-foreground">
                                    Categorias Personalizadas
                                </Label>
                                <div className="space-y-2">
                                    {categories.map((cat) => (
                                        <div
                                            key={cat.id}
                                            className="flex items-center justify-between bg-muted rounded-md px-3 py-2"
                                        >
                                            <span className="text-sm">
                                                {cat.name}
                                            </span>
                                            <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-7 w-7 text-muted-foreground hover:text-destructive"
                                                onClick={() =>
                                                    handleDeleteCategory(
                                                        cat.id
                                                    )
                                                }
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </Button>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <DialogFooter>
                        <Button
                            variant="outline"
                            onClick={() => setIsCategoryDialogOpen(false)}
                        >
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
