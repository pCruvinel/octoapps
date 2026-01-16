import * as React from "react"
import { Check, ChevronsUpDown } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"

interface Product {
  id: string
  name: string
  category?: string
}

interface ProductMultiSelectProps {
  products: Product[]
  selectedValues: string[] // Array of IDs
  onChange: (values: string[]) => void
  placeholder?: string
}

export function ProductMultiSelect({
  products,
  selectedValues = [],
  onChange,
  placeholder = "Selecione os serviços..."
}: ProductMultiSelectProps) {
  const [open, setOpen] = React.useState(false)

  const handleSelect = (productId: string) => {
    const isSelected = selectedValues.includes(productId)
    if (isSelected) {
      onChange(selectedValues.filter((value) => value !== productId))
    } else {
      onChange([...selectedValues, productId])
    }
  }

  // Get selected product objects efficiently
  const selectedProducts = React.useMemo(() => {
    return products.filter(p => selectedValues.includes(p.id));
  }, [products, selectedValues]);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between h-auto min-h-[40px] px-3 py-2"
        >
          <div className="flex flex-wrap gap-1 items-center text-left">
             {selectedValues.length === 0 && <span className="text-muted-foreground font-normal">{placeholder}</span>}
             
             {selectedProducts.map(product => (
                  <Badge variant="secondary" key={product.id} className="mr-1 mb-1 font-normal">
                    {product.name}
                  </Badge>
             ))}
          </div>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[400px] p-0" align="start">
        <Command>
          <CommandInput placeholder="Buscar serviço..." />
          <CommandList>
            <CommandEmpty>Nenhum serviço encontrado.</CommandEmpty>
            <CommandGroup className="max-h-64 overflow-auto">
              {products.map((product) => (
                <CommandItem
                  key={product.id}
                  value={product.name} // Search by name
                  onSelect={() => handleSelect(product.id)}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      selectedValues.includes(product.id) ? "opacity-100" : "opacity-0"
                    )}
                  />
                  <div className="flex flex-col">
                    <span>{product.name}</span>
                    {product.category && (
                        <span className="text-xs text-muted-foreground">{product.category}</span>
                    )}
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}
