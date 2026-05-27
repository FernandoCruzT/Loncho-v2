import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product } from '../models/product.model';

@Injectable({ providedIn: 'root' })
export class ProductService {

  private apiUrl = `${environment.apiUrl}/productos`;

  constructor(private http: HttpClient) {}

  // ─── GET todos ───────────────────────────────────────────────────
  getAll(): Observable<Product[]> {
    return this.http
      .get<{ ok: boolean; datos: any[] }>(this.apiUrl)
      .pipe(map(response => response.datos.map(p => this.mapToProduct(p))));
  }

  // ─── GET por id ──────────────────────────────────────────────────
  getById(id: number): Observable<Product> {
    return this.http
      .get<{ ok: boolean; datos: any }>(`${this.apiUrl}/${id}`)
      .pipe(map(response => this.mapToProduct(response.datos)));
  }

  // ─── Mapper snake_case → camelCase ───────────────────────────────
  private mapToProduct(p: any): Product {
    return {
      id:          p.id,
      nombre:      p.nombre,
      precio:      Number(p.precio),
      stock:       p.stock,
      enStock:     p.en_stock,    // ← snake → camel
      categoria:   p.categoria,
      imageUrl:    p.image_url,   // ← snake → camel
      descripcion: p.descripcion,
    };
  }
}
