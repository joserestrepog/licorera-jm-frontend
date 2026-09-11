import { Routes } from '@angular/router';

import { authGuard } from './core/guards/auth-guard';
import { adminGuard } from './core/guards/admin-guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login/login').then((m) => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.DashboardComponent),
  },
  {
    path: 'sales',
    canActivate: [authGuard],
    loadComponent: () => import('./features/sale/sale').then((m) => m.SaleComponent),
  },
  {
    path: 'inventory',
    canActivate: [authGuard],
    loadComponent: () => import('./features/inventory/inventory').then((m) => m.InventoryComponent),
  },
  {
    path: 'products',
    canActivate: [authGuard],
    loadComponent: () => import('./features/product/product').then((m) => m.ProductComponent),
  },
  {
    path: 'categories',
    canActivate: [authGuard],
    loadComponent: () => import('./features/category/category').then((m) => m.CategoryComponent),
  },
  {
    path: 'cash-register',
    canActivate: [authGuard],
    loadComponent: () =>
      import('./features/cash-register/cash-register').then((m) => m.CashRegisterComponent),
  },
  {
    path: 'report',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/report/report').then((m) => m.ReportComponent),
  },
  {
    path: 'users',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/user/user').then((m) => m.UserComponent),
  },
  {
    path: 'backups',
    canActivate: [authGuard, adminGuard],
    loadComponent: () => import('./features/backup/backup').then((m) => m.BackupComponent),
  },
  {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full',
  },
];
