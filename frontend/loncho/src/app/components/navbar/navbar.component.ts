import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';

import { AuthService }    from '../../core/services/auth.service';
import { CarritoService } from '../../core/services/carrito.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrl: './navbar.component.css'
})
export class NavbarComponent {

  private authService    = inject(AuthService);
  private carritoService = inject(CarritoService);
  private router         = inject(Router);

  // ─── Computed públicos ────────────────────────────────────────────
  readonly isLoggedIn      = computed(() => this.authService.isLoggedIn());
  readonly usuario         = computed(() => this.authService.usuario());
  readonly cantidadCarrito = computed(() => this.carritoService.cantidadTotal());

  // ─── Estado menú móvil ────────────────────────────────────────────
  menuAbierto = signal(false);

  // ─── Logout ───────────────────────────────────────────────────────
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
