import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css'
})
export class LoginComponent {

  private authService = inject(AuthService);
  private router      = inject(Router);

  // ─── Signals del formulario ───────────────────────────────────────
  email    = signal('');
  password = signal('');
  error    = signal('');
  loading  = signal(false);

  // ─── Validación de email ─────────────────────────────────────────
  private readonly EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ─── Submit ───────────────────────────────────────────────────────
  onSubmit(event: Event): void {
    event.preventDefault();

    if (!this.email().trim() || !this.password().trim()) {
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
      .login(this.email().trim(), this.password())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.router.navigate(['/']);
          } else {
            this.error.set(res.mensaje ?? 'Credenciales incorrectas.');
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
