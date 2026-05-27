import { Injectable, signal, computed } from '@angular/core';
import { Product } from '../models/product.model';
import { CartItem } from '../models/cart.model';

@Injectable({ providedIn: 'root' })
export class CarritoService {

  // ─── Signal privado ───────────────────────────────────────────────
  private _items = signal<CartItem[]>([]);

  // ─── Computed públicos ────────────────────────────────────────────
  readonly items = this._items.asReadonly();

  readonly subtotal = computed(() =>
    this._items().reduce(
      (sum, item) => sum + item.product.precio * item.cantidad,
      0
    )
  );

  readonly iva = computed(() => this.subtotal() * 0.16);

  readonly total = computed(() => this.subtotal() + this.iva());

  readonly cantidadTotal = computed(() =>
    this._items().reduce((sum, item) => sum + item.cantidad, 0)
  );

  // ─── Agregar producto ─────────────────────────────────────────────
  agregar(product: Product): void {
    const current = this._items();
    const idx     = current.findIndex(i => i.product.id === product.id);

    if (idx >= 0) {
      // Ya existe → incrementar cantidad
      const updated   = [...current];
      updated[idx]    = { ...updated[idx], cantidad: updated[idx].cantidad + 1 };
      this._items.set(updated);
    } else {
      // Nuevo → agregar con cantidad 1
      this._items.set([...current, { product, cantidad: 1 }]);
    }
  }

  // ─── Quitar (decrementa 1, elimina si llega a 0) ──────────────────
  quitar(productId: number): void {
    const current = this._items();
    const idx     = current.findIndex(i => i.product.id === productId);

    if (idx < 0) return;

    if (current[idx].cantidad <= 1) {
      this._items.set(current.filter(i => i.product.id !== productId));
    } else {
      const updated = [...current];
      updated[idx]  = { ...updated[idx], cantidad: updated[idx].cantidad - 1 };
      this._items.set(updated);
    }
  }

  // ─── Eliminar (sin importar cantidad) ─────────────────────────────
  eliminar(productId: number): void {
    this._items.set(this._items().filter(i => i.product.id !== productId));
  }

  // ─── Vaciar carrito ───────────────────────────────────────────────
  vaciar(): void {
    this._items.set([]);
  }

  // ─── Mapper para enviar al backend ────────────────────────────────
  getItemsParaPedido() {
    return this._items().map(item => ({
      producto_id: item.product.id,
      nombre:      item.product.nombre,
      precio:      item.product.precio,
      cantidad:    item.cantidad,
      subtotal:    item.product.precio * item.cantidad,
    }));
  }
}
