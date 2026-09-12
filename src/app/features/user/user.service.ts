import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { Role, User, UserRequest } from './user.model';

@Injectable({
  providedIn: 'root',
})
export class UserService {
  private readonly http = inject(HttpClient);

  private readonly apiUrl = '/api/users';
  private readonly roleApiUrl = '/api/roles';

  findAll(): Observable<User[]> {
    return this.http.get<User[]>(this.apiUrl);
  }

  findById(id: number): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/${id}`);
  }

  create(request: UserRequest): Observable<User> {
    return this.http.post<User>(this.apiUrl, request);
  }

  update(id: number, request: UserRequest): Observable<User> {
    return this.http.put<User>(`${this.apiUrl}/${id}`, request);
  }

  deactivate(id: number): Observable<User> {
    return this.http.delete<User>(`${this.apiUrl}/${id}`);
  }

  activate(id: number): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/${id}/activate`, {});
  }

  findRoles(): Observable<Role[]> {
    return this.http.get<Role[]>(this.roleApiUrl);
  }
}
