import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
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
  readonly authService = inject(AuthService);
  private router      = inject(Router);

  nombre            = signal(this.authService.usuario()?.nombre ?? '');
  email             = signal(this.authService.usuario()?.email  ?? '');

  passwordActual    = signal('');
  passwordNueva     = signal('');
  confirmarPassword = signal('');

  loading              = signal(false);
  exito                = signal('');
  error                = signal('');
  confirmandoEliminar  = signal(false);
  eliminando           = signal(false);

  get inicial(): string {
    return (this.nombre() || this.email()).charAt(0).toUpperCase();
  }

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

    const nombreCambiado   = this.nombre().trim() !== this.authService.usuario()?.nombre;
    const passwordCambiada = !!this.passwordNueva();

    if (!nombreCambiado && !passwordCambiada) {
      this.exito.set('No hay cambios que guardar');
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

  eliminarCuenta(): void {
    this.eliminando.set(true);
    this.error.set('');

    const headers = new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });

    this.http
      .delete<any>(`${environment.apiUrl}/auth/cuenta`, { headers })
      .pipe(finalize(() => this.eliminando.set(false)))
      .subscribe({
        next: res => {
          if (res.ok) {
            this.authService.logout();
            this.router.navigate(['/']);
          } else {
            this.error.set(res.mensaje ?? 'No se pudo eliminar la cuenta.');
          }
        },
        error: err => {
          this.error.set(err?.error?.mensaje ?? 'Error al conectar con el servidor.');
        }
      });
  }
}
