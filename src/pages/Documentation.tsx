import { useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  ArrowLeftRight,
  ShoppingCart,
  FileText,
  HardHat,
  MapPin,
  Boxes,
  Wrench,
  BarChart3,
  Shield,
  Smartphone,
  Building2,
  Search,
  ArrowLeft,
  CheckCircle2,
  Users,
  Bell,
  Settings,
  Database,
  Lock,
  Zap,
  Globe,
  Clock,
  FileCheck,
  AlertTriangle,
  TrendingUp,
  Truck,
  ClipboardList,
  QrCode,
  Printer,
  Mail,
  Calendar,
  Eye,
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  RefreshCw,
  Filter,
  Table,
  PieChart,
  LineChart,
  LayoutDashboard,
  UserCheck,
  Key,
  History,
  Bookmark,
  Tag,
  Layers,
  ArrowRightLeft,
  ClipboardCheck,
  Award,
  Star,
  BookOpen,
} from "lucide-react";

const fadeInUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5 }
};

const staggerContainer = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

const documentationSections = [
  {
    id: "overview",
    title: "Visão Geral",
    icon: LayoutDashboard,
    description: "Introdução ao sistema Stockly"
  },
  {
    id: "products",
    title: "Produtos e Estoque",
    icon: Package,
    description: "Gestão completa de produtos"
  },
  {
    id: "entries-exits",
    title: "Entradas e Saídas",
    icon: ArrowLeftRight,
    description: "Movimentações de estoque"
  },
  {
    id: "purchases",
    title: "Compras",
    icon: ShoppingCart,
    description: "Ordens de compra e fornecedores"
  },
  {
    id: "nfe",
    title: "NF-e",
    icon: FileText,
    description: "Integração com notas fiscais"
  },
  {
    id: "epis",
    title: "Gestão de EPIs",
    icon: HardHat,
    description: "Equipamentos de proteção"
  },
  {
    id: "locations",
    title: "Multi-Almoxarifado",
    icon: MapPin,
    description: "Gestão de múltiplos locais"
  },
  {
    id: "kits",
    title: "Kits de Produtos",
    icon: Boxes,
    description: "Agrupamento de produtos"
  },
  {
    id: "assets",
    title: "Ativos",
    icon: Wrench,
    description: "Gestão de patrimônio"
  },
  {
    id: "reports",
    title: "Relatórios",
    icon: BarChart3,
    description: "Analytics e dashboards"
  },
  {
    id: "security",
    title: "Segurança",
    icon: Shield,
    description: "Controle de acesso e auditoria"
  },
  {
    id: "mobile",
    title: "Mobile/PWA",
    icon: Smartphone,
    description: "Acesso móvel"
  },
];

const Documentation = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [activeSection, setActiveSection] = useState("overview");

  const filteredSections = documentationSections.filter(
    section =>
      section.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      section.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-slate-950/80 border-b border-slate-800">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
              </Link>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-white">Documentação Stockly</h1>
                  <p className="text-sm text-slate-400">Guia completo do sistema</p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="relative w-64 hidden md:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Buscar na documentação..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
                />
              </div>
              <Link to="/auth">
                <Button className="bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-600 hover:to-cyan-600">
                  Acessar Sistema
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-[280px_1fr] gap-8">
          {/* Sidebar Navigation */}
          <aside className="hidden lg:block">
            <div className="sticky top-24 space-y-2">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-4">
                Navegação
              </p>
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-left transition-all ${
                    activeSection === section.id
                      ? "bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 text-white border border-emerald-500/30"
                      : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                  }`}
                >
                  <section.icon className="h-5 w-5" />
                  <div>
                    <p className="font-medium">{section.title}</p>
                    <p className="text-xs text-slate-500">{section.description}</p>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          {/* Mobile Navigation */}
          <div className="lg:hidden mb-6">
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Buscar na documentação..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-slate-800/50 border-slate-700 text-white placeholder:text-slate-500"
              />
            </div>
            <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide">
              {filteredSections.map((section) => (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`flex-shrink-0 flex items-center gap-2 px-4 py-2 rounded-full text-sm transition-all ${
                    activeSection === section.id
                      ? "bg-gradient-to-r from-emerald-500 to-cyan-500 text-white"
                      : "bg-slate-800/50 text-slate-400 hover:text-white"
                  }`}
                >
                  <section.icon className="h-4 w-4" />
                  {section.title}
                </button>
              ))}
            </div>
          </div>

          {/* Main Content */}
          <main className="min-w-0">
            <motion.div
              key={activeSection}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {activeSection === "overview" && <OverviewSection />}
              {activeSection === "products" && <ProductsSection />}
              {activeSection === "entries-exits" && <EntriesExitsSection />}
              {activeSection === "purchases" && <PurchasesSection />}
              {activeSection === "nfe" && <NFeSection />}
              {activeSection === "epis" && <EPIsSection />}
              {activeSection === "locations" && <LocationsSection />}
              {activeSection === "kits" && <KitsSection />}
              {activeSection === "assets" && <AssetsSection />}
              {activeSection === "reports" && <ReportsSection />}
              {activeSection === "security" && <SecuritySection />}
              {activeSection === "mobile" && <MobileSection />}
            </motion.div>
          </main>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-slate-800 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-cyan-500 rounded-lg flex items-center justify-center">
                <Package className="h-4 w-4 text-white" />
              </div>
              <span className="font-bold text-white">Stockly</span>
            </div>
            <p className="text-sm text-slate-400">
              © 2025 Stockly. Todos os direitos reservados.
            </p>
            <div className="flex items-center gap-4">
              <Link to="/contato" className="text-sm text-slate-400 hover:text-white transition-colors">
                Suporte
              </Link>
              <Link to="/" className="text-sm text-slate-400 hover:text-white transition-colors">
                Voltar ao Início
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

// Overview Section
const OverviewSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
        Introdução
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Bem-vindo ao Stockly</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        O Stockly é um sistema completo de gestão de estoque e almoxarifado, desenvolvido para 
        otimizar o controle de materiais, EPIs, ativos e toda a cadeia de suprimentos da sua empresa.
      </p>
    </div>

    <Card className="bg-gradient-to-br from-emerald-500/10 to-cyan-500/10 border-emerald-500/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-emerald-400" />
          Principais Características
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            "Controle completo de estoque em tempo real",
            "Gestão de múltiplos almoxarifados",
            "Integração com NF-e (Focus NFe)",
            "Gestão de EPIs com termos de entrega",
            "Relatórios e dashboards avançados",
            "Sistema de requisições e aprovações",
            "Controle de fornecedores e compras",
            "Aplicativo móvel (PWA)",
            "Multi-usuários com níveis de acesso",
            "Auditoria completa de ações",
            "Alertas e notificações automáticas",
            "Exportação de dados (PDF, Excel, CSV)",
          ].map((feature, index) => (
            <div key={index} className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
              <span className="text-slate-300">{feature}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <div className="grid md:grid-cols-3 gap-4">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Users className="h-6 w-6 text-blue-400" />
          </div>
          <h4 className="font-semibold text-white mb-2">3 Níveis de Acesso</h4>
          <p className="text-sm text-slate-400">Admin, Almoxarife e Visualizador</p>
        </CardContent>
      </Card>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-purple-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Globe className="h-6 w-6 text-purple-400" />
          </div>
          <h4 className="font-semibold text-white mb-2">100% Cloud</h4>
          <p className="text-sm text-slate-400">Acesse de qualquer lugar</p>
        </CardContent>
      </Card>
      <Card className="bg-slate-800/50 border-slate-700">
        <CardContent className="p-6 text-center">
          <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center mx-auto mb-4">
            <Shield className="h-6 w-6 text-amber-400" />
          </div>
          <h4 className="font-semibold text-white mb-2">Seguro</h4>
          <p className="text-sm text-slate-400">Dados criptografados e protegidos</p>
        </CardContent>
      </Card>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Building2 className="h-5 w-5 text-cyan-400" />
          Arquitetura Multi-Tenant (SaaS)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          O Stockly opera em modelo SaaS (Software as a Service), onde cada empresa possui seu 
          próprio ambiente isolado e seguro. Isso significa que:
        </p>
        <ul className="space-y-2">
          {[
            "Cada organização tem seus dados completamente isolados",
            "Suporte a múltiplos usuários por organização",
            "Planos flexíveis com limites personalizáveis",
            "Período de teste gratuito de 14 dias",
            "Atualizações automáticas sem downtime",
          ].map((item, index) => (
            <li key={index} className="flex items-start gap-2 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 mt-1 flex-shrink-0" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  </div>
);

// Products Section
const ProductsSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-blue-500/20 text-blue-400 border-blue-500/30">
        Módulo Principal
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Gestão de Produtos e Estoque</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        O módulo de produtos é o coração do sistema, permitindo controle completo sobre todos 
        os itens do seu estoque com informações detalhadas e rastreabilidade total.
      </p>
    </div>

    <Tabs defaultValue="cadastro" className="w-full">
      <TabsList className="bg-slate-800/50 border border-slate-700">
        <TabsTrigger value="cadastro">Cadastro</TabsTrigger>
        <TabsTrigger value="estoque">Controle de Estoque</TabsTrigger>
        <TabsTrigger value="categorias">Categorias</TabsTrigger>
        <TabsTrigger value="funcoes">Funções</TabsTrigger>
      </TabsList>

      <TabsContent value="cadastro" className="mt-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Campos do Cadastro de Produtos</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h4 className="font-semibold text-emerald-400">Informações Básicas</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <span><strong>Nome:</strong> Nome do produto</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-slate-400" />
                    <span><strong>Descrição:</strong> Detalhes do produto</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-slate-400" />
                    <span><strong>SKU:</strong> Código interno</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <QrCode className="h-4 w-4 text-slate-400" />
                    <span><strong>Código de Barras:</strong> EAN/GTIN</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Layers className="h-4 w-4 text-slate-400" />
                    <span><strong>Categoria:</strong> Classificação</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Bookmark className="h-4 w-4 text-slate-400" />
                    <span><strong>Marca:</strong> Fabricante</span>
                  </li>
                </ul>
              </div>
              <div className="space-y-4">
                <h4 className="font-semibold text-cyan-400">Informações de Estoque</h4>
                <ul className="space-y-2 text-slate-300">
                  <li className="flex items-center gap-2">
                    <Package className="h-4 w-4 text-slate-400" />
                    <span><strong>Quantidade:</strong> Estoque atual</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <AlertTriangle className="h-4 w-4 text-slate-400" />
                    <span><strong>Qtd. Mínima:</strong> Ponto de reposição</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-slate-400" />
                    <span><strong>Qtd. Máxima:</strong> Limite de estoque</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span><strong>Validade:</strong> Data de expiração</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Tag className="h-4 w-4 text-slate-400" />
                    <span><strong>Lote:</strong> Controle de lote</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-slate-400" />
                    <span><strong>Localização:</strong> Endereço no almoxarifado</span>
                  </li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="estoque" className="mt-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Indicadores de Estoque</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
                <h4 className="font-semibold text-red-400 mb-2">⚠️ Estoque Crítico</h4>
                <p className="text-sm text-slate-300">
                  Produtos com quantidade abaixo do mínimo definido. Sistema envia alertas automáticos.
                </p>
              </div>
              <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                <h4 className="font-semibold text-amber-400 mb-2">⏰ Próximos ao Vencimento</h4>
                <p className="text-sm text-slate-300">
                  Produtos que irão vencer nos próximos 30 dias, permitindo ações preventivas.
                </p>
              </div>
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <h4 className="font-semibold text-purple-400 mb-2">📊 Análise ABC</h4>
                <p className="text-sm text-slate-300">
                  Classificação dos produtos por importância (A, B, C) baseada em movimentação.
                </p>
              </div>
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl">
                <h4 className="font-semibold text-emerald-400 mb-2">📈 Giro de Estoque</h4>
                <p className="text-sm text-slate-300">
                  Métricas de rotatividade e cobertura de estoque para otimização.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="categorias" className="mt-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Sistema de Categorias</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-slate-300">
              As categorias permitem organizar os produtos de forma hierárquica e visual:
            </p>
            <ul className="space-y-2 text-slate-300">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Cores personalizáveis para identificação visual
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Descrição detalhada para cada categoria
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Vinculação com fornecedores especializados
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                Filtros rápidos por categoria
              </li>
            </ul>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="funcoes" className="mt-6">
        <Card className="bg-slate-800/50 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white">Funcionalidades Disponíveis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-4">
              {[
                { icon: Plus, text: "Cadastrar novos produtos", color: "text-emerald-400" },
                { icon: Edit, text: "Editar informações", color: "text-blue-400" },
                { icon: Trash2, text: "Soft-delete (exclusão lógica)", color: "text-red-400" },
                { icon: Download, text: "Exportar para Excel/PDF", color: "text-purple-400" },
                { icon: Printer, text: "Imprimir etiquetas", color: "text-amber-400" },
                { icon: QrCode, text: "Gerar códigos de barras", color: "text-cyan-400" },
                { icon: Filter, text: "Filtros avançados", color: "text-pink-400" },
                { icon: Table, text: "Colunas personalizáveis", color: "text-indigo-400" },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                  <span className="text-slate-300">{item.text}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  </div>
);

// Entries and Exits Section
const EntriesExitsSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
        Movimentações
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Entradas e Saídas de Estoque</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        Controle completo de todas as movimentações do estoque, com rastreabilidade total 
        e atualização automática das quantidades.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-emerald-400 flex items-center gap-2">
            <Plus className="h-5 w-5" />
            Entradas de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300">Registre todas as entradas de materiais:</p>
          <ul className="space-y-2">
            {[
              "Produto e quantidade",
              "Fornecedor vinculado",
              "Número da nota fiscal",
              "Lote do produto",
              "Preço unitário e total",
              "Local de armazenamento",
              "Responsável pelo recebimento",
              "Observações adicionais",
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-red-400 flex items-center gap-2">
            <ArrowRightLeft className="h-5 w-5" />
            Saídas de Estoque
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300">Controle todas as saídas e baixas:</p>
          <ul className="space-y-2">
            {[
              "Produto e quantidade",
              "Motivo da saída",
              "Destino do material",
              "Funcionário solicitante",
              "Ativo vinculado (opcional)",
              "Requisição de origem",
              "Local de saída",
              "Data e hora da retirada",
            ].map((item, index) => (
              <li key={index} className="flex items-center gap-2 text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-red-400" />
                {item}
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ClipboardList className="h-5 w-5 text-blue-400" />
          Sistema de Requisições
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          Fluxo de aprovação para solicitações de materiais:
        </p>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "1", title: "Solicitação", desc: "Usuário cria requisição", color: "bg-blue-500" },
            { step: "2", title: "Análise", desc: "Almoxarife avalia", color: "bg-amber-500" },
            { step: "3", title: "Aprovação", desc: "Admin aprova/rejeita", color: "bg-purple-500" },
            { step: "4", title: "Entrega", desc: "Material liberado", color: "bg-emerald-500" },
          ].map((item, index) => (
            <div key={index} className="text-center">
              <div className={`w-10 h-10 ${item.color} rounded-full flex items-center justify-center text-white font-bold mx-auto mb-2`}>
                {item.step}
              </div>
              <h4 className="font-semibold text-white">{item.title}</h4>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
        <div className="mt-4 p-4 bg-slate-700/30 rounded-lg">
          <h4 className="font-semibold text-white mb-2">Níveis de Prioridade:</h4>
          <div className="flex gap-4">
            <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Urgente</Badge>
            <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">Alta</Badge>
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Normal</Badge>
            <Badge className="bg-slate-500/20 text-slate-400 border-slate-500/30">Baixa</Badge>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <History className="h-5 w-5 text-purple-400" />
          Histórico de Movimentações
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          Todas as movimentações são registradas automaticamente no histórico:
        </p>
        <ul className="grid md:grid-cols-2 gap-2">
          {[
            "Data e hora da movimentação",
            "Tipo de ação (entrada/saída)",
            "Quantidade movimentada",
            "Saldo anterior e atual",
            "Usuário responsável",
            "Notas e observações",
          ].map((item, index) => (
            <li key={index} className="flex items-center gap-2 text-slate-300">
              <CheckCircle2 className="h-4 w-4 text-purple-400" />
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  </div>
);

// Purchases Section
const PurchasesSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-purple-500/20 text-purple-400 border-purple-500/30">
        Compras
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Gestão de Compras e Fornecedores</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        Módulo completo para gerenciar todo o ciclo de compras, desde a cotação até o 
        recebimento, com avaliação de fornecedores.
      </p>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ShoppingCart className="h-5 w-5 text-purple-400" />
          Ordens de Compra
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="criar" className="border-slate-700">
            <AccordionTrigger className="text-white hover:text-emerald-400">
              Criação de Ordem de Compra
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              <ul className="space-y-2">
                <li>• Numeração automática (OC-ANO-SEQUENCIAL)</li>
                <li>• Seleção de fornecedor cadastrado</li>
                <li>• Adição de múltiplos itens (produtos ou EPIs)</li>
                <li>• Definição de quantidades e valores</li>
                <li>• Condições de pagamento e frete</li>
                <li>• Data de entrega prevista</li>
                <li>• Observações e instruções especiais</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="status" className="border-slate-700">
            <AccordionTrigger className="text-white hover:text-emerald-400">
              Status da Ordem
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              <div className="flex flex-wrap gap-2">
                <Badge className="bg-slate-500/20 text-slate-400">Rascunho</Badge>
                <Badge className="bg-amber-500/20 text-amber-400">Pendente</Badge>
                <Badge className="bg-blue-500/20 text-blue-400">Aprovada</Badge>
                <Badge className="bg-purple-500/20 text-purple-400">Enviada</Badge>
                <Badge className="bg-cyan-500/20 text-cyan-400">Parcialmente Recebida</Badge>
                <Badge className="bg-emerald-500/20 text-emerald-400">Recebida</Badge>
                <Badge className="bg-red-500/20 text-red-400">Cancelada</Badge>
              </div>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="acoes" className="border-slate-700">
            <AccordionTrigger className="text-white hover:text-emerald-400">
              Ações Disponíveis
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              <ul className="space-y-2">
                <li>• Imprimir ordem de compra (PDF profissional)</li>
                <li>• Enviar por e-mail ao fornecedor</li>
                <li>• Registrar recebimento parcial ou total</li>
                <li>• Avaliar desempenho do fornecedor</li>
                <li>• Duplicar ordem para nova compra</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Truck className="h-5 w-5 text-cyan-400" />
          Cadastro de Fornecedores
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-emerald-400 mb-3">Dados Cadastrais</h4>
            <ul className="space-y-2 text-slate-300">
              <li>• Razão Social / Nome Fantasia</li>
              <li>• CNPJ</li>
              <li>• Endereço completo</li>
              <li>• Telefone e e-mail</li>
              <li>• Contato principal</li>
              <li>• Categorias atendidas</li>
              <li>• Observações gerais</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-cyan-400 mb-3">Avaliação de Desempenho</h4>
            <ul className="space-y-2 text-slate-300">
              <li>• Rating geral (1-5 estrelas)</li>
              <li>• Pontualidade nas entregas</li>
              <li>• Qualidade dos produtos</li>
              <li>• Conformidade de preços</li>
              <li>• Histórico de avaliações</li>
              <li>• Relatório de performance</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-purple-500/10 to-pink-500/10 border-purple-500/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Star className="h-5 w-5 text-amber-400" />
          Dashboard de Compras
        </h3>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { label: "Total de Ordens", desc: "Visão geral do período" },
            { label: "Valor Total", desc: "Soma dos pedidos" },
            { label: "Entregas Pendentes", desc: "Aguardando recebimento" },
            { label: "Top Fornecedores", desc: "Mais utilizados" },
          ].map((item, index) => (
            <div key={index} className="text-center p-4 bg-slate-800/50 rounded-lg">
              <h4 className="font-semibold text-white">{item.label}</h4>
              <p className="text-sm text-slate-400">{item.desc}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// NF-e Section
const NFeSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-orange-500/20 text-orange-400 border-orange-500/30">
        Fiscal
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Integração NF-e</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        Integração completa com notas fiscais eletrônicas para agilizar o processo de 
        entrada de materiais e manter conformidade fiscal.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Upload className="h-5 w-5 text-emerald-400" />
            Importação de XML
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300">Upload de arquivos XML de NF-e:</p>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Leitura automática dos dados
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Extração de itens da nota
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Vinculação com fornecedor
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              Importação para o estoque
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Eye className="h-5 w-5 text-blue-400" />
            OCR de DANFE
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-slate-300">Leitura de DANFE em PDF/Imagem:</p>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Reconhecimento óptico (OCR)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Extração da chave de acesso
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Consulta na SEFAZ
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Download do XML original
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Database className="h-5 w-5 text-purple-400" />
          Histórico de NF-e
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          Todas as notas importadas ficam armazenadas com informações completas:
        </p>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Dados da Nota</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Número e série</li>
              <li>• Chave de acesso (44 dígitos)</li>
              <li>• Data de emissão</li>
              <li>• Valor total</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Emitente</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Razão social</li>
              <li>• CNPJ</li>
              <li>• Vinculação automática</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Arquivos</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• XML armazenado</li>
              <li>• PDF do DANFE</li>
              <li>• Download disponível</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-orange-500/10 to-red-500/10 border-orange-500/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Zap className="h-5 w-5 text-orange-400" />
          Integração Focus NFe
        </h3>
        <p className="text-slate-300 mb-4">
          O sistema está integrado com a API Focus NFe para consulta de notas diretamente na SEFAZ:
        </p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-orange-400" />
            Consulta por chave de acesso
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-orange-400" />
            Manifestação do destinatário
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-orange-400" />
            Download automático do XML
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
);

// EPIs Section
const EPIsSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-yellow-500/20 text-yellow-400 border-yellow-500/30">
        Segurança do Trabalho
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Gestão de EPIs</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        Módulo especializado para controle de Equipamentos de Proteção Individual, 
        com rastreabilidade completa e conformidade com normas de segurança.
      </p>
    </div>

    <div className="grid md:grid-cols-2 gap-6">
      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <HardHat className="h-5 w-5 text-yellow-400" />
            Cadastro de EPIs
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-400" />
              Nome e descrição do EPI
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-400" />
              Número do C.A. (Certificado de Aprovação)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-400" />
              Data de validade do C.A.
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-400" />
              Categoria (cabeça, mãos, pés, etc.)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-400" />
              Quantidade em estoque
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-400" />
              Quantidade mínima (alerta)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-400" />
              Validade padrão (em dias)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-yellow-400" />
              Imagem do equipamento
            </li>
          </ul>
        </CardContent>
      </Card>

      <Card className="bg-slate-800/50 border-slate-700">
        <CardHeader>
          <CardTitle className="text-white flex items-center gap-2">
            <Users className="h-5 w-5 text-blue-400" />
            Cadastro de Funcionários
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Nome completo
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Matrícula/Registro
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Departamento
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Cargo/Função
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Data de admissão
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              E-mail e telefone
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Foto do funcionário
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-blue-400" />
              Status (ativo/inativo)
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <FileCheck className="h-5 w-5 text-emerald-400" />
          Termos de Entrega de EPI
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          Documentação legal para controle de entrega de EPIs aos funcionários:
        </p>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-emerald-400 mb-3">Dados do Termo</h4>
            <ul className="space-y-2 text-slate-300">
              <li>• Número automático do termo</li>
              <li>• Data de emissão</li>
              <li>• Funcionário destinatário</li>
              <li>• Responsável pela entrega</li>
              <li>• Observações gerais</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-cyan-400 mb-3">Itens do Termo</h4>
            <ul className="space-y-2 text-slate-300">
              <li>• Lista de EPIs entregues</li>
              <li>• Quantidade de cada item</li>
              <li>• Número do C.A.</li>
              <li>• Tamanho (quando aplicável)</li>
              <li>• Data de validade</li>
            </ul>
          </div>
        </div>
        <div className="mt-4 p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg">
          <h4 className="font-semibold text-emerald-400 mb-2">📄 Impressão do Termo</h4>
          <p className="text-sm text-slate-300">
            Gere um PDF profissional do termo de entrega com espaço para assinatura do funcionário,
            dados da empresa, lista detalhada dos EPIs e declaração de responsabilidade conforme NR-6.
          </p>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Settings className="h-5 w-5 text-purple-400" />
          Matriz de EPIs por Função
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          Configure quais EPIs são obrigatórios para cada função/departamento:
        </p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
            Defina requisitos por departamento
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
            Defina requisitos por cargo/função
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
            Marque como obrigatório ou recomendado
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-purple-400" />
            Alertas de não conformidade automáticos
          </li>
        </ul>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-yellow-400" />
          Alertas e Notificações
        </h3>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="font-semibold text-red-400 mb-2">EPIs Vencidos</h4>
            <p className="text-sm text-slate-400">
              Alerta quando um EPI entregue ultrapassa a data de validade.
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="font-semibold text-amber-400 mb-2">C.A. Expirando</h4>
            <p className="text-sm text-slate-400">
              Aviso quando o certificado de aprovação está próximo do vencimento.
            </p>
          </div>
          <div className="p-4 bg-slate-800/50 rounded-lg">
            <h4 className="font-semibold text-orange-400 mb-2">Estoque Baixo</h4>
            <p className="text-sm text-slate-400">
              Notificação quando EPI atinge quantidade mínima.
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Locations Section
const LocationsSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-teal-500/20 text-teal-400 border-teal-500/30">
        Multi-Local
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Gestão Multi-Almoxarifado</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        Gerencie múltiplos locais de armazenamento com controle de estoque individual 
        e transferências entre unidades.
      </p>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <MapPin className="h-5 w-5 text-teal-400" />
          Cadastro de Locais
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              Nome do local/almoxarifado
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              Código identificador
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              Endereço completo
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              Cidade e estado
            </li>
          </ul>
          <ul className="space-y-2 text-slate-300">
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              Status (ativo/inativo)
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              Definir como local padrão
            </li>
            <li className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-teal-400" />
              Vinculação com organização
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Package className="h-5 w-5 text-blue-400" />
          Estoque por Local
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          Cada local possui seu próprio controle de estoque independente:
        </p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Quantidade por produto em cada local
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Quantidade mínima específica por local
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Endereço de armazenamento (bin location)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Visualização consolidada ou por local
          </li>
        </ul>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <ArrowRightLeft className="h-5 w-5 text-purple-400" />
          Transferências entre Locais
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          Movimente produtos entre almoxarifados com rastreabilidade:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Dados da Transferência</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Produto a transferir</li>
              <li>• Quantidade</li>
              <li>• Local de origem</li>
              <li>• Local de destino</li>
              <li>• Solicitante</li>
              <li>• Observações</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Fluxo de Aprovação</h4>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge className="bg-amber-500/20 text-amber-400">Pendente</Badge>
              <Badge className="bg-blue-500/20 text-blue-400">Em Trânsito</Badge>
              <Badge className="bg-emerald-500/20 text-emerald-400">Concluída</Badge>
              <Badge className="bg-red-500/20 text-red-400">Cancelada</Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

// Kits Section
const KitsSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-pink-500/20 text-pink-400 border-pink-500/30">
        Agrupamentos
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Kits de Produtos</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        Agrupe produtos relacionados em kits para facilitar a gestão e 
        movimentação conjunta de materiais.
      </p>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Boxes className="h-5 w-5 text-pink-400" />
          Tipos de Kits
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div className="p-4 bg-pink-500/10 border border-pink-500/20 rounded-lg">
            <h4 className="font-semibold text-pink-400 mb-2">🔮 Kit Virtual</h4>
            <p className="text-sm text-slate-300 mb-3">
              Agrupamento lógico de produtos. O estoque é calculado 
              automaticamente baseado nos componentes.
            </p>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Não possui estoque próprio</li>
              <li>• Quantidade = mínimo dos componentes</li>
              <li>• Ideal para conjuntos padrão</li>
            </ul>
          </div>
          <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-lg">
            <h4 className="font-semibold text-purple-400 mb-2">📦 Kit Físico</h4>
            <p className="text-sm text-slate-300 mb-3">
              Kit montado fisicamente com estoque próprio. 
              Baixa os componentes ao montar.
            </p>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Estoque independente</li>
              <li>• Montagem/desmontagem</li>
              <li>• Controle separado</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Cadastro de Kits</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-pink-400" />
            Nome e descrição do kit
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-pink-400" />
            SKU do kit
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-pink-400" />
            Categoria
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-pink-400" />
            Lista de produtos componentes
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-pink-400" />
            Quantidade de cada componente
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-pink-400" />
            Status (ativo/inativo)
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
);

// Assets Section
const AssetsSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-indigo-500/20 text-indigo-400 border-indigo-500/30">
        Patrimônio
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Gestão de Ativos</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        Controle completo do patrimônio da empresa, incluindo equipamentos, 
        máquinas e outros bens duráveis.
      </p>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Wrench className="h-5 w-5 text-indigo-400" />
          Cadastro de Ativos
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-indigo-400 mb-3">Identificação</h4>
            <ul className="space-y-2 text-slate-300">
              <li>• Nome do ativo</li>
              <li>• Etiqueta patrimonial</li>
              <li>• Número de série</li>
              <li>• Fabricante</li>
              <li>• Modelo</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-cyan-400 mb-3">Informações</h4>
            <ul className="space-y-2 text-slate-300">
              <li>• Departamento responsável</li>
              <li>• Local de instalação</li>
              <li>• Data de compra</li>
              <li>• Vencimento da garantia</li>
              <li>• Status do ativo</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Status dos Ativos</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-3">
          <Badge className="bg-emerald-500/20 text-emerald-400 border-emerald-500/30">
            Ativo - Em operação
          </Badge>
          <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30">
            Em Manutenção
          </Badge>
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">
            Em Estoque
          </Badge>
          <Badge className="bg-red-500/20 text-red-400 border-red-500/30">
            Inativo/Baixado
          </Badge>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4">
          Vinculação com Saídas de Estoque
        </h3>
        <p className="text-slate-300">
          Ao registrar uma saída de material, é possível vincular a um ativo específico, 
          permitindo rastrear quais materiais foram utilizados em cada equipamento 
          (ideal para manutenções).
        </p>
      </CardContent>
    </Card>
  </div>
);

// Reports Section
const ReportsSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-cyan-500/20 text-cyan-400 border-cyan-500/30">
        Analytics
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Relatórios e Dashboards</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        Visualize dados em tempo real através de dashboards interativos e 
        gere relatórios detalhados para análise e auditoria.
      </p>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <LayoutDashboard className="h-5 w-5 text-cyan-400" />
          Dashboard Principal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { icon: Package, label: "Total de Produtos", color: "text-blue-400" },
            { icon: AlertTriangle, label: "Estoque Crítico", color: "text-red-400" },
            { icon: TrendingUp, label: "Entradas do Mês", color: "text-emerald-400" },
            { icon: ArrowRightLeft, label: "Saídas do Mês", color: "text-amber-400" },
            { icon: Clock, label: "Próximos a Vencer", color: "text-purple-400" },
            { icon: ClipboardCheck, label: "Requisições Pendentes", color: "text-cyan-400" },
            { icon: HardHat, label: "EPIs a Vencer", color: "text-yellow-400" },
            { icon: Users, label: "Funcionários Ativos", color: "text-pink-400" },
          ].map((item, index) => (
            <div key={index} className="p-4 bg-slate-700/30 rounded-lg text-center">
              <item.icon className={`h-8 w-8 ${item.color} mx-auto mb-2`} />
              <p className="text-sm text-slate-300">{item.label}</p>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <BarChart3 className="h-5 w-5 text-purple-400" />
          Tipos de Relatórios
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="estoque" className="border-slate-700">
            <AccordionTrigger className="text-white hover:text-emerald-400">
              📦 Relatórios de Estoque
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              <ul className="space-y-2">
                <li>• Posição atual do estoque</li>
                <li>• Produtos abaixo do mínimo</li>
                <li>• Produtos sem movimentação</li>
                <li>• Validade de produtos</li>
                <li>• Análise ABC</li>
                <li>• Giro de estoque</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="movimentacao" className="border-slate-700">
            <AccordionTrigger className="text-white hover:text-emerald-400">
              📊 Relatórios de Movimentação
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              <ul className="space-y-2">
                <li>• Entradas por período</li>
                <li>• Saídas por período</li>
                <li>• Movimentação por produto</li>
                <li>• Histórico de transferências</li>
                <li>• Consumo por departamento</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="epis" className="border-slate-700">
            <AccordionTrigger className="text-white hover:text-emerald-400">
              🦺 Relatórios de EPIs
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              <ul className="space-y-2">
                <li>• EPIs por funcionário</li>
                <li>• Entregas por período</li>
                <li>• EPIs vencidos/a vencer</li>
                <li>• Conformidade por departamento</li>
                <li>• Histórico de termos de entrega</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="compras" className="border-slate-700">
            <AccordionTrigger className="text-white hover:text-emerald-400">
              🛒 Relatórios de Compras
            </AccordionTrigger>
            <AccordionContent className="text-slate-300">
              <ul className="space-y-2">
                <li>• Ordens de compra por status</li>
                <li>• Gastos por período</li>
                <li>• Performance de fornecedores</li>
                <li>• Histórico de preços</li>
              </ul>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Download className="h-5 w-5 text-emerald-400" />
          Exportação de Dados
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-center">
            <FileText className="h-8 w-8 text-red-400 mx-auto mb-2" />
            <h4 className="font-semibold text-white">PDF</h4>
            <p className="text-sm text-slate-400">Relatórios formatados</p>
          </div>
          <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-center">
            <Table className="h-8 w-8 text-emerald-400 mx-auto mb-2" />
            <h4 className="font-semibold text-white">Excel</h4>
            <p className="text-sm text-slate-400">Planilhas .xlsx</p>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg text-center">
            <FileText className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <h4 className="font-semibold text-white">CSV</h4>
            <p className="text-sm text-slate-400">Dados separados</p>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-cyan-500/10 to-blue-500/10 border-cyan-500/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <PieChart className="h-5 w-5 text-cyan-400" />
          Gráficos Disponíveis
        </h3>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            "Gráfico de movimentações (linhas)",
            "Distribuição por categoria (pizza)",
            "Estoque por local (barras)",
            "Tendência de consumo",
            "Top produtos movimentados",
            "Comparativo entrada x saída",
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-2 text-slate-300">
              <LineChart className="h-4 w-4 text-cyan-400" />
              {item}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Security Section
const SecuritySection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-red-500/20 text-red-400 border-red-500/30">
        Segurança
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Controle de Acesso e Auditoria</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        Sistema robusto de segurança com controle granular de permissões, 
        autenticação segura e log completo de auditoria.
      </p>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-400" />
          Níveis de Acesso (Roles)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-3 gap-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Award className="h-5 w-5 text-amber-400" />
              <h4 className="font-semibold text-amber-400">Admin</h4>
            </div>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>✓ Acesso total ao sistema</li>
              <li>✓ Gerenciar usuários</li>
              <li>✓ Aprovar novos cadastros</li>
              <li>✓ Excluir registros</li>
              <li>✓ Configurações do sistema</li>
              <li>✓ Visualizar auditoria</li>
            </ul>
          </div>
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <UserCheck className="h-5 w-5 text-blue-400" />
              <h4 className="font-semibold text-blue-400">Almoxarife</h4>
            </div>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>✓ Cadastrar produtos</li>
              <li>✓ Registrar entradas/saídas</li>
              <li>✓ Gerenciar EPIs</li>
              <li>✓ Criar ordens de compra</li>
              <li>✓ Gerar relatórios</li>
              <li>✗ Excluir registros</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-500/10 border border-slate-500/20 rounded-lg">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="h-5 w-5 text-slate-400" />
              <h4 className="font-semibold text-slate-400">Visualizador</h4>
            </div>
            <ul className="text-sm text-slate-300 space-y-1">
              <li>✓ Consultar estoque</li>
              <li>✓ Visualizar produtos</li>
              <li>✓ Criar requisições</li>
              <li>✗ Modificar dados</li>
              <li>✗ Acessar configurações</li>
              <li>✗ Gerar relatórios</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Lock className="h-5 w-5 text-emerald-400" />
          Autenticação
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Login com e-mail e senha
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Senhas criptografadas (bcrypt)
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Tokens JWT para sessões
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Recuperação de senha por e-mail
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Validação de força de senha
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            Aprovação de novos usuários pelo admin
          </li>
        </ul>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <History className="h-5 w-5 text-purple-400" />
          Log de Auditoria
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          Todas as ações importantes são registradas automaticamente:
        </p>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Dados Registrados</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Data e hora da ação</li>
              <li>• Usuário que executou</li>
              <li>• Tipo de ação (INSERT/UPDATE/DELETE)</li>
              <li>• Tabela afetada</li>
              <li>• Dados anteriores</li>
              <li>• Dados novos</li>
              <li>• Campos alterados</li>
            </ul>
          </div>
          <div className="p-4 bg-slate-700/30 rounded-lg">
            <h4 className="font-semibold text-white mb-2">Tabelas Auditadas</h4>
            <ul className="text-sm text-slate-400 space-y-1">
              <li>• Produtos</li>
              <li>• Entradas e Saídas</li>
              <li>• EPIs e Entregas</li>
              <li>• Fornecedores</li>
              <li>• Ordens de Compra</li>
              <li>• Funcionários</li>
              <li>• Usuários e Permissões</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-red-500/10 to-orange-500/10 border-red-500/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-400" />
          Políticas de Segurança (RLS)
        </h3>
        <p className="text-slate-300 mb-4">
          O sistema utiliza Row Level Security (RLS) do banco de dados para garantir 
          que usuários só acessem dados permitidos para seu nível:
        </p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-red-400" />
            Políticas por tabela e operação
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-red-400" />
            Verificação automática de permissões
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-red-400" />
            Isolamento de dados por organização
          </li>
        </ul>
      </CardContent>
    </Card>
  </div>
);

// Mobile Section
const MobileSection = () => (
  <div className="space-y-8">
    <div>
      <Badge className="mb-4 bg-green-500/20 text-green-400 border-green-500/30">
        Mobile
      </Badge>
      <h2 className="text-3xl font-bold text-white mb-4">Aplicativo Mobile (PWA)</h2>
      <p className="text-lg text-slate-300 leading-relaxed">
        O Stockly é um Progressive Web App (PWA), permitindo uso completo em 
        dispositivos móveis com experiência nativa.
      </p>
    </div>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Smartphone className="h-5 w-5 text-green-400" />
          Recursos PWA
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-4">
          {[
            { icon: Download, text: "Instalável na tela inicial", color: "text-blue-400" },
            { icon: RefreshCw, text: "Atualizações automáticas", color: "text-emerald-400" },
            { icon: Zap, text: "Carregamento rápido", color: "text-amber-400" },
            { icon: Smartphone, text: "Interface responsiva", color: "text-purple-400" },
            { icon: Bell, text: "Notificações push", color: "text-pink-400" },
            { icon: Globe, text: "Funciona em qualquer dispositivo", color: "text-cyan-400" },
          ].map((item, index) => (
            <div key={index} className="flex items-center gap-3 p-3 bg-slate-700/30 rounded-lg">
              <item.icon className={`h-5 w-5 ${item.color}`} />
              <span className="text-slate-300">{item.text}</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <QrCode className="h-5 w-5 text-blue-400" />
          Leitor de Código de Barras
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-slate-300">
          Use a câmera do celular para escanear códigos de barras:
        </p>
        <ul className="space-y-2 text-slate-300">
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Busca rápida de produtos
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Entrada de estoque via scanner
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Saída de estoque via scanner
          </li>
          <li className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-blue-400" />
            Suporte a EAN-13, EAN-8, Code128, QR Code
          </li>
        </ul>
      </CardContent>
    </Card>

    <Card className="bg-slate-800/50 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white">Funcionalidades Mobile</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-emerald-400 mb-3">✅ Disponível</h4>
            <ul className="space-y-2 text-slate-300">
              <li>• Dashboard simplificado</li>
              <li>• Consulta de produtos</li>
              <li>• Entrada rápida de estoque</li>
              <li>• Saída rápida de estoque</li>
              <li>• Scanner de código de barras</li>
              <li>• Notificações de alertas</li>
              <li>• Requisições de material</li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-cyan-400 mb-3">📱 Interface Adaptada</h4>
            <ul className="space-y-2 text-slate-300">
              <li>• Menu de navegação inferior</li>
              <li>• Formulários otimizados</li>
              <li>• Tabelas com scroll horizontal</li>
              <li>• Botões grandes para touch</li>
              <li>• Gestos de swipe</li>
            </ul>
          </div>
        </div>
      </CardContent>
    </Card>

    <Card className="bg-gradient-to-br from-green-500/10 to-emerald-500/10 border-green-500/20">
      <CardContent className="p-6">
        <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
          <Download className="h-5 w-5 text-green-400" />
          Como Instalar
        </h3>
        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <h4 className="font-semibold text-white mb-2">📱 Android (Chrome)</h4>
            <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
              <li>Acesse o sistema pelo Chrome</li>
              <li>Toque no menu (3 pontos)</li>
              <li>Selecione "Instalar aplicativo"</li>
              <li>Confirme a instalação</li>
            </ol>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-2">🍎 iOS (Safari)</h4>
            <ol className="text-sm text-slate-300 space-y-1 list-decimal list-inside">
              <li>Acesse o sistema pelo Safari</li>
              <li>Toque no botão compartilhar</li>
              <li>Selecione "Adicionar à Tela de Início"</li>
              <li>Confirme o nome e adicione</li>
            </ol>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
);

export default Documentation;
