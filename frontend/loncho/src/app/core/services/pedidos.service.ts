import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { Pedido } from '../models/pedido.model';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PedidosService {

  private apiUrl = `${environment.apiUrl}/pedidos`;

  constructor(
    private http:        HttpClient,
    private authService: AuthService
  ) {}

  // ─── Headers con JWT ──────────────────────────────────────────────
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
  }

  // ─── GET historial de pedidos del usuario ─────────────────────────
  getPedidos(): Observable<Pedido[]> {
    return this.http.get<{ ok: boolean; datos: Pedido[] }>(this.apiUrl, {
      headers: this.getHeaders()
    }).pipe(map(res => res.datos));
  }

  // ─── PATCH cancelar pedido ────────────────────────────────────────
  cancelarPedido(id: number): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/${id}/cancelar`,
      {},
      { headers: this.getHeaders() }
    );
  }
}
