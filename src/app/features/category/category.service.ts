import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Category } from './category.model';

@Injectable({
  providedIn: 'root',
})
export class CategoryService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/categories';

  findAll(): Observable<Category[]> {
    return this.http.get<Category[]>(this.apiUrl);
  }

  findById(id: number): Observable<Category> {
    return this.http.get<Category>(`${this.apiUrl}/${id}`);
  }

  create(category: { name: string; description: string | null }): Observable<Category> {
    return this.http.post<Category>(this.apiUrl, category);
  }

  update(
    id: number,
    category: {
      name: string;
      description: string | null;
    },
  ): Observable<Category> {
    return this.http.put<Category>(`${this.apiUrl}/${id}`, category);
  }

  deactivate(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }

  activate(id: number): Observable<Category> {
    return this.http.patch<Category>(`${this.apiUrl}/${id}/activate`, {});
  }
}
