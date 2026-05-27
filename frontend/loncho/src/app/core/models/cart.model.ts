import { Product } from './product.model';

export interface CartItem {
  product: Product;
  cantidad: number;
}

export interface CarritoState {
  items: CartItem[];
  subtotal: number;
  iva: number;
  total: number;
}
