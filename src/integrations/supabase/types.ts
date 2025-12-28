export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      audit_log: {
        Row: {
          action: string
          changed_fields: string[] | null
          created_at: string
          id: string
          ip_address: string | null
          new_data: Json | null
          old_data: Json | null
          record_id: string
          table_name: string
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id: string
          table_name: string
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          changed_fields?: string[] | null
          created_at?: string
          id?: string
          ip_address?: string | null
          new_data?: Json | null
          old_data?: Json | null
          record_id?: string
          table_name?: string
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      company_settings: {
        Row: {
          address: string | null
          city: string | null
          cnpj: string | null
          created_at: string
          email: string | null
          id: string
          logo_url: string | null
          name: string
          phone: string | null
          state: string | null
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          city?: string | null
          cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          logo_url?: string | null
          name?: string
          phone?: string | null
          state?: string | null
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          admission_date: string | null
          created_at: string
          deleted_at: string | null
          department: string | null
          email: string | null
          id: string
          name: string
          phone: string | null
          photo_url: string | null
          position: string | null
          registration_number: string | null
          status: string | null
          updated_at: string
        }
        Insert: {
          admission_date?: string | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          registration_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          admission_date?: string | null
          created_at?: string
          deleted_at?: string | null
          department?: string | null
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          photo_url?: string | null
          position?: string | null
          registration_number?: string | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      entries: {
        Row: {
          batch: string | null
          created_at: string
          entry_date: string
          id: string
          invoice_number: string | null
          notes: string | null
          product_id: string
          quantity: number
          received_by: string | null
          supplier_id: string | null
          total_price: number | null
          unit_price: number | null
        }
        Insert: {
          batch?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          product_id: string
          quantity: number
          received_by?: string | null
          supplier_id?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Update: {
          batch?: string | null
          created_at?: string
          entry_date?: string
          id?: string
          invoice_number?: string | null
          notes?: string | null
          product_id?: string
          quantity?: number
          received_by?: string | null
          supplier_id?: string | null
          total_price?: number | null
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "entries_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "entries_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      epi_deliveries: {
        Row: {
          created_at: string
          delivery_date: string
          employee_id: string
          epi_id: string
          expiry_date: string | null
          id: string
          notes: string | null
          quantity: number
          return_date: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          delivery_date?: string
          employee_id: string
          epi_id: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          return_date?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          delivery_date?: string
          employee_id?: string
          epi_id?: string
          expiry_date?: string | null
          id?: string
          notes?: string | null
          quantity?: number
          return_date?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "epi_deliveries_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "epi_deliveries_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis"
            referencedColumns: ["id"]
          },
        ]
      }
      epis: {
        Row: {
          ca_expiry_date: string | null
          ca_number: string | null
          category: string | null
          created_at: string
          default_validity_days: number | null
          deleted_at: string | null
          description: string | null
          id: string
          image_url: string | null
          min_quantity: number | null
          name: string
          quantity: number
          updated_at: string
        }
        Insert: {
          ca_expiry_date?: string | null
          ca_number?: string | null
          category?: string | null
          created_at?: string
          default_validity_days?: number | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          min_quantity?: number | null
          name: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          ca_expiry_date?: string | null
          ca_number?: string | null
          category?: string | null
          created_at?: string
          default_validity_days?: number | null
          deleted_at?: string | null
          description?: string | null
          id?: string
          image_url?: string | null
          min_quantity?: number | null
          name?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: []
      }
      exits: {
        Row: {
          created_at: string
          destination: string | null
          employee_id: string | null
          exit_date: string
          id: string
          notes: string | null
          product_id: string
          quantity: number
          reason: string | null
          requisition_id: string | null
        }
        Insert: {
          created_at?: string
          destination?: string | null
          employee_id?: string | null
          exit_date?: string
          id?: string
          notes?: string | null
          product_id: string
          quantity: number
          reason?: string | null
          requisition_id?: string | null
        }
        Update: {
          created_at?: string
          destination?: string | null
          employee_id?: string | null
          exit_date?: string
          id?: string
          notes?: string | null
          product_id?: string
          quantity?: number
          reason?: string | null
          requisition_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "exits_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exits_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "exits_requisition_id_fkey"
            columns: ["requisition_id"]
            isOneToOne: false
            referencedRelation: "requisitions"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_settings: {
        Row: {
          created_at: string
          email_epi_expiring: boolean | null
          email_low_stock: boolean | null
          email_new_requisition: boolean | null
          epi_expiry_days: number | null
          id: string
          low_stock_threshold: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_epi_expiring?: boolean | null
          email_low_stock?: boolean | null
          email_new_requisition?: boolean | null
          epi_expiry_days?: number | null
          id?: string
          low_stock_threshold?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_epi_expiring?: boolean | null
          email_low_stock?: boolean | null
          email_new_requisition?: boolean | null
          epi_expiry_days?: number | null
          id?: string
          low_stock_threshold?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          batch: string | null
          brand: string | null
          category_id: string | null
          created_at: string
          deleted_at: string | null
          description: string | null
          expiry_date: string | null
          id: string
          location: string | null
          max_quantity: number | null
          min_quantity: number | null
          name: string
          price: number | null
          quantity: number
          sku: string | null
          status: string | null
          supplier_id: string | null
          unit: string | null
          updated_at: string
        }
        Insert: {
          batch?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          location?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          name: string
          price?: number | null
          quantity?: number
          sku?: string | null
          status?: string | null
          supplier_id?: string | null
          unit?: string | null
          updated_at?: string
        }
        Update: {
          batch?: string | null
          brand?: string | null
          category_id?: string | null
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          expiry_date?: string | null
          id?: string
          location?: string | null
          max_quantity?: number | null
          min_quantity?: number | null
          name?: string
          price?: number | null
          quantity?: number
          sku?: string | null
          status?: string | null
          supplier_id?: string | null
          unit?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          address: string | null
          avatar_url: string | null
          city: string | null
          created_at: string
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          selected_icon: string | null
          state: string | null
          ui_theme: string | null
          updated_at: string
          user_id: string
          username: string | null
          zip_code: string | null
        }
        Insert: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          selected_icon?: string | null
          state?: string | null
          ui_theme?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
          zip_code?: string | null
        }
        Update: {
          address?: string | null
          avatar_url?: string | null
          city?: string | null
          created_at?: string
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          selected_icon?: string | null
          state?: string | null
          ui_theme?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
          zip_code?: string | null
        }
        Relationships: []
      }
      requisitions: {
        Row: {
          approved_at: string | null
          approved_by: string | null
          created_at: string
          employee_id: string | null
          id: string
          notes: string | null
          priority: string | null
          product_id: string
          quantity: number
          requested_by: string | null
          status: string | null
        }
        Insert: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          product_id: string
          quantity: number
          requested_by?: string | null
          status?: string | null
        }
        Update: {
          approved_at?: string | null
          approved_by?: string | null
          created_at?: string
          employee_id?: string | null
          id?: string
          notes?: string | null
          priority?: string | null
          product_id?: string
          quantity?: number
          requested_by?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "requisitions_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "requisitions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_history: {
        Row: {
          action: string
          created_at: string
          id: string
          new_quantity: number | null
          notes: string | null
          previous_quantity: number | null
          product_id: string
          quantity: number
          user_name: string | null
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          new_quantity?: number | null
          notes?: string | null
          previous_quantity?: number | null
          product_id: string
          quantity: number
          user_name?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          new_quantity?: number | null
          notes?: string | null
          previous_quantity?: number | null
          product_id?: string
          quantity?: number
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          cnpj: string | null
          contact_name: string | null
          created_at: string
          deleted_at: string | null
          email: string | null
          id: string
          name: string
          notes: string | null
          phone: string | null
          rating: number | null
          status: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          cnpj?: string | null
          contact_name?: string | null
          created_at?: string
          deleted_at?: string | null
          email?: string | null
          id?: string
          name?: string
          notes?: string | null
          phone?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      termo_epis: {
        Row: {
          ca_number: string | null
          created_at: string
          data_devolucao: string | null
          data_entrega: string
          data_validade: string | null
          epi_id: string
          id: string
          quantidade: number | null
          tamanho: string | null
          termo_id: string
        }
        Insert: {
          ca_number?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_entrega?: string
          data_validade?: string | null
          epi_id: string
          id?: string
          quantidade?: number | null
          tamanho?: string | null
          termo_id: string
        }
        Update: {
          ca_number?: string | null
          created_at?: string
          data_devolucao?: string | null
          data_entrega?: string
          data_validade?: string | null
          epi_id?: string
          id?: string
          quantidade?: number | null
          tamanho?: string | null
          termo_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "termo_epis_epi_id_fkey"
            columns: ["epi_id"]
            isOneToOne: false
            referencedRelation: "epis"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "termo_epis_termo_id_fkey"
            columns: ["termo_id"]
            isOneToOne: false
            referencedRelation: "termos_entrega"
            referencedColumns: ["id"]
          },
        ]
      }
      termos_entrega: {
        Row: {
          created_at: string
          data_emissao: string
          employee_id: string
          id: string
          numero: string
          observacoes: string | null
          responsavel_nome: string | null
          status: string | null
        }
        Insert: {
          created_at?: string
          data_emissao?: string
          employee_id: string
          id?: string
          numero: string
          observacoes?: string | null
          responsavel_nome?: string | null
          status?: string | null
        }
        Update: {
          created_at?: string
          data_emissao?: string
          employee_id?: string
          id?: string
          numero?: string
          observacoes?: string | null
          responsavel_nome?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "termos_entrega_employee_id_fkey"
            columns: ["employee_id"]
            isOneToOne: false
            referencedRelation: "employees"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          approved: boolean | null
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          approved?: boolean | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          approved?: boolean | null
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "almoxarife" | "visualizador"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "almoxarife", "visualizador"],
    },
  },
} as const
