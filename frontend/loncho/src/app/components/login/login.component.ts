import { Component, inject, signal, OnDestroy } from '@angular/core';
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
export class LoginComponent implements OnDestroy {

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

  // ─── Recuperación de contraseña ──────────────────────────────────
  mostrarReset     = signal(false);
  resetStep        = signal<1 | 2 | 3>(1);
  resetEmail       = signal('');
  resetCodigo      = signal('');
  resetPassword    = signal('');
  resetConfirm     = signal('');
  resetMostrarPass = signal(false);
  resetLoading     = signal(false);
  resetError       = signal('');
  resetMensaje     = signal('');
  resetSegundos    = signal(0);
  resetCountdownId: ReturnType<typeof setInterval> | null = null;

  // ─── Validación de email ─────────────────────────────────────────
  private readonly EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  ngOnDestroy(): void {
    if (this.resetCountdownId) clearInterval(this.resetCountdownId);
  }

  // ─── Reset: abrir / cerrar ────────────────────────────────────────
  abrirReset(): void {
    this.mostrarReset.set(true);
    this.resetStep.set(1);
    this.resetEmail.set(this.email());
    this.resetError.set('');
    this.resetMensaje.set('');
  }

  cerrarReset(): void {
    this.mostrarReset.set(false);
    this.resetStep.set(1);
    this.resetEmail.set('');
    this.resetCodigo.set('');
    this.resetPassword.set('');
    this.resetConfirm.set('');
    this.resetMostrarPass.set(false);
    this.resetLoading.set(false);
    this.resetError.set('');
    this.resetMensaje.set('');
    this.resetSegundos.set(0);
    if (this.resetCountdownId) {
      clearInterval(this.resetCountdownId);
      this.resetCountdownId = null;
    }
  }

  private iniciarResetCountdown(): void {
    if (this.resetCountdownId) clearInterval(this.resetCountdownId);
    this.resetSegundos.set(60);
    this.resetCountdownId = setInterval(() => {
      const s = this.resetSegundos() - 1;
      this.resetSegundos.set(s);
      if (s <= 0 && this.resetCountdownId) {
        clearInterval(this.resetCountdownId);
        this.resetCountdownId = null;
      }
    }, 1000);
  }

  enviarCodigoReset(): void {
    if (!this.resetEmail()) {
      this.resetError.set('Ingresa tu correo');
      return;
    }
    this.resetLoading.set(true);
    this.resetError.set('');
    this.authService
      .solicitarReset(this.resetEmail())
      .pipe(finalize(() => this.resetLoading.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.resetStep.set(2);
            this.iniciarResetCountdown();
          } else {
            this.resetError.set(res.mensaje ?? 'No se pudo enviar el código');
          }
        },
        error: err => {
          this.resetError.set(err?.error?.mensaje ?? 'No se pudo enviar el código');
        }
      });
  }

  verificarCodigoReset(): void {
    this.resetLoading.set(true);
    this.resetError.set('');
    this.authService
      .verificarReset(this.resetEmail(), this.resetCodigo())
      .pipe(finalize(() => this.resetLoading.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.resetStep.set(3);
          } else {
            this.resetError.set(res.mensaje ?? 'Código incorrecto');
          }
        },
        error: err => {
          this.resetError.set(err?.error?.mensaje ?? 'Código incorrecto');
        }
      });
  }

  confirmarReset(): void {
    if (this.resetPassword() !== this.resetConfirm()) {
      this.resetError.set('Las contraseñas no coinciden');
      return;
    }
    if (this.resetPassword().length < 6) {
      this.resetError.set('Mínimo 6 caracteres');
      return;
    }
    this.resetLoading.set(true);
    this.resetError.set('');
    this.authService
      .resetPassword(this.resetEmail(), this.resetCodigo(), this.resetPassword())
      .pipe(finalize(() => this.resetLoading.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.cerrarReset();
            this.router.navigate(['/']);
          } else {
            this.resetError.set(res.mensaje ?? 'No se pudo cambiar la contraseña');
          }
        },
        error: err => {
          this.resetError.set(err?.error?.mensaje ?? 'No se pudo cambiar la contraseña');
        }
      });
  }

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
