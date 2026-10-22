export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[];

export type Database = {
    public: {
        Tables: {
            billing_keys: {
                Row: {
                    billing_key: string;
                    created_at: string;
                    customer_key: string;
                    subscription_id: string;
                };
                ComputedFields: never;
                Insert: {
                    billing_key: string;
                    created_at?: string;
                    customer_key: string;
                    subscription_id: string;
                };
                Update: {
                    billing_key?: string;
                    created_at?: string;
                    customer_key?: string;
                    subscription_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'billing_keys_subscription_id_fkey';
                        columns: ['subscription_id'];
                        isOneToOne: true;
                        referencedRelation: 'subscriptions';
                        referencedColumns: ['id'];
                    },
                ];
            };
            cycle_contents: {
                Row: {
                    cycle_id: string;
                    postcard_path: string | null;
                    product_id: string | null;
                    reply_letter: string | null;
                    updated_at: string;
                };
                ComputedFields: never;
                Insert: {
                    cycle_id: string;
                    postcard_path?: string | null;
                    product_id?: string | null;
                    reply_letter?: string | null;
                    updated_at?: string;
                };
                Update: {
                    cycle_id?: string;
                    postcard_path?: string | null;
                    product_id?: string | null;
                    reply_letter?: string | null;
                    updated_at?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'cycle_contents_cycle_id_fkey';
                        columns: ['cycle_id'];
                        isOneToOne: true;
                        referencedRelation: 'subscription_cycles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'cycle_contents_product_id_fkey';
                        columns: ['product_id'];
                        isOneToOne: false;
                        referencedRelation: 'products';
                        referencedColumns: ['id'];
                    },
                ];
            };
            farewell_letters: {
                Row: {
                    body: string;
                    created_at: string;
                    updated_at: string;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    body: string;
                    created_at?: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    body?: string;
                    created_at?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'farewell_letters_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: true;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            farewell_notes: {
                Row: {
                    body: string;
                    created_at: string;
                    subscription_id: string;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    body?: string;
                    created_at?: string;
                    subscription_id: string;
                    user_id: string;
                };
                Update: {
                    body?: string;
                    created_at?: string;
                    subscription_id?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'farewell_notes_subscription_id_fkey';
                        columns: ['subscription_id'];
                        isOneToOne: true;
                        referencedRelation: 'subscriptions';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'farewell_notes_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            order_items: {
                Row: {
                    id: string;
                    order_id: string;
                    product_id: string;
                    product_name: string;
                    quantity: number;
                    unit_price: number;
                };
                ComputedFields: never;
                Insert: {
                    id?: string;
                    order_id: string;
                    product_id: string;
                    product_name: string;
                    quantity: number;
                    unit_price: number;
                };
                Update: {
                    id?: string;
                    order_id?: string;
                    product_id?: string;
                    product_name?: string;
                    quantity?: number;
                    unit_price?: number;
                };
                Relationships: [
                    {
                        foreignKeyName: 'order_items_order_id_fkey';
                        columns: ['order_id'];
                        isOneToOne: false;
                        referencedRelation: 'orders';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'order_items_product_id_fkey';
                        columns: ['product_id'];
                        isOneToOne: false;
                        referencedRelation: 'products';
                        referencedColumns: ['id'];
                    },
                ];
            };
            orders: {
                Row: {
                    created_at: string;
                    id: string;
                    items_amount: number;
                    order_name: string;
                    paid_at: string | null;
                    refunded_at: string | null;
                    ship_address1: string;
                    ship_address2: string;
                    ship_phone: string;
                    ship_postal_code: string;
                    ship_recipient_name: string;
                    shipped_at: string | null;
                    shipping_fee: number;
                    status: Database['public']['Enums']['order_status'];
                    total_amount: number;
                    updated_at: string;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    created_at?: string;
                    id?: string;
                    items_amount: number;
                    order_name: string;
                    paid_at?: string | null;
                    refunded_at?: string | null;
                    ship_address1: string;
                    ship_address2: string;
                    ship_phone: string;
                    ship_postal_code: string;
                    ship_recipient_name: string;
                    shipped_at?: string | null;
                    shipping_fee: number;
                    status?: Database['public']['Enums']['order_status'];
                    total_amount: number;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    id?: string;
                    items_amount?: number;
                    order_name?: string;
                    paid_at?: string | null;
                    refunded_at?: string | null;
                    ship_address1?: string;
                    ship_address2?: string;
                    ship_phone?: string;
                    ship_postal_code?: string;
                    ship_recipient_name?: string;
                    shipped_at?: string | null;
                    shipping_fee?: number;
                    status?: Database['public']['Enums']['order_status'];
                    total_amount?: number;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'orders_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            payments: {
                Row: {
                    amount: number;
                    approved_at: string | null;
                    created_at: string;
                    cycle_no: number | null;
                    failure_code: string | null;
                    failure_message: string | null;
                    id: string;
                    method: string | null;
                    order_id: string | null;
                    payment_key: string | null;
                    purpose: Database['public']['Enums']['payment_purpose'];
                    refunded_at: string | null;
                    status: Database['public']['Enums']['payment_status'];
                    subscription_id: string | null;
                    toss_order_id: string;
                    updated_at: string;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    amount: number;
                    approved_at?: string | null;
                    created_at?: string;
                    cycle_no?: number | null;
                    failure_code?: string | null;
                    failure_message?: string | null;
                    id?: string;
                    method?: string | null;
                    order_id?: string | null;
                    payment_key?: string | null;
                    purpose: Database['public']['Enums']['payment_purpose'];
                    refunded_at?: string | null;
                    status?: Database['public']['Enums']['payment_status'];
                    subscription_id?: string | null;
                    toss_order_id: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    amount?: number;
                    approved_at?: string | null;
                    created_at?: string;
                    cycle_no?: number | null;
                    failure_code?: string | null;
                    failure_message?: string | null;
                    id?: string;
                    method?: string | null;
                    order_id?: string | null;
                    payment_key?: string | null;
                    purpose?: Database['public']['Enums']['payment_purpose'];
                    refunded_at?: string | null;
                    status?: Database['public']['Enums']['payment_status'];
                    subscription_id?: string | null;
                    toss_order_id?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'payments_order_id_fkey';
                        columns: ['order_id'];
                        isOneToOne: false;
                        referencedRelation: 'orders';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'payments_subscription_fk';
                        columns: ['subscription_id'];
                        isOneToOne: false;
                        referencedRelation: 'subscriptions';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'payments_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            products: {
                Row: {
                    author: string;
                    bookkeeper_note: string;
                    created_at: string;
                    description: string;
                    id: string;
                    image_url: string;
                    name: string;
                    price: number;
                    publisher: string;
                    stock_quantity: number;
                    theme: Database['public']['Enums']['theme'];
                    updated_at: string;
                };
                ComputedFields: never;
                Insert: {
                    author: string;
                    bookkeeper_note: string;
                    created_at?: string;
                    description: string;
                    id?: string;
                    image_url: string;
                    name: string;
                    price: number;
                    publisher: string;
                    stock_quantity?: number;
                    theme: Database['public']['Enums']['theme'];
                    updated_at?: string;
                };
                Update: {
                    author?: string;
                    bookkeeper_note?: string;
                    created_at?: string;
                    description?: string;
                    id?: string;
                    image_url?: string;
                    name?: string;
                    price?: number;
                    publisher?: string;
                    stock_quantity?: number;
                    theme?: Database['public']['Enums']['theme'];
                    updated_at?: string;
                };
                Relationships: [];
            };
            profiles: {
                Row: {
                    created_at: string;
                    display_name: string;
                    id: string;
                    is_admin: boolean;
                    updated_at: string;
                };
                ComputedFields: never;
                Insert: {
                    created_at?: string;
                    display_name?: string;
                    id: string;
                    is_admin?: boolean;
                    updated_at?: string;
                };
                Update: {
                    created_at?: string;
                    display_name?: string;
                    id?: string;
                    is_admin?: boolean;
                    updated_at?: string;
                };
                Relationships: [];
            };
            shelf_memos: {
                Row: {
                    body: string;
                    created_at: string;
                    cycle_id: string;
                    updated_at: string;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    body: string;
                    created_at?: string;
                    cycle_id: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    body?: string;
                    created_at?: string;
                    cycle_id?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'shelf_memos_cycle_id_fkey';
                        columns: ['cycle_id'];
                        isOneToOne: true;
                        referencedRelation: 'subscription_cycles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'shelf_memos_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            shipping_addresses: {
                Row: {
                    address1: string;
                    address2: string;
                    consented_at: string;
                    created_at: string;
                    phone: string;
                    postal_code: string;
                    recipient_name: string;
                    updated_at: string;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    address1: string;
                    address2?: string;
                    consented_at: string;
                    created_at?: string;
                    phone: string;
                    postal_code: string;
                    recipient_name: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    address1?: string;
                    address2?: string;
                    consented_at?: string;
                    created_at?: string;
                    phone?: string;
                    postal_code?: string;
                    recipient_name?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'shipping_addresses_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: true;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            subscription_cycles: {
                Row: {
                    created_at: string;
                    cycle_no: number;
                    id: string;
                    payment_id: string;
                    reading_started_at: string | null;
                    shipped_at: string | null;
                    status: Database['public']['Enums']['cycle_status'];
                    subscription_id: string;
                    teaser: string | null;
                    unboxed_at: string | null;
                    updated_at: string;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    created_at?: string;
                    cycle_no: number;
                    id?: string;
                    payment_id: string;
                    reading_started_at?: string | null;
                    shipped_at?: string | null;
                    status: Database['public']['Enums']['cycle_status'];
                    subscription_id: string;
                    teaser?: string | null;
                    unboxed_at?: string | null;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    cycle_no?: number;
                    id?: string;
                    payment_id?: string;
                    reading_started_at?: string | null;
                    shipped_at?: string | null;
                    status?: Database['public']['Enums']['cycle_status'];
                    subscription_id?: string;
                    teaser?: string | null;
                    unboxed_at?: string | null;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'subscription_cycles_payment_id_fkey';
                        columns: ['payment_id'];
                        isOneToOne: true;
                        referencedRelation: 'payments';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'subscription_cycles_subscription_id_fkey';
                        columns: ['subscription_id'];
                        isOneToOne: false;
                        referencedRelation: 'subscriptions';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'subscription_cycles_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            subscription_drafts: {
                Row: {
                    created_at: string;
                    letter_body: string;
                    updated_at: string;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    created_at?: string;
                    letter_body: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    created_at?: string;
                    letter_body?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'subscription_drafts_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: true;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            subscription_letters: {
                Row: {
                    body: string;
                    created_at: string;
                    cycle_id: string | null;
                    id: string;
                    subscription_id: string;
                    updated_at: string;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    body: string;
                    created_at?: string;
                    cycle_id?: string | null;
                    id?: string;
                    subscription_id: string;
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    body?: string;
                    created_at?: string;
                    cycle_id?: string | null;
                    id?: string;
                    subscription_id?: string;
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'subscription_letters_cycle_id_fkey';
                        columns: ['cycle_id'];
                        isOneToOne: true;
                        referencedRelation: 'subscription_cycles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'subscription_letters_subscription_id_fkey';
                        columns: ['subscription_id'];
                        isOneToOne: false;
                        referencedRelation: 'subscriptions';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'subscription_letters_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            subscriptions: {
                Row: {
                    billing_day: number;
                    cancelled_at: string | null;
                    created_at: string;
                    end_reason: string | null;
                    ended_at: string | null;
                    id: string;
                    monthly_price: number;
                    next_billing_date: string | null;
                    started_at: string;
                    status: Database['public']['Enums']['subscription_status'];
                    updated_at: string;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    billing_day: number;
                    cancelled_at?: string | null;
                    created_at?: string;
                    end_reason?: string | null;
                    ended_at?: string | null;
                    id?: string;
                    monthly_price: number;
                    next_billing_date?: string | null;
                    started_at?: string;
                    status?: Database['public']['Enums']['subscription_status'];
                    updated_at?: string;
                    user_id: string;
                };
                Update: {
                    billing_day?: number;
                    cancelled_at?: string | null;
                    created_at?: string;
                    end_reason?: string | null;
                    ended_at?: string | null;
                    id?: string;
                    monthly_price?: number;
                    next_billing_date?: string | null;
                    started_at?: string;
                    status?: Database['public']['Enums']['subscription_status'];
                    updated_at?: string;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'subscriptions_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            unboxing_attempts: {
                Row: {
                    attempted_at: string;
                    cycle_id: string;
                    id: number;
                    succeeded: boolean;
                    user_id: string;
                };
                ComputedFields: never;
                Insert: {
                    attempted_at?: string;
                    cycle_id: string;
                    id?: never;
                    succeeded: boolean;
                    user_id: string;
                };
                Update: {
                    attempted_at?: string;
                    cycle_id?: string;
                    id?: never;
                    succeeded?: boolean;
                    user_id?: string;
                };
                Relationships: [
                    {
                        foreignKeyName: 'unboxing_attempts_cycle_id_fkey';
                        columns: ['cycle_id'];
                        isOneToOne: false;
                        referencedRelation: 'subscription_cycles';
                        referencedColumns: ['id'];
                    },
                    {
                        foreignKeyName: 'unboxing_attempts_user_id_fkey';
                        columns: ['user_id'];
                        isOneToOne: false;
                        referencedRelation: 'profiles';
                        referencedColumns: ['id'];
                    },
                ];
            };
            unboxing_codes: {
                Row: {
                    code: string;
                    cycle_id: string;
                    issued_at: string;
                    redeemed_at: string | null;
                };
                ComputedFields: never;
                Insert: {
                    code: string;
                    cycle_id: string;
                    issued_at?: string;
                    redeemed_at?: string | null;
                };
                Update: {
                    code?: string;
                    cycle_id?: string;
                    issued_at?: string;
                    redeemed_at?: string | null;
                };
                Relationships: [
                    {
                        foreignKeyName: 'unboxing_codes_cycle_id_fkey';
                        columns: ['cycle_id'];
                        isOneToOne: true;
                        referencedRelation: 'subscription_cycles';
                        referencedColumns: ['id'];
                    },
                ];
            };
        };
        Views: {
            [_ in never]: never;
        };
        Functions: {
            admin_save_cycle_content: {
                Args: {
                    p_cycle_id: string;
                    p_postcard_path?: string;
                    p_product_id?: string;
                    p_reply_letter?: string;
                    p_teaser?: string;
                };
                Returns: undefined;
            };
            admin_ship_cycle: { Args: { p_cycle_id: string }; Returns: string };
            admin_ship_order: {
                Args: { p_order_id: string };
                Returns: undefined;
            };
            admin_start_reading: {
                Args: { p_cycle_id: string };
                Returns: undefined;
            };
            app_constants: {
                Args: Record<PropertyKey, never>;
                Returns: {
                    free_shipping_threshold: number;
                    shipping_fee: number;
                    subscription_monthly_price: number;
                }[];
            };
            audit_rls: {
                Args: Record<PropertyKey, never>;
                Returns: {
                    policy_count: number;
                    rls_enabled: boolean;
                    table_name: string;
                }[];
            };
            cancel_subscription: {
                Args: { p_note: string };
                Returns: undefined;
            };
            confirm_order_payment: {
                Args: {
                    p_amount: number;
                    p_approved_at: string;
                    p_method: string;
                    p_payment_key: string;
                    p_toss_order_id: string;
                };
                Returns: string;
            };
            create_pending_order: {
                Args: { p_items: Json };
                Returns: {
                    amount: number;
                    order_id: string;
                    order_name: string;
                    toss_order_id: string;
                }[];
            };
            end_subscription_payment_failed: {
                Args: {
                    p_amount: number;
                    p_code: string;
                    p_cycle_no: number;
                    p_message: string;
                    p_subscription_id: string;
                    p_toss_order_id: string;
                };
                Returns: undefined;
            };
            fail_order_payment: {
                Args: {
                    p_code: string;
                    p_message: string;
                    p_toss_order_id: string;
                };
                Returns: undefined;
            };
            is_admin: { Args: Record<PropertyKey, never>; Returns: boolean };
            open_cycle: {
                Args: {
                    p_amount: number;
                    p_approved_at: string;
                    p_cycle_no: number;
                    p_method?: string;
                    p_next_billing_date: string;
                    p_payment_key: string;
                    p_subscription_id: string;
                    p_toss_order_id: string;
                };
                Returns: string;
            };
            redeem_unboxing_code: {
                Args: { p_code: string; p_cycle_id: string };
                Returns: {
                    locked_until: string;
                    ok: boolean;
                    remaining_attempts: number;
                }[];
            };
            refund_order: {
                Args: { p_order_id: string; p_refunded_at: string };
                Returns: undefined;
            };
            start_subscription: {
                Args: {
                    p_amount: number;
                    p_approved_at: string;
                    p_billing_day: number;
                    p_billing_key: string;
                    p_customer_key: string;
                    p_method: string;
                    p_next_billing_date: string;
                    p_payment_key: string;
                    p_subscription_id: string;
                    p_toss_order_id: string;
                    p_user_id: string;
                };
                Returns: string;
            };
            submit_letter: {
                Args: { p_body: string };
                Returns: {
                    attached_cycle_id: string;
                    letter_id: string;
                }[];
            };
            update_letter: {
                Args: { p_body: string; p_letter_id: string };
                Returns: undefined;
            };
        };
        Enums: {
            cycle_status:
                | 'awaiting_letter'
                | 'letter_arrived'
                | 'reading'
                | 'shipped'
                | 'unboxed';
            order_status:
                | 'pending_payment'
                | 'paid'
                | 'shipped'
                | 'cancelled'
                | 'refunded';
            payment_purpose: 'order' | 'subscription_cycle';
            payment_status: 'ready' | 'confirmed' | 'failed' | 'refunded';
            subscription_status: 'active' | 'cancelled' | 'ended';
            theme: 'nature' | 'food' | 'ecology' | 'local';
        };
        CompositeTypes: {
            [_ in never]: never;
        };
    };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
    keyof Database,
    'public'
>];

export type Tables<
    DefaultSchemaTableNameOrOptions extends
        | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
              DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
          DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
          Row: infer R;
      }
        ? R
        : never
    : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
            DefaultSchema['Views'])
      ? (DefaultSchema['Tables'] &
            DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
            Row: infer R;
        }
          ? R
          : never
      : never;

export type TablesInsert<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Insert: infer I;
      }
        ? I
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Insert: infer I;
        }
          ? I
          : never
      : never;

export type TablesUpdate<
    DefaultSchemaTableNameOrOptions extends
        | keyof DefaultSchema['Tables']
        | { schema: keyof DatabaseWithoutInternals },
    TableName extends (DefaultSchemaTableNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
        : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
          Update: infer U;
      }
        ? U
        : never
    : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
      ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
            Update: infer U;
        }
          ? U
          : never
      : never;

export type Enums<
    DefaultSchemaEnumNameOrOptions extends
        | keyof DefaultSchema['Enums']
        | { schema: keyof DatabaseWithoutInternals },
    EnumName extends (DefaultSchemaEnumNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
        : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
    : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
      ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
      : never;

export type CompositeTypes<
    PublicCompositeTypeNameOrOptions extends
        | keyof DefaultSchema['CompositeTypes']
        | { schema: keyof DatabaseWithoutInternals },
    CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
        schema: keyof DatabaseWithoutInternals;
    }
        ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
        : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
}
    ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
    : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
      ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
      : never;

export const Constants = {
    public: {
        Enums: {
            cycle_status: [
                'awaiting_letter',
                'letter_arrived',
                'reading',
                'shipped',
                'unboxed',
            ],
            order_status: [
                'pending_payment',
                'paid',
                'shipped',
                'cancelled',
                'refunded',
            ],
            payment_purpose: ['order', 'subscription_cycle'],
            payment_status: ['ready', 'confirmed', 'failed', 'refunded'],
            subscription_status: ['active', 'cancelled', 'ended'],
            theme: ['nature', 'food', 'ecology', 'local'],
        },
    },
} as const;
