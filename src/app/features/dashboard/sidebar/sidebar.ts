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
import { CashRegisterService } from '../../cash-register/cash-register.service';

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
  private readonly cashRegisterService = inject(CashRegisterService);
  private readonly router = inject(Router);

  readonly currentUser = this.authService.getCurrentUser();

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }

  goToSales(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.router.navigate(['/sales'], {
        state: {
          cashClosed: true,
          cashMessage: 'No fue posible identificar al usuario autenticado.',
        },
      });

      return;
    }

    this.cashRegisterService.findAll().subscribe({
      next: (cashRegisters) => {
        const openCashRegister = cashRegisters.find(
          (cashRegister) =>
            cashRegister.userId === currentUser.userId && cashRegister.status === 'OPEN',
        );

        this.router.navigate(['/sales'], {
          state: {
            cashClosed: !openCashRegister,
            cashMessage: !openCashRegister
              ? 'Para realizar una venta debes abrir una caja primero.'
              : '',
          },
        });
      },

      error: (error) => {
        console.error('Error al verificar la caja:', error);

        this.router.navigate(['/sales'], {
          state: {
            cashClosed: true,
            cashMessage: 'No fue posible verificar el estado de la caja.',
          },
        });
      },
    });
  }

  isAdmin(): boolean {
    return this.currentUser?.role === 'ADMINISTRADOR';
  }
}
