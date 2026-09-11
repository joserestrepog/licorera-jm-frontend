import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import {
  LucideBanknote,
  LucideEye,
  LucideLandmark,
  LucideLockKeyhole,
  LucideWalletCards,
  LucideX,
} from '@lucide/angular';

import { Sidebar } from '../dashboard/sidebar/sidebar';
import { Topbar } from '../dashboard/topbar/topbar';

import { CashRegisterService } from './cash-register.service';
import { CashRegister } from './cash-register.model';

@Component({
  selector: 'app-cash-register',
  standalone: true,
  imports: [
    Sidebar,
    Topbar,
    CurrencyPipe,
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    LucideBanknote,
    LucideEye,
    LucideLandmark,
    LucideLockKeyhole,
    LucideWalletCards,
    LucideX,
  ],
  templateUrl: './cash-register.html',
  styleUrl: './cash-register.css',
})
export class CashRegisterComponent implements OnInit {
  private readonly cashRegisterService = inject(CashRegisterService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  cashRegisters: CashRegister[] = [];
  filteredCashRegisters: CashRegister[] = [];

  searchTerm = '';
  selectedStatus = 'ALL';

  selectedCashRegister: CashRegister | null = null;

  showOpenForm = false;
  showDetail = false;
  showCloseForm = false;

  isSaving = false;

  openForm = this.formBuilder.group({
    openingAmount: [0, [Validators.required, Validators.min(0)]],
    notes: ['', Validators.maxLength(255)],
  });

  closeForm = this.formBuilder.group({
    countedCash: [0, [Validators.required, Validators.min(0)]],
    notes: ['', Validators.maxLength(255)],
  });

  ngOnInit(): void {
    this.loadCashRegisters();
  }

  private loadCashRegisters(): void {
    this.cashRegisterService.findAll().subscribe({
      next: (cashRegisters) => {
        this.cashRegisters = [...cashRegisters].sort(
          (a, b) => new Date(b.openedAt).getTime() - new Date(a.openedAt).getTime(),
        );

        this.applyFilters();
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar las cajas:', error);
      },
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredCashRegisters = this.cashRegisters.filter((cashRegister) => {
      const matchesSearch =
        !search ||
        cashRegister.username.toLowerCase().includes(search) ||
        cashRegister.status.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'ALL' || cashRegister.status === this.selectedStatus;

      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  get openCashRegisters(): CashRegister[] {
    return this.cashRegisters.filter((cashRegister) => cashRegister.status === 'OPEN');
  }

  get closedCashRegisters(): CashRegister[] {
    return this.cashRegisters.filter((cashRegister) => cashRegister.status === 'CLOSED');
  }

  get currentOpenCashRegister(): CashRegister | null {
    return this.openCashRegisters.length > 0 ? this.openCashRegisters[0] : null;
  }

  openCashRegisterForm(): void {
    this.openForm.reset({
      openingAmount: 0,
      notes: '',
    });

    this.showDetail = false;
    this.showCloseForm = false;
    this.showOpenForm = true;
    this.isSaving = false;
  }

  closeOpenForm(): void {
    this.showOpenForm = false;
    this.isSaving = false;

    this.openForm.reset({
      openingAmount: 0,
      notes: '',
    });
  }

  saveOpenCashRegister(): void {
    if (this.openForm.invalid) {
      this.openForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.openForm.getRawValue();

    const request = {
      openingAmount: formValue.openingAmount,
      notes: formValue.notes.trim() || null,
    };

    this.cashRegisterService.openCashRegister(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeOpenForm();
        this.loadCashRegisters();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al abrir la caja:', error);
      },
    });
  }

  openCashRegisterDetail(cashRegister: CashRegister): void {
    this.selectedCashRegister = cashRegister;
    this.showDetail = true;
    this.showCloseForm = false;
    this.showOpenForm = false;
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedCashRegister = null;
  }

  openCloseForm(cashRegister: CashRegister): void {
    this.selectedCashRegister = cashRegister;

    this.closeForm.reset({
      countedCash: cashRegister.expectedCash,
      notes: '',
    });

    this.showDetail = false;
    this.showOpenForm = false;
    this.showCloseForm = true;
    this.isSaving = false;
  }

  closeCloseForm(): void {
    this.showCloseForm = false;
    this.isSaving = false;
    this.selectedCashRegister = null;

    this.closeForm.reset({
      countedCash: 0,
      notes: '',
    });
  }

  saveCloseCashRegister(): void {
    if (!this.selectedCashRegister) {
      return;
    }

    if (this.closeForm.invalid) {
      this.closeForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.closeForm.getRawValue();

    const request = {
      countedCash: formValue.countedCash,
      notes: formValue.notes.trim() || null,
    };

    this.cashRegisterService.closeCashRegister(this.selectedCashRegister.id, request).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeCloseForm();
        this.loadCashRegisters();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al cerrar la caja:', error);
      },
    });
  }

  getDifferenceClass(cashRegister: CashRegister): string {
    if (cashRegister.difference === null) {
      return '';
    }

    if (cashRegister.difference > 0) {
      return 'positive';
    }

    if (cashRegister.difference < 0) {
      return 'negative';
    }

    return 'neutral';
  }

  getDifferenceLabel(cashRegister: CashRegister): string {
    if (cashRegister.difference === null) {
      return 'Pendiente';
    }

    if (cashRegister.difference > 0) {
      return 'Sobrante';
    }

    if (cashRegister.difference < 0) {
      return 'Faltante';
    }

    return 'Sin diferencia';
  }
}
