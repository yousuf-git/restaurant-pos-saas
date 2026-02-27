export type UserRole = 'admin' | 'operator';
export type OrderStatus = 'pending' | 'confirmed' | 'cancelled';

export interface Restaurant {
  id: number;
  name: string;
  logo_url: string | null;
  phone: string | null;
  address: string | null;
  receipt_header: string | null;
  receipt_footer: string | null;
  created_by: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  role: UserRole;
  restaurant_id: number | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Item {
  id: number;
  restaurant_id: number;
  name: string;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface ItemVariant {
  id: number;
  item_id: number;
  label: string;
  price: number;
  is_active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Order {
  id: number;
  restaurant_id: number;
  operator_id: string;
  order_number: number;
  total_amount: number;
  status: OrderStatus;
  note: string | null;
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  item_variant_id: number | null;
  item_name: string;
  variant_label: string;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface BillItem {
  item_variant_id: number;
  item_name: string;
  variant_label: string;
  quantity: number;
  unit_price: number;
}

export interface ItemWithVariants extends Item {
  variants: ItemVariant[];
}
