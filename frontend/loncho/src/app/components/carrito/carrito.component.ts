import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

import { CarritoService } from '../../core/services/carrito.service';
import { Product } from '../../core/models/product.model';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './carrito.component.html',
  styleUrl: './carrito.component.css'
})
export class CarritoComponent {

  private carritoService = inject(CarritoService);
  private router         = inject(Router);

  // ─── Exponer signals/computed del servicio ────────────────────────
  readonly items         = this.carritoService.items;
  readonly subtotal      = this.carritoService.subtotal;
  readonly iva           = this.carritoService.iva;
  readonly total         = this.carritoService.total;
  readonly cantidadTotal = this.carritoService.cantidadTotal;

  // ─── Estado local ─────────────────────────────────────────────────
  mensajeError = signal('');

  // ─── Métodos de mutación ──────────────────────────────────────────
  aumentar(product: Product): void {
    this.carritoService.agregar(product);
  }

  disminuir(productId: number): void {
    this.carritoService.quitar(productId);
  }

  eliminar(productId: number): void {
    this.carritoService.eliminar(productId);
  }

  vaciar(): void {
    this.carritoService.vaciar();
  }

  // ─── Navegación a checkout ────────────────────────────────────────
  irACheckout(): void {
    if (this.cantidadTotal() === 0) {
      this.mensajeError.set('Tu carrito está vacío.');
      return;
    }
    this.mensajeError.set('');
    this.router.navigate(['/checkout']);
  }

  // ─── Exportar recibo XML ──────────────────────────────────────────
  exportarXML(): void {
    const fecha = new Date().toISOString();

    const productosXML = this.items()
      .map(item => `
  <producto>
    <id>${item.product.id}</id>
    <nombre>${item.product.nombre}</nombre>
    <categoria>${item.product.categoria}</categoria>
    <precio>${item.product.precio.toFixed(2)}</precio>
    <cantidad>${item.cantidad}</cantidad>
    <subtotal>${(item.product.precio * item.cantidad).toFixed(2)}</subtotal>
  </producto>`)
      .join('');

    const xml =
      `<?xml version="1.0" encoding="UTF-8"?>
<recibo>
  <tienda>Loncho</tienda>
  <fecha>${fecha}</fecha>${productosXML}
  <subtotal>${this.subtotal().toFixed(2)}</subtotal>
  <iva>${this.iva().toFixed(2)}</iva>
  <total>${this.total().toFixed(2)}</total>
</recibo>`;

    const blob = new Blob([xml], { type: 'application/xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `loncho-recibo-${Date.now()}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
