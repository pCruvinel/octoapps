'use client';

import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Loader2, User, Building2, Mail, Phone, Tag, MapPin } from 'lucide-react';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '../ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Tabs, TabsList, TabsTrigger } from '../ui/tabs';
import { toast } from 'sonner';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import type { Contact } from '../../types/contact';

// Validation Schema
const contactFormSchema = z.object({
    nome_completo: z.string().min(2, 'Nome deve ter pelo menos 2 caracteres'),
    email: z.string().email('Email inválido').or(z.literal('')),
    telefone_principal: z.string().optional(),
    cpf_cnpj: z.string().optional(),
    categoria_contato: z.enum(['LEAD', 'CLIENTE', 'EX_CLIENTE']),
    tipo: z.enum(['PF', 'PJ']),
    // Address fields
    cep: z.string().optional(),
    endereco: z.string().optional(),
    numero: z.string().optional(),
    complemento: z.string().optional(),
    bairro: z.string().optional(),
    cidade: z.string().optional(),
    estado: z.string().optional(),
});

type ContactFormData = z.infer<typeof contactFormSchema>;

interface ContactFormDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    contact?: Contact | null; // If provided, we're in edit mode
    onSuccess: () => void;
}

// CPF/CNPJ Mask helper
const formatDocument = (value: string, tipo: 'PF' | 'PJ'): string => {
    const numbers = value.replace(/\D/g, '');
    if (tipo === 'PJ') {
        // CNPJ: 00.000.000/0000-00
        return numbers
            .replace(/^(\d{2})(\d)/, '$1.$2')
            .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
            .replace(/\.(\d{3})(\d)/, '.$1/$2')
            .replace(/(\d{4})(\d)/, '$1-$2')
            .substring(0, 18);
    }
    // CPF: 000.000.000-00
    return numbers
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
        .substring(0, 14);
};

// Phone Mask helper
const formatPhone = (value: string): string => {
    const numbers = value.replace(/\D/g, '');
    if (numbers.length <= 10) {
        return numbers
            .replace(/(\d{2})(\d)/, '($1) $2')
            .replace(/(\d{4})(\d)/, '$1-$2');
    }
    return numbers
        .replace(/(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{5})(\d)/, '$1-$2')
        .substring(0, 15);
};

export function ContactFormDialog({
    open,
    onOpenChange,
    contact,
    onSuccess,
}: ContactFormDialogProps) {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const isEditMode = !!contact;

    const form = useForm<ContactFormData>({
        resolver: zodResolver(contactFormSchema),
        defaultValues: {
            nome_completo: '',
            email: '',
            telefone_principal: '',
            cpf_cnpj: '',
            categoria_contato: 'LEAD',
            tipo: 'PF',
            cep: '',
            endereco: '',
            numero: '',
            complemento: '',
            bairro: '',
            cidade: '',
            estado: '',
        },
    });

    const watchTipo = form.watch('tipo');

    // Reset form when dialog opens/closes or contact changes
    useEffect(() => {
        if (open) {
            if (contact) {
                // Edit mode
                const isPJ = contact.tipo === 'Pessoa Jurídica' ||
                    (contact.cpf_cnpj?.replace(/\D/g, '').length || 0) > 11;
                form.reset({
                    nome_completo: contact.nome_completo || '',
                    email: contact.email || '',
                    telefone_principal: contact.telefone_principal || '',
                    cpf_cnpj: contact.cpf_cnpj || '',
                    categoria_contato: (contact.categoria_contato as 'LEAD' | 'CLIENTE' | 'EX_CLIENTE') || 'LEAD',
                    tipo: isPJ ? 'PJ' : 'PF',
                    cep: contact.cep || '',
                    endereco: contact.endereco || '',
                    numero: contact.numero || '',
                    complemento: contact.complemento || '',
                    bairro: contact.bairro || '',
                    cidade: contact.cidade || '',
                    estado: contact.estado || '',
                });
            } else {
                // Create mode
                form.reset({
                    nome_completo: '',
                    email: '',
                    telefone_principal: '',
                    cpf_cnpj: '',
                    categoria_contato: 'LEAD',
                    tipo: 'PF',
                    cep: '',
                    endereco: '',
                    numero: '',
                    complemento: '',
                    bairro: '',
                    cidade: '',
                    estado: '',
                });
            }
        }
    }, [open, contact, form]);

    const onSubmit = async (values: ContactFormData) => {
        setLoading(true);
        try {
            const payload = {
                nome_completo: values.nome_completo.trim(),
                email: values.email || null,
                telefone_principal: values.telefone_principal || null,
                cpf_cnpj: values.cpf_cnpj || null,
                categoria_contato: values.categoria_contato,
                tipo: values.tipo === 'PJ' ? 'Pessoa Jurídica' : 'Pessoa Física',
                cep: values.cep || null,
                endereco: values.endereco || null,
                numero: values.numero || null,
                complemento: values.complemento || null,
                bairro: values.bairro || null,
                cidade: values.cidade || null,
                estado: values.estado || null,
                data_atualizacao: new Date().toISOString(),
            };

            if (isEditMode && contact) {
                const { error } = await supabase
                    .from('contatos')
                    .update(payload)
                    .eq('id', contact.id);

                if (error) throw error;
                toast.success('Contato atualizado com sucesso!');
            } else {
                const { error } = await supabase.from('contatos').insert({
                    ...payload,
                    criado_por: user?.id,
                    responsavel_id: user?.id,
                });

                if (error) throw error;
                toast.success('Contato criado com sucesso!');
            }

            onSuccess();
            onOpenChange(false);
        } catch (error: any) {
            console.error('Error saving contact:', error);
            toast.error(error.message || 'Erro ao salvar contato');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg">
                <DialogHeader className="pb-4 border-b border-slate-100">
                    <DialogTitle className="flex items-center gap-3 text-xl">
                        {watchTipo === 'PJ' ? (
                            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                                <Building2 className="w-5 h-5 text-blue-600" />
                            </div>
                        ) : (
                            <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center">
                                <User className="w-5 h-5 text-slate-600" />
                            </div>
                        )}
                        {isEditMode ? 'Editar Contato' : 'Novo Contato'}
                    </DialogTitle>
                    <DialogDescription>
                        {isEditMode
                            ? 'Atualize as informações do contato'
                            : 'Preencha os dados para criar um novo contato'}
                    </DialogDescription>
                </DialogHeader>

                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-4">
                        {/* Tipo Toggle */}
                        <FormField
                            control={form.control}
                            name="tipo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Tipo de Pessoa</FormLabel>
                                    <FormControl>
                                        <Tabs
                                            value={field.value}
                                            onValueChange={(v) => {
                                                field.onChange(v);
                                                form.setValue('cpf_cnpj', ''); // Clear document when type changes
                                            }}
                                            className="w-full"
                                        >
                                            <TabsList className="grid w-full grid-cols-2 bg-slate-100">
                                                <TabsTrigger
                                                    value="PF"
                                                    className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                                >
                                                    <User className="w-4 h-4" />
                                                    Pessoa Física
                                                </TabsTrigger>
                                                <TabsTrigger
                                                    value="PJ"
                                                    className="gap-2 data-[state=active]:bg-white data-[state=active]:shadow-sm"
                                                >
                                                    <Building2 className="w-4 h-4" />
                                                    Pessoa Jurídica
                                                </TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    </FormControl>
                                </FormItem>
                            )}
                        />

                        {/* Nome */}
                        <FormField
                            control={form.control}
                            name="nome_completo"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>
                                        {watchTipo === 'PJ' ? 'Razão Social' : 'Nome Completo'} *
                                    </FormLabel>
                                    <FormControl>
                                        <div className="relative">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                            <Input
                                                {...field}
                                                placeholder={
                                                    watchTipo === 'PJ'
                                                        ? 'Nome da empresa'
                                                        : 'Nome do contato'
                                                }
                                                className="pl-10"
                                            />
                                        </div>
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* CPF/CNPJ */}
                        <FormField
                            control={form.control}
                            name="cpf_cnpj"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>{watchTipo === 'PJ' ? 'CNPJ' : 'CPF'}</FormLabel>
                                    <FormControl>
                                        <Input
                                            {...field}
                                            placeholder={
                                                watchTipo === 'PJ'
                                                    ? '00.000.000/0000-00'
                                                    : '000.000.000-00'
                                            }
                                            onChange={(e) =>
                                                field.onChange(formatDocument(e.target.value, watchTipo))
                                            }
                                            className="font-mono"
                                        />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Email & Telefone - Grid */}
                        <div className="grid grid-cols-2 gap-4">
                            <FormField
                                control={form.control}
                                name="email"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>E-mail</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    {...field}
                                                    type="email"
                                                    placeholder="email@exemplo.com"
                                                    className="pl-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />

                            <FormField
                                control={form.control}
                                name="telefone_principal"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Telefone</FormLabel>
                                        <FormControl>
                                            <div className="relative">
                                                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                                <Input
                                                    {...field}
                                                    placeholder="(00) 00000-0000"
                                                    onChange={(e) =>
                                                        field.onChange(formatPhone(e.target.value))
                                                    }
                                                    className="pl-10"
                                                />
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        </div>

                        {/* Categoria */}
                        <FormField
                            control={form.control}
                            name="categoria_contato"
                            render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Categoria *</FormLabel>
                                    <div className="relative">
                                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 z-10" />
                                        <Select onValueChange={field.onChange} value={field.value}>
                                            <FormControl>
                                                <SelectTrigger className="pl-10">
                                                    <SelectValue placeholder="Selecione a categoria" />
                                                </SelectTrigger>
                                            </FormControl>
                                            <SelectContent>
                                                <SelectItem value="LEAD">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-yellow-500" />
                                                        Lead
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="CLIENTE">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-green-500" />
                                                        Cliente
                                                    </div>
                                                </SelectItem>
                                                <SelectItem value="EX_CLIENTE">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-2 h-2 rounded-full bg-slate-400" />
                                                        Ex-Cliente
                                                    </div>
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </div>
                                    <FormMessage />
                                </FormItem>
                            )}
                        />

                        {/* Address Section */}
                        <div className="pt-4 border-t border-slate-100">
                            <div className="flex items-center gap-2 mb-4">
                                <MapPin className="w-4 h-4 text-slate-500" />
                                <span className="font-medium text-sm text-slate-700">Endereço</span>
                            </div>

                            <div className="grid grid-cols-3 gap-3">
                                <FormField
                                    control={form.control}
                                    name="cep"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">CEP</FormLabel>
                                            <FormControl>
                                                <Input
                                                    {...field}
                                                    placeholder="00000-000"
                                                    className="font-mono text-sm"
                                                    onChange={(e) => {
                                                        const value = e.target.value.replace(/\D/g, '').slice(0, 8);
                                                        field.onChange(value.replace(/(\d{5})(\d)/, '$1-$2'));
                                                    }}
                                                />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="endereco"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Logradouro</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Rua, Av..." className="text-sm" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-4 gap-3 mt-3">
                                <FormField
                                    control={form.control}
                                    name="numero"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Número</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Nº" className="text-sm" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <FormField
                                    control={form.control}
                                    name="complemento"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">Complemento</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="Apto, Sala..." className="text-sm" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="bairro"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Bairro</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Bairro" className="text-sm" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-3 gap-3 mt-3">
                                <div className="col-span-2">
                                    <FormField
                                        control={form.control}
                                        name="cidade"
                                        render={({ field }) => (
                                            <FormItem>
                                                <FormLabel className="text-xs">Cidade</FormLabel>
                                                <FormControl>
                                                    <Input {...field} placeholder="Cidade" className="text-sm" />
                                                </FormControl>
                                            </FormItem>
                                        )}
                                    />
                                </div>
                                <FormField
                                    control={form.control}
                                    name="estado"
                                    render={({ field }) => (
                                        <FormItem>
                                            <FormLabel className="text-xs">UF</FormLabel>
                                            <FormControl>
                                                <Input {...field} placeholder="UF" maxLength={2} className="text-sm uppercase" />
                                            </FormControl>
                                        </FormItem>
                                    )}
                                />
                            </div>
                        </div>

                        <DialogFooter className="pt-4 border-t border-slate-100">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => onOpenChange(false)}
                                disabled={loading}
                            >
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : isEditMode ? (
                                    'Salvar Alterações'
                                ) : (
                                    'Criar Contato'
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </Form>
            </DialogContent>
        </Dialog>
    );
}
