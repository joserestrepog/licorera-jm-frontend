import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';

import {
  LucideClock3,
  LucideDatabaseBackup,
  LucideFileArchive,
  LucideHistory,
  LucideRotateCcw,
  LucideShieldCheck,
  LucideTriangleAlert,
  LucideX,
} from '@lucide/angular';

import { Sidebar } from '../dashboard/sidebar/sidebar';
import { Topbar } from '../dashboard/topbar/topbar';

import { BackupService } from './backup.service';

@Component({
  selector: 'app-backup',
  standalone: true,
  imports: [
    Sidebar,
    Topbar,
    DatePipe,
    LucideClock3,
    LucideDatabaseBackup,
    LucideFileArchive,
    LucideHistory,
    LucideRotateCcw,
    LucideShieldCheck,
    LucideTriangleAlert,
    LucideX,
  ],
  templateUrl: './backup.html',
  styleUrl: './backup.css',
})
export class BackupComponent implements OnInit {
  private readonly backupService = inject(BackupService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  backups: string[] = [];

  selectedBackup: string | null = null;

  showRestoreConfirmation = false;

  isLoading = false;
  isCreating = false;
  isRestoring = false;

  successMessage = '';
  errorMessage = '';

  ngOnInit(): void {
    this.loadBackups();
  }

  private loadBackups(): void {
    this.isLoading = true;
    this.errorMessage = '';

    this.backupService.findAll().subscribe({
      next: (backups) => {
        this.backups = [...backups].sort((a, b) => b.localeCompare(a));
        this.isLoading = false;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar los respaldos:', error);

        this.isLoading = false;
        this.errorMessage = 'No fue posible cargar los respaldos.';
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  createBackup(): void {
    if (this.isCreating) {
      return;
    }

    this.isCreating = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.backupService.createBackup().subscribe({
      next: (response) => {
        this.isCreating = false;
        this.successMessage = response.message;
        this.loadBackups();
      },
      error: (error) => {
        console.error('Error al crear el respaldo:', error);

        this.isCreating = false;
        this.errorMessage = error?.error?.message || 'No fue posible crear el respaldo.';

        this.changeDetectorRef.detectChanges();
      },
    });
  }

  openRestoreConfirmation(fileName: string): void {
    this.selectedBackup = fileName;
    this.showRestoreConfirmation = true;
    this.successMessage = '';
    this.errorMessage = '';
  }

  closeRestoreConfirmation(): void {
    if (this.isRestoring) {
      return;
    }

    this.showRestoreConfirmation = false;
    this.selectedBackup = null;
  }

  restoreBackup(): void {
    if (!this.selectedBackup || this.isRestoring) {
      return;
    }

    this.isRestoring = true;
    this.successMessage = '';
    this.errorMessage = '';

    this.backupService.restoreBackup(this.selectedBackup).subscribe({
      next: (response) => {
        this.isRestoring = false;
        this.showRestoreConfirmation = false;
        this.selectedBackup = null;
        this.successMessage = response.message;

        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al restaurar el respaldo:', error);

        this.isRestoring = false;
        this.errorMessage = error?.error?.message || 'No fue posible restaurar el respaldo.';

        this.changeDetectorRef.detectChanges();
      },
    });
  }

  get latestBackup(): string | null {
    return this.backups.length > 0 ? this.backups[0] : null;
  }

  getBackupDate(fileName: string): Date | null {
    const match = fileName.match(
      /^licorera_jm_(\d{4})-(\d{2})-(\d{2})_(\d{2})-(\d{2})-(\d{2})\.backup$/,
    );

    if (!match) {
      return null;
    }

    const [, year, month, day, hour, minute, second] = match;

    return new Date(
      Number(year),
      Number(month) - 1,
      Number(day),
      Number(hour),
      Number(minute),
      Number(second),
    );
  }
}
