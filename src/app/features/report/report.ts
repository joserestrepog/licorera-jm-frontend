import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import * as XLSX from 'xlsx';

import { Sidebar } from '../dashboard/sidebar/sidebar';
import { Topbar } from '../dashboard/topbar/topbar';

import { ReportService } from './report.service';
import { InventoryStock, SalesByProduct, SalesReport } from './report.model';

@Component({
  selector: 'app-report',
  standalone: true,
  imports: [Sidebar, Topbar, CurrencyPipe, FormsModule],
  templateUrl: './report.html',
  styleUrl: './report.css',
})
export class ReportComponent implements OnInit {
  private readonly reportService = inject(ReportService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  salesReport: SalesReport | null = null;
  salesByProduct: SalesByProduct[] = [];

  fromDate = '';
  toDate = '';

  isLoadingSales = false;
  isGeneratingExcel = false;

  salesErrorMessage = '';

  inventoryStock: InventoryStock[] = [];

  isLoadingInventory = false;
  isGeneratingInventoryExcel = false;

  inventoryErrorMessage = '';

  ngOnInit(): void {
    this.initializeDates();
    this.loadSalesReports();
    this.loadInventoryReport();
  }

  private initializeDates(): void {
    const today = new Date();

    this.toDate = this.formatDate(today);

    const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    this.fromDate = this.formatDate(firstDayOfMonth);
  }

  loadDailyReport(): void {
    const today = new Date();

    this.fromDate = this.formatDate(today);
    this.toDate = this.formatDate(today);

    this.loadSalesReports();
  }

  loadWeeklyReport(): void {
    const today = new Date();

    const dayOfWeek = today.getDay();
    const daysFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;

    const monday = new Date(today);
    monday.setDate(today.getDate() - daysFromMonday);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);

    this.fromDate = this.formatDate(monday);
    this.toDate = this.formatDate(sunday);

    this.loadSalesReports();
  }

  loadBiweeklyReport(): void {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth();
    const day = today.getDate();

    if (day <= 15) {
      const firstDay = new Date(year, month, 1);
      const fifteenthDay = new Date(year, month, 15);

      this.fromDate = this.formatDate(firstDay);
      this.toDate = this.formatDate(fifteenthDay);
    } else {
      const sixteenthDay = new Date(year, month, 16);
      const lastDay = new Date(year, month + 1, 0);

      this.fromDate = this.formatDate(sixteenthDay);
      this.toDate = this.formatDate(lastDay);
    }

    this.loadSalesReports();
  }

  loadMonthlyReport(): void {
    const today = new Date();

    const year = today.getFullYear();
    const month = today.getMonth();

    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);

    this.fromDate = this.formatDate(firstDay);
    this.toDate = this.formatDate(lastDay);

    this.loadSalesReports();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  loadSalesReports(): void {
    this.salesErrorMessage = '';

    if (!this.fromDate || !this.toDate) {
      this.salesErrorMessage = 'Las fechas de inicio y fin son obligatorias.';
      return;
    }

    if (this.fromDate > this.toDate) {
      this.salesErrorMessage = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
      return;
    }

    this.isLoadingSales = true;

    this.reportService.getSalesSummary(this.fromDate, this.toDate).subscribe({
      next: (salesReport) => {
        this.salesReport = salesReport;
        this.isLoadingSales = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.isLoadingSales = false;
        this.salesErrorMessage = 'No fue posible cargar el resumen de ventas.';

        console.error('Error al cargar el resumen de ventas:', error);

        this.changeDetectorRef.detectChanges();
      },
    });

    this.reportService.getSalesByProduct(this.fromDate, this.toDate).subscribe({
      next: (salesByProduct) => {
        this.salesByProduct = salesByProduct;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.salesErrorMessage = 'No fue posible cargar el detalle de ventas.';

        console.error('Error al cargar las ventas por producto:', error);

        this.changeDetectorRef.detectChanges();
      },
    });
  }

  loadInventoryReport(): void {
    this.inventoryErrorMessage = '';
    this.isLoadingInventory = true;

    this.reportService.getInventoryStock().subscribe({
      next: (inventoryStock) => {
        this.inventoryStock = inventoryStock;
        this.isLoadingInventory = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.isLoadingInventory = false;
        this.inventoryErrorMessage = 'No fue posible cargar el reporte de inventario.';

        console.error('Error al cargar el inventario:', error);

        this.changeDetectorRef.detectChanges();
      },
    });
  }

  generateInventoryExcel(): void {
    if (this.inventoryStock.length === 0) {
      this.inventoryErrorMessage = 'No hay productos para generar el archivo Excel.';
      return;
    }

    this.inventoryErrorMessage = '';
    this.isGeneratingInventoryExcel = true;

    try {
      this.createInventoryExcel();
    } catch (error) {
      this.inventoryErrorMessage = 'No fue posible generar el Excel del inventario.';

      console.error('Error al generar el Excel del inventario:', error);
    } finally {
      this.isGeneratingInventoryExcel = false;
      this.changeDetectorRef.detectChanges();
    }
  }

  private createInventoryExcel(): void {
    const workbook = XLSX.utils.book_new();

    const totalUnits = this.inventoryStock.reduce(
      (total, product) => total + product.currentStock,
      0,
    );

    const totalInventoryValue = this.inventoryStock.reduce(
      (total, product) => total + product.stockValue,
      0,
    );

    const inventoryData = [
      ['REPORTE DE INVENTARIO'],
      [],
      ['Productos registrados', this.inventoryStock.length],
      ['Unidades disponibles', totalUnits],
      ['Valor total del inventario', totalInventoryValue],
      [],
      [
        'Producto',
        'Código de barras',
        'Categoría',
        'Unidades disponibles',
        'Costo unitario',
        'Valor total del inventario',
      ],
      ...this.inventoryStock.map((product) => [
        product.productName,
        product.barcode,
        product.categoryName,
        product.currentStock,
        product.purchasePrice,
        product.stockValue,
      ]),
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(inventoryData);

    // Formato de moneda colombiana.
    const currencyFormat = '"$"#,##0';

    // Aplicar formato al valor total del resumen (celda B5).
    if (worksheet['B5']) {
      worksheet['B5'].z = currencyFormat;
    }

    // Aplicar formato a los precios y valores de cada producto.
    // Los datos comienzan en la fila 8 de Excel (índice 7 en JavaScript).
    for (let row = 7; row < inventoryData.length; row++) {
      const purchasePriceCell = XLSX.utils.encode_cell({
        r: row,
        c: 4,
      });

      const stockValueCell = XLSX.utils.encode_cell({
        r: row,
        c: 5,
      });

      if (worksheet[purchasePriceCell]) {
        worksheet[purchasePriceCell].z = currencyFormat;
      }

      if (worksheet[stockValueCell]) {
        worksheet[stockValueCell].z = currencyFormat;
      }
    }

    // Ajustar el ancho de las seis columnas.
    worksheet['!cols'] = [
      { wch: 35 },
      { wch: 20 },
      { wch: 20 },
      { wch: 22 },
      { wch: 18 },
      { wch: 30 },
    ];

    XLSX.utils.book_append_sheet(workbook, worksheet, 'Inventario');

    XLSX.writeFile(workbook, 'reporte-inventario.xlsx');
  }

  get totalInventoryUnits(): number {
    return this.inventoryStock.reduce((total, product) => total + product.currentStock, 0);
  }

  get totalInventoryValue(): number {
    return this.inventoryStock.reduce((total, product) => total + product.stockValue, 0);
  }

  generateSalesExcel(): void {
    if (!this.fromDate || !this.toDate) {
      this.salesErrorMessage = 'Las fechas de inicio y fin son obligatorias.';
      return;
    }

    if (this.fromDate > this.toDate) {
      this.salesErrorMessage = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
      return;
    }

    this.salesErrorMessage = '';
    this.isGeneratingExcel = true;

    this.reportService.getSalesSummary(this.fromDate, this.toDate).subscribe({
      next: (salesReport) => {
        this.salesReport = salesReport;

        this.reportService.getSalesByProduct(this.fromDate, this.toDate).subscribe({
          next: (salesByProduct) => {
            this.salesByProduct = salesByProduct;

            this.createSalesExcel();

            this.isGeneratingExcel = false;
            this.changeDetectorRef.detectChanges();
          },
          error: (error) => {
            this.isGeneratingExcel = false;
            this.salesErrorMessage =
              'No fue posible obtener el detalle de ventas para generar el Excel.';

            console.error('Error al obtener las ventas por producto:', error);

            this.changeDetectorRef.detectChanges();
          },
        });
      },
      error: (error) => {
        this.isGeneratingExcel = false;
        this.salesErrorMessage =
          'No fue posible obtener el resumen de ventas para generar el Excel.';

        console.error('Error al obtener el resumen de ventas:', error);

        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private createSalesExcel(): void {
    if (!this.salesReport) {
      return;
    }

    const workbook = XLSX.utils.book_new();

    const summaryData = [
      ['REPORTE DE VENTAS'],
      [],
      ['Periodo', `${this.fromDate} a ${this.toDate}`],
      [],
      ['Indicador', 'Valor'],
      ['Ventas realizadas', this.salesReport.saleCount],
      ['Subtotal', this.salesReport.subtotal],
      ['Descuentos', this.salesReport.discount],
      ['Total ventas', this.salesReport.total],
      ['Costo de ventas', this.salesReport.totalCost],
      ['Ganancia', this.salesReport.profit],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);

    summarySheet['!cols'] = [{ wch: 25 }, { wch: 25 }];

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    const productData = [
      ['Producto', 'Código de barras', 'Unidades vendidas', 'Total ventas', 'Costo', 'Ganancia'],
      ...this.salesByProduct.map((product) => [
        product.productName,
        product.barcode,
        product.quantitySold,
        product.totalSales,
        product.totalCost,
        product.profit,
      ]),
    ];

    const productSheet = XLSX.utils.aoa_to_sheet(productData);

    productSheet['!cols'] = [
      { wch: 35 },
      { wch: 20 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
      { wch: 18 },
    ];

    XLSX.utils.book_append_sheet(workbook, productSheet, 'Ventas por producto');

    const fileName = `reporte-ventas-${this.fromDate}-a-${this.toDate}.xlsx`;

    XLSX.writeFile(workbook, fileName);
  }
}
