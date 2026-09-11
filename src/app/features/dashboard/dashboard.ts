import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';

import { Sidebar } from './sidebar/sidebar';
import { Topbar } from './topbar/topbar';

import { AuthService } from '../auth/auth.service';

import { ProductService } from '../product/product.service';
import { Product } from '../product/product.model';

import { SaleService } from '../sale/sale.service';
import { Sale } from '../sale/sale.model';

import { CashRegisterService } from '../cash-register/cash-register.service';
import { CashRegister } from '../cash-register/cash-register.model';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [Sidebar, Topbar, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.css',
})
export class DashboardComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly productService = inject(ProductService);
  private readonly saleService = inject(SaleService);
  private readonly cashRegisterService = inject(CashRegisterService);

  products: Product[] = [];
  sales: Sale[] = [];
  recentSales: Sale[] = [];
  cashRegisters: CashRegister[] = [];

  activeProducts = 0;
  totalStock = 0;
  lowStockProducts: Product[] = [];

  todaySales = 0;
  todaySalesCount = 0;

  currentCashRegister: CashRegister | null = null;

  ngOnInit(): void {
    this.loadProducts();
    this.loadSales();
    this.loadCashRegisters();
  }

  private loadProducts(): void {
    this.productService.findAll().subscribe({
      next: (products) => {
        this.products = products;

        const activeProducts = products.filter((product) => product.active);

        this.activeProducts = activeProducts.length;

        this.totalStock = activeProducts.reduce(
          (total, product) => total + product.currentStock,
          0,
        );

        this.lowStockProducts = activeProducts.filter(
          (product) => product.currentStock <= product.minimumStock,
        );
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      },
    });
  }

  private loadSales(): void {
    this.saleService.findAll().subscribe({
      next: (sales) => {
        this.sales = sales;
        this.recentSales = sales.slice(0, 5);

        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');

        const today = `${year}-${month}-${day}`;

        const todayCompletedSales = sales.filter(
          (sale) => sale.status === 'COMPLETED' && sale.saleDate.startsWith(today),
        );

        this.todaySalesCount = todayCompletedSales.length;
        this.todaySales = todayCompletedSales.reduce((total, sale) => total + sale.total, 0);
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => console.error('Error al cargar ventas:', error),
    });
  }

  private loadCashRegisters(): void {
    this.cashRegisterService.findAll().subscribe({
      next: (cashRegisters) => {
        this.cashRegisters = cashRegisters;

        const currentUser = this.authService.getCurrentUser();

        if (!currentUser) {
          this.currentCashRegister = null;
          return;
        }

        this.currentCashRegister =
          cashRegisters.find(
            (cashRegister) =>
              cashRegister.username === currentUser.username && cashRegister.status === 'OPEN',
          ) ?? null;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar cajas:', error);
      },
    });
  }
}
