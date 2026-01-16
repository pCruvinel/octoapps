import { createFileRoute } from '@tanstack/react-router';
import { ProductCatalog } from '@/components/settings/ProductCatalog';

export const Route = createFileRoute('/_authenticated/settings/products')({
  component: ProductsSettingsPage,
});

function ProductsSettingsPage() {
  return (
    <div className="h-full flex flex-col p-4 lg:p-8">
      <div className="mb-8">
        <h1 className="text-gray-900 dark:text-white mb-2 font-bold text-2xl">
          Catálogo de Produtos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Gerencie os produtos e serviços oferecidos pelo escritório
        </p>
      </div>
      <ProductCatalog />
    </div>
  );
}
