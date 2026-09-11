import { Component, inject } from '@angular/core';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  LucideBoxes,
  LucideChartNoAxesCombined,
  LucideDatabaseBackup,
  LucideHouse,
  LucideLogOut,
  LucidePackage,
  LucideShoppingCart,
  LucideTags,
  LucideUsers,
  LucideWalletCards,
} from '@lucide/angular';

import { AuthService } from '../../auth/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [
    RouterLink,
    RouterLinkActive,
    LucideHouse,
    LucideShoppingCart,
    LucideBoxes,
    LucidePackage,
    LucideTags,
    LucideWalletCards,
    LucideChartNoAxesCombined,
    LucideUsers,
    LucideDatabaseBackup,
    LucideLogOut,
  ],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
})
export class Sidebar {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.getCurrentUser();

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToSales(): void {
    this.router.navigate(['/sales'], {
      onSameUrlNavigation: 'reload',
    });
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'ADMINISTRADOR';
  }
}
