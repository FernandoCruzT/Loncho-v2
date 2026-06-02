import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';

interface Usuario {
  id: number;
  nombre: string;
  email: string;
  rol: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {

  // ─── Signals privados ─────────────────────────────────────────────
  private _usuario = signal<Usuario | null>(null);
  private _token   = signal<string | null>(null);

  // ─── Computed públicos ────────────────────────────────────────────
  readonly isLoggedIn = computed(() => !!this._token());
  readonly isAdmin    = computed(() => this._usuario()?.rol === 'admin');
  readonly usuario    = this._usuario.asReadonly();

  constructor(private http: HttpClient) {
    // Restaurar sesión desde localStorage al arrancar la app
    const token      = localStorage.getItem('loncho_token');
    const usuarioStr = localStorage.getItem('loncho_usuario');

    if (token) {
      this._token.set(token);
    }
    if (usuarioStr) {
      try {
        this._usuario.set(JSON.parse(usuarioStr));
      } catch {
        // JSON inválido: ignorar silenciosamente
      }
    }
  }

  // ─── Login ────────────────────────────────────────────────────────
  login(email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/login`, { email, password })
      .pipe(
        tap(res => {
          if (res.ok) {
            localStorage.setItem('loncho_token',   res.token);
            localStorage.setItem('loncho_usuario', JSON.stringify(res.usuario));
            this._token.set(res.token);
            this._usuario.set(res.usuario);
          }
        })
      );
  }

  // ─── Register ─────────────────────────────────────────────────────
  register(nombre: string, email: string, password: string): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/register`, { nombre, email, password, terminos_aceptados: true });
  }

  // ─── Verificar código ─────────────────────────────────────────────
  verificarCodigo(email: string, codigo: string): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/verificar-codigo`, { email, codigo })
      .pipe(
        tap(res => {
          if (res.ok) {
            localStorage.setItem('loncho_token',   res.token);
            localStorage.setItem('loncho_usuario', JSON.stringify(res.usuario));
            this._token.set(res.token);
            this._usuario.set(res.usuario);
          }
        })
      );
  }

  // ─── Reenviar código ──────────────────────────────────────────────
  reenviarCodigo(email: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/reenviar-codigo`, { email });
  }

  // ─── Recuperación de contraseña ───────────────────────────────────
  solicitarReset(email: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/solicitar-reset`, { email });
  }

  verificarReset(email: string, codigo: string): Observable<any> {
    return this.http.post<any>(`${environment.apiUrl}/auth/verificar-reset`, { email, codigo });
  }

  resetPassword(email: string, codigo: string, passwordNueva: string): Observable<any> {
    return this.http
      .post<any>(`${environment.apiUrl}/auth/reset-password`, { email, codigo, passwordNueva })
      .pipe(
        tap(res => {
          if (res.ok) {
            localStorage.setItem('loncho_token',   res.token);
            localStorage.setItem('loncho_usuario', JSON.stringify(res.usuario));
            this._token.set(res.token);
            this._usuario.set(res.usuario);
          }
        })
      );
  }

  // ─── Logout ───────────────────────────────────────────────────────
  logout(): void {
    localStorage.removeItem('loncho_token');
    localStorage.removeItem('loncho_usuario');
    this._token.set(null);
    this._usuario.set(null);
  }

  // ─── Helper para headers ──────────────────────────────────────────
  getToken(): string | null {
    return this._token();
  }

  // ─── Actualizar nombre en memoria y localStorage ──────────────────
  actualizarNombre(nombre: string): void {
    this._usuario.update(u => u ? { ...u, nombre } : u);
    localStorage.setItem('loncho_usuario', JSON.stringify(this._usuario()));
  }
}
