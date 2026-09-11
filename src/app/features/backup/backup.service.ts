import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

import { BackupResponse } from './backup.model';

@Injectable({
  providedIn: 'root',
})
export class BackupService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = 'http://localhost:8080/api/backups';

  findAll(): Observable<string[]> {
    return this.http.get<string[]>(this.apiUrl);
  }

  createBackup(): Observable<BackupResponse> {
    return this.http.post<BackupResponse>(this.apiUrl, {});
  }

  restoreBackup(fileName: string): Observable<BackupResponse> {
    const params = new HttpParams().set('fileName', fileName);

    return this.http.post<BackupResponse>(`${this.apiUrl}/restore`, {}, { params });
  }
}
