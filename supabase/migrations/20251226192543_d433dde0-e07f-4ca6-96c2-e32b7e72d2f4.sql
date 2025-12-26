-- Create enum for user roles
CREATE TYPE public.app_role AS ENUM ('admin', 'almoxarife', 'visualizador');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'visualizador',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    full_name TEXT,
    email TEXT,
    avatar_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create categories table
CREATE TABLE public.categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#3B82F6',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Create suppliers table
CREATE TABLE public.suppliers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    contact_name TEXT,
    email TEXT,
    phone TEXT,
    address TEXT,
    cnpj TEXT,
    status TEXT DEFAULT 'active',
    rating INTEGER DEFAULT 5,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.suppliers ENABLE ROW LEVEL SECURITY;

-- Create products table
CREATE TABLE public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    sku TEXT UNIQUE,
    category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 10,
    max_quantity INTEGER DEFAULT 1000,
    unit TEXT DEFAULT 'un',
    location TEXT,
    price DECIMAL(10,2) DEFAULT 0,
    description TEXT,
    batch TEXT,
    expiry_date DATE,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

-- Create employees table
CREATE TABLE public.employees (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    registration_number TEXT UNIQUE,
    department TEXT,
    position TEXT,
    admission_date DATE,
    phone TEXT,
    email TEXT,
    photo_url TEXT,
    status TEXT DEFAULT 'active',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

-- Create epis table (types of EPIs)
CREATE TABLE public.epis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    category TEXT,
    ca_number TEXT,
    default_validity_days INTEGER DEFAULT 365,
    quantity INTEGER NOT NULL DEFAULT 0,
    min_quantity INTEGER DEFAULT 5,
    image_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.epis ENABLE ROW LEVEL SECURITY;

-- Create epi_deliveries table
CREATE TABLE public.epi_deliveries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    epi_id UUID REFERENCES public.epis(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE CASCADE NOT NULL,
    quantity INTEGER NOT NULL DEFAULT 1,
    delivery_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expiry_date DATE,
    status TEXT DEFAULT 'in_use',
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.epi_deliveries ENABLE ROW LEVEL SECURITY;

-- Create entries table (stock entries)
CREATE TABLE public.entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    supplier_id UUID REFERENCES public.suppliers(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2),
    total_price DECIMAL(10,2),
    received_by TEXT,
    invoice_number TEXT,
    batch TEXT,
    notes TEXT,
    entry_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.entries ENABLE ROW LEVEL SECURITY;

-- Create exits table (stock exits)
CREATE TABLE public.exits (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL,
    destination TEXT,
    reason TEXT,
    notes TEXT,
    exit_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.exits ENABLE ROW LEVEL SECURITY;

-- Create requisitions table
CREATE TABLE public.requisitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL,
    requested_by TEXT,
    quantity INTEGER NOT NULL,
    status TEXT DEFAULT 'pending',
    priority TEXT DEFAULT 'normal',
    notes TEXT,
    approved_by TEXT,
    approved_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.requisitions ENABLE ROW LEVEL SECURITY;

-- Create stock_history table
CREATE TABLE public.stock_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE NOT NULL,
    action TEXT NOT NULL,
    quantity INTEGER NOT NULL,
    previous_quantity INTEGER,
    new_quantity INTEGER,
    user_name TEXT,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.stock_history ENABLE ROW LEVEL SECURITY;

-- Create notification_settings table
CREATE TABLE public.notification_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    email_low_stock BOOLEAN DEFAULT true,
    email_epi_expiring BOOLEAN DEFAULT true,
    email_new_requisition BOOLEAN DEFAULT true,
    low_stock_threshold INTEGER DEFAULT 10,
    epi_expiry_days INTEGER DEFAULT 30,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.notification_settings ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" ON public.user_roles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all roles" ON public.user_roles
    FOR ALL USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for profiles
CREATE POLICY "Users can view all profiles" ON public.profiles
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own profile" ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policies for categories (all authenticated users can view, admin/almoxarife can modify)
CREATE POLICY "Authenticated users can view categories" ON public.categories
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and almoxarife can insert categories" ON public.categories
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin and almoxarife can update categories" ON public.categories
    FOR UPDATE TO authenticated USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin can delete categories" ON public.categories
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for suppliers
CREATE POLICY "Authenticated users can view suppliers" ON public.suppliers
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and almoxarife can insert suppliers" ON public.suppliers
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin and almoxarife can update suppliers" ON public.suppliers
    FOR UPDATE TO authenticated USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin can delete suppliers" ON public.suppliers
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for products
CREATE POLICY "Authenticated users can view products" ON public.products
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and almoxarife can insert products" ON public.products
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin and almoxarife can update products" ON public.products
    FOR UPDATE TO authenticated USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin can delete products" ON public.products
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for employees
CREATE POLICY "Authenticated users can view employees" ON public.employees
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and almoxarife can insert employees" ON public.employees
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin and almoxarife can update employees" ON public.employees
    FOR UPDATE TO authenticated USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin can delete employees" ON public.employees
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for epis
CREATE POLICY "Authenticated users can view epis" ON public.epis
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and almoxarife can insert epis" ON public.epis
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin and almoxarife can update epis" ON public.epis
    FOR UPDATE TO authenticated USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin can delete epis" ON public.epis
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for epi_deliveries
CREATE POLICY "Authenticated users can view epi_deliveries" ON public.epi_deliveries
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and almoxarife can insert epi_deliveries" ON public.epi_deliveries
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin and almoxarife can update epi_deliveries" ON public.epi_deliveries
    FOR UPDATE TO authenticated USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin can delete epi_deliveries" ON public.epi_deliveries
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for entries
CREATE POLICY "Authenticated users can view entries" ON public.entries
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and almoxarife can insert entries" ON public.entries
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin and almoxarife can update entries" ON public.entries
    FOR UPDATE TO authenticated USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin can delete entries" ON public.entries
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for exits
CREATE POLICY "Authenticated users can view exits" ON public.exits
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and almoxarife can insert exits" ON public.exits
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin and almoxarife can update exits" ON public.exits
    FOR UPDATE TO authenticated USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin can delete exits" ON public.exits
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for requisitions
CREATE POLICY "Authenticated users can view requisitions" ON public.requisitions
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Authenticated users can insert requisitions" ON public.requisitions
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Admin and almoxarife can update requisitions" ON public.requisitions
    FOR UPDATE TO authenticated USING (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

CREATE POLICY "Admin can delete requisitions" ON public.requisitions
    FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- RLS Policies for stock_history
CREATE POLICY "Authenticated users can view stock_history" ON public.stock_history
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admin and almoxarife can insert stock_history" ON public.stock_history
    FOR INSERT TO authenticated WITH CHECK (
        public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'almoxarife')
    );

-- RLS Policies for notification_settings
CREATE POLICY "Users can view own notification_settings" ON public.notification_settings
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own notification_settings" ON public.notification_settings
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own notification_settings" ON public.notification_settings
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Create trigger to auto-create profile and default role on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, email)
  VALUES (NEW.id, NEW.raw_user_meta_data ->> 'full_name', NEW.email);
  
  -- First user gets admin role, others get visualizador by default
  IF (SELECT COUNT(*) FROM public.user_roles) = 0 THEN
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role)
    VALUES (NEW.id, 'visualizador');
  END IF;
  
  -- Create default notification settings
  INSERT INTO public.notification_settings (user_id)
  VALUES (NEW.id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update product quantity on entry
CREATE OR REPLACE FUNCTION public.update_product_on_entry()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET quantity = quantity + NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;
  
  INSERT INTO public.stock_history (product_id, action, quantity, previous_quantity, new_quantity)
  SELECT NEW.product_id, 'entry', NEW.quantity, 
         (SELECT quantity - NEW.quantity FROM public.products WHERE id = NEW.product_id),
         (SELECT quantity FROM public.products WHERE id = NEW.product_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_entry_created
  AFTER INSERT ON public.entries
  FOR EACH ROW EXECUTE FUNCTION public.update_product_on_entry();

-- Trigger to update product quantity on exit
CREATE OR REPLACE FUNCTION public.update_product_on_exit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  UPDATE public.products
  SET quantity = quantity - NEW.quantity,
      updated_at = now()
  WHERE id = NEW.product_id;
  
  INSERT INTO public.stock_history (product_id, action, quantity, previous_quantity, new_quantity)
  SELECT NEW.product_id, 'exit', NEW.quantity, 
         (SELECT quantity + NEW.quantity FROM public.products WHERE id = NEW.product_id),
         (SELECT quantity FROM public.products WHERE id = NEW.product_id);
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_exit_created
  AFTER INSERT ON public.exits
  FOR EACH ROW EXECUTE FUNCTION public.update_product_on_exit();