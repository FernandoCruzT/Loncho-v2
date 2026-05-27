import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PedidosService } from '../../core/services/pedidos.service';
import { AuthService }    from '../../core/services/auth.service';
import { Pedido }         from '../../core/models/pedido.model';

@Component({
  selector: 'app-mis-pedidos',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './mis-pedidos.component.html',
  styleUrl: './mis-pedidos.component.css'
})
export class MisPedidosComponent implements OnInit {

  private pedidosService = inject(PedidosService);
  // AuthService inyectado para futuras extensiones (mostrar nombre, etc.)
  private authService    = inject(AuthService);

  // ─── Signals ──────────────────────────────────────────────────────
  pedidos           = signal<Pedido[]>([]);
  loading           = signal(true);
  error             = signal('');
  pedidoCancelando  = signal<number | null>(null);
  confirmarCancelar = signal<number | null>(null);

  // ─── Ciclo de vida ────────────────────────────────────────────────
  ngOnInit(): void {
    this.cargarPedidos();
  }

  // ─── Carga (o recarga) el listado ────────────────────────────────
  cargarPedidos(): void {
    this.loading.set(true);
    this.error.set('');

    this.pedidosService
      .getPedidos()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next:  lista => this.pedidos.set(lista),
        error: err   => this.error.set(
          err?.error?.mensaje ?? 'No se pudieron cargar los pedidos.'
        )
      });
  }

  // ─── Pedir confirmación antes de cancelar ────────────────────────
  solicitarCancelacion(id: number): void {
    this.confirmarCancelar.set(id);
  }

  // ─── Confirmar y ejecutar la cancelación ─────────────────────────
  cancelar(id: number): void {
    this.confirmarCancelar.set(null);
    this.pedidoCancelando.set(id);

    this.pedidosService
      .cancelarPedido(id)
      .pipe(finalize(() => this.pedidoCancelando.set(null)))
      .subscribe({
        next: () => {
          this.pedidos.update(lista =>
            lista.map(p =>
              p.id === id ? { ...p, status: 'CANCELADO' as const } : p
            )
          );
        },
        error: err => {
          this.error.set(
            err?.error?.mensaje ?? 'No se pudo cancelar el pedido.'
          );
        }
      });
  }

  // ─── Color dinámico del badge de status ──────────────────────────
  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETADO':   return '#22c55e';
      case 'CREADO':       return '#f0b429';
      case 'CANCELADO':    return '#888888';
      case 'PAGO_FALLIDO': return '#e63030';
      default:             return '#aaaaaa';
    }
  }

  // ─── Formatea created_at → dd/MM/yyyy HH:mm ──────────────────────
  formatearFecha(fecha: string): string {
    const d    = new Date(fecha);
    const dd   = String(d.getDate()).padStart(2, '0');
    const mm   = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    const hh   = String(d.getHours()).padStart(2, '0');
    const min  = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${yyyy} ${hh}:${min}`;
  }
}
