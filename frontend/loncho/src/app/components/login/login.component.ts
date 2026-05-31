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
  email           = signal('');
  password        = signal('');
  error           = signal('');
  loading         = signal(false);
  mostrarPassword = signal(false);

  // ─── Reenvío y verificación de código ───────────────────────────
  mostrarReenvio    = signal(false);
  emailReenvio      = signal('');
  cargandoReenvio   = signal(false);
  mensajeReenvio    = signal('');
  errorReenvio      = signal('');
  codigoLogin       = signal('');
  verificandoLogin  = signal(false);
  errorCodigoLogin  = signal('');

  // ─── Validación de email ─────────────────────────────────────────
  private readonly EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  // ─── Solicitar nuevo código ───────────────────────────────────────
  solicitarCodigo(): void {
    if (!this.emailReenvio().trim()) {
      this.errorReenvio.set('Ingresa tu correo');
      return;
    }

    this.mensajeReenvio.set('');
    this.errorReenvio.set('');
    this.cargandoReenvio.set(true);

    this.authService
      .reenviarCodigo(this.emailReenvio().trim())
      .pipe(finalize(() => this.cargandoReenvio.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.mensajeReenvio.set('Código enviado. Revisa tu correo.');
          } else {
            this.errorReenvio.set(res.mensaje ?? 'No se pudo enviar el código.');
          }
        },
        error: err => {
          const status = err?.status;
          if (status === 404) {
            this.errorReenvio.set('No encontramos una cuenta con ese correo');
          } else {
            this.errorReenvio.set(err?.error?.mensaje ?? 'No se pudo enviar el código.');
          }
        }
      });
  }

  // ─── Verificar código desde login ────────────────────────────────
  verificarCodigoLogin(): void {
    this.errorCodigoLogin.set('');
    this.verificandoLogin.set(true);

    this.authService
      .verificarCodigo(this.emailReenvio(), this.codigoLogin())
      .pipe(finalize(() => this.verificandoLogin.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.router.navigate(['/']);
          } else {
            this.errorCodigoLogin.set(res.mensaje ?? 'Código incorrecto.');
          }
        },
        error: err => {
          this.errorCodigoLogin.set(err?.error?.mensaje ?? 'Error al verificar el código.');
        }
      });
  }

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
    this.mostrarReenvio.set(false);
    this.mensajeReenvio.set('');
    this.errorReenvio.set('');

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
          const mensaje = err?.error?.mensaje ?? 'Error al conectar con el servidor.';
          this.error.set(mensaje);
          if (err?.status === 403) {
            this.mostrarReenvio.set(true);
            this.emailReenvio.set(this.email().trim());
          }
        }
      });
  }
}
