import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';

import { Product }        from '../../core/models/product.model';
import { ProductService } from '../../core/services/product.service';
import { CarritoService } from '../../core/services/carrito.service';
import { AuthService }    from '../../core/services/auth.service';

@Component({
  selector: 'app-catalogo',
  standalone: true,
  imports: [CommonModule, DecimalPipe],
  templateUrl: './catalogo.component.html',
  styleUrl: './catalogo.component.css'
})
export class CatalogoComponent implements OnInit {

  private productService  = inject(ProductService);
  private carritoService  = inject(CarritoService);
  readonly authService    = inject(AuthService);

  // ─── Signals ─────────────────────────────────────────────────────
  products        = signal<Product[]>([]);
  loading         = signal(true);
  error           = signal('');
  categoriaActiva = signal('TODOS');
  toast           = signal('');
  toastVisible    = signal(false);

  // ─── Cantidades seleccionadas por producto ────────────────────────
  // Map<productId, cantidad> — plain Map; Zone.js re-evalúa el template
  // tras cada click, por lo que getCantidad() siempre lee el valor fresco
  cantidades = new Map<number, number>();

  // ─── Catálogo de filtros ──────────────────────────────────────────
  readonly categorias = [
    'TODOS', 'HOODIES', 'PANTALONES', 'CAMISETAS',
    'CHAMARRAS', 'ACCESORIOS', 'SHORTS'
  ] as const;

  // ─── Computed ────────────────────────────────────────────────────
  readonly productosFiltrados = computed(() => {
    const cat = this.categoriaActiva();
    if (cat === 'TODOS') return this.products();
    return this.products().filter(
      p => p.categoria.toUpperCase() === cat
    );
  });

  // ─── Init ────────────────────────────────────────────────────────
  ngOnInit(): void {
    this.productService.getAll().subscribe({
      next: prods => {
        this.products.set(prods);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('No se pudo cargar el catálogo. Intenta más tarde.');
        this.loading.set(false);
      }
    });
  }

  // ─── Cantidad actual de un producto ──────────────────────────────
  getCantidad(id: number): number {
    return this.cantidades.get(id) ?? 0;
  }

  // ─── Primer click: AGREGAR (0 → 1) ───────────────────────────────
  agregar(product: Product): void {
    this.cantidades.set(product.id, 1);
    this.carritoService.agregar(product);
    this.mostrarToast(product.nombre);
  }

  // ─── Aumentar cantidad (+1, máx = stock) ─────────────────────────
  aumentar(product: Product): void {
    const actual = this.getCantidad(product.id);
    if (actual >= product.stock) return;
    this.cantidades.set(product.id, actual + 1);
    this.carritoService.agregar(product);
    this.mostrarToast(product.nombre);
  }

  // ─── Disminuir cantidad (−1; si llega a 0, elimina del carrito) ──
  disminuir(id: number): void {
    const actual = this.getCantidad(id);
    if (actual <= 0) return;
    const nueva = actual - 1;
    this.cantidades.set(id, nueva);
    if (nueva === 0) {
      this.carritoService.eliminar(id);
    } else {
      this.carritoService.quitar(id);
    }
  }

  // ─── Toast ───────────────────────────────────────────────────────
  mostrarToast(nombre: string): void {
    this.toast.set(nombre);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2500);
  }
}
