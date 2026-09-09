import { Component, inject } from '@angular/core';

import { AuthService } from '../../../auth/services/auth.service';
import { CurrentUser } from '../../../auth/models/current-user.model';

@Component({
  selector: 'app-topbar',
  standalone: true,
  imports: [],
  templateUrl: './topbar.html',
  styleUrl: './topbar.css',
})
export class Topbar {
  private readonly authService = inject(AuthService);

  currentUser: CurrentUser | null = this.authService.getCurrentUser();

  get userInitial(): string {
    return this.currentUser?.username?.charAt(0).toUpperCase() ?? '?';
  }
}
