import {
  AfterViewInit,
  ChangeDetectorRef,
  Component,
  ElementRef,
  OnInit,
  ViewChild,
  inject,
} from '@angular/core';
import { Router } from '@angular/router';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';

import {
  LucideCircleCheck,
  LucideMinus,
  LucidePlus,
  LucideShoppingCart,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import { Sidebar } from '../dashboard/sidebar/sidebar';
import { Topbar } from '../dashboard/topbar/topbar';

import { ProductService } from '../product/product.service';
import { Product } from '../product/product.model';

import { CashRegisterService } from '../cash-register/cash-register.service';
import { AuthService } from '../auth/auth.service';

import { SaleService } from './sale.service';
import { SaleItem } from './sale.model';

@Component({
  selector: 'app-sale',
  standalone: true,
  imports: [
    Sidebar,
    Topbar,
    CurrencyPipe,
    FormsModule,
    LucideCircleCheck,
    LucideMinus,
    LucidePlus,
    LucideShoppingCart,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl: './sale.html',
  styleUrl: './sale.css',
})
export class SaleComponent implements OnInit, AfterViewInit {
  private readonly productService = inject(ProductService);
  private readonly cashRegisterService = inject(CashRegisterService);
  private readonly authService = inject(AuthService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly router = inject(Router);
  private readonly saleService = inject(SaleService);

  @ViewChild('barcodeInput')
  readonly barcodeInput!: ElementRef<HTMLInputElement>;

  products: Product[] = [];

  barcode = '';

  saleItems: SaleItem[] = [];

  discount = 0;

  selectedPaymentMethod = 'EFECTIVO';

  cashPaymentAmount = 0;
  transferPaymentAmount = 0;
  customerName = '';

  showCashAlert = false;
  showProductAlert = false;
  showStockAlert = false;
  showSaleConfirmation = false;
  processingSale = false;
  showSaleSuccess = false;

  alertMessage = '';
  productAlertTitle = 'Producto no disponible';

  canSell = false;

  openCashRegisterId: number | null = null;

  ngOnInit(): void {
    this.restoreSaleDraft();

    const navigationState = history.state;

    if (navigationState?.cashClosed) {
      this.canSell = false;
      this.showCashAlert = true;
      this.alertMessage =
        navigationState.cashMessage || 'Para realizar una venta debes abrir una caja primero.';
    } else {
      this.checkCashRegister();
    }

    this.loadProducts();
  }

  private restoreSaleDraft(): void {
    this.saleItems = this.saleService.getSaleItems();
    this.discount = this.saleService.getDiscount();
    this.selectedPaymentMethod = this.saleService.getPaymentMethod();
  }

  private saveSaleDraft(): void {
    this.saleService.setSaleItems(this.saleItems);
    this.saleService.setDiscount(this.discount);
    this.saleService.setPaymentMethod(this.selectedPaymentMethod);
  }

  private refreshSaleAfterItemChange(): void {
    if (this.discount > this.subtotal) {
      this.discount = this.subtotal;
      this.saleService.setDiscount(this.discount);
    }

    this.saveSaleDraft();
  }

  onDiscountChange(value: number): void {
    this.discount = Number(value) || 0;
    this.saleService.setDiscount(this.discount);
  }

  onPaymentMethodChange(value: string): void {
    this.selectedPaymentMethod = value;
    this.saleService.setPaymentMethod(value);
  }

  onCashPaymentChange(value: number): void {
    this.cashPaymentAmount = Math.max(Number(value) || 0, 0);
  }

  onTransferPaymentChange(value: number): void {
    this.transferPaymentAmount = Math.max(Number(value) || 0, 0);
  }

  get paidAmount(): number {
    return this.cashPaymentAmount + this.transferPaymentAmount;
  }

  get creditBalance(): number {
    return Math.max(this.total - this.paidAmount, 0);
  }

  get hasCredit(): boolean {
    return this.creditBalance > 0;
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.focusBarcodeInput();
    });
  }

  private focusBarcodeInput(): void {
    if (!this.canSell) {
      return;
    }

    this.barcodeInput?.nativeElement.focus();
    this.barcodeInput?.nativeElement.select();
  }

  private checkCashRegister(): void {
    this.showCashAlert = false;
    this.alertMessage = '';
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.canSell = false;
      this.showCashAlert = true;
      this.alertMessage = 'No fue posible identificar al usuario autenticado.';
      return;
    }

    this.cashRegisterService.findAll().subscribe({
      next: (cashRegisters) => {
        const openCashRegister = cashRegisters.find(
          (cashRegister) =>
            cashRegister.userId === currentUser.userId && cashRegister.status === 'OPEN',
        );

        if (!openCashRegister) {
          this.canSell = false;
          this.openCashRegisterId = null;
          this.showCashAlert = true;
          this.alertMessage = 'Para realizar una venta debes abrir una caja primero.';
          return;
        }

        this.canSell = true;
        this.openCashRegisterId = openCashRegister.id;
        this.showCashAlert = false;
        this.alertMessage = '';

        this.changeDetectorRef.detectChanges();

        setTimeout(() => {
          this.focusBarcodeInput();
        });
      },

      error: (error) => {
        console.error('Error al verificar la caja:', error);

        this.canSell = false;
        this.showCashAlert = true;
        this.alertMessage = 'No fue posible verificar el estado de la caja.';
      },
    });
  }

  private loadProducts(): void {
    this.productService.findAll().subscribe({
      next: (products) => {
        this.products = products;

        this.changeDetectorRef.detectChanges();
      },

      error: (error) => {
        console.error('Error al cargar los productos:', error);
      },
    });
  }

  processBarcode(): void {
    if (!this.canSell) {
      this.productAlertTitle = 'Producto no disponible';
      this.showCashAlert = true;
      this.alertMessage = 'Para realizar una venta debes abrir una caja primero.';
      return;
    }

    const scannedBarcode = this.barcode.trim();

    if (!scannedBarcode) {
      this.focusBarcodeInput();
      return;
    }

    const product = this.products.find((item) => item.barcode === scannedBarcode);

    this.barcode = '';

    if (!product) {
      this.showProductAlert = true;
      this.alertMessage = 'El producto no se encuentra en el inventario.';

      this.focusBarcodeInput();
      return;
    }

    if (!product.active) {
      this.showProductAlert = true;
      this.alertMessage = `El producto "${product.name}" no está disponible para la venta.`;

      this.focusBarcodeInput();
      return;
    }

    if (product.currentStock <= 0) {
      this.showStockAlert = true;
      this.alertMessage = `El producto "${product.name}" no tiene existencias disponibles.`;

      this.focusBarcodeInput();
      return;
    }

    const existingItem = this.saleItems.find((item) => item.product.id === product.id);

    if (existingItem) {
      if (existingItem.quantity >= product.currentStock) {
        this.showStockAlert = true;
        this.alertMessage = `No hay más unidades disponibles de "${product.name}".`;

        this.focusBarcodeInput();
        return;
      }

      existingItem.quantity++;

      this.saveSaleDraft();

      this.focusBarcodeInput();
      return;
    }

    this.saleItems.push({
      product,
      quantity: 1,
    });

    this.saveSaleDraft();

    this.focusBarcodeInput();
  }

  goToCashRegister(): void {
    this.closeAlerts();
    this.router.navigate(['/cash-register']);
  }

  increaseQuantity(item: SaleItem): void {
    if (item.quantity >= item.product.currentStock) {
      this.showStockAlert = true;
      this.alertMessage = `No hay más unidades disponibles de "${item.product.name}".`;

      this.focusBarcodeInput();
      return;
    }

    item.quantity++;

    this.refreshSaleAfterItemChange();

    this.focusBarcodeInput();
  }

  decreaseQuantity(item: SaleItem): void {
    if (item.quantity > 1) {
      item.quantity--;

      this.refreshSaleAfterItemChange();

      this.focusBarcodeInput();
      return;
    }

    this.removeItem(item);
  }

  removeItem(item: SaleItem): void {
    this.saleItems = this.saleItems.filter((saleItem) => saleItem.product.id !== item.product.id);

    this.refreshSaleAfterItemChange();

    this.focusBarcodeInput();
  }

  getItemTotal(item: SaleItem): number {
    return item.product.salePrice * item.quantity;
  }

  get subtotal(): number {
    return this.saleItems.reduce((total, item) => total + this.getItemTotal(item), 0);
  }

  get total(): number {
    return Math.max(this.subtotal - this.discount, 0);
  }

  cancelSaleConfirmation(): void {
    if (this.processingSale) {
      return;
    }

    this.showSaleConfirmation = false;
    this.focusBarcodeInput();
  }

  acceptSaleSuccess(): void {
    this.showSaleSuccess = false;
    this.router.navigate(['/dashboard']);
  }

  confirmSale(): void {
    if (this.processingSale) {
      return;
    }

    if (!this.openCashRegisterId) {
      this.processingSale = false;
      this.showSaleConfirmation = false;
      this.showCashAlert = true;
      this.alertMessage = 'No fue posible identificar la caja abierta para registrar la venta.';
      return;
    }

    if (this.saleItems.length === 0) {
      this.processingSale = false;
      this.showSaleConfirmation = false;
      this.productAlertTitle = 'Venta incompleta';
      this.showProductAlert = true;
      this.alertMessage = 'Debes agregar al menos un producto a la venta.';
      return;
    }

    if (this.cashPaymentAmount < 0 || this.transferPaymentAmount < 0) {
      this.productAlertTitle = 'Datos de pago inválidos';
      this.showProductAlert = true;
      this.alertMessage = 'Los montos de pago no pueden ser negativos.';
      return;
    }

    if (this.paidAmount > this.total) {
      this.productAlertTitle = 'Datos de pago inválidos';
      this.showProductAlert = true;
      this.alertMessage = 'El total pagado no puede superar el total de la venta.';
      return;
    }

    if (this.hasCredit && !this.customerName.trim()) {
      this.productAlertTitle = 'Datos del cliente incompletos';
      this.showProductAlert = true;
      this.alertMessage = 'Debes indicar el nombre del cliente cuando la venta queda a crédito.';
      return;
    }

    this.processingSale = true;

    const payments = [];

    if (this.cashPaymentAmount > 0) {
      payments.push({
        paymentMethodId: 1,
        amount: this.cashPaymentAmount,
      });
    }

    if (this.transferPaymentAmount > 0) {
      payments.push({
        paymentMethodId: 2,
        amount: this.transferPaymentAmount,
      });
    }

    const request = {
      cashRegisterId: this.openCashRegisterId,

      items: this.saleItems.map((item) => ({
        productId: item.product.id,
        quantity: item.quantity,
        discount: 0,
      })),

      discount: this.discount,
      payments,
      customerName: this.hasCredit ? this.customerName.trim() : null,
    };

    console.log('Venta enviada al backend:', request);

    this.saleService.create(request).subscribe({
      next: (response) => {
        console.log('Venta registrada correctamente:', response);

        this.processingSale = false;
        this.showSaleConfirmation = false;

        this.clearSale();

        this.showSaleSuccess = true;

        this.changeDetectorRef.detectChanges();
      },

      error: (error) => {
        console.error('Error al registrar la venta:', error);

        this.processingSale = false;

        let message = 'No fue posible registrar la venta.';

        if (error?.error?.message) {
          message = error.error.message;
        } else if (typeof error?.error === 'string') {
          message = error.error;
        } else if (error?.status === 0) {
          message = 'No fue posible conectar con el servidor.';
        }

        this.showSaleConfirmation = false;
        this.productAlertTitle = 'No se pudo registrar la venta';
        this.showProductAlert = true;
        this.alertMessage = message;

        this.focusBarcodeInput();
      },
    });
  }

  clearSale(): void {
    this.saleItems = [];
    this.discount = 0;
    this.barcode = '';
    this.cashPaymentAmount = 0;
    this.transferPaymentAmount = 0;
    this.customerName = '';

    this.saleService.clearDraft();

    this.focusBarcodeInput();
  }

  closeAlerts(): void {
    this.showCashAlert = false;
    this.showProductAlert = false;
    this.showStockAlert = false;
    this.alertMessage = '';

    setTimeout(() => {
      this.focusBarcodeInput();
    });
  }

  sell(): void {
    if (!this.canSell) {
      this.showCashAlert = true;
      this.alertMessage = 'Para realizar una venta debes abrir una caja primero.';
      return;
    }

    if (this.saleItems.length === 0) {
      this.productAlertTitle = 'Venta incompleta';
      this.showProductAlert = true;
      this.alertMessage = 'Debes agregar al menos un producto a la venta.';
      return;
    }

    if (this.discount < 0) {
      this.discount = 0;
    }

    if (this.discount > this.subtotal) {
      this.discount = this.subtotal;
    }

    this.cashPaymentAmount = this.selectedPaymentMethod === 'EFECTIVO' ? this.total : 0;

    this.transferPaymentAmount = this.selectedPaymentMethod === 'TRANSFERENCIA' ? this.total : 0;

    if (this.selectedPaymentMethod === 'CREDITO') {
      this.cashPaymentAmount = 0;
      this.transferPaymentAmount = 0;
    }

    this.customerName = '';

    this.saveSaleDraft();

    this.showSaleConfirmation = true;
  }
}
