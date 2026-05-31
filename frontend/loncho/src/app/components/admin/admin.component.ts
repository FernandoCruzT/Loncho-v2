import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { finalize } from 'rxjs/operators';

import { AdminService } from '../../core/services/admin.service';

const CATEGORIAS = ['HOODIES', 'PANTALONES', 'CAMISETAS', 'CHAMARRAS', 'ACCESORIOS', 'SHORTS'] as const;

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './admin.component.html',
  styleUrl: './admin.component.css'
})
export class AdminComponent implements OnInit {

  private adminService = inject(AdminService);

  readonly categorias = CATEGORIAS;

  tab       = signal<'productos' | 'usuarios'>('productos');
  productos = signal<any[]>([]);
  usuarios  = signal<any[]>([]);
  loading   = signal(true);
  editando  = signal<number | null>(null);
  editForm  = signal<any>(null);
  guardando = signal(false);
  error     = signal('');
  exito     = signal('');

  creando        = signal(false);
  guardandoNuevo = signal(false);
  nuevoProducto  = signal({
    nombre:      '',
    precio:      0,
    stock:       0,
    descripcion: '',
    categoria:   'HOODIES',
    image_url:   ''
  });

  ngOnInit(): void {
    forkJoin({
      productos: this.adminService.getProductos(),
      usuarios:  this.adminService.getUsuarios()
    })
    .pipe(finalize(() => this.loading.set(false)))
    .subscribe({
      next: ({ productos, usuarios }) => {
        this.productos.set(productos);
        this.usuarios.set(usuarios);
      },
      error: err => this.error.set(err?.error?.mensaje ?? 'Error al cargar datos')
    });
  }

  editarProducto(producto: any): void {
    this.editando.set(producto.id);
    this.editForm.set({ ...producto });
  }

  cancelarEdicion(): void {
    this.editando.set(null);
    this.editForm.set(null);
  }

  guardarProducto(): void {
    this.guardando.set(true);
    const id = this.editando()!;

    this.adminService.updateProducto(id, this.editForm())
      .pipe(finalize(() => this.guardando.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            const form = this.editForm();
            this.productos.update(lista =>
              lista.map(p => p.id === id ? { ...p, ...form } : p)
            );
            this.cancelarEdicion();
            this.exito.set('Producto actualizado');
            setTimeout(() => this.exito.set(''), 3000);
          }
        },
        error: err => this.error.set(err?.error?.mensaje ?? 'Error al actualizar el producto')
      });
  }

  toggleStock(producto: any): void {
    const nuevoEstado = !producto.en_stock;
    this.adminService.toggleStock(producto.id, nuevoEstado)
      .subscribe({
        next: res => {
          if (res.ok) {
            this.productos.update(lista =>
              lista.map(p => p.id === producto.id ? { ...p, en_stock: nuevoEstado } : p)
            );
          }
        },
        error: err => this.error.set(err?.error?.mensaje ?? 'Error al cambiar el stock')
      });
  }

  setEditField(field: string, value: any): void {
    this.editForm.set({ ...this.editForm(), [field]: value });
  }

  setNuevoField(field: string, value: any): void {
    this.nuevoProducto.set({ ...this.nuevoProducto(), [field]: value });
  }

  cancelarNuevo(): void {
    this.creando.set(false);
    this.nuevoProducto.set({ nombre: '', precio: 0, stock: 0, descripcion: '', categoria: 'HOODIES', image_url: '' });
  }

  guardarNuevoProducto(): void {
    this.guardandoNuevo.set(true);
    this.adminService.crearProducto(this.nuevoProducto())
      .pipe(finalize(() => this.guardandoNuevo.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.productos.update(lista => [...lista, res.datos]);
            this.cancelarNuevo();
            this.exito.set('Producto creado correctamente');
            setTimeout(() => this.exito.set(''), 3000);
          }
        },
        error: err => this.error.set(err?.error?.mensaje ?? 'Error al crear el producto')
      });
  }
}
