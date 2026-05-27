import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.css'
})
export class RegisterComponent {

  private authService = inject(AuthService);
  private router      = inject(Router);

  // ─── Signals del formulario ───────────────────────────────────────
  nombre   = signal('');
  email    = signal('');
  password = signal('');
  error    = signal('');
  loading  = signal(false);

  // ─── Validación de email ─────────────────────────────────────────
  private readonly EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ─── Submit ───────────────────────────────────────────────────────
  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.nombre().trim() || !this.email().trim() || !this.password().trim()) {
      this.error.set('Por favor completa todos los campos.');
      return;
    }

    if (!this.EMAIL_RE.test(this.email().trim())) {
      this.error.set('Ingresa un correo electrónico válido.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService
      .register(this.nombre().trim(), this.email().trim(), this.password())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.router.navigate(['/']);
          } else {
            this.error.set(res.mensaje ?? 'No se pudo crear la cuenta.');
          }
        },
        error: err => {
          this.error.set(
            err?.error?.mensaje ?? 'Error al conectar con el servidor.'
          );
        }
      });
  }
}
