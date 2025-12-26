import { useState } from "react";
import {
  Settings as SettingsIcon,
  Building2,
  Bell,
  Users,
  Shield,
  Palette,
  Database,
  FileBarChart,
  Save,
} from "lucide-react";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const [companyName, setCompanyName] = useState("Almoxarifado Industrial");
  const [lowStockAlert, setLowStockAlert] = useState(true);
  const [epiExpiryAlert, setEpiExpiryAlert] = useState(true);
  const [emailNotifications, setEmailNotifications] = useState(false);

  const handleSave = () => {
    toast({ title: "Configurações salvas!", description: "Suas alterações foram salvas com sucesso." });
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Configurações"
        description="Configure as preferências do sistema"
        breadcrumbs={[{ label: "Dashboard", href: "/" }, { label: "Configurações" }]}
      />

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="bg-secondary/50 flex-wrap h-auto gap-1 p-1">
          <TabsTrigger value="general" className="gap-2">
            <Building2 className="w-4 h-4" />
            Geral
          </TabsTrigger>
          <TabsTrigger value="notifications" className="gap-2">
            <Bell className="w-4 h-4" />
            Notificações
          </TabsTrigger>
          <TabsTrigger value="stock" className="gap-2">
            <Database className="w-4 h-4" />
            Estoque
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="w-4 h-4" />
            Usuários
          </TabsTrigger>
          <TabsTrigger value="security" className="gap-2">
            <Shield className="w-4 h-4" />
            Segurança
          </TabsTrigger>
          <TabsTrigger value="appearance" className="gap-2">
            <Palette className="w-4 h-4" />
            Aparência
          </TabsTrigger>
        </TabsList>

        <TabsContent value="general" className="space-y-6">
          <div className="glass rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Building2 className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Informações da Empresa</h3>
                <p className="text-sm text-muted-foreground">Configure os dados básicos</p>
              </div>
            </div>

            <div className="grid gap-4 max-w-xl">
              <div className="grid gap-2">
                <Label htmlFor="companyName">Nome da Empresa</Label>
                <Input
                  id="companyName"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="email">E-mail de Contato</Label>
                <Input id="email" type="email" placeholder="contato@empresa.com" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="phone">Telefone</Label>
                <Input id="phone" placeholder="(00) 0000-0000" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="timezone">Fuso Horário</Label>
                <Select defaultValue="america_sp">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="america_sp">América/São Paulo (GMT-3)</SelectItem>
                    <SelectItem value="america_rj">América/Rio de Janeiro (GMT-3)</SelectItem>
                    <SelectItem value="america_bs">América/Brasília (GMT-3)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-6">
          <div className="glass rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Bell className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Configurações de Alertas</h3>
                <p className="text-sm text-muted-foreground">Gerencie as notificações do sistema</p>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">Alerta de Estoque Baixo</p>
                  <p className="text-sm text-muted-foreground">Notificar quando o estoque atingir o mínimo</p>
                </div>
                <Switch checked={lowStockAlert} onCheckedChange={setLowStockAlert} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">Alerta de EPIs Vencendo</p>
                  <p className="text-sm text-muted-foreground">Notificar 30, 15 e 7 dias antes</p>
                </div>
                <Switch checked={epiExpiryAlert} onCheckedChange={setEpiExpiryAlert} />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">Notificações por E-mail</p>
                  <p className="text-sm text-muted-foreground">Receber alertas por e-mail</p>
                </div>
                <Switch checked={emailNotifications} onCheckedChange={setEmailNotifications} />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="stock" className="space-y-6">
          <div className="glass rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Database className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Configurações de Estoque</h3>
                <p className="text-sm text-muted-foreground">Configure as regras do almoxarifado</p>
              </div>
            </div>

            <div className="grid gap-4 max-w-xl">
              <div className="grid gap-2">
                <Label>Nível Mínimo Padrão</Label>
                <Input type="number" placeholder="10" />
                <p className="text-sm text-muted-foreground">
                  Quantidade mínima padrão para novos produtos
                </p>
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">Controle de Lote</p>
                  <p className="text-sm text-muted-foreground">Ativar rastreamento por lote</p>
                </div>
                <Switch />
              </div>
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">Controle de Validade</p>
                  <p className="text-sm text-muted-foreground">Ativar controle de validade</p>
                </div>
                <Switch defaultChecked />
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-6">
          <div className="glass rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Users className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Usuários e Permissões</h3>
                <p className="text-sm text-muted-foreground">Gerencie os acessos ao sistema</p>
              </div>
            </div>

            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Para gerenciar usuários, conecte-se ao Lovable Cloud</p>
              <Button variant="outline" className="mt-4">
                Conectar Lovable Cloud
              </Button>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="security" className="space-y-6">
          <div className="glass rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Backup e Segurança</h3>
                <p className="text-sm text-muted-foreground">Configure backups e segurança</p>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="flex items-center justify-between p-4 rounded-lg bg-secondary/50">
                <div>
                  <p className="font-medium">Backup Automático</p>
                  <p className="text-sm text-muted-foreground">Realizar backup diário</p>
                </div>
                <Switch defaultChecked />
              </div>
              <div className="flex gap-4">
                <Button variant="outline" className="flex-1">
                  Exportar Dados
                </Button>
                <Button variant="outline" className="flex-1">
                  Importar Dados
                </Button>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-6">
          <div className="glass rounded-xl p-6 space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-border/50">
              <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                <Palette className="w-5 h-5 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">Personalização</h3>
                <p className="text-sm text-muted-foreground">Customize a aparência do sistema</p>
              </div>
            </div>

            <div className="space-y-4 max-w-xl">
              <div className="grid gap-2">
                <Label>Cor Principal</Label>
                <div className="flex gap-2">
                  {["bg-cyan-500", "bg-blue-500", "bg-green-500", "bg-purple-500", "bg-orange-500"].map((color) => (
                    <button
                      key={color}
                      className={`w-10 h-10 rounded-lg ${color} ring-2 ring-offset-2 ring-offset-background ring-transparent hover:ring-primary transition-all ${
                        color === "bg-cyan-500" ? "ring-foreground" : ""
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end">
        <Button onClick={handleSave} className="gradient-primary text-primary-foreground glow-sm">
          <Save className="w-4 h-4 mr-2" />
          Salvar Alterações
        </Button>
      </div>
    </div>
  );
}
