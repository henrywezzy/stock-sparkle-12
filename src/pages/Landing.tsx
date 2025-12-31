import { useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Package,
  Shield,
  Users,
  BarChart3,
  FileText,
  Truck,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Zap,
  Lock,
  Clock,
  Star,
  ChevronDown,
  Menu,
  X,
  HardHat,
  ClipboardList,
  Building2,
  TrendingUp,
  Bell,
  FileCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: HardHat,
    title: "Gestão de EPIs",
    description: "Controle completo de Equipamentos de Proteção Individual, com rastreamento de entregas e vencimentos.",
    color: "text-amber-500",
    bgColor: "bg-amber-500/10",
  },
  {
    icon: Package,
    title: "Entrada e Saída",
    description: "Gerencie todas as movimentações de estoque em tempo real com histórico completo.",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: ClipboardList,
    title: "Requisições",
    description: "Sistema de requisições com aprovações, prioridades e rastreamento de status.",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Users,
    title: "Gestão de Funcionários",
    description: "Cadastro completo de funcionários com histórico de EPIs e departamentos.",
    color: "text-purple-500",
    bgColor: "bg-purple-500/10",
  },
  {
    icon: FileText,
    title: "Relatórios Avançados",
    description: "Relatórios detalhados e exportáveis para análise e tomada de decisão.",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
  {
    icon: Truck,
    title: "Gestão de Fornecedores",
    description: "Cadastro de fornecedores com avaliação de desempenho e histórico de compras.",
    color: "text-cyan-500",
    bgColor: "bg-cyan-500/10",
  },
];

const benefits = [
  { icon: Zap, text: "Aumente a produtividade em até 40%" },
  { icon: Lock, text: "Segurança e conformidade garantidas" },
  { icon: Clock, text: "Economize até 20 horas por semana" },
  { icon: TrendingUp, text: "Reduza custos operacionais" },
];

const plans = {
  mensal: [
    {
      name: "Básico",
      price: "297",
      period: "/mês",
      description: "Para pequenas empresas até 50 funcionários",
      features: [
        "Até 500 produtos cadastrados",
        "3 usuários simultâneos",
        "Gestão de EPIs básica",
        "Relatórios padrão",
        "Suporte por email",
      ],
      highlighted: false,
      badge: null,
    },
    {
      name: "Profissional",
      price: "597",
      period: "/mês",
      description: "Para médias empresas até 200 funcionários",
      features: [
        "Produtos ilimitados",
        "10 usuários simultâneos",
        "EPIs com requisitos por cargo",
        "Relatórios avançados + exportação",
        "Integração NF-e completa",
        "Suporte prioritário (chat)",
      ],
      highlighted: true,
      badge: "Mais Popular",
    },
    {
      name: "Empresarial",
      price: "1.197",
      period: "/mês",
      description: "Para grandes empresas - ilimitado",
      features: [
        "Tudo do Profissional +",
        "Usuários ilimitados",
        "Multi-filial (várias unidades)",
        "API de integração",
        "Relatórios customizáveis",
        "Gerente de conta dedicado",
        "SLA de 99,9% uptime",
      ],
      highlighted: false,
      badge: "Enterprise",
    },
  ],
  semestral: [
    {
      name: "Básico",
      price: "247",
      period: "/mês",
      originalPrice: "297",
      description: "Para pequenas empresas até 50 funcionários",
      features: [
        "Até 500 produtos cadastrados",
        "3 usuários simultâneos",
        "Gestão de EPIs básica",
        "Relatórios padrão",
        "Suporte por email",
      ],
      highlighted: false,
      badge: null,
      savings: "Economize R$ 300/semestre",
    },
    {
      name: "Profissional",
      price: "497",
      period: "/mês",
      originalPrice: "597",
      description: "Para médias empresas até 200 funcionários",
      features: [
        "Produtos ilimitados",
        "10 usuários simultâneos",
        "EPIs com requisitos por cargo",
        "Relatórios avançados + exportação",
        "Integração NF-e completa",
        "Suporte prioritário (chat)",
      ],
      highlighted: true,
      badge: "Mais Popular",
      savings: "Economize R$ 600/semestre",
    },
    {
      name: "Empresarial",
      price: "997",
      period: "/mês",
      originalPrice: "1.197",
      description: "Para grandes empresas - ilimitado",
      features: [
        "Tudo do Profissional +",
        "Usuários ilimitados",
        "Multi-filial (várias unidades)",
        "API de integração",
        "Relatórios customizáveis",
        "Gerente de conta dedicado",
        "SLA de 99,9% uptime",
      ],
      highlighted: false,
      badge: "Enterprise",
      savings: "Economize R$ 1.200/semestre",
    },
  ],
  anual: [
    {
      name: "Básico",
      price: "223",
      period: "/mês",
      originalPrice: "297",
      description: "Para pequenas empresas até 50 funcionários",
      features: [
        "Até 500 produtos cadastrados",
        "3 usuários simultâneos",
        "Gestão de EPIs básica",
        "Relatórios padrão",
        "Suporte por email",
      ],
      highlighted: false,
      badge: null,
      savings: "Economize 25% - R$ 888/ano",
    },
    {
      name: "Profissional",
      price: "448",
      period: "/mês",
      originalPrice: "597",
      description: "Para médias empresas até 200 funcionários",
      features: [
        "Produtos ilimitados",
        "10 usuários simultâneos",
        "EPIs com requisitos por cargo",
        "Relatórios avançados + exportação",
        "Integração NF-e completa",
        "Suporte prioritário (chat)",
      ],
      highlighted: true,
      badge: "Mais Popular",
      savings: "Economize 25% - R$ 1.788/ano",
    },
    {
      name: "Empresarial",
      price: "898",
      period: "/mês",
      originalPrice: "1.197",
      description: "Para grandes empresas - ilimitado",
      features: [
        "Tudo do Profissional +",
        "Usuários ilimitados",
        "Multi-filial (várias unidades)",
        "API de integração",
        "Relatórios customizáveis",
        "Gerente de conta dedicado",
        "SLA de 99,9% uptime",
      ],
      highlighted: false,
      badge: "Enterprise",
      savings: "Economize 25% - R$ 3.588/ano",
    },
  ],
};

const testimonials = [
  {
    name: "Carlos Silva",
    role: "Gerente de Almoxarifado",
    company: "Construtora ABC",
    text: "O sistema transformou nossa gestão de estoque. Reduzimos perdas em 60% e ganhamos tempo precioso.",
    rating: 5,
  },
  {
    name: "Maria Santos",
    role: "Coordenadora de Segurança",
    company: "Indústria XYZ",
    text: "A gestão de EPIs ficou muito mais simples. Nunca mais tivemos problemas com vencimentos ou entregas.",
    rating: 5,
  },
  {
    name: "Roberto Lima",
    role: "Diretor de Operações",
    company: "Logística Express",
    text: "Implementação rápida e suporte excepcional. O ROI veio no primeiro mês de uso.",
    rating: 5,
  },
];

const stats = [
  { value: "500+", label: "Empresas Ativas" },
  { value: "50mil+", label: "Produtos Gerenciados" },
  { value: "99,9%", label: "Uptime Garantido" },
  { value: "24/7", label: "Suporte Disponível" },
];

const Landing = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [billingPeriod, setBillingPeriod] = useState<"mensal" | "semestral" | "anual">("mensal");

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">AlmoxStock</span>
            </div>

            {/* Desktop Navigation */}
            <nav className="hidden items-center gap-8 md:flex">
              <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Funcionalidades
              </a>
              <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Preços
              </a>
              <a href="#testimonials" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
                Depoimentos
              </a>
            </nav>

            <div className="hidden items-center gap-4 md:flex">
              <Link to="/auth">
                <Button variant="ghost" size="sm">
                  Entrar
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm" className="gap-2">
                  Começar Agora
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              className="md:hidden"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border-t border-border bg-background md:hidden"
          >
            <div className="container mx-auto space-y-4 px-4 py-4">
              <a href="#features" className="block text-sm text-muted-foreground">
                Funcionalidades
              </a>
              <a href="#pricing" className="block text-sm text-muted-foreground">
                Preços
              </a>
              <a href="#testimonials" className="block text-sm text-muted-foreground">
                Depoimentos
              </a>
              <div className="flex flex-col gap-2 pt-4">
                <Link to="/auth">
                  <Button variant="outline" className="w-full">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button className="w-full">Começar Agora</Button>
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-20 lg:pt-40 lg:pb-32">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-[500px] w-[500px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[400px] w-[400px] rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-4xl text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <Badge variant="secondary" className="mb-6 gap-2 px-4 py-2">
                <Sparkles className="h-4 w-4 text-primary" />
                Sistema completo de gestão de almoxarifado
              </Badge>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl"
            >
              Controle Total do Seu{" "}
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                Estoque e EPIs
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="mb-8 text-lg text-muted-foreground sm:text-xl"
            >
              Simplifique a gestão do seu almoxarifado com nossa plataforma completa.
              Controle de EPIs, entradas, saídas, requisições e muito mais em um só lugar.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              className="flex flex-col items-center justify-center gap-4 sm:flex-row"
            >
              <Link to="/auth">
                <Button size="lg" className="gap-2 text-base">
                  Teste Grátis por 14 Dias
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <a href="#features">
                <Button size="lg" variant="outline" className="gap-2 text-base">
                  Ver Funcionalidades
                  <ChevronDown className="h-5 w-5" />
                </Button>
              </a>
            </motion.div>

            {/* Trust Indicators */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.5 }}
              className="mt-12 flex flex-wrap items-center justify-center gap-8"
            >
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                  <benefit.icon className="h-5 w-5 text-primary" />
                  <span>{benefit.text}</span>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
            {stats.map((stat, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
                className="text-center"
              >
                <div className="text-3xl font-bold text-primary sm:text-4xl">{stat.value}</div>
                <div className="mt-1 text-sm text-muted-foreground">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">Funcionalidades</Badge>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Tudo que você precisa para{" "}
              <span className="text-primary">gerenciar seu estoque</span>
            </h2>
            <p className="text-muted-foreground">
              Uma plataforma completa com todas as ferramentas necessárias para uma gestão eficiente
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5">
                  <CardHeader>
                    <div className={cn("mb-4 flex h-12 w-12 items-center justify-center rounded-xl", feature.bgColor)}>
                      <feature.icon className={cn("h-6 w-6", feature.color)} />
                    </div>
                    <CardTitle className="text-xl">{feature.title}</CardTitle>
                    <CardDescription>{feature.description}</CardDescription>
                  </CardHeader>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Additional Features */}
          <div className="mt-16 grid gap-6 md:grid-cols-3">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <Building2 className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Multi-Filial</h3>
              <p className="text-sm text-muted-foreground">
                Gerencie múltiplas unidades e localizações em uma única plataforma centralizada.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <Bell className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Alertas Inteligentes</h3>
              <p className="text-sm text-muted-foreground">
                Receba notificações de estoque baixo, vencimentos de EPIs e requisições pendentes.
              </p>
            </motion.div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              viewport={{ once: true }}
              className="rounded-2xl border border-border bg-card p-6"
            >
              <FileCheck className="mb-4 h-8 w-8 text-primary" />
              <h3 className="mb-2 text-lg font-semibold">Integração NF-e</h3>
              <p className="text-sm text-muted-foreground">
                Importe produtos automaticamente via XML de notas fiscais eletrônicas.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative py-20 lg:py-32">
        <div className="absolute inset-0 -z-10 bg-muted/30" />
        
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">Preços</Badge>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Planos que{" "}
              <span className="text-primary">cabem no seu bolso</span>
            </h2>
            <p className="mb-8 text-muted-foreground">
              Escolha o plano ideal para o tamanho da sua empresa
            </p>

            {/* Billing Toggle */}
            <Tabs 
              defaultValue="mensal" 
              className="mx-auto mb-12"
              onValueChange={(value) => setBillingPeriod(value as typeof billingPeriod)}
            >
              <TabsList className="grid w-full max-w-md grid-cols-3 mx-auto">
                <TabsTrigger value="mensal">Mensal</TabsTrigger>
                <TabsTrigger value="semestral" className="relative">
                  Semestral
                  <Badge className="absolute -top-3 -right-2 px-1.5 py-0.5 text-[10px]">-17%</Badge>
                </TabsTrigger>
                <TabsTrigger value="anual" className="relative">
                  Anual
                  <Badge className="absolute -top-3 -right-2 px-1.5 py-0.5 text-[10px] bg-emerald-500">-25%</Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
          </div>

          <div className="mx-auto grid max-w-6xl gap-8 md:grid-cols-3">
            {plans[billingPeriod].map((plan, index) => (
              <motion.div
                key={`${billingPeriod}-${index}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
              >
                <Card
                  className={cn(
                    "relative h-full transition-all",
                    plan.highlighted
                      ? "border-primary shadow-xl shadow-primary/10 scale-105"
                      : "hover:border-primary/50"
                  )}
                >
                  {plan.badge && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <Badge 
                        className={cn(
                          "px-4",
                          plan.highlighted ? "bg-primary" : "bg-secondary"
                        )}
                      >
                        {plan.badge}
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-4">
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description}</CardDescription>
                    <div className="mt-4">
                      <div className="flex items-baseline gap-1">
                        <span className="text-sm text-muted-foreground">R$</span>
                        <span className="text-5xl font-bold">{plan.price}</span>
                        <span className="text-muted-foreground">{plan.period}</span>
                      </div>
                      {"originalPrice" in plan && plan.originalPrice && (
                        <div className="mt-1 text-sm text-muted-foreground">
                          <span className="line-through">R$ {plan.originalPrice}/mês</span>
                        </div>
                      )}
                      {"savings" in plan && plan.savings && (
                        <Badge variant="secondary" className="mt-2 bg-emerald-500/10 text-emerald-500">
                          {plan.savings}
                        </Badge>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <Link to="/auth">
                      <Button
                        className="mb-6 w-full"
                        variant={plan.highlighted ? "default" : "outline"}
                      >
                        Começar Agora
                      </Button>
                    </Link>
                    <ul className="space-y-3">
                      {plan.features.map((feature, featureIndex) => (
                        <li key={featureIndex} className="flex items-start gap-2">
                          <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="mx-auto max-w-2xl text-center">
            <Badge variant="secondary" className="mb-4">Depoimentos</Badge>
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              O que nossos{" "}
              <span className="text-primary">clientes dizem</span>
            </h2>
            <p className="text-muted-foreground">
              Empresas que transformaram sua gestão com o AlmoxStock
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {testimonials.map((testimonial, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: index * 0.1 }}
                viewport={{ once: true }}
              >
                <Card className="h-full">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex gap-1">
                      {[...Array(testimonial.rating)].map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <p className="mb-6 text-muted-foreground">"{testimonial.text}"</p>
                    <div>
                      <div className="font-semibold">{testimonial.name}</div>
                      <div className="text-sm text-muted-foreground">
                        {testimonial.role} • {testimonial.company}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="relative py-20 lg:py-32">
        <div className="absolute inset-0 -z-10">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-cyan-500/10" />
        </div>
        
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
            className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-8 text-center shadow-2xl sm:p-12"
          >
            <h2 className="mb-4 text-3xl font-bold sm:text-4xl">
              Pronto para transformar sua gestão?
            </h2>
            <p className="mb-8 text-lg text-muted-foreground">
              Comece seu teste gratuito de 14 dias. Sem cartão de crédito necessário.
            </p>
            <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
              <Link to="/auth">
                <Button size="lg" className="gap-2 text-base">
                  Criar Conta Gratuita
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="gap-2 text-base">
                Falar com Vendas
              </Button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="text-lg font-bold">AlmoxStock</span>
            </div>
            <div className="flex flex-wrap items-center justify-center gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">Termos de Uso</a>
              <a href="#" className="hover:text-foreground">Privacidade</a>
              <a href="#" className="hover:text-foreground">Suporte</a>
              <a href="#" className="hover:text-foreground">Contato</a>
            </div>
            <div className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} AlmoxStock. Todos os direitos reservados.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;
