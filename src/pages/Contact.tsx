import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, useInView } from "framer-motion";
import { useRef } from "react";
import {
  Package,
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Clock,
  ArrowLeft,
  CheckCircle2,
  Loader2,
  HelpCircle,
  Headphones,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  email: z.string().email("Email inválido").max(255),
  phone: z.string().optional(),
  company: z.string().optional(),
  subject: z.string().min(1, "Selecione um assunto"),
  message: z.string().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(1000),
});

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    description: "Resposta em até 24h úteis",
    value: "contato@stockly.com.br",
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    icon: Phone,
    title: "Telefone",
    description: "Seg-Sex, 8h às 18h",
    value: "(11) 4000-0000",
    color: "text-emerald-500",
    bgColor: "bg-emerald-500/10",
  },
  {
    icon: MessageSquare,
    title: "WhatsApp",
    description: "Atendimento rápido",
    value: "(11) 99999-0000",
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    icon: MapPin,
    title: "Endereço",
    description: "Venha nos visitar",
    value: "São Paulo, SP - Brasil",
    color: "text-rose-500",
    bgColor: "bg-rose-500/10",
  },
];

const faqItems = [
  {
    question: "Quanto tempo leva para implementar o sistema?",
    answer: "A implementação básica leva de 1 a 3 dias úteis. Para empresas maiores com múltiplas filiais, pode levar até 1 semana.",
  },
  {
    question: "Posso migrar meus dados do sistema atual?",
    answer: "Sim! Nossa equipe auxilia na migração de dados de planilhas ou outros sistemas. Oferecemos suporte completo durante todo o processo.",
  },
  {
    question: "O sistema funciona offline?",
    answer: "O Stockly é um sistema web que requer conexão com internet. Porém, temos um aplicativo PWA que permite algumas funcionalidades offline.",
  },
  {
    question: "Como funciona o período de teste?",
    answer: "Oferecemos 14 dias gratuitos com acesso completo a todas as funcionalidades. Não é necessário cartão de crédito para começar.",
  },
];

const AnimatedSection = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-100px" });

  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 50 }}
      animate={isInView ? { opacity: 1, y: 0 } : { opacity: 0, y: 50 }}
      transition={{ duration: 0.6, delay, ease: "easeOut" }}
    >
      {children}
    </motion.div>
  );
};

const Contact = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      contactSchema.parse(formData);
      setErrors({});
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0] as string] = err.message;
          }
        });
        setErrors(newErrors);
        return;
      }
    }

    setIsSubmitting(true);

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500));

    setIsSubmitting(false);
    setIsSubmitted(true);
    toast.success("Mensagem enviada com sucesso! Entraremos em contato em breve.");
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="container mx-auto px-4">
          <div className="flex h-16 items-center justify-between">
            <Link to="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary">
                <Package className="h-6 w-6 text-primary-foreground" />
              </div>
              <span className="text-xl font-bold">Stockly</span>
            </Link>

            <div className="flex items-center gap-4">
              <Link to="/">
                <Button variant="ghost" size="sm" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Voltar
                </Button>
              </Link>
              <Link to="/auth">
                <Button size="sm">Acessar Sistema</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32 pb-16 lg:pt-40 lg:pb-20">
        {/* Background Effects */}
        <div className="absolute inset-0 -z-10">
          <div className="absolute top-0 left-1/4 h-[400px] w-[400px] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-0 right-1/4 h-[300px] w-[300px] rounded-full bg-cyan-500/10 blur-[100px]" />
        </div>

        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="mx-auto max-w-3xl text-center"
          >
            <Badge variant="secondary" className="mb-6 gap-2 px-4 py-2">
              <Headphones className="h-4 w-4 text-primary" />
              Suporte e Contato
            </Badge>

            <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">
              Como podemos{" "}
              <span className="bg-gradient-to-r from-primary to-cyan-400 bg-clip-text text-transparent">
                ajudar você?
              </span>
            </h1>

            <p className="text-lg text-muted-foreground">
              Nossa equipe está pronta para tirar suas dúvidas, apresentar o sistema
              ou ajudar com qualquer necessidade. Entre em contato!
            </p>
          </motion.div>
        </div>
      </section>

      {/* Contact Methods */}
      <section className="py-12">
        <div className="container mx-auto px-4">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {contactMethods.map((method, index) => (
              <AnimatedSection key={index} delay={index * 0.1}>
                <Card className="h-full transition-all hover:border-primary/50 hover:shadow-lg">
                  <CardContent className="flex flex-col items-center p-6 text-center">
                    <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl ${method.bgColor}`}>
                      <method.icon className={`h-7 w-7 ${method.color}`} />
                    </div>
                    <h3 className="mb-1 font-semibold">{method.title}</h3>
                    <p className="mb-2 text-sm text-muted-foreground">{method.description}</p>
                    <p className="text-sm font-medium text-primary">{method.value}</p>
                  </CardContent>
                </Card>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* Contact Form & Info */}
      <section className="py-16 lg:py-24">
        <div className="container mx-auto px-4">
          <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-2">
            {/* Form */}
            <AnimatedSection>
              <Card className="border-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-2xl">
                    <Send className="h-6 w-6 text-primary" />
                    Envie sua mensagem
                  </CardTitle>
                  <CardDescription>
                    Preencha o formulário abaixo e retornaremos o mais breve possível
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {isSubmitted ? (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="flex flex-col items-center py-12 text-center"
                    >
                      <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-emerald-500/10">
                        <CheckCircle2 className="h-8 w-8 text-emerald-500" />
                      </div>
                      <h3 className="mb-2 text-xl font-semibold">Mensagem Enviada!</h3>
                      <p className="mb-6 text-muted-foreground">
                        Recebemos sua mensagem e entraremos em contato em breve.
                      </p>
                      <Button onClick={() => setIsSubmitted(false)} variant="outline">
                        Enviar Nova Mensagem
                      </Button>
                    </motion.div>
                  ) : (
                    <form onSubmit={handleSubmit} className="space-y-5">
                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="name">Nome Completo *</Label>
                          <Input
                            id="name"
                            placeholder="Seu nome"
                            value={formData.name}
                            onChange={(e) => handleChange("name", e.target.value)}
                            className={errors.name ? "border-destructive" : ""}
                          />
                          {errors.name && (
                            <p className="text-sm text-destructive">{errors.name}</p>
                          )}
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email *</Label>
                          <Input
                            id="email"
                            type="email"
                            placeholder="seu@email.com"
                            value={formData.email}
                            onChange={(e) => handleChange("email", e.target.value)}
                            className={errors.email ? "border-destructive" : ""}
                          />
                          {errors.email && (
                            <p className="text-sm text-destructive">{errors.email}</p>
                          )}
                        </div>
                      </div>

                      <div className="grid gap-5 sm:grid-cols-2">
                        <div className="space-y-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            placeholder="(00) 00000-0000"
                            value={formData.phone}
                            onChange={(e) => handleChange("phone", e.target.value)}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="company">Empresa</Label>
                          <Input
                            id="company"
                            placeholder="Nome da empresa"
                            value={formData.company}
                            onChange={(e) => handleChange("company", e.target.value)}
                          />
                        </div>
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="subject">Assunto *</Label>
                        <Select
                          value={formData.subject}
                          onValueChange={(value) => handleChange("subject", value)}
                        >
                          <SelectTrigger className={errors.subject ? "border-destructive" : ""}>
                            <SelectValue placeholder="Selecione o assunto" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="demo">Solicitar Demonstração</SelectItem>
                            <SelectItem value="pricing">Dúvidas sobre Preços</SelectItem>
                            <SelectItem value="support">Suporte Técnico</SelectItem>
                            <SelectItem value="partnership">Parcerias</SelectItem>
                            <SelectItem value="other">Outros</SelectItem>
                          </SelectContent>
                        </Select>
                        {errors.subject && (
                          <p className="text-sm text-destructive">{errors.subject}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="message">Mensagem *</Label>
                        <Textarea
                          id="message"
                          placeholder="Descreva como podemos ajudar..."
                          rows={5}
                          value={formData.message}
                          onChange={(e) => handleChange("message", e.target.value)}
                          className={errors.message ? "border-destructive" : ""}
                        />
                        {errors.message && (
                          <p className="text-sm text-destructive">{errors.message}</p>
                        )}
                      </div>

                      <Button type="submit" className="w-full gap-2" disabled={isSubmitting}>
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Enviando...
                          </>
                        ) : (
                          <>
                            <Send className="h-4 w-4" />
                            Enviar Mensagem
                          </>
                        )}
                      </Button>
                    </form>
                  )}
                </CardContent>
              </Card>
            </AnimatedSection>

            {/* FAQ */}
            <AnimatedSection delay={0.2}>
              <div className="space-y-6">
                <div>
                  <Badge variant="secondary" className="mb-4 gap-2">
                    <HelpCircle className="h-4 w-4" />
                    Perguntas Frequentes
                  </Badge>
                  <h2 className="mb-2 text-2xl font-bold">Dúvidas Comuns</h2>
                  <p className="text-muted-foreground">
                    Confira as respostas para as perguntas mais frequentes
                  </p>
                </div>

                <div className="space-y-4">
                  {faqItems.map((item, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 20 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      viewport={{ once: true }}
                    >
                      <Card>
                        <CardContent className="p-5">
                          <h4 className="mb-2 font-semibold">{item.question}</h4>
                          <p className="text-sm text-muted-foreground">{item.answer}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>

                {/* Support Hours */}
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Clock className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold">Horário de Atendimento</h4>
                      <p className="text-sm text-muted-foreground">
                        Segunda a Sexta: 8h às 18h<br />
                        Sábado: 9h às 13h<br />
                        Suporte Premium: 24/7
                      </p>
                    </div>
                  </CardContent>
                </Card>

                {/* Documentation CTA */}
                <Card>
                  <CardContent className="flex items-start gap-4 p-5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-cyan-500/10">
                      <FileText className="h-6 w-6 text-cyan-500" />
                    </div>
                    <div>
                      <h4 className="mb-1 font-semibold">Central de Ajuda</h4>
                      <p className="mb-3 text-sm text-muted-foreground">
                        Acesse nossa documentação completa com tutoriais e guias.
                      </p>
                      <Button variant="outline" size="sm">
                        Acessar Documentação
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-8">
        <div className="container mx-auto px-4">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Package className="h-5 w-5 text-primary-foreground" />
              </div>
              <span className="font-bold">Stockly</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Stockly. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Contact;
