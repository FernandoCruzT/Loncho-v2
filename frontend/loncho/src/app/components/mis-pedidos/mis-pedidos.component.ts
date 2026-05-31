import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { PedidosService } from '../../core/services/pedidos.service';
import { AuthService }    from '../../core/services/auth.service';
import { EmailService }   from '../../core/services/email.service';
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
  private authService    = inject(AuthService);
  private emailService   = inject(EmailService);

  // ─── Signals pedidos ──────────────────────────────────────────────
  pedidos           = signal<Pedido[]>([]);
  loading           = signal(true);
  error             = signal('');
  pedidoCancelando  = signal<number | null>(null);
  confirmarCancelar = signal<number | null>(null);

  // ─── Signals modal email ──────────────────────────────────────────
  emailEnvio    = signal<number | null>(null);
  emailDestino  = signal('');
  enviandoEmail = signal(false);
  emailExito    = signal('');
  emailError    = signal('');

  // ─── Toast envío ──────────────────────────────────────────────────
  toastEnvio        = signal('');
  toastEnvioVisible = signal(false);

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

  // ─── Cancelación ─────────────────────────────────────────────────
  solicitarCancelacion(id: number): void {
    this.confirmarCancelar.set(id);
  }

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
          this.error.set(err?.error?.mensaje ?? 'No se pudo cancelar el pedido.');
        }
      });
  }

  // ─── XML helper privado ───────────────────────────────────────────
  private buildXML(pedido: Pedido): string {
    const productosXML = pedido.items
      .map(item => `
    <producto>
      <nombre>${item.nombre}</nombre>
      <cantidad>${item.cantidad}</cantidad>
      <precio>${Number(item.precio).toFixed(2)}</precio>
      <subtotal>${Number(item.subtotal).toFixed(2)}</subtotal>
    </producto>`)
      .join('');

    return `<?xml version="1.0" encoding="UTF-8"?>
<recibo>
  <tienda>Loncho</tienda>
  <pedido_id>${pedido.id}</pedido_id>
  <fecha>${pedido.created_at}</fecha>
  <status>${pedido.status}</status>
  <productos>${productosXML}
  </productos>
  <subtotal>${Number(pedido.subtotal).toFixed(2)}</subtotal>
  <iva>${Number(pedido.iva).toFixed(2)}</iva>
  <total>${Number(pedido.total).toFixed(2)}</total>
</recibo>`;
  }

  // ─── Descargar recibo XML ─────────────────────────────────────────
  generarXML(pedido: Pedido): void {
    const xml  = this.buildXML(pedido);
    const blob = new Blob([xml], { type: 'application/xml' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `recibo-loncho-${pedido.id}.xml`;
    a.click();
    URL.revokeObjectURL(url);
  }

  // ─── Modal email ──────────────────────────────────────────────────
  abrirEnvioEmail(pedidoId: number): void {
    this.emailEnvio.set(pedidoId);
    this.emailDestino.set(this.authService.usuario()?.email ?? '');
  }

  cerrarEnvioEmail(): void {
    this.emailEnvio.set(null);
    this.emailDestino.set('');
    this.emailExito.set('');
    this.emailError.set('');
  }

  enviarXMLPorEmail(pedido: Pedido): void {
    this.enviandoEmail.set(true);
    this.emailError.set('');
    this.toastEnvioVisible.set(true);
    this.toastEnvio.set('Enviando recibo...');
    const xmlContent = this.buildXML(pedido);

    this.emailService
      .enviarRecibo(pedido.id, this.emailDestino(), xmlContent)
      .pipe(finalize(() => this.enviandoEmail.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.emailExito.set(`Recibo enviado a ${this.emailDestino()}`);
            this.toastEnvio.set('✓ Recibo enviado a ' + this.emailDestino());
            setTimeout(() => { this.toastEnvioVisible.set(false); this.cerrarEnvioEmail(); }, 3000);
          } else {
            this.emailError.set('Error al enviar el correo');
            this.toastEnvio.set('Error al enviar el correo');
            setTimeout(() => this.toastEnvioVisible.set(false), 3000);
          }
        },
        error: () => {
          this.emailError.set('Error al enviar el correo');
          this.toastEnvio.set('Error al enviar el correo');
          setTimeout(() => this.toastEnvioVisible.set(false), 3000);
        }
      });
  }

  // ─── Badge de status ──────────────────────────────────────────────
  getStatusColor(status: string): string {
    switch (status) {
      case 'COMPLETADO':   return '#22c55e';
      case 'CREADO':       return '#f0b429';
      case 'CANCELADO':    return '#888888';
      case 'PAGO_FALLIDO': return '#e63030';
      default:             return '#aaaaaa';
    }
  }

  // ─── Formato de fecha ─────────────────────────────────────────────
  formatearFecha(fecha: string): string {
    const d   = new Date(fecha);
    const dd  = String(d.getDate()).padStart(2, '0');
    const mm  = String(d.getMonth() + 1).padStart(2, '0');
    const hh  = String(d.getHours()).padStart(2, '0');
    const min = String(d.getMinutes()).padStart(2, '0');
    return `${dd}/${mm}/${d.getFullYear()} ${hh}:${min}`;
  }
}
