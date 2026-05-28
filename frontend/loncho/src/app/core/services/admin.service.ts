import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class AdminService {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = `${environment.apiUrl}/admin`;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
  }

  getUsuarios(): Observable<any[]> {
    return this.http
      .get<{ ok: boolean; datos: any[] }>(`${this.apiUrl}/usuarios`, { headers: this.getHeaders() })
      .pipe(map(res => res.datos));
  }

  getProductos(): Observable<any[]> {
    return this.http
      .get<{ ok: boolean; datos: any[] }>(`${this.apiUrl}/productos`, { headers: this.getHeaders() })
      .pipe(map(res => res.datos));
  }

  updateProducto(id: number, data: any): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}/productos/${id}`, data, { headers: this.getHeaders() });
  }

  toggleStock(id: number, en_stock: boolean): Observable<any> {
    return this.http.patch<any>(
      `${this.apiUrl}/productos/${id}/toggle-stock`,
      { en_stock },
      { headers: this.getHeaders() }
    );
  }
}
