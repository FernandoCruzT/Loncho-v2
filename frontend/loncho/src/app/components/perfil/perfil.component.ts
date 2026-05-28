import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { finalize } from 'rxjs';

import { AuthService } from '../../core/services/auth.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-perfil',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './perfil.component.html',
  styleUrl: './perfil.component.css'
})
export class PerfilComponent {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  // ─── Datos del usuario ────────────────────────────────────────────
  nombre            = signal(this.authService.usuario()?.nombre ?? '');
  email             = signal(this.authService.usuario()?.email  ?? '');

  // ─── Campos de contraseña ─────────────────────────────────────────
  passwordActual    = signal('');
  passwordNueva     = signal('');
  confirmarPassword = signal('');

  // ─── Estado ───────────────────────────────────────────────────────
  loading = signal(false);
  exito   = signal('');
  error   = signal('');

  // ─── Inicial del avatar ───────────────────────────────────────────
  get inicial(): string {
    return (this.nombre() || this.email()).charAt(0).toUpperCase();
  }

  // ─── Guardar perfil ───────────────────────────────────────────────
  guardarPerfil(event: Event): void {
    event.preventDefault();
    this.exito.set('');
    this.error.set('');

    if (!this.nombre().trim()) {
      this.error.set('El nombre no puede estar vacío.');
      return;
    }

    if (this.passwordNueva() && this.passwordNueva() !== this.confirmarPassword()) {
      this.error.set('Las contraseñas no coinciden.');
      return;
    }

    this.loading.set(true);

    const body: any = { nombre: this.nombre().trim() };
    if (this.passwordNueva()) {
      body.passwordActual = this.passwordActual();
      body.passwordNueva  = this.passwordNueva();
    }

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });

    this.http
      .put<any>(`${environment.apiUrl}/auth/perfil`, body, { headers })
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.authService.actualizarNombre(res.usuario.nombre);
            this.nombre.set(res.usuario.nombre);
            this.passwordActual.set('');
            this.passwordNueva.set('');
            this.confirmarPassword.set('');
            this.exito.set('Perfil actualizado correctamente.');
          } else {
            this.error.set(res.mensaje ?? 'No se pudo actualizar el perfil.');
          }
        },
        error: err => {
          this.error.set(err?.error?.mensaje ?? 'Error al conectar con el servidor.');
        }
      });
  }
}
