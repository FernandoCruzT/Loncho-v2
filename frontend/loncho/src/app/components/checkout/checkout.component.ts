import {
  Component,
  OnInit,
  AfterViewInit,
  OnDestroy,
  inject,
  signal
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { firstValueFrom } from 'rxjs';

import { CarritoService }  from '../../core/services/carrito.service';
import { PaypalService }   from '../../core/services/paypal.service';
import { PedidosService }  from '../../core/services/pedidos.service';
import { AuthService }     from '../../core/services/auth.service';
import { environment }     from '../../../environments/environment';

@Component({
  selector: 'app-checkout',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './checkout.component.html',
  styleUrl: './checkout.component.css'
})
export class CheckoutComponent implements OnInit, AfterViewInit, OnDestroy {

  private carritoService = inject(CarritoService);
  private paypalService  = inject(PaypalService);
  // Inyectados según spec; PedidosService queda disponible para
  // futuras extensiones (historial post-pago, etc.)
  private pedidosService = inject(PedidosService);
  private authService    = inject(AuthService);
  private router         = inject(Router);

  // ─── Signals / computed del servicio ─────────────────────────────
  readonly items    = this.carritoService.items;
  readonly subtotal = this.carritoService.subtotal;
  readonly iva      = this.carritoService.iva;
  readonly total    = this.carritoService.total;

  // ─── Signals locales ──────────────────────────────────────────────
  cargando    = signal(false);
  error       = signal('');
  pagoExitoso = signal<any>(null);

  // ─── Referencia al script para limpiarlo en destroy ───────────────
  private paypalScript: HTMLScriptElement | null = null;

  // ─── Ciclo de vida ────────────────────────────────────────────────

  ngOnInit(): void {
    if (this.carritoService.cantidadTotal() === 0) {
      this.router.navigate(['/carrito']);
    }
  }

  ngAfterViewInit(): void {
    if (this.items().length > 0) {
      this.cargarSDKPayPal();
    }
  }

  ngOnDestroy(): void {
    if (this.paypalScript && document.head.contains(this.paypalScript)) {
      document.head.removeChild(this.paypalScript);
      this.paypalScript = null;
    }
  }

  // ─── Carga el SDK de PayPal en el <head> ──────────────────────────
  cargarSDKPayPal(): void {
    const clientId     = environment.paypalClientId;
    const script       = document.createElement('script');
    script.src         = `https://www.paypal.com/sdk/js?client-id=${clientId}&currency=MXN&components=buttons`;
    script.onload      = () => this.renderBotonPayPal();
    document.head.appendChild(script);
    this.paypalScript  = script;
  }

  // ─── Renderiza el botón de PayPal en el DOM ───────────────────────
  renderBotonPayPal(): void {
    (window as any).paypal
      .Buttons({
        // ── Crear orden ─────────────────────────────────────────────
        createOrder: async () => {
          this.cargando.set(true);

          const itemsParaPedido = this.items().map(i => ({
            nombre:   i.product.nombre,
            cantidad: i.cantidad,
            precio:   i.product.precio
          }));

          const res = await firstValueFrom(
            this.paypalService.createOrder(
              itemsParaPedido,
              this.subtotal(),
              this.iva(),
              this.total()
            )
          );

          return res.orderID;
        },

        // ── Pago aprobado por el usuario ─────────────────────────────
        onApprove: async (data: any) => {
          const itemsParaPedido = this.items().map(i => ({
            producto_id: i.product.id,
            nombre:      i.product.nombre,
            precio:      i.product.precio,
            cantidad:    i.cantidad,
            subtotal:    i.product.precio * i.cantidad
          }));

          const res = await firstValueFrom(
            this.paypalService.captureOrder(
              data.orderID,
              itemsParaPedido,
              this.subtotal(),
              this.iva(),
              this.total()
            )
          );

          if (res.ok) {
            this.pagoExitoso.set(res);
            this.carritoService.vaciar();
          } else {
            this.error.set('El pago no pudo completarse. Intenta de nuevo.');
          }

          this.cargando.set(false);
        },

        // ── Usuario canceló ──────────────────────────────────────────
        onCancel: () => {
          this.error.set('Pago cancelado. Puedes intentarlo de nuevo.');
          this.cargando.set(false);
        },

        // ── Error de PayPal ──────────────────────────────────────────
        onError: (err: any) => {
          console.error('PayPal error:', err);
          this.error.set('Error con PayPal. Intenta de nuevo.');
          this.cargando.set(false);
        },

        style: {
          layout: 'vertical',
          color:  'blue',
          shape:  'rect',
          label:  'pay'
        }
      })
      .render('#paypal-button-container');
  }
}
