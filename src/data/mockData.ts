// Mock data for the inventory management system

export interface Product {
  id: string;
  name: string;
  category: string;
  quantity: number;
  minStock: number;
  unit: string;
  price: number;
  location: string;
  lastMovement: string;
}

export interface Category {
  id: string;
  name: string;
  description: string;
  productCount: number;
  color: string;
}

export interface Entry {
  id: string;
  date: string;
  product: string;
  quantity: number;
  supplier: string;
  responsible: string;
  notes: string;
}

export interface Exit {
  id: string;
  date: string;
  product: string;
  quantity: number;
  destination: string;
  employee: string;
  notes: string;
}

export interface Employee {
  id: string;
  name: string;
  registration: string;
  department: string;
  position: string;
  admissionDate: string;
  status: "active" | "inactive";
  email: string;
  phone: string;
}

export interface EPI {
  id: string;
  name: string;
  category: string;
  ca: string;
  validityDays: number;
  stock: number;
  minStock: number;
}

export interface EPIDelivery {
  id: string;
  employeeId: string;
  employeeName: string;
  epiId: string;
  epiName: string;
  deliveryDate: string;
  expiryDate: string;
  status: "in_use" | "returned" | "expired";
}

export interface Supplier {
  id: string;
  name: string;
  cnpj: string;
  email: string;
  phone: string;
  address: string;
  rating: number;
}

export const products: Product[] = [
  { id: "1", name: "Parafuso Phillips 6mm", category: "Ferragens", quantity: 1500, minStock: 500, unit: "un", price: 0.15, location: "A1-P1", lastMovement: "2024-01-15" },
  { id: "2", name: "Luva de Proteção Nitrílica", category: "EPIs", quantity: 230, minStock: 100, unit: "par", price: 8.50, location: "B2-P3", lastMovement: "2024-01-14" },
  { id: "3", name: "Óleo Lubrificante WD-40", category: "Químicos", quantity: 45, minStock: 20, unit: "un", price: 32.00, location: "C1-P2", lastMovement: "2024-01-13" },
  { id: "4", name: "Fita Isolante 19mm", category: "Elétricos", quantity: 180, minStock: 50, unit: "rolo", price: 5.80, location: "A3-P1", lastMovement: "2024-01-12" },
  { id: "5", name: "Capacete de Segurança", category: "EPIs", quantity: 75, minStock: 30, unit: "un", price: 45.00, location: "B1-P1", lastMovement: "2024-01-11" },
  { id: "6", name: "Chave de Fenda 1/4", category: "Ferramentas", quantity: 28, minStock: 10, unit: "un", price: 12.50, location: "D2-P4", lastMovement: "2024-01-10" },
  { id: "7", name: "Cabo Elétrico 2.5mm", category: "Elétricos", quantity: 850, minStock: 200, unit: "m", price: 3.20, location: "C2-P1", lastMovement: "2024-01-09" },
  { id: "8", name: "Óculos de Proteção", category: "EPIs", quantity: 95, minStock: 40, unit: "un", price: 18.00, location: "B2-P2", lastMovement: "2024-01-08" },
];

export const categories: Category[] = [
  { id: "1", name: "Ferragens", description: "Parafusos, porcas, arruelas e fixadores", productCount: 45, color: "bg-blue-500" },
  { id: "2", name: "EPIs", description: "Equipamentos de proteção individual", productCount: 32, color: "bg-green-500" },
  { id: "3", name: "Ferramentas", description: "Ferramentas manuais e elétricas", productCount: 28, color: "bg-orange-500" },
  { id: "4", name: "Elétricos", description: "Materiais elétricos em geral", productCount: 56, color: "bg-yellow-500" },
  { id: "5", name: "Químicos", description: "Produtos químicos e lubrificantes", productCount: 18, color: "bg-purple-500" },
  { id: "6", name: "Hidráulicos", description: "Conexões, tubos e válvulas", productCount: 23, color: "bg-cyan-500" },
];

export const entries: Entry[] = [
  { id: "1", date: "2024-01-15", product: "Parafuso Phillips 6mm", quantity: 500, supplier: "Ferragens ABC", responsible: "João Silva", notes: "Entrega parcial do pedido #1234" },
  { id: "2", date: "2024-01-14", product: "Luva de Proteção Nitrílica", quantity: 100, supplier: "EPI Safety", responsible: "Maria Santos", notes: "" },
  { id: "3", date: "2024-01-13", product: "Óleo Lubrificante WD-40", quantity: 24, supplier: "Química Industrial", responsible: "Pedro Costa", notes: "Lote: WD2024-001" },
  { id: "4", date: "2024-01-12", product: "Fita Isolante 19mm", quantity: 50, supplier: "Elétrica Master", responsible: "João Silva", notes: "" },
  { id: "5", date: "2024-01-11", product: "Capacete de Segurança", quantity: 30, supplier: "EPI Safety", responsible: "Ana Lima", notes: "CA: 12345" },
];

export const exits: Exit[] = [
  { id: "1", date: "2024-01-15", product: "Parafuso Phillips 6mm", quantity: 200, destination: "Produção", employee: "Carlos Mendes", notes: "Ordem de serviço #5678" },
  { id: "2", date: "2024-01-14", product: "Luva de Proteção Nitrílica", quantity: 20, destination: "Manutenção", employee: "Roberto Alves", notes: "" },
  { id: "3", date: "2024-01-13", product: "Cabo Elétrico 2.5mm", quantity: 150, destination: "Elétrica", employee: "Fernando Dias", notes: "Instalação nova máquina" },
  { id: "4", date: "2024-01-12", product: "Chave de Fenda 1/4", quantity: 5, destination: "Manutenção", employee: "Lucas Oliveira", notes: "" },
  { id: "5", date: "2024-01-11", product: "Óculos de Proteção", quantity: 10, destination: "Produção", employee: "Marcos Souza", notes: "Novos colaboradores" },
];

export const employees: Employee[] = [
  { id: "1", name: "Carlos Mendes", registration: "EMP001", department: "Produção", position: "Operador de Máquinas", admissionDate: "2020-03-15", status: "active", email: "carlos@empresa.com", phone: "(11) 99999-1111" },
  { id: "2", name: "Roberto Alves", registration: "EMP002", department: "Manutenção", position: "Técnico de Manutenção", admissionDate: "2019-08-20", status: "active", email: "roberto@empresa.com", phone: "(11) 99999-2222" },
  { id: "3", name: "Fernando Dias", registration: "EMP003", department: "Elétrica", position: "Eletricista", admissionDate: "2021-01-10", status: "active", email: "fernando@empresa.com", phone: "(11) 99999-3333" },
  { id: "4", name: "Lucas Oliveira", registration: "EMP004", department: "Manutenção", position: "Auxiliar de Manutenção", admissionDate: "2022-06-01", status: "active", email: "lucas@empresa.com", phone: "(11) 99999-4444" },
  { id: "5", name: "Marcos Souza", registration: "EMP005", department: "Produção", position: "Supervisor de Produção", admissionDate: "2018-11-25", status: "active", email: "marcos@empresa.com", phone: "(11) 99999-5555" },
  { id: "6", name: "André Costa", registration: "EMP006", department: "Logística", position: "Almoxarife", admissionDate: "2023-02-14", status: "inactive", email: "andre@empresa.com", phone: "(11) 99999-6666" },
];

export const epis: EPI[] = [
  { id: "1", name: "Capacete de Segurança Classe B", category: "Proteção da Cabeça", ca: "12345", validityDays: 365, stock: 75, minStock: 30 },
  { id: "2", name: "Luva de Proteção Nitrílica", category: "Proteção das Mãos", ca: "23456", validityDays: 180, stock: 230, minStock: 100 },
  { id: "3", name: "Óculos de Proteção Ampla Visão", category: "Proteção Visual", ca: "34567", validityDays: 365, stock: 95, minStock: 40 },
  { id: "4", name: "Protetor Auricular Plug", category: "Proteção Auditiva", ca: "45678", validityDays: 90, stock: 500, minStock: 200 },
  { id: "5", name: "Botina de Segurança", category: "Proteção dos Pés", ca: "56789", validityDays: 365, stock: 45, minStock: 20 },
  { id: "6", name: "Máscara PFF2", category: "Proteção Respiratória", ca: "67890", validityDays: 30, stock: 300, minStock: 150 },
];

export const epiDeliveries: EPIDelivery[] = [
  { id: "1", employeeId: "1", employeeName: "Carlos Mendes", epiId: "1", epiName: "Capacete de Segurança", deliveryDate: "2024-01-01", expiryDate: "2025-01-01", status: "in_use" },
  { id: "2", employeeId: "1", employeeName: "Carlos Mendes", epiId: "2", epiName: "Luva de Proteção", deliveryDate: "2024-01-10", expiryDate: "2024-07-10", status: "in_use" },
  { id: "3", employeeId: "2", employeeName: "Roberto Alves", epiId: "3", epiName: "Óculos de Proteção", deliveryDate: "2023-12-15", expiryDate: "2024-12-15", status: "in_use" },
  { id: "4", employeeId: "3", employeeName: "Fernando Dias", epiId: "4", epiName: "Protetor Auricular", deliveryDate: "2024-01-05", expiryDate: "2024-04-05", status: "expired" },
  { id: "5", employeeId: "4", employeeName: "Lucas Oliveira", epiId: "5", epiName: "Botina de Segurança", deliveryDate: "2023-10-20", expiryDate: "2024-10-20", status: "in_use" },
];

export const suppliers: Supplier[] = [
  { id: "1", name: "Ferragens ABC", cnpj: "12.345.678/0001-90", email: "contato@ferragensabc.com", phone: "(11) 3333-1111", address: "Rua das Ferragens, 100", rating: 4.5 },
  { id: "2", name: "EPI Safety", cnpj: "23.456.789/0001-01", email: "vendas@episafety.com", phone: "(11) 3333-2222", address: "Av. da Segurança, 200", rating: 4.8 },
  { id: "3", name: "Química Industrial", cnpj: "34.567.890/0001-12", email: "comercial@quimicaind.com", phone: "(11) 3333-3333", address: "Rua dos Químicos, 300", rating: 4.2 },
  { id: "4", name: "Elétrica Master", cnpj: "45.678.901/0001-23", email: "vendas@eletricamaster.com", phone: "(11) 3333-4444", address: "Av. Elétrica, 400", rating: 4.6 },
  { id: "5", name: "Hidráulica Total", cnpj: "56.789.012/0001-34", email: "contato@hidraulicatotal.com", phone: "(11) 3333-5555", address: "Rua das Válvulas, 500", rating: 4.0 },
];

export const movementData = [
  { month: "Jan", entries: 45, exits: 32 },
  { month: "Fev", entries: 52, exits: 41 },
  { month: "Mar", entries: 38, exits: 35 },
  { month: "Abr", entries: 61, exits: 48 },
  { month: "Mai", entries: 55, exits: 52 },
  { month: "Jun", entries: 67, exits: 58 },
];

export const categoryDistribution = [
  { name: "Ferragens", value: 45 },
  { name: "EPIs", value: 32 },
  { name: "Ferramentas", value: 28 },
  { name: "Elétricos", value: 56 },
  { name: "Químicos", value: 18 },
  { name: "Hidráulicos", value: 23 },
];

export const stockAlerts = [
  { product: "Máscara PFF2", current: 150, min: 150, status: "warning" },
  { product: "Protetor Auricular", current: 180, min: 200, status: "critical" },
  { product: "Botina de Segurança", current: 45, min: 20, status: "ok" },
];
