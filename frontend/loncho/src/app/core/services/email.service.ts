import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';

@Injectable({ providedIn: 'root' })
export class EmailService {

  private http        = inject(HttpClient);
  private authService = inject(AuthService);

  private apiUrl = `${environment.apiUrl}/email`;

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      Authorization: `Bearer ${this.authService.getToken()}`
    });
  }

  enviarRecibo(pedidoId: number, email: string, xmlContent: string): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}/recibo`,
      { pedidoId, email, xmlContent },
      { headers: this.getHeaders() }
    );
  }
}
