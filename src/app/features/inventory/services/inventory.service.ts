import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { InventoryEntry } from '../models/inventory-entry.model';
import { InventoryEntryRequest } from '../models/inventory-entry-request.model';

@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = 'http://localhost:8080/api/inventory';

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