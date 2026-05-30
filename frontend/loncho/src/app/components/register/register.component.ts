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

  toastMsg     = signal('');
  toastVisible = signal(false);

  private readonly EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

  irAlLogin(): void {
    this.router.navigate(['/login']);
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
