import { Component, inject, signal, OnDestroy } from '@angular/core';
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
export class RegisterComponent implements OnDestroy {

  private authService = inject(AuthService);
  private router      = inject(Router);
  private countdownId: ReturnType<typeof setInterval> | null = null;

  nombre            = signal('');
  email             = signal('');
  password          = signal('');
  terminos          = signal(false);
  privacidad        = signal(false);
  mostrarTyC        = signal(false);
  mostrarPrivacidad = signal(false);
  error             = signal('');
  loading           = signal(false);
  registroExitoso   = signal(false);
  emailRegistrado   = signal('');
  mostrarPasswordReg = signal(false);

  // ─── Verificación por código ──────────────────────────────────────
  codigo            = signal('');
  cargandoCodigo    = signal(false);
  errorCodigo       = signal('');
  segundosRestantes = signal(0);

  toastMsg     = signal('');
  toastVisible = signal(false);

  private readonly EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  ngOnDestroy(): void {
    if (this.countdownId) clearInterval(this.countdownId);
  }

  onTerminosChange(checked: boolean): void {
    this.terminos.set(checked);
    if (checked) this.mostrarToastConfirm('Términos y condiciones aceptados');
  }

  onPrivacidadChange(checked: boolean): void {
    this.privacidad.set(checked);
    if (checked) this.mostrarToastConfirm('Aviso de privacidad aceptado');
  }

  mostrarToastConfirm(msg: string): void {
    this.toastMsg.set(msg);
    this.toastVisible.set(true);
    setTimeout(() => this.toastVisible.set(false), 2500);
  }

  iniciarCountdown(): void {
    if (this.countdownId) clearInterval(this.countdownId);
    this.segundosRestantes.set(60);
    this.countdownId = setInterval(() => {
      const restantes = this.segundosRestantes() - 1;
      this.segundosRestantes.set(restantes);
      if (restantes <= 0 && this.countdownId) {
        clearInterval(this.countdownId);
        this.countdownId = null;
      }
    }, 1000);
  }

  verificarCodigoSubmit(): void {
    if (!this.codigo().trim()) {
      this.errorCodigo.set('Ingresa el código de 6 dígitos.');
      return;
    }

    this.cargandoCodigo.set(true);
    this.errorCodigo.set('');

    this.authService
      .verificarCodigo(this.emailRegistrado(), this.codigo())
      .pipe(finalize(() => this.cargandoCodigo.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.router.navigate(['/']);
          } else {
            this.errorCodigo.set(res.mensaje ?? 'Código incorrecto.');
          }
        },
        error: err => {
          this.errorCodigo.set(err?.error?.mensaje ?? 'Error al verificar el código.');
        }
      });
  }

  reenviarCodigoClick(): void {
    this.errorCodigo.set('');
    this.authService
      .reenviarCodigo(this.emailRegistrado())
      .subscribe({
        next: res => {
          if (res.ok) {
            this.iniciarCountdown();
          } else {
            this.errorCodigo.set(res.mensaje ?? 'No se pudo reenviar el código.');
          }
        },
        error: err => {
          this.errorCodigo.set(err?.error?.mensaje ?? 'Error al reenviar el código.');
        }
      });
  }

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

    if (!this.terminos()) {
      this.error.set('Debes aceptar los términos y condiciones para registrarte.');
      return;
    }

    if (!this.privacidad()) {
      this.error.set('Debes aceptar el aviso de privacidad para registrarte.');
      return;
    }

    this.loading.set(true);
    this.error.set('');

    this.authService
      .register(this.nombre().trim(), this.email().trim(), this.password())
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => {
          if (res.ok && res.requiresVerification) {
            this.emailRegistrado.set(this.email().trim());
            this.registroExitoso.set(true);
            this.iniciarCountdown();
          } else {
            this.error.set(res.mensaje ?? 'No se pudo crear la cuenta.');
          }
        },
        error: err => {
          this.error.set(err?.error?.mensaje ?? 'Error al conectar con el servidor.');
        }
      });
  }
}
