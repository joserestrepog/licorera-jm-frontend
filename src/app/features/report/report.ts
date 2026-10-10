import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import * as XLSX from 'xlsx';

import { Sidebar } from '../dashboard/sidebar/sidebar';
import { Topbar } from '../dashboard/topbar/topbar';

import { ReportService } from './report.service';
import {
  CollectionsByDay,
  CollectionsReport,
  InventoryStock,
  SalesByDay,
  SalesByProduct,
  SalesReport,
} from './report.model';

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
  collectionsReport: CollectionsReport | null = null;

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
      this.fromDate = this.formatDate(new Date(year, month, 1));
      this.toDate = this.formatDate(new Date(year, month, 15));
    } else {
      this.fromDate = this.formatDate(new Date(year, month, 16));
      this.toDate = this.formatDate(new Date(year, month + 1, 0));
    }

    this.loadSalesReports();
  }

  loadMonthlyReport(): void {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth();

    this.fromDate = this.formatDate(new Date(year, month, 1));
    this.toDate = this.formatDate(new Date(year, month + 1, 0));
    this.loadSalesReports();
  }

  private formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');

    return `${year}-${month}-${day}`;
  }

  private hasValidDateRange(): boolean {
    if (!this.fromDate || !this.toDate) {
      this.salesErrorMessage = 'Las fechas de inicio y fin son obligatorias.';
      return false;
    }

    if (this.fromDate > this.toDate) {
      this.salesErrorMessage = 'La fecha de inicio no puede ser posterior a la fecha de fin.';
      return false;
    }

    return true;
  }

  loadSalesReports(): void {
    this.salesErrorMessage = '';

    if (!this.hasValidDateRange()) {
      return;
    }

    this.isLoadingSales = true;

    forkJoin({
      salesReport: this.reportService.getSalesSummary(this.fromDate, this.toDate),
      collectionsReport: this.reportService.getCollectionsSummary(this.fromDate, this.toDate),
    }).subscribe({
      next: ({ salesReport, collectionsReport }) => {
        this.salesReport = salesReport;
        this.collectionsReport = collectionsReport;
        this.isLoadingSales = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        this.isLoadingSales = false;
        this.salesErrorMessage = 'No fue posible cargar los reportes de ventas y recaudo.';

        console.error('Error al cargar ventas y recaudo:', error);
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
    const currencyFormat = '"$"#,##0';

    if (worksheet['B5']) {
      worksheet['B5'].z = currencyFormat;
    }

    for (let row = 7; row < inventoryData.length; row++) {
      for (const col of [4, 5]) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });

        if (worksheet[cell]) {
          worksheet[cell].z = currencyFormat;
        }
      }
    }

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
    this.salesErrorMessage = '';

    if (!this.hasValidDateRange()) {
      return;
    }

    this.isGeneratingExcel = true;

    forkJoin({
      salesReport: this.reportService.getSalesSummary(this.fromDate, this.toDate),
      salesByProduct: this.reportService.getSalesByProduct(this.fromDate, this.toDate),
      salesByDay: this.reportService.getSalesByDay(this.fromDate, this.toDate),
      collectionsReport: this.reportService.getCollectionsSummary(this.fromDate, this.toDate),
      collectionsByDay: this.reportService.getCollectionsByDay(this.fromDate, this.toDate),
    }).subscribe({
      next: ({ salesReport, salesByProduct, salesByDay, collectionsReport, collectionsByDay }) => {
        this.salesReport = salesReport;
        this.salesByProduct = salesByProduct;
        this.collectionsReport = collectionsReport;

        try {
          this.createSalesExcel(salesByDay, collectionsReport, collectionsByDay);
        } catch (error) {
          this.salesErrorMessage = 'No fue posible generar el Excel de ventas y recaudo.';
          console.error('Error al generar el Excel de ventas:', error);
        } finally {
          this.isGeneratingExcel = false;
          this.changeDetectorRef.detectChanges();
        }
      },
      error: (error) => {
        this.isGeneratingExcel = false;
        this.salesErrorMessage = 'No fue posible obtener todos los datos para generar el Excel.';

        console.error('Error al obtener los datos del Excel:', error);
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private createSalesExcel(
    salesByDay: SalesByDay[],
    collectionsReport: CollectionsReport,
    collectionsByDay: CollectionsByDay[],
  ): void {
    if (!this.salesReport) {
      return;
    }

    const workbook = XLSX.utils.book_new();
    const currencyFormat = '"$"#,##0';

    // HOJA 1: RESUMEN DE VENTAS Y RECAUDO

    const summaryData: (string | number)[][] = [
      ['REPORTE DE VENTAS Y RECAUDO'],
      [],
      ['Periodo', `${this.fromDate} a ${this.toDate}`],
      [],
      ['VENTAS'],
      ['Indicador', 'Valor'],
      ['Ventas realizadas', this.salesReport.saleCount],
      ['Subtotal', this.salesReport.subtotal],
      ['Descuentos', this.salesReport.discount],
      ['Total ventas', this.salesReport.total],
      ['Costo de ventas', this.salesReport.totalCost],
      ['Ganancia', this.salesReport.profit],
      [],
      ['RECAUDO'],
      ['Indicador', 'Valor'],
      ['Pagos recibidos por ventas', collectionsReport.salePaymentsTotal],
      ['Abonos recibidos a créditos', collectionsReport.creditPaymentsTotal],
      ['Total recaudado', collectionsReport.totalCollected],
    ];

    const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
    summarySheet['!cols'] = [{ wch: 35 }, { wch: 25 }];

    for (const row of [7, 8, 9, 10, 11, 15, 16, 17]) {
      const cell = XLSX.utils.encode_cell({ r: row, c: 1 });

      if (summarySheet[cell]) {
        summarySheet[cell].z = currencyFormat;
      }
    }

    XLSX.utils.book_append_sheet(workbook, summarySheet, 'Resumen');

    // HOJA 2: RECAUDO POR MÉTODO DE PAGO
    const collectionsData: (string | number)[][] = [
      ['Origen del dinero', 'Efectivo', 'Transferencia', 'Total'],
      [
        'Pagos de ventas',
        collectionsReport.salePaymentsCash,
        collectionsReport.salePaymentsTransfer,
        collectionsReport.salePaymentsTotal,
      ],
      [
        'Abonos a créditos',
        collectionsReport.creditPaymentsCash,
        collectionsReport.creditPaymentsTransfer,
        collectionsReport.creditPaymentsTotal,
      ],
      [
        'Total recaudado',
        collectionsReport.cashCollected,
        collectionsReport.transferCollected,
        collectionsReport.totalCollected,
      ],
    ];

    const collectionsSheet = XLSX.utils.aoa_to_sheet(collectionsData);
    collectionsSheet['!cols'] = [{ wch: 28 }, { wch: 20 }, { wch: 22 }, { wch: 20 }];

    for (let row = 1; row < collectionsData.length; row++) {
      for (let col = 1; col <= 3; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });

        if (collectionsSheet[cell]) {
          collectionsSheet[cell].z = currencyFormat;
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, collectionsSheet, 'Recaudo por método');

    // HOJA 3: VENTAS POR PRODUCTO
    const productData: (string | number)[][] = [
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

    for (let row = 1; row < productData.length; row++) {
      for (let col = 3; col <= 5; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });

        if (productSheet[cell]) {
          productSheet[cell].z = currencyFormat;
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, productSheet, 'Ventas por producto');

    // HOJA 4: VENTAS Y RECAUDO POR DÍA
    const dailySalesMap = new Map(salesByDay.map((day) => [day.saleDate, day]));
    const dailyCollectionsMap = new Map(collectionsByDay.map((day) => [day.collectionDate, day]));

    const dailyData: (string | number)[][] = [
      [
        'Fecha',
        'Ventas realizadas',
        'Subtotal',
        'Descuentos',
        'Total ventas',
        'Costo de ventas',
        'Ganancia',
        'Pagos ventas en efectivo',
        'Pagos ventas por transferencia',
        'Total pagos de ventas',
        'Abonos en efectivo',
        'Abonos por transferencia',
        'Total abonos a créditos',
        'Efectivo recaudado',
        'Transferencias recaudadas',
        'Recaudo total',
      ],
    ];

    const currentDate = new Date(`${this.fromDate}T00:00:00`);
    const lastDate = new Date(`${this.toDate}T00:00:00`);

    while (currentDate <= lastDate) {
      const date = this.formatDate(currentDate);
      const sales = dailySalesMap.get(date);
      const collections = dailyCollectionsMap.get(date);

      dailyData.push([
        date,
        sales?.saleCount ?? 0,
        sales?.subtotal ?? 0,
        sales?.discount ?? 0,
        sales?.total ?? 0,
        sales?.totalCost ?? 0,
        sales?.profit ?? 0,
        collections?.salePaymentsCash ?? 0,
        collections?.salePaymentsTransfer ?? 0,
        collections?.salePaymentsTotal ?? 0,
        collections?.creditPaymentsCash ?? 0,
        collections?.creditPaymentsTransfer ?? 0,
        collections?.creditPaymentsTotal ?? 0,
        collections?.cashCollected ?? 0,
        collections?.transferCollected ?? 0,
        collections?.totalCollected ?? 0,
      ]);

      currentDate.setDate(currentDate.getDate() + 1);
    }

    const dailySheet = XLSX.utils.aoa_to_sheet(dailyData);
    dailySheet['!cols'] = [
      { wch: 15 },
      { wch: 18 },
      { wch: 16 },
      { wch: 16 },
      { wch: 18 },
      { wch: 18 },
      { wch: 16 },
      { wch: 22 },
      { wch: 26 },
      { wch: 20 },
      { wch: 18 },
      { wch: 24 },
      { wch: 22 },
      { wch: 18 },
      { wch: 24 },
      { wch: 18 },
    ];

    for (let row = 1; row < dailyData.length; row++) {
      for (let col = 2; col < 16; col++) {
        const cell = XLSX.utils.encode_cell({ r: row, c: col });

        if (dailySheet[cell]) {
          dailySheet[cell].z = currencyFormat;
        }
      }
    }

    XLSX.utils.book_append_sheet(workbook, dailySheet, 'Ventas y recaudo por día');

    const fileName = `reporte-ventas-${this.fromDate}-a-${this.toDate}.xlsx`;
    XLSX.writeFile(workbook, fileName);
  }
}
