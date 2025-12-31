import { useState } from 'react';
import { 
  ArrowDownToLine, 
  ArrowUpFromLine, 
  Package, 
  ScanLine,
  History,
  Search,
  Home
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { BarcodeScanner } from '@/components/mobile/BarcodeScanner';
import { MobileEntryForm } from '@/components/mobile/MobileEntryForm';
import { MobileExitForm } from '@/components/mobile/MobileExitForm';
import { useProducts, Product } from '@/hooks/useProducts';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type ViewMode = 'menu' | 'scan' | 'search' | 'entry' | 'exit';

export default function Warehouse() {
  const [viewMode, setViewMode] = useState<ViewMode>('menu');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { products } = useProducts();
  const { toast } = useToast();

  const filteredProducts = products?.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.sku?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.barcode?.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleScan = (code: string) => {
    // Search by barcode or SKU
    const product = products?.find(p => 
      p.barcode === code || 
      p.sku === code ||
      p.id === code
    );

    if (product) {
      setSelectedProduct(product);
      setViewMode('menu');
      toast({
        title: 'Produto encontrado!',
        description: product.name,
      });
    } else {
      toast({
        title: 'Produto não encontrado',
        description: `Código: ${code}`,
        variant: 'destructive',
      });
    }
  };

  const handleProductSelect = (product: Product) => {
    setSelectedProduct(product);
    setSearchQuery('');
    setViewMode('menu');
  };

  const handleOperationComplete = () => {
    setSelectedProduct(null);
    setViewMode('menu');
    toast({
      title: 'Operação concluída!',
      description: 'Movimentação registrada com sucesso.',
    });
  };

  const handleCancel = () => {
    setSelectedProduct(null);
    setViewMode('menu');
  };

  // Entry form view
  if (viewMode === 'entry' && selectedProduct) {
    return (
      <div className="min-h-screen bg-background">
        <MobileEntryForm
          product={selectedProduct}
          onSuccess={handleOperationComplete}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // Exit form view
  if (viewMode === 'exit' && selectedProduct) {
    return (
      <div className="min-h-screen bg-background">
        <MobileExitForm
          product={selectedProduct}
          onSuccess={handleOperationComplete}
          onCancel={handleCancel}
        />
      </div>
    );
  }

  // Scanner view
  if (viewMode === 'scan') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <h1 className="text-2xl font-bold text-center mb-6">Scanner de Código</h1>
          <BarcodeScanner
            onScan={handleScan}
            onClose={() => setViewMode('menu')}
          />
        </div>
      </div>
    );
  }

  // Search view
  if (viewMode === 'search') {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-md mx-auto">
          <div className="flex items-center gap-3 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setViewMode('menu')}
            >
              <Home className="w-5 h-5" />
            </Button>
            <h1 className="text-2xl font-bold">Buscar Produto</h1>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Nome, SKU ou código de barras..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-14 pl-12 text-lg"
              autoFocus
            />
          </div>

          <div className="space-y-3">
            {filteredProducts.slice(0, 10).map((product) => (
              <Card
                key={product.id}
                className="p-4 cursor-pointer hover:bg-accent transition-colors"
                onClick={() => handleProductSelect(product)}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium">{product.name}</h3>
                    {product.sku && (
                      <p className="text-sm text-muted-foreground">SKU: {product.sku}</p>
                    )}
                  </div>
                  <Badge variant={product.quantity > 0 ? 'default' : 'destructive'}>
                    {product.quantity} un
                  </Badge>
                </div>
              </Card>
            ))}

            {searchQuery && filteredProducts.length === 0 && (
              <p className="text-center text-muted-foreground py-8">
                Nenhum produto encontrado
              </p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Main menu view
  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Modo Armazém</h1>
            <p className="text-muted-foreground">Movimentação rápida de estoque</p>
          </div>
          <Link to="/">
            <Button variant="outline" size="icon">
              <Home className="w-5 h-5" />
            </Button>
          </Link>
        </div>

        {/* Selected product display */}
        {selectedProduct && (
          <Card className="p-6 mb-6 bg-primary/5 border-primary/20">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                <Package className="w-8 h-8 text-primary" />
              </div>
              <div className="flex-1">
                <h2 className="font-bold text-lg">{selectedProduct.name}</h2>
                {selectedProduct.sku && (
                  <p className="text-sm text-muted-foreground">SKU: {selectedProduct.sku}</p>
                )}
                <Badge className="mt-1">{selectedProduct.quantity} unidades</Badge>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedProduct(null)}
              >
                Trocar
              </Button>
            </div>
          </Card>
        )}

        {/* Action buttons */}
        <div className="grid gap-4">
          {!selectedProduct && (
            <>
              {/* Scan button */}
              <Button
                size="lg"
                className="h-24 text-xl"
                onClick={() => setViewMode('scan')}
              >
                <ScanLine className="w-8 h-8 mr-4" />
                Escanear Código
              </Button>

              {/* Search button */}
              <Button
                variant="outline"
                size="lg"
                className="h-24 text-xl"
                onClick={() => setViewMode('search')}
              >
                <Search className="w-8 h-8 mr-4" />
                Buscar Produto
              </Button>
            </>
          )}

          {selectedProduct && (
            <>
              {/* Entry button */}
              <Button
                size="lg"
                className="h-24 text-xl bg-primary hover:bg-primary/90"
                onClick={() => setViewMode('entry')}
              >
                <ArrowDownToLine className="w-8 h-8 mr-4" />
                Entrada
              </Button>

              {/* Exit button */}
              <Button
                size="lg"
                className="h-24 text-xl bg-orange-500 hover:bg-orange-600"
                onClick={() => setViewMode('exit')}
                disabled={selectedProduct.quantity <= 0}
              >
                <ArrowUpFromLine className="w-8 h-8 mr-4" />
                Saída
              </Button>
            </>
          )}

          {/* History link */}
          <Link to="/historico" className="block">
            <Button
              variant="ghost"
              size="lg"
              className="w-full h-16 text-lg"
            >
              <History className="w-6 h-6 mr-3" />
              Ver Histórico
            </Button>
          </Link>
        </div>

        {/* PWA install hint */}
        <div className="mt-8 p-4 bg-muted/50 rounded-xl text-center">
          <p className="text-sm text-muted-foreground">
            💡 Dica: Adicione à tela inicial para acesso rápido
          </p>
        </div>
      </div>
    </div>
  );
}
