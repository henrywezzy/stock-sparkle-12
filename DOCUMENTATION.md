# Stockly - Documentação Completa do Sistema

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Tecnologias Utilizadas](#tecnologias-utilizadas)
3. [Estrutura do Projeto](#estrutura-do-projeto)
4. [Módulos do Sistema](#módulos-do-sistema)
5. [Autenticação e Autorização](#autenticação-e-autorização)
6. [Banco de Dados](#banco-de-dados)
7. [Funcionalidades Detalhadas](#funcionalidades-detalhadas)
8. [Integrações](#integrações)
9. [PWA e Mobile](#pwa-e-mobile)
10. [Configurações](#configurações)

---

## 🎯 Visão Geral

O **Stockly** é um sistema completo de gestão de estoque e almoxarifado desenvolvido para empresas que precisam de controle preciso sobre seus produtos, EPIs (Equipamentos de Proteção Individual), ativos e movimentações.

### Principais Características

- ✅ Gestão completa de produtos e estoque
- ✅ Controle de EPIs com termos de entrega
- ✅ Multi-almoxarifado (múltiplas localizações)
- ✅ Gestão de fornecedores e compras
- ✅ Importação de NF-e (Nota Fiscal Eletrônica)
- ✅ Controle de requisições e aprovações
- ✅ Relatórios e dashboards
- ✅ Sistema de notificações
- ✅ PWA (Progressive Web App) para uso mobile
- ✅ Controle de acesso por roles (admin, almoxarife, visualizador)

---

## 🛠 Tecnologias Utilizadas

### Frontend

| Tecnologia | Versão | Descrição |
|------------|--------|-----------|
| React | 18.3.1 | Biblioteca principal de UI |
| TypeScript | - | Tipagem estática |
| Vite | - | Build tool e dev server |
| Tailwind CSS | - | Framework CSS utilitário |
| shadcn/ui | - | Componentes de UI |
| Framer Motion | 12.23.26 | Animações |
| React Router DOM | 6.30.1 | Roteamento SPA |
| TanStack Query | 5.83.0 | Gerenciamento de estado servidor |
| React Hook Form | 7.61.1 | Formulários |
| Zod | 3.25.76 | Validação de schemas |
| Recharts | 2.15.4 | Gráficos e visualizações |

### Backend (Supabase/Lovable Cloud)

| Recurso | Descrição |
|---------|-----------|
| PostgreSQL | Banco de dados relacional |
| Row Level Security (RLS) | Segurança em nível de linha |
| Edge Functions | Funções serverless |
| Storage | Armazenamento de arquivos |
| Auth | Autenticação de usuários |

### Bibliotecas Auxiliares

| Biblioteca | Uso |
|------------|-----|
| date-fns | Manipulação de datas |
| jspdf + jspdf-autotable | Geração de PDFs |
| html2canvas | Captura de tela para PDFs |
| jsbarcode | Geração de códigos de barras |
| qrcode | Geração de QR codes |
| html5-qrcode | Leitura de códigos de barras/QR |
| lucide-react | Ícones |
| sonner | Notificações toast |

---

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── dashboard/       # Componentes do dashboard
│   ├── entries/         # Componentes de entradas
│   ├── epis/           # Componentes de EPIs
│   ├── filters/        # Componentes de filtros
│   ├── layout/         # Componentes de layout (Sidebar, Header, etc)
│   ├── mobile/         # Componentes específicos mobile
│   ├── nfe/            # Componentes de NF-e
│   ├── notifications/  # Componentes de notificações
│   ├── onboarding/     # Tour de onboarding
│   ├── products/       # Componentes de produtos
│   ├── profile/        # Componentes de perfil
│   ├── purchases/      # Componentes de compras
│   ├── pwa/            # Componentes PWA
│   ├── reports/        # Componentes de relatórios
│   ├── settings/       # Componentes de configurações
│   ├── subscription/   # Componentes de assinatura
│   └── ui/             # Componentes base (shadcn/ui)
├── contexts/            # Contextos React
│   └── AuthContext.tsx # Contexto de autenticação
├── hooks/               # Hooks customizados
├── integrations/        # Integrações externas
│   └── supabase/       # Cliente e tipos do Supabase
├── lib/                 # Utilitários e helpers
├── pages/               # Páginas da aplicação
└── data/                # Dados mock para desenvolvimento
```

---

## 📦 Módulos do Sistema

### 1. Dashboard (`/dashboard`)

O dashboard é a página inicial após login, apresentando:

#### Cards de Indicadores
- **Total de Produtos**: Quantidade total de produtos cadastrados
- **Valor em Estoque**: Valor monetário total do estoque
- **Produtos Críticos**: Produtos abaixo do estoque mínimo
- **Movimentações do Mês**: Total de entradas e saídas

#### Gráficos
- Movimentação de estoque (linha temporal)
- Distribuição por categoria (pizza)
- Top produtos mais movimentados
- Análise ABC

#### Alertas
- Produtos com estoque baixo
- EPIs próximos do vencimento
- Requisições pendentes
- CAs (Certificados de Aprovação) vencendo

### 2. Produtos (`/products`)

Gestão completa de produtos do estoque.

#### Campos do Produto
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome do produto (obrigatório) |
| sku | string | Código SKU único |
| barcode | string | Código de barras |
| description | string | Descrição detalhada |
| category_id | uuid | Categoria do produto |
| supplier_id | uuid | Fornecedor principal |
| quantity | number | Quantidade em estoque |
| min_quantity | number | Estoque mínimo |
| max_quantity | number | Estoque máximo |
| price | number | Preço unitário |
| unit | string | Unidade de medida |
| location | string | Localização no almoxarifado |
| brand | string | Marca |
| batch | string | Lote |
| expiry_date | date | Data de validade |
| status | string | Status (ativo/inativo) |

#### Funcionalidades
- ✅ CRUD completo de produtos
- ✅ Importação via NF-e
- ✅ Geração de etiquetas com código de barras
- ✅ Filtros avançados (categoria, status, estoque)
- ✅ Exportação para Excel/PDF
- ✅ Histórico de movimentações
- ✅ Alertas de estoque mínimo/máximo
- ✅ Soft delete (exclusão lógica)

### 3. Entradas (`/entries`)

Registro de entradas de produtos no estoque.

#### Campos da Entrada
| Campo | Tipo | Descrição |
|-------|------|-----------|
| product_id | uuid | Produto (obrigatório) |
| quantity | number | Quantidade (obrigatório) |
| entry_date | date | Data da entrada |
| supplier_id | uuid | Fornecedor |
| invoice_number | string | Número da nota fiscal |
| batch | string | Lote |
| unit_price | number | Preço unitário |
| total_price | number | Valor total |
| location_id | uuid | Almoxarifado destino |
| received_by | string | Recebido por |
| notes | string | Observações |

#### Funcionalidades
- ✅ Registro manual de entradas
- ✅ Entrada rápida (quick entry)
- ✅ Importação via NF-e
- ✅ Atualização automática do estoque
- ✅ Registro no histórico de movimentações
- ✅ Filtros por período, produto, fornecedor
- ✅ Suporte a leitor de código de barras

### 4. Saídas (`/exits`)

Registro de saídas de produtos do estoque.

#### Campos da Saída
| Campo | Tipo | Descrição |
|-------|------|-----------|
| product_id | uuid | Produto (obrigatório) |
| quantity | number | Quantidade (obrigatório) |
| exit_date | date | Data da saída |
| employee_id | uuid | Funcionário solicitante |
| destination | string | Destino |
| reason | string | Motivo |
| requisition_id | uuid | Requisição vinculada |
| location_id | uuid | Almoxarifado origem |
| asset_id | uuid | Ativo vinculado |
| notes | string | Observações |

#### Funcionalidades
- ✅ Registro manual de saídas
- ✅ Saída via requisição aprovada
- ✅ Validação de estoque disponível
- ✅ Atualização automática do estoque
- ✅ Registro no histórico
- ✅ Filtros por período, funcionário, motivo

### 5. EPIs (`/epis`)

Gestão de Equipamentos de Proteção Individual.

#### Campos do EPI
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome do EPI (obrigatório) |
| description | string | Descrição |
| category | string | Categoria do EPI |
| ca_number | string | Número do CA |
| ca_expiry_date | date | Validade do CA |
| quantity | number | Quantidade em estoque |
| min_quantity | number | Estoque mínimo |
| default_validity_days | number | Validade padrão (dias) |
| image_url | string | URL da imagem |

#### Categorias de EPI
- Proteção da Cabeça (capacetes, bonés)
- Proteção dos Olhos (óculos, viseiras)
- Proteção Auditiva (protetores, abafadores)
- Proteção Respiratória (máscaras, respiradores)
- Proteção das Mãos (luvas)
- Proteção dos Pés (calçados, botas)
- Proteção contra Quedas (cintos, talabartes)
- Vestimentas (uniformes, aventais)

#### Termos de Entrega
Sistema completo para documentar a entrega de EPIs aos funcionários:

- **Número do termo**: Gerado automaticamente
- **Funcionário**: Seleção obrigatória
- **EPIs entregues**: Lista com quantidade, tamanho, validade
- **Data de emissão**: Data do termo
- **Responsável**: Quem fez a entrega
- **Observações**: Campo livre
- **Assinatura**: Campo para assinatura

#### Funcionalidades
- ✅ CRUD completo de EPIs
- ✅ Controle de CA (Certificado de Aprovação)
- ✅ Alertas de CA vencendo
- ✅ Termos de entrega com impressão
- ✅ Histórico de entregas por funcionário
- ✅ Controle de validade dos EPIs entregues
- ✅ Requisitos de EPI por cargo/departamento
- ✅ Kits de EPI pré-definidos

### 6. Funcionários (`/employees`)

Cadastro e gestão de funcionários.

#### Campos do Funcionário
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome completo (obrigatório) |
| registration_number | string | Matrícula |
| email | string | E-mail |
| phone | string | Telefone |
| department | string | Departamento |
| position | string | Cargo |
| admission_date | date | Data de admissão |
| photo_url | string | URL da foto |
| status | string | Status (ativo/inativo) |

#### Funcionalidades
- ✅ CRUD completo de funcionários
- ✅ Upload de foto
- ✅ Histórico de EPIs recebidos
- ✅ Histórico de requisições
- ✅ Soft delete
- ✅ Filtros por departamento, cargo, status

### 7. Fornecedores (`/suppliers`)

Gestão de fornecedores.

#### Campos do Fornecedor
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Razão social (obrigatório) |
| cnpj | string | CNPJ |
| contact_name | string | Nome do contato |
| email | string | E-mail |
| phone | string | Telefone |
| address | string | Endereço |
| rating | number | Avaliação (1-5) |
| status | string | Status |
| notes | string | Observações |

#### Funcionalidades
- ✅ CRUD completo
- ✅ Avaliação de desempenho
- ✅ Histórico de compras
- ✅ Categorias de fornecimento
- ✅ Relatório de performance

### 8. Compras (`/purchases`)

Gestão de ordens de compra.

#### Campos da Ordem de Compra
| Campo | Tipo | Descrição |
|-------|------|-----------|
| numero | string | Número da OC (auto) |
| supplier_id | uuid | Fornecedor |
| data_emissao | date | Data de emissão |
| data_entrega | date | Data prevista entrega |
| status | string | Status da ordem |
| solicitante | string | Quem solicitou |
| aprovado_por | string | Quem aprovou |
| condicoes_pagamento | string | Condições de pagamento |
| frete | string | Tipo de frete |
| total | number | Valor total |
| observacoes | string | Observações |

#### Itens da Ordem
| Campo | Tipo | Descrição |
|-------|------|-----------|
| tipo | string | produto ou epi |
| product_id / epi_id | uuid | Referência ao item |
| descricao | string | Descrição |
| codigo | string | Código/SKU |
| quantidade | number | Quantidade |
| unidade | string | Unidade |
| valor_unitario | number | Valor unitário |
| subtotal | number | Subtotal |

#### Status da Ordem
- `rascunho`: Em elaboração
- `pendente`: Aguardando aprovação
- `aprovada`: Aprovada, aguardando recebimento
- `parcialmente_recebida`: Alguns itens recebidos
- `recebida`: Todos itens recebidos
- `cancelada`: Cancelada

#### Funcionalidades
- ✅ Criação de ordens de compra
- ✅ Fluxo de aprovação
- ✅ Recebimento parcial/total
- ✅ Impressão da ordem
- ✅ Envio por e-mail
- ✅ Dashboard de compras
- ✅ Análise de fornecedores

### 9. Requisições (`/requisitions`)

Sistema de requisições internas.

#### Campos da Requisição
| Campo | Tipo | Descrição |
|-------|------|-----------|
| product_id | uuid | Produto solicitado |
| quantity | number | Quantidade |
| employee_id | uuid | Funcionário solicitante |
| requested_by | string | Solicitado por |
| priority | string | Prioridade |
| status | string | Status |
| notes | string | Justificativa |
| approved_by | string | Aprovado por |
| approved_at | timestamp | Data aprovação |

#### Status da Requisição
- `pendente`: Aguardando análise
- `aprovada`: Aprovada, aguardando retirada
- `rejeitada`: Rejeitada
- `atendida`: Retirada realizada

#### Funcionalidades
- ✅ Solicitação de materiais
- ✅ Fluxo de aprovação
- ✅ Geração automática de saída
- ✅ Notificações
- ✅ Priorização (alta, média, baixa)

### 10. Localizações/Almoxarifados (`/locations`)

Gestão multi-almoxarifado.

#### Campos da Localização
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome (obrigatório) |
| code | string | Código |
| address | string | Endereço |
| city | string | Cidade |
| state | string | Estado |
| is_default | boolean | Almoxarifado padrão |
| status | string | Status |

#### Estoque por Localização
| Campo | Tipo | Descrição |
|-------|------|-----------|
| product_id | uuid | Produto |
| location_id | uuid | Localização |
| quantity | number | Quantidade |
| min_quantity | number | Mínimo local |
| bin_location | string | Posição/Prateleira |

#### Funcionalidades
- ✅ Múltiplos almoxarifados
- ✅ Estoque por localização
- ✅ Transferências entre locais
- ✅ Mínimo por localização
- ✅ Posição (bin location)

### 11. Transferências (`/transfers`)

Movimentação entre almoxarifados.

#### Campos da Transferência
| Campo | Tipo | Descrição |
|-------|------|-----------|
| product_id | uuid | Produto |
| from_location_id | uuid | Origem |
| to_location_id | uuid | Destino |
| quantity | number | Quantidade |
| status | string | Status |
| requested_by | string | Solicitado por |
| approved_by | string | Aprovado por |
| transfer_date | date | Data transferência |
| notes | string | Observações |

#### Status
- `pendente`: Aguardando aprovação
- `aprovada`: Aprovada
- `concluida`: Transferência realizada
- `cancelada`: Cancelada

### 12. Kits (`/kits`)

Agrupamento de produtos.

#### Campos do Kit
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome do kit |
| description | string | Descrição |
| sku | string | Código SKU |
| category_id | uuid | Categoria |
| is_virtual | boolean | Kit virtual (não estocado) |
| quantity | number | Quantidade montada |
| status | string | Status |

#### Itens do Kit
| Campo | Tipo | Descrição |
|-------|------|-----------|
| kit_id | uuid | Kit |
| product_id | uuid | Produto |
| quantity | number | Quantidade por kit |

#### Funcionalidades
- ✅ Criação de kits
- ✅ Kit virtual (soma dos componentes)
- ✅ Kit físico (montagem prévia)
- ✅ Cálculo automático de disponibilidade

### 13. Ativos (`/assets`)

Gestão de ativos/patrimônio.

#### Campos do Ativo
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome do ativo |
| asset_tag | string | Etiqueta/Plaqueta |
| serial_number | string | Número de série |
| model | string | Modelo |
| manufacturer | string | Fabricante |
| department | string | Departamento |
| location_id | uuid | Localização |
| purchase_date | date | Data de compra |
| warranty_expiry | date | Fim da garantia |
| status | string | Status |
| notes | string | Observações |

#### Status do Ativo
- `em_uso`: Em utilização
- `disponivel`: Disponível para uso
- `manutencao`: Em manutenção
- `baixa`: Baixado/Descartado

### 14. NF-e (`/nfe`)

Importação de Notas Fiscais Eletrônicas.

#### Dados da NF-e
| Campo | Tipo | Descrição |
|-------|------|-----------|
| chave_acesso | string | Chave de 44 dígitos |
| numero | string | Número da nota |
| serie | string | Série |
| data_emissao | date | Data de emissão |
| nome_emitente | string | Fornecedor |
| cnpj_emitente | string | CNPJ fornecedor |
| valor_total | number | Valor total |
| itens | json | Lista de itens |
| status_manifestacao | string | Status MDFe |

#### Funcionalidades
- ✅ Upload de XML
- ✅ Consulta por chave de acesso
- ✅ OCR de DANFE (PDF/Imagem)
- ✅ Importação de itens para estoque
- ✅ Vinculação com produtos existentes
- ✅ Histórico de notas importadas

### 15. Categorias (`/categories`)

Organização de produtos em categorias.

#### Campos
| Campo | Tipo | Descrição |
|-------|------|-----------|
| name | string | Nome da categoria |
| description | string | Descrição |
| color | string | Cor (hex) |

### 16. Relatórios (`/reports`)

Sistema de relatórios.

#### Relatórios Disponíveis
- **Posição de Estoque**: Snapshot atual do estoque
- **Movimentação**: Entradas e saídas por período
- **Curva ABC**: Classificação por valor/giro
- **Giro de Estoque**: Análise de rotatividade
- **Previsão de Demanda**: Projeção baseada em histórico
- **Produtos Críticos**: Abaixo do mínimo
- **Validade**: Produtos próximos do vencimento
- **EPIs**: Entregas e vencimentos
- **Fornecedores**: Performance e histórico

#### Funcionalidades
- ✅ Filtros por período, categoria, produto
- ✅ Exportação PDF
- ✅ Exportação Excel
- ✅ Envio por e-mail
- ✅ Agendamento (futuro)

### 17. Histórico (`/history`)

Auditoria de movimentações.

#### Campos do Histórico
| Campo | Tipo | Descrição |
|-------|------|-----------|
| product_id | uuid | Produto |
| action | string | Tipo de ação |
| quantity | number | Quantidade |
| previous_quantity | number | Quantidade anterior |
| new_quantity | number | Nova quantidade |
| user_name | string | Usuário |
| notes | string | Observações |
| created_at | timestamp | Data/hora |

#### Tipos de Ação
- `entrada`: Entrada de estoque
- `saida`: Saída de estoque
- `ajuste`: Ajuste manual
- `transferencia`: Transferência
- `inventario`: Ajuste de inventário

---

## 🔐 Autenticação e Autorização

### Sistema de Autenticação

O sistema utiliza Supabase Auth com:

- ✅ Login com email/senha
- ✅ Registro de novos usuários
- ✅ Recuperação de senha
- ✅ Autenticação 2FA (Two-Factor)
- ✅ Sessão persistente

### Roles (Papéis)

| Role | Descrição | Permissões |
|------|-----------|------------|
| `admin` | Administrador | Acesso total, gerencia usuários |
| `almoxarife` | Operador | CRUD de produtos, movimentações |
| `visualizador` | Consulta | Apenas visualização |

### Tabela user_roles

```sql
CREATE TABLE user_roles (
  id UUID PRIMARY KEY,
  user_id UUID REFERENCES auth.users,
  role app_role NOT NULL DEFAULT 'visualizador',
  approved BOOLEAN DEFAULT false,
  created_at TIMESTAMP DEFAULT now()
);
```

### Fluxo de Aprovação

1. Usuário se registra
2. Role padrão: `visualizador`
3. Admin aprova e pode alterar role
4. Usuário recebe notificação

---

## 🗄 Banco de Dados

### Diagrama ER Simplificado

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│  products   │────<│   entries   │>────│  suppliers  │
└─────────────┘     └─────────────┘     └─────────────┘
       │                                       │
       │            ┌─────────────┐           │
       └───────────<│    exits    │           │
                    └─────────────┘           │
       │                   │                  │
       │                   v                  │
       │            ┌─────────────┐           │
       │            │  employees  │           │
       │            └─────────────┘           │
       │                   │                  │
       v                   v                  │
┌─────────────┐     ┌─────────────┐           │
│ categories  │     │requisitions │           │
└─────────────┘     └─────────────┘           │
                                              │
┌─────────────┐     ┌─────────────┐           │
│    epis     │────<│epi_deliveries│          │
└─────────────┘     └─────────────┘           │
       │                                      │
       v                                      v
┌─────────────┐     ┌─────────────────┐      │
│ termo_epis  │>────│termos_entrega   │      │
└─────────────┘     └─────────────────┘      │
                                              │
┌─────────────┐     ┌─────────────────────┐  │
│  locations  │────<│   location_stock    │  │
└─────────────┘     └─────────────────────┘  │
       │                                      │
       v                                      │
┌─────────────────┐                          │
│ stock_transfers │                          │
└─────────────────┘                          │
                                              │
┌─────────────────┐     ┌─────────────────┐  │
│ purchase_orders │────<│purchase_order_   │ │
└─────────────────┘     │items             │<┘
                        └─────────────────┘
```

### Principais Tabelas

| Tabela | Descrição |
|--------|-----------|
| products | Produtos do estoque |
| categories | Categorias de produtos |
| suppliers | Fornecedores |
| entries | Entradas de estoque |
| exits | Saídas de estoque |
| employees | Funcionários |
| epis | Equipamentos de proteção |
| epi_deliveries | Entregas de EPI |
| termos_entrega | Termos de entrega de EPI |
| termo_epis | EPIs por termo |
| locations | Almoxarifados |
| location_stock | Estoque por local |
| stock_transfers | Transferências |
| stock_history | Histórico de movimentações |
| requisitions | Requisições |
| purchase_orders | Ordens de compra |
| purchase_order_items | Itens das ordens |
| assets | Ativos/Patrimônio |
| product_kits | Kits de produtos |
| kit_items | Itens dos kits |
| nfe_history | Notas fiscais importadas |
| organizations | Organizações (multi-tenant) |
| organization_members | Membros da organização |
| profiles | Perfis de usuário |
| user_roles | Papéis de usuário |
| audit_log | Log de auditoria |
| notification_settings | Configurações de notificação |

### Row Level Security (RLS)

Todas as tabelas possuem RLS habilitado para garantir:

- Usuários só veem dados da sua organização
- Operações respeitam o papel do usuário
- Isolamento total entre organizações

---

## ⚡ Funcionalidades Detalhadas

### Importação de NF-e

#### Via XML
1. Upload do arquivo XML
2. Parse automático dos dados
3. Extração de itens
4. Vinculação com produtos existentes ou criação de novos
5. Geração automática de entrada

#### Via Chave de Acesso
1. Digita a chave de 44 dígitos
2. Consulta na SEFAZ via Edge Function
3. Retorna dados da nota
4. Mesmo fluxo de importação

#### Via OCR (DANFE)
1. Upload de PDF ou imagem do DANFE
2. Processamento OCR via Edge Function
3. Extração de dados
4. Validação e importação

### Sistema de Notificações

#### Tipos de Notificação
- Estoque baixo
- EPI vencendo
- Requisição pendente
- CA vencendo
- Ordem de compra aprovada

#### Canais
- In-app (badge no sino)
- E-mail (configurável)

#### Configurações
- Dias de antecedência para alertas
- Threshold de estoque baixo
- Ativar/desativar por tipo

### Geração de Etiquetas

#### Tipos
- Código de barras (EAN-13, Code128)
- QR Code
- Etiqueta completa (nome + código + preço)

#### Formatos
- Individual
- Múltiplas (grade)
- PDF para impressão

### Exportação de Dados

#### Formatos Suportados
- Excel (.xlsx)
- PDF
- CSV

#### Dados Exportáveis
- Lista de produtos
- Movimentações
- Relatórios
- Termos de entrega

---

## 🔌 Integrações

### Edge Functions

| Função | Descrição |
|--------|-----------|
| focus-nfe | Integração com Focus NFe para consulta |
| ocr-danfe | OCR de documentos DANFE |
| send-notification-email | Envio de e-mails de notificação |
| send-purchase-order-email | Envio de ordens de compra |
| send-report-email | Envio de relatórios |
| find-user-email | Busca e-mail de usuário |

### APIs Externas

- **Focus NFe**: Consulta de notas fiscais
- **OCR**: Processamento de imagens (configurável)
- **SMTP**: Envio de e-mails

---

## 📱 PWA e Mobile

### Progressive Web App

O sistema é um PWA completo com:

- ✅ Instalação na home screen
- ✅ Funcionamento offline (básico)
- ✅ Push notifications (preparado)
- ✅ Ícones adaptativos

### Recursos Mobile

#### Interface Adaptativa
- Sidebar colapsável
- Bottom navigation
- Menus otimizados para touch
- Cards responsivos

#### Funcionalidades Mobile
- Scanner de código de barras (câmera)
- Entrada rápida via scan
- Saída rápida via scan
- Formulários otimizados

### Manifest

```json
{
  "name": "Stockly",
  "short_name": "Stockly",
  "theme_color": "#8B5CF6",
  "background_color": "#1F2937",
  "display": "standalone",
  "orientation": "portrait"
}
```

---

## ⚙️ Configurações

### Configurações da Empresa

- Nome da empresa
- CNPJ
- Logo
- Endereço
- Telefone
- E-mail

### Configurações de Usuário

- Tema (claro/escuro)
- Notificações
- Colunas visíveis nas tabelas
- Foto de perfil
- Dados pessoais

### Configurações de EPI

- Requisitos por cargo
- Requisitos por departamento
- Validade padrão por tipo

### Preferências de Colunas

O sistema salva preferências de colunas visíveis por tabela:
- Quais colunas exibir
- Ordem das colunas
- Persistência por usuário

---

## 📊 Hooks Disponíveis

| Hook | Descrição |
|------|-----------|
| useProducts | CRUD de produtos |
| useEntries | CRUD de entradas |
| useExits | CRUD de saídas |
| useSuppliers | CRUD de fornecedores |
| useCategories | CRUD de categorias |
| useEmployees | CRUD de funcionários |
| useEPIs | CRUD de EPIs |
| useEPIDeliveries | Entregas de EPI |
| useEPICompliance | Conformidade de EPI |
| useEPIRequirements | Requisitos de EPI |
| useTermosEntrega | Termos de entrega |
| useLocations | Almoxarifados |
| useTransfers | Transferências |
| useKits | Kits de produtos |
| useAssets | Ativos |
| useRequisitions | Requisições |
| usePurchaseOrders | Ordens de compra |
| useNFe | Notas fiscais |
| useNFeHistory | Histórico de NFe |
| useStockHistory | Histórico de estoque |
| useStockIndicators | Indicadores de estoque |
| useStockTurnover | Giro de estoque |
| useABCAnalysis | Curva ABC |
| useDemandForecast | Previsão de demanda |
| useInventoryReports | Relatórios |
| useNotifications | Notificações |
| useAuditLog | Log de auditoria |
| useCompanySettings | Config. empresa |
| useOrganization | Organização |
| useColumnPreferences | Preferências de colunas |
| useTheme | Tema da interface |
| usePagination | Paginação |
| useMobile | Detecção mobile |

---

## 🚀 Como Executar

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Iniciar servidor de desenvolvimento
npm run dev
```

### Build

```bash
# Gerar build de produção
npm run build

# Preview do build
npm run preview
```

---

## 📝 Observações Finais

### Convenções de Código

- TypeScript strict mode
- Componentes funcionais com hooks
- Imports absolutos com @/
- Formatação com Prettier
- Linting com ESLint

### Padrões de Nomenclatura

- Componentes: PascalCase
- Hooks: camelCase com prefixo "use"
- Arquivos de componente: PascalCase.tsx
- Arquivos de hook: camelCase.ts
- Tabelas do banco: snake_case

### Segurança

- Todas as tabelas com RLS
- Sanitização de inputs
- Validação com Zod
- Autenticação obrigatória
- Tokens JWT

---

## 📞 Suporte

Para suporte ou dúvidas:
- Página de contato: `/contato`
- E-mail: suporte@stockly.com.br

---

*Documentação gerada em Janeiro/2026*
*Versão do Sistema: 1.0.0*
