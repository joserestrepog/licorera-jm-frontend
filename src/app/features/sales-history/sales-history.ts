import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { LucideEye, LucideX } from '@lucide/angular';

import { Sidebar } from '../dashboard/sidebar/sidebar';
import { Topbar } from '../dashboard/topbar/topbar';

import { SalesHistoryService } from './sales-history.service';
import { SalesHistorySale } from './sales-history.model';

@Component({
  selector: 'app-sales-history',
  standalone: true,
  imports: [Sidebar, Topbar, CurrencyPipe, DatePipe, FormsModule, LucideEye, LucideX],
  templateUrl: './sales-history.html',
  styleUrl: './sales-history.css',
})
export class SalesHistoryComponent implements OnInit {
  private readonly salesHistoryService = inject(SalesHistoryService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  sales: SalesHistorySale[] = [];
  filteredSales: SalesHistorySale[] = [];

  startDate = '';
  endDate = '';

  selectedSale: SalesHistorySale | null = null;
  saleToCancel: SalesHistorySale | null = null;

  showDetail = false;
  showCancelDialog = false;

  cancelReason = '';
  isLoading = false;
  isSaving = false;

  errorMessage = '';
  successMessage = '';

  ngOnInit(): void {
    this.loadSales();
  }

  loadSales(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.salesHistoryService.findAll().subscribe({
      next: (sales) => {
        this.sales = [...sales].sort(
          (a, b) => new Date(b.saleDate).getTime() - new Date(a.saleDate).getTime(),
        );

        this.applyFilters();
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar el historial de ventas:', error);
        this.errorMessage =
          error?.error?.message || 'No fue posible cargar el historial de ventas.';
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  applyFilters(): void {
    this.filteredSales = this.sales.filter((sale) => {
      const saleDate = sale.saleDate?.slice(0, 10) ?? '';
      const matchesStartDate = !this.startDate || saleDate >= this.startDate;
      const matchesEndDate = !this.endDate || saleDate <= this.endDate;

      return matchesStartDate && matchesEndDate;
    });
  }

  consultSales(): void {
    if (this.startDate && this.endDate && this.startDate > this.endDate) {
      this.errorMessage = 'La fecha inicial no puede ser posterior a la fecha final.';
      return;
    }

    this.errorMessage = '';
    this.applyFilters();
  }

  clearFilters(): void {
    this.startDate = '';
    this.endDate = '';
    this.errorMessage = '';
    this.applyFilters();
  }

  openSaleDetail(sale: SalesHistorySale): void {
    this.errorMessage = '';

    this.salesHistoryService.findById(sale.id).subscribe({
      next: (detail) => {
        this.selectedSale = detail;
        this.showDetail = true;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al consultar el detalle de la venta:', error);
        this.errorMessage =
          error?.error?.message || 'No fue posible consultar el detalle de la venta.';
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  closeSaleDetail(): void {
    this.showDetail = false;
    this.selectedSale = null;
  }

  openCancelDialog(sale: SalesHistorySale): void {
    if (sale.status !== 'COMPLETED') {
      return;
    }

    this.saleToCancel = sale;
    this.cancelReason = '';
    this.errorMessage = '';
    this.showCancelDialog = true;
  }

  closeCancelDialog(): void {
    if (this.isSaving) {
      return;
    }

    this.showCancelDialog = false;
    this.saleToCancel = null;
    this.cancelReason = '';
  }

  confirmCancellation(): void {
    if (!this.saleToCancel || this.saleToCancel.status !== 'COMPLETED') {
      return;
    }

    const saleId = this.saleToCancel.id;
    const reason = this.cancelReason.trim();

    if (reason.length > 255) {
      this.errorMessage = 'El motivo no puede superar los 255 caracteres.';
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';
    this.successMessage = '';

    this.salesHistoryService.cancel(saleId, { reason: reason || null }).subscribe({
      next: (cancelledSale) => {
        this.sales = this.sales.map((sale) => (sale.id === saleId ? cancelledSale : sale));

        this.applyFilters();
        this.showCancelDialog = false;
        this.saleToCancel = null;
        this.cancelReason = '';
        this.isSaving = false;
        this.successMessage = `La venta ${cancelledSale.saleNumber} fue cancelada correctamente.`;

        if (this.selectedSale?.id === saleId) {
          this.selectedSale = cancelledSale;
        }

        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cancelar la venta:', error);
        this.errorMessage =
          error?.error?.message ||
          'No fue posible cancelar la venta. Actualiza el historial e inténtalo de nuevo.';
        this.isSaving = false;
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'COMPLETED':
        return 'Completada';
      case 'CANCELLED':
        return 'Cancelada';
      default:
        return status;
    }
  }

  trackBySaleId(_index: number, sale: SalesHistorySale): number {
    return sale.id;
  }
}
