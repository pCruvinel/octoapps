'use client';

import * as React from 'react';
import { Check, ChevronsUpDown, Loader2, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { supabase } from '@/lib/supabase';

interface Contact {
  id: string;
  nome_completo: string;
  email: string | null;
  telefone_principal?: string | null;
}

interface ContactComboboxProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
  className?: string;
}

/**
 * Combobox de Contatos com busca assíncrona no Supabase
 * Substitui o Select tradicional para melhor performance com muitos registros
 */
export function ContactCombobox({
  value,
  onChange,
  disabled = false,
  placeholder = 'Selecione um contato...',
  className,
}: ContactComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [contacts, setContacts] = React.useState<Contact[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [selectedContact, setSelectedContact] = React.useState<Contact | null>(null);
  
  // Debounce timer ref
  const debounceRef = React.useRef<NodeJS.Timeout | null>(null);

  // Load selected contact details on mount if value exists
  React.useEffect(() => {
    if (value && !selectedContact) {
      loadContactById(value);
    }
  }, [value]);

  const loadContactById = async (id: string) => {
    try {
      const { data, error } = await supabase
        .from('contatos')
        .select('id, nome_completo, email, telefone_principal')
        .eq('id', id)
        .single();

      if (!error && data) {
        setSelectedContact(data);
      }
    } catch (err) {
      console.error('Error loading contact:', err);
    }
  };

  const searchContacts = async (query: string) => {
    setLoading(true);
    try {
      let queryBuilder = supabase
        .from('contatos')
        .select('id, nome_completo, email, telefone_principal')
        .eq('ativo', true)
        .order('nome_completo')
        .limit(20);

      if (query.trim()) {
        // Busca por nome, email ou telefone
        queryBuilder = queryBuilder.or(
          `nome_completo.ilike.%${query}%,email.ilike.%${query}%,telefone_principal.ilike.%${query}%`
        );
      }

      const { data, error } = await queryBuilder;

      if (error) throw error;
      setContacts(data || []);
    } catch (err) {
      console.error('Error searching contacts:', err);
      setContacts([]);
    } finally {
      setLoading(false);
    }
  };

  // Debounced search
  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      searchContacts(query);
    }, 300);
  };

  // Load initial contacts when popover opens
  React.useEffect(() => {
    if (open) {
      searchContacts(searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const handleSelect = (contact: Contact) => {
    setSelectedContact(contact);
    onChange(contact.id);
    setOpen(false);
    setSearchQuery('');
  };

  const displayValue = selectedContact?.nome_completo || placeholder;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          disabled={disabled}
          className={cn(
            'w-full justify-between font-normal',
            !selectedContact && 'text-muted-foreground',
            disabled && 'opacity-70 cursor-not-allowed',
            className
          )}
        >
          <span className="flex items-center gap-2 truncate">
            {selectedContact && <User className="h-4 w-4 shrink-0 text-muted-foreground" />}
            <span className="truncate">{displayValue}</span>
          </span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Buscar por nome, email ou telefone..."
            value={searchQuery}
            onValueChange={handleSearchChange}
          />
          <CommandList>
            {loading ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : contacts.length === 0 ? (
              <CommandEmpty>
                {searchQuery ? 'Nenhum contato encontrado.' : 'Digite para buscar...'}
              </CommandEmpty>
            ) : (
              <CommandGroup>
                {contacts.map((contact) => (
                  <CommandItem
                    key={contact.id}
                    value={contact.id}
                    onSelect={() => handleSelect(contact)}
                    className="flex flex-col items-start gap-0.5 py-2"
                  >
                    <div className="flex w-full items-center">
                      <Check
                        className={cn(
                          'mr-2 h-4 w-4 shrink-0',
                          value === contact.id ? 'opacity-100' : 'opacity-0'
                        )}
                      />
                      <span className="font-medium">{contact.nome_completo}</span>
                    </div>
                    {(contact.email || contact.telefone_principal) && (
                      <span className="ml-6 text-xs text-muted-foreground">
                        {contact.email || contact.telefone_principal}
                      </span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
