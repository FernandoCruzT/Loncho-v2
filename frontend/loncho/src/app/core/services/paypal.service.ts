import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class PaypalService {

  private apiUrl = `${environment.apiUrl}/paypal`;

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

  // ─── Crear orden en PayPal vía backend ────────────────────────────
  createOrder(
    items:    any[],
    subtotal: number,
    iva:      number,
    total:    number
  ): Observable<{ ok: boolean; orderID: string }> {
    return this.http.post<{ ok: boolean; orderID: string }>(
      `${this.apiUrl}/create-order`,
      { items, subtotal, iva, total },
      { headers: this.getHeaders() }
    );
  }

  // ─── Capturar pago después de aprobación ─────────────────────────
  captureOrder(
    orderId:  string,
    items:    any[],
    subtotal: number,
    iva:      number,
    total:    number
  ): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/capture-order`,
      { orderId, items, subtotal, iva, total },
      { headers: this.getHeaders() }
    );
  }
}
