export interface PedidoItem {
  producto_id: number;
  nombre: string;
  precio: number;
  cantidad: number;
  subtotal: number;
}

export interface Pedido {
  id: number;
  status: 'CREADO' | 'COMPLETADO' | 'CANCELADO' | 'PAGO_FALLIDO';
  subtotal: number;
  iva: number;
  total: number;
  paypal_order_id: string;
  created_at: string;
  items: PedidoItem[];
}
