import { CurrencyPipe, DatePipe } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { CreditService } from './credit.service';
import { CreditAccount, CreditPayment } from './credit.model';

import { Sidebar } from '../dashboard/sidebar/sidebar';
import { Topbar } from '../dashboard/topbar/topbar';

import { CashRegisterService } from '../cash-register/cash-register.service';
import { AuthService } from '../auth/auth.service';

import { LucideEye, LucideTriangleAlert, LucideX } from '@lucide/angular';

@Component({
  selector: 'app-credit',
  standalone: true,
  imports: [
    Sidebar,
    Topbar,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    LucideEye,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl: './credit.html',
  styleUrl: './credit.css',
})
export class CreditComponent implements OnInit {
  private readonly creditService = inject(CreditService);
  private readonly cashRegisterService = inject(CashRegisterService);
  private readonly authService = inject(AuthService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  credits: CreditAccount[] = [];
  selectedCredit: CreditAccount | null = null;
  showCreditDetail = false;

  paymentAmount = 0;
  paymentMethodId = 1;

  loading = false;
  processingPayment = false;

  errorMessage = '';
  successMessage = '';

  showCashAlert = false;
  alertMessage = '';

  ngOnInit(): void {
    this.loadCredits();
  }

  loadCredits(): void {
    this.loading = true;
    this.errorMessage = '';
    this.changeDetectorRef.detectChanges();

    this.creditService.getCredits().subscribe({
      next: (credits) => {
        this.credits = credits;
        this.loading = false;

        if (this.selectedCredit) {
          this.selectedCredit =
            credits.find((credit) => credit.id === this.selectedCredit?.id) ?? null;
        }

        this.changeDetectorRef.detectChanges();
      },
      error: () => {
        this.loading = false;
        this.errorMessage = 'No fue posible cargar los créditos.';
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  selectCredit(credit: CreditAccount): void {
    this.selectedCredit = credit;
    this.showCreditDetail = true;

    this.paymentAmount = 0;
    this.paymentMethodId = 1;
    this.errorMessage = '';
    this.successMessage = '';
    this.showCashAlert = false;
  }

  closeCreditDetail(): void {
    this.showCreditDetail = false;
    this.errorMessage = '';
    this.successMessage = '';
  }

  goToCashRegister(): void {
    this.showCashAlert = false;
    this.router.navigate(['/cash-register']);
  }

  closeCashAlert(): void {
    this.showCashAlert = false;
  }

  private showClosedCashAlert(message?: string): void {
    this.processingPayment = false;
    this.showCashAlert = true;
    this.alertMessage = message || 'Para registrar un abono debes abrir una caja primero.';

    this.changeDetectorRef.detectChanges();
  }

  private getPaymentErrorMessage(error: any): string {
    const message = error?.error?.message;

    if (typeof message === 'string' && message.trim()) {
      return message;
    }

    if (typeof error?.error === 'string' && error.error.trim()) {
      return error.error;
    }

    if (error?.status === 0) {
      return 'No fue posible conectar con el servidor.';
    }

    return 'No fue posible registrar el abono. Inténtalo nuevamente.';
  }

  private checkCashRegisterAndRegisterPayment(): void {
    const currentUser = this.authService.getCurrentUser();

    if (!currentUser) {
      this.processingPayment = false;
      this.errorMessage = 'No fue posible identificar al usuario autenticado.';
      this.changeDetectorRef.detectChanges();
      return;
    }

    this.cashRegisterService.findAll().subscribe({
      next: (cashRegisters) => {
        const openCashRegister = cashRegisters.find(
          (cashRegister) =>
            cashRegister.userId === currentUser.userId && cashRegister.status === 'OPEN',
        );

        if (!openCashRegister) {
          this.showClosedCashAlert();
          return;
        }

        this.submitPayment();
      },
      error: (error) => {
        console.error('Error al verificar la caja:', error);

        this.processingPayment = false;
        this.errorMessage = 'No fue posible verificar el estado de la caja.';
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private submitPayment(): void {
    if (!this.selectedCredit) {
      this.processingPayment = false;
      return;
    }

    this.creditService
      .registerPayment(this.selectedCredit.id, {
        paymentMethodId: this.paymentMethodId,
        amount: this.paymentAmount,
      })
      .subscribe({
        next: (_payment: CreditPayment) => {
          this.processingPayment = false;
          this.paymentAmount = 0;
          this.successMessage = 'Abono registrado correctamente.';
          this.errorMessage = '';

          this.loadCredits();
          this.changeDetectorRef.detectChanges();
        },
        error: (error) => {
          console.error('Error al registrar el abono:', error);

          this.processingPayment = false;

          const message = this.getPaymentErrorMessage(error);

          if (/caja|cash register/i.test(message)) {
            this.showClosedCashAlert(message);
          } else {
            this.errorMessage = message;
          }

          this.changeDetectorRef.detectChanges();
        },
      });
  }

  registerPayment(): void {
    if (!this.selectedCredit || this.processingPayment) {
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.showCashAlert = false;

    if (!Number.isFinite(this.paymentAmount) || this.paymentAmount <= 0) {
      this.errorMessage = 'Ingresa un monto de abono válido.';
      return;
    }

    if (this.paymentAmount > this.selectedCredit.balance) {
      this.errorMessage = 'El abono no puede superar el saldo pendiente.';
      return;
    }

    if (![1, 2].includes(this.paymentMethodId)) {
      this.errorMessage = 'Selecciona un método de pago válido.';
      return;
    }

    this.processingPayment = true;
    this.changeDetectorRef.detectChanges();

    this.checkCashRegisterAndRegisterPayment();
  }

  get pendingCredits(): CreditAccount[] {
    return this.credits.filter(
      (credit) => credit.status === 'PENDING' || credit.status === 'PARTIAL',
    );
  }

  get totalPending(): number {
    return this.pendingCredits.reduce((total, credit) => total + credit.balance, 0);
  }
}
