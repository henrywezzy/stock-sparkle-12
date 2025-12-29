import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageLoader } from "@/components/ui/page-loader";

// Lazy load pages for better performance
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Products = lazy(() => import("./pages/Products"));
const Categories = lazy(() => import("./pages/Categories"));
const Entries = lazy(() => import("./pages/Entries"));
const Exits = lazy(() => import("./pages/Exits"));
const Employees = lazy(() => import("./pages/Employees"));
const EPIs = lazy(() => import("./pages/EPIs"));
const Suppliers = lazy(() => import("./pages/Suppliers"));
const Requisitions = lazy(() => import("./pages/Requisitions"));
const Inventory = lazy(() => import("./pages/Inventory"));
const History = lazy(() => import("./pages/History"));
const Reports = lazy(() => import("./pages/Reports"));
const Settings = lazy(() => import("./pages/Settings"));
const Purchases = lazy(() => import("./pages/Purchases"));
const NFe = lazy(() => import("./pages/NFe"));
const Auth = lazy(() => import("./pages/Auth"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 30, // 30 minutes (formerly cacheTime)
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route element={<ProtectedRoute><MainLayout /></ProtectedRoute>}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/produtos" element={<Products />} />
                <Route path="/categorias" element={<Categories />} />
                <Route path="/entrada" element={<Entries />} />
                <Route path="/saida" element={<Exits />} />
                <Route path="/compras" element={<Purchases />} />
                <Route path="/funcionarios" element={<Employees />} />
                <Route path="/epis" element={<EPIs />} />
                <Route path="/fornecedores" element={<Suppliers />} />
                <Route path="/requisicoes" element={<Requisitions />} />
                <Route path="/inventario" element={<Inventory />} />
                <Route path="/historico" element={<History />} />
                <Route path="/relatorios" element={<Reports />} />
                <Route path="/nfe" element={<NFe />} />
                <Route path="/configuracoes" element={<Settings />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;