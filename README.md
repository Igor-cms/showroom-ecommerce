# ☕ NATIVE — Exclusive Coffee Roastery & Showroom

Plataforma de e-commerce e portal de atacado (*Wholesale*) de alta performance desenvolvida para a **NATIVE Coffee Company**. O projeto combina uma experiência de varejo (B2C) com design editorial de luxo e um portal B2B completo com precificação dinâmica, catálogo em lote, autenticação protegida por tokens HMAC e ferramentas analíticas internas.

---

## 📑 Sumário

- [Visão Geral](#-visão-geral)
- [Principais Funcionalidades](#-principais-funcionalidades)
  - [Portal B2B (Wholesale)](#1-portal-b2b-wholesale)
  - [E-Commerce B2C & The Vault](#2-e-commerce-b2c--the-vault)
  - [Ferramentas Internas & Painel Administrativo](#3-ferramentas-internas--painel-administrativo)
  - [Performance & Design Editorial](#4-performance--design-editorial)
- [Stack Tecnológica](#-stack-tecnológica)
- [Estrutura do Projeto](#-estrutura-do-projeto)
- [Mapeamento de Rotas](#-mapeamento-de-rotas)
- [Arquitetura Serverless (Supabase Edge Functions)](#-arquitetura-serverless-supabase-edge-functions)
- [Modelo de Dados (Supabase / PostgreSQL)](#-modelo-de-dados-supabase--postgresql)
- [Variáveis de Ambiente](#-variáveis-de-ambiente)
- [Instalação e Execução Local](#-instalação-e-execução-local)
- [Scripts Auxiliares e Automações](#-scripts-auxiliares-e-automações)

---

## 🌟 Visão Geral

A **NATIVE** é uma torrefação exclusiva dedicada a microlotes raros e cafés de competição (*farm to cup*). O projeto foi desenhado sob uma arquitetura **Headless Commerce**, integrando:

1. **Frontend SPA Ultra-rápido:** Construído com React 18, TypeScript, Vite e Tailwind CSS, proporcionando transições fluidas e microinterações cinematográficas (GSAP).
2. **Back-end Serverless (Supabase):** Mais de 20 Edge Functions em Deno/TypeScript gerenciando regras de negócio, autenticação B2B com HMAC/JWT, persistência de dados e middleware seguro com a API do Shopify.
3. **Shopify Storefront & Admin API:** Gestão de catálogo, precificação de variantes em tempo real, cupons de desconto automatizados e finalização de compra (*checkout*).

---

## 🚀 Principais Funcionalidades

### 1. Portal B2B (Wholesale)
- **Acesso Restrito & Protegido:** Autenticação por senha com emissão de token HMAC-SHA256 validado via Edge Function (`verify-wholesale-password`).
- **Matriz de Pedidos em Lote:** Tabela interativa para seleção ágil de múltiplos cafés e pesos (250g, 500g, 1kg, 2.5kg, 5kg), com controle de estoque e variantes.
- **Tiers de Café & Volume:** Categorização em *Base*, *Top Shelf*, *Competition*, *Exotics* e *Hyper-Limited*, com regras de pedido mínimo (MOQ) e cálculo de descontos progressivos por volume.
- **Suporte Internacional (ROW - Rest of the World):** Rotas e tabelas dedicadas (`/wholesale-row`) com precificação ajustada e conversão cambial em tempo real.
- **Fluxo de Cadastro B2B:** Formulário de aplicação completo (`/wholesale-request`) com validação de dados empresariais (*tax ID*, endereço, volume estimado) e criação automática de clientes no Shopify.
- **Portal de Histórico de Pedidos:** Acesso a pedidos anteriores e função de repetição de pedido (*reorder*) com validação de disponibilidade de estoque.

### 2. E-Commerce B2C & The Vault
- **Catálogo Conectado à API Shopify:** Sincronização automática de produtos, variantes, notas sensoriais, fotos e status de disponibilidade via GraphQL.
- **Cart Drawer Customizado:** Carrinho lateral com cálculo dinâmico de descontos por cupom, limites de compra e integração de checkout nativo do Shopify.
- **The Vault:** Seção exclusiva para cafés experimentais e microlotes ultra-limitados, com sistema de aplicação para alocação.
- **Notificação de Estoque ("Back in Stock"):** Modal de inscrição para clientes serem avisados por e-mail quando variantes esgotadas voltarem ao estoque.
- **Área do Cliente (Customer Account):** Fluxo de login sem senha (*magic link* / tokens) integrado com a API Customer Account do Shopify.

### 3. Ferramentas Internas & Painel Administrativo
- **Calculadora de Lucro para Cafeterias (`/profit-calculator`):**
  - Ferramenta avançada para baristas e proprietários de cafeterias calcularem custo por dose (*Espresso*, *Pour Over*, *Batch Brew*).
  - Simulação de margens de lucro, precificação ideal de cardápio, desperdício e comparativo de rentabilidade com cafés de diferentes origens.
- **Painel Administrativo B2B (`/wholesale-admin`):**
  - Aprovação/rejeição de cadastros de atacado.
  - Sincronização e auditoria de tags de clientes no Shopify (`wholesale-approved`, `wholesale-pending`).
- **Gestão de Alertas e Inscrições:**
  - Visualização de inscritos no aviso de reposição (`/stock-notify-list`).
  - Gestão de candidaturas do Vault (`/vault-applications`).
  - Rastreamento de pedidos vinculados a cupons (`/coupon-orders`).

### 4. Performance & Design Editorial
- **Instant Boot Screen:** Tela de carregamento inline em HTML/CSS no `index.html` que elimina *Layout Shift* e pré-carrega assets críticos antes do bundle JavaScript ser inicializado.
- **SiteGate de Pré-lançamento:** Sistema de gate global por senha para permitir visualização de rotas em desenvolvimento sem expô-las ao público final.
- **Scroll Horizontal Dinâmico:** Animações com GSAP (`HorizontalPinScroll`) para apresentação de produtos e storytelling de produtores parceiros.

---

## 🛠 Stack Tecnológica

| Camada | Tecnologias |
| :--- | :--- |
| **Frontend Core** | React 18, TypeScript, Vite |
| **Estilização & UI** | Tailwind CSS, Radix UI Primitives (shadcn/ui), Lucide Icons |
| **Animações & Motion** | GSAP (GreenSock), Embla Carousel |
| **Gerenciamento de Estado & Dados** | TanStack React Query v5, Context API nativa |
| **Formulários & Validação** | React Hook Form, Zod |
| **Notificações** | Sonner, Radix Toast |
| **Backend & Banco de Dados** | Supabase (PostgreSQL, Deno Edge Functions, Auth, RLS) |
| **E-Commerce API** | Shopify Storefront API (GraphQL), Shopify Admin REST/GraphQL |
| **Ferramentas de Teste & Medição** | Puppeteer, ESLint, Python & Node scripts de regressão visual |

---

## 📁 Estrutura do Projeto

```plaintext
lovably-crafted-pixels/
├── public/                     # Favicons, imagens estáticas e assets públicos
├── scripts/                    # Scripts de automação, medição visual e auditoria
│   ├── cleanup-wholesale-tags.mjs  # Auditoria e limpeza de tags B2B no Shopify
│   ├── verify-pin.cjs          # Validação de animações de scroll GSAP
│   └── ... (scripts de teste e calibração de UI com Puppeteer/Python)
├── src/
│   ├── assets/                 # Imagens, ilustrações de cafés e branding
│   ├── components/             # Componentes modulares da aplicação
│   │   ├── ui/                 # Primitives do Shadcn/Radix UI (Button, Dialog, etc.)
│   │   ├── wholesale-copy/     # Componentes específicos do portal de atacado
│   │   ├── CartDrawer.tsx      # Drawer lateral de carrinho
│   │   ├── Header.tsx          # Cabeçalho responsivo com microinterações
│   │   ├── HorizontalPinScroll.tsx # Animação de scroll fixo com GSAP
│   │   ├── ProfitAnalysisCard.tsx  # Cards de cálculo de margem de café
│   │   ├── SiteGate.tsx        # Gate de proteção para rotas em pré-lançamento
│   │   ├── TheVaultSection.tsx # Seção exclusiva de microlotes raros
│   │   └── WholesaleProductTable.tsx # Tabela de pedidos em lote
│   ├── contexts/               # Contextos React (Cart, Customer, Currency)
│   │   ├── CartContext.tsx     # Estado global do carrinho e cupons
│   │   ├── CurrencyContext.tsx # Contexto de moedas e taxas de câmbio
│   │   └── CustomerContext.tsx # Sessão e autenticação de cliente
│   ├── data/                   # Mock data e tipos de produtos
│   ├── hooks/                  # Custom React Hooks
│   │   ├── useShopifyStorefrontProducts.ts # Consulta GraphQL de produtos
│   │   ├── useLoginBootGate.ts # Sincronização do boot screen nativo
│   │   ├── useCartDiscount.ts  # Lógica de cálculo de descontos
│   │   └── useCrispPitch.ts    # Ajustes finos de tipografia e layout
│   ├── integrations/
│   │   └── supabase/           # Cliente Supabase, tipos gerados e storage
│   ├── lib/                    # Utilitários auxiliares (Shopify client, cn helpers)
│   ├── pages/                  # Páginas e rotas da aplicação
│   │   ├── Index.tsx           # Homepage editorial
│   │   ├── Shop.tsx            # Catálogo de cafés B2C
│   │   ├── ProtectedWholesale.tsx # Portal B2B de atacado
│   │   ├── ProfitCalculator.tsx# Calculadora de rentabilidade
│   │   ├── WholesaleAdmin.tsx  # Painel administrativo B2B
│   │   ├── Producers.tsx       # Página de produtores e fazendas parceiras
│   │   └── ...
│   ├── App.tsx                 # Configuração de rotas (React Router) e Providers
│   ├── index.css               # Design tokens, fontes e estilos globais Tailwind
│   └── main.tsx                # Ponto de entrada da aplicação React
├── supabase/
│   ├── config.toml             # Configuração local do Supabase CLI
│   ├── functions/              # Deno Edge Functions (Serverless)
│   │   ├── create-b2b-company/ # Criação de empresa e tags no Shopify
│   │   ├── customer-auth-*     # Autenticação de clientes e callbacks
│   │   ├── get-shopify-products/# Proxy e cache de produtos Shopify
│   │   ├── shopify-cart/       # Criação de carrinho seguro no servidor
│   │   ├── stock-notify-*      # Inscrição e listagem de alertas de estoque
│   │   └── verify-*-password/  # Verificação de senhas HMAC
│   └── migrations/             # Migrações SQL do banco de dados PostgreSQL
├── package.json                # Dependências e scripts npm
├── tailwind.config.ts          # Configuração de cores, fontes e extensões Tailwind
└── vite.config.ts              # Configuração do Vite e plugins SWC
```

---

## 🗺 Mapeamento de Rotas

| Rota | Tipo | Descrição |
| :--- | :--- | :--- |
| `/` | Pública (Gated) | Homepage com hero cinematográfico e lançamentos recentes |
| `/shop` | Pública (Gated) | Catálogo de cafés especiais com filtros de notas e processos |
| `/producers` | Pública (Gated) | Perfil detalhado de produtores parceiros e processos de torra |
| `/podcast` | Pública (Gated) | Episódios e conteúdo de áudio oficial |
| `/blog` | Pública (Gated) | Guias de extração, receitas e artigos da torrefação |
| `/contact` | Pública (Gated) | Informações do Showroom e formulário de contato |
| `/wholesale` | Protegida (B2B) | Portal principal de pedidos para clientes de atacado |
| `/wholesale-row` | Protegida (B2B) | Portal de atacado para pedidos internacionais (Rest of World) |
| `/wholesale-request` | Pública | Formulário de solicitação de conta atacadista |
| `/wholesale-admin` | Administrativa | Painel de controle e aprovação de clientes atacadistas |
| `/profit-calculator` | Administrativa | Calculadora de margem e custo por xícara para parceiros |
| `/coupon-orders` | Administrativa | Visualizador de pedidos gerados por campanhas de cupom |
| `/vault-applications` | Administrativa | Gestão de inscrições para acesso a lotes raros |
| `/stock-notify-list` | Administrativa | Lista de clientes aguardando reabastecimento de produtos |
| `/login` / `/signup` | Pública (Gated) | Autenticação e cadastro de clientes |
| `/account` | Privada (Cliente) | Histórico de pedidos e dados da conta do cliente |

> *Nota: As rotas marcadas como **(Gated)** utilizam o componente `SiteGate` para controle durante fases de pré-lançamento.*

---

## ⚡ Arquitetura Serverless (Supabase Edge Functions)

As funções serverless executadas em ambiente **Deno** garantem segurança e isolamento de credenciais sensíveis:

- **`verify-wholesale-password` & `verify-admin-password`:** Validam senhas mestras e geram tokens JWT assinados via HMAC-SHA256 válidos por 7 dias.
- **`shopify-cart`:** Cria instâncias de carrinho no Shopify Storefront com `buyerIdentity`, permitindo que descontos atrelados ao cliente sejam validados com segurança.
- **`wholesale-register` & `create-b2b-company`:** Processam pedidos de registro B2B, criam o cliente no Shopify e disparam notificações internas.
- **`set-wholesale-status` & `list-wholesale-customers`:** Permitem que a equipe administrativa aprove ou rejeite contas com sincronização em tempo real de tags no Shopify.
- **`stock-notify-subscribe` & `stock-notify-list`:** Gerenciam cadastros no banco PostgreSQL para notificações automáticas de reposição de itens.
- **`customer-auth-start`, `customer-auth-callback`, `customer-orders-get`:** Implementação headless do fluxo de login e consulta de pedidos da Shopify Customer Account API.

---

## 🗄 Modelo de Dados (Supabase / PostgreSQL)

O banco de dados armazena os estados que não pertencem ao catálogo público da loja:

1. **`stock_notify_signups`:** Registros de clientes interessados em variantes esgotadas (`email`, `variant_id`, `product_title`, `created_at`, `notified_at`).
2. **`auth_sessions` & `customer_sessions`:** Gestão de tokens de sessão, PKCE verifiers e nonces para autenticação segura sem expor segredos ao navegador.
3. **`vault_applications`:** Formulários submetidos por clientes para obtenção de alocações exclusivas de microlotes raros.
4. **`wholesale_signups`:** Fila de pré-cadastro de parceiros comerciais e status de homologação (`pending`, `approved`, `rejected`).

---

## 🔑 Variáveis de Ambiente

Crie um arquivo `.env` na raiz do projeto com as seguintes variáveis:

```ini
# Supabase Configuration
VITE_SUPABASE_PROJECT_ID="seu-project-id"
VITE_SUPABASE_URL="https://seu-projeto.supabase.co"
VITE_SUPABASE_PUBLISHABLE_KEY="sua-chave-anon-publica"

# Shopify Storefront API
VITE_SHOPIFY_STORE_DOMAIN="sua-loja.myshopify.com"
VITE_SHOPIFY_STOREFRONT_TOKEN="seu-token-publico-storefront"
```

### Variáveis dos Segredos das Edge Functions (Supabase Dashboard)
- `ADMIN_PASSWORD`: Senha mestra para desbloquear painéis administrativos e o `SiteGate`.
- `WHOLESALE_PASSWORD`: Senha para acesso ao portal de atacado.
- `SHOPIFY_ADMIN_ACCESS_TOKEN`: Token da API Admin do Shopify com permissões de leitura/escrita em clientes e pedidos.

---

## 📦 Instalação e Execução Local

### Pré-requisitos
- **Node.js** (versão 18+ recomendada) ou **Bun**
- **npm** ou **bun** instalado
- Opcional: **Supabase CLI** para testes locais de Edge Functions

### 1. Clonar o repositório e instalar dependências
```bash
# Clone o repositório
git clone <url-do-repositorio>
cd lovably-crafted-pixels

# Instalar dependências via npm
npm install

# Ou via bun
bun install
```

### 2. Iniciar o servidor de desenvolvimento
```bash
npm run dev
# Ou com bun:
bun dev
```
A aplicação estará disponível por padrão em `http://localhost:5173`.

### 3. Build de Produção e Teste
```bash
# Executar verificação de tipos e build otimizado
npm run build

# Pré-visualizar o build localmente
npm run preview
```

---

## 🔬 Scripts Auxiliares e Automações

Na pasta `scripts/` encontram-se ferramentas especializadas criadas durante o desenvolvimento para manter a precisão de design e integridade de dados:

- **Auditoria de Tags B2B:**
  ```bash
  node scripts/cleanup-wholesale-tags.mjs
  ```
  Audita e normaliza tags de clientes no Shopify para garantir sincronia com os níveis de atacado.

- **Verificação Visual e Layout (Puppeteer / Python):**
  - `verify-pin.cjs`: Testa e mede a precisão das seções fixadas via GSAP ScrollTrigger em diferentes resoluções.
  - `measure-*.cjs`: Scripts automatizados para capturar dimensões exatas de cabeçalhos, barras laterais e alinhamento tipográfico.

---

## 🎨 Identidade Visual & Design System

- **Paleta de Cores:**
  - `wholesale-bg` / `bg-cream` (`#F8F5E4` / `#FAF7EB`): Tons quentes de creme orgânico.
  - `wholesale-primary` / `foreground` (`#131313`): Preto carvão profundo para máximo contraste e legibilidade.
  - Acentos em tons terrosos e dourados para categorização de cafés especiais (*Competition*, *Exotics*).
- **Tipografia:**
  - **Pixelify Sans:** Elementos de destaque, badges e acentos visuais característicos.
  - **Sans-serif limpa e moderna:** Textos de leitura, tabelas de dados e especificações sensoriais.

---

<div align="center">
  <sub>Desenvolvido com excelência para <strong>NATIVE Coffee Company</strong>.</sub>
</div>
