import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { InventoryEntry } from './inventory-entry.model';
import { InventoryEntryRequest } from './inventory-entry-request.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = '/api/inventory';

  findAll(): Observable<InventoryEntry[]> {
    return this.http.get<InventoryEntry[]>(`${this.apiUrl}/entries`);
  }

  findById(id: number): Observable<InventoryEntry> {
    return this.http.get<InventoryEntry>(`${this.apiUrl}/entries/${id}`);
  }

  createEntry(request: InventoryEntryRequest): Observable<InventoryEntry> {
    return this.http.post<InventoryEntry>(
      `${this.apiUrl}/entries`,
      request,
    );
  }
}