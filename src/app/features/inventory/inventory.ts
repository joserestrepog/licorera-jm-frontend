import { ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CurrencyPipe, DatePipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';

import { Sidebar } from '../dashboard/sidebar/sidebar';
import { Topbar } from '../dashboard/topbar/topbar';

import { InventoryService } from './inventory.service';
import { InventoryEntry } from './inventory-entry.model';

import { ProductService } from '../product/product.service';
import { Product } from '../product/product.model';

import { CategoryService } from '../category/category.service';
import { Category } from '../category/category.model';

@Component({
  selector: 'app-inventory',
  standalone: true,
  imports: [Sidebar, Topbar, CurrencyPipe, DatePipe, ReactiveFormsModule],
  templateUrl: './inventory.html',
  styleUrl: './inventory.css',
})
export class InventoryComponent implements OnInit {
  @ViewChild('barcodeInput')
  private barcodeInput?: ElementRef<HTMLInputElement>;

  private readonly inventoryService = inject(InventoryService);
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  entries: InventoryEntry[] = [];
  products: Product[] = [];
  categories: Category[] = [];
  selectedEntry: InventoryEntry | null = null;

  showNewEntryForm = false;
  productExists = false;
  isSearchingProduct = false;
  isSaving = false;

  inventoryForm = this.formBuilder.group({
    barcode: ['', [Validators.required, Validators.maxLength(50)]],
    name: [{ value: '', disabled: true }, [Validators.required, Validators.maxLength(100)]],
    categoryId: [{ value: 0, disabled: true }, Validators.required],
    provider: [{ value: '', disabled: true }, Validators.maxLength(100)],
    purchasePrice: [0, [Validators.required, Validators.min(0)]],
    salePrice: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
    minimumStock: [{ value: 0, disabled: true }, [Validators.required, Validators.min(0)]],
    quantity: [0, [Validators.required, Validators.min(1)]],
    notes: ['', Validators.maxLength(255)],
  });

  ngOnInit(): void {
    this.loadEntries();
    this.loadProducts();
    this.loadCategories();
  }

  private loadEntries(): void {
    this.inventoryService.findAll().subscribe({
      next: (entries) => {
        this.entries = entries;
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar entradas de inventario:', error);
      },
    });
  }

  private loadProducts(): void {
    this.productService.findAll().subscribe({
      next: (products) => {
        this.products = products;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
      },
    });
  }

  private loadCategories(): void {
    this.categoryService.findAll().subscribe({
      next: (categories) => {
        this.categories = categories.filter((category) => category.active);
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      },
    });
  }

  openNewEntryForm(): void {
    this.showNewEntryForm = true;
    this.resetNewEntryForm();

    setTimeout(() => {
      this.barcodeInput?.nativeElement.focus();
    });
  }

  closeNewEntryForm(): void {
    this.showNewEntryForm = false;
    this.resetNewEntryForm();
  }

  openEntryDetail(entry: InventoryEntry): void {
    this.selectedEntry = entry;
  }

  closeEntryDetail(): void {
    this.selectedEntry = null;
  }

  searchProductByBarcode(): void {
    const barcodeControl = this.inventoryForm.controls.barcode;
    const barcode = barcodeControl.value?.trim();

    if (!barcode) {
      barcodeControl.markAsTouched();
      return;
    }

    this.isSearchingProduct = true;

    const product = this.products.find(
      (item) => item.barcode.toLowerCase() === barcode.toLowerCase(),
    );

    if (product) {
      this.loadExistingProduct(product);
    } else {
      this.prepareNewProduct();
    }

    this.isSearchingProduct = false;
    this.changeDetectorRef.detectChanges();
  }

  private loadExistingProduct(product: Product): void {
    this.productExists = true;

    this.inventoryForm.patchValue({
      name: product.name,
      categoryId: product.categoryId,
      provider: product.provider ?? '',
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      minimumStock: product.minimumStock,
      quantity: 0,
      notes: '',
    });

    this.inventoryForm.controls.name.disable();
    this.inventoryForm.controls.categoryId.disable();
    this.inventoryForm.controls.provider.disable();
    this.inventoryForm.controls.salePrice.disable();
    this.inventoryForm.controls.minimumStock.disable();

    this.inventoryForm.controls.purchasePrice.enable();
    this.inventoryForm.controls.quantity.enable();
    this.inventoryForm.controls.notes.enable();
  }

  private prepareNewProduct(): void {
    this.productExists = false;

    this.inventoryForm.patchValue({
      name: '',
      categoryId: 0,
      provider: '',
      purchasePrice: 0,
      salePrice: 0,
      minimumStock: 0,
      quantity: 0,
      notes: '',
    });

    this.inventoryForm.controls.name.enable();
    this.inventoryForm.controls.categoryId.enable();
    this.inventoryForm.controls.provider.enable();
    this.inventoryForm.controls.salePrice.enable();
    this.inventoryForm.controls.minimumStock.enable();

    this.inventoryForm.controls.purchasePrice.enable();
    this.inventoryForm.controls.quantity.enable();
    this.inventoryForm.controls.notes.enable();
  }

  saveNewEntry(): void {
    if (this.inventoryForm.invalid) {
      this.inventoryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.inventoryForm.getRawValue();

    if (this.productExists) {
      this.createInventoryEntry(formValue.barcode, null);
      return;
    }

    this.createProductAndInventoryEntry(formValue);
  }

  private createProductAndInventoryEntry(
    formValue: ReturnType<typeof this.inventoryForm.getRawValue>,
  ): void {
    if (formValue.categoryId === 0) {
      this.isSaving = false;
      return;
    }

    const productRequest = {
      barcode: formValue.barcode!.trim(),
      name: formValue.name!.trim(),
      categoryId: formValue.categoryId,
      provider: formValue.provider?.trim() || null,
      purchasePrice: formValue.purchasePrice,
      salePrice: formValue.salePrice,
      minimumStock: formValue.minimumStock,
    };

    this.productService.create(productRequest).subscribe({
      next: (product) => {
        this.createInventoryEntry(product.barcode, product.id);
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al crear producto:', error);
      },
    });
  }

  private createInventoryEntry(barcode: string | null, productId: number | null): void {
    const resolvedProductId = productId ?? this.findProductIdByBarcode(barcode);

    if (resolvedProductId === null) {
      this.isSaving = false;
      console.error('No fue posible encontrar el producto.');
      return;
    }

    const formValue = this.inventoryForm.getRawValue();

    this.inventoryService
      .createEntry({
        productId: resolvedProductId,
        quantity: formValue.quantity,
        purchasePrice: formValue.purchasePrice,
        notes: formValue.notes?.trim() || null,
      })
      .subscribe({
        next: () => {
          this.isSaving = false;
          this.loadEntries();
          this.loadProducts();
          this.closeNewEntryForm();
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error al registrar entrada de inventario:', error);
        },
      });
  }

  private findProductIdByBarcode(barcode: string | null): number | null {
    if (!barcode) {
      return null;
    }

    const product = this.products.find(
      (item) => item.barcode.toLowerCase() === barcode.toLowerCase(),
    );

    return product?.id ?? null;
  }

  private resetNewEntryForm(): void {
    this.productExists = false;
    this.isSearchingProduct = false;
    this.isSaving = false;

    this.inventoryForm.reset({
      barcode: '',
      name: '',
      categoryId: 0,
      provider: '',
      purchasePrice: 0,
      salePrice: 0,
      minimumStock: 0,
      quantity: 0,
      notes: '',
    });

    this.inventoryForm.controls.name.disable();
    this.inventoryForm.controls.categoryId.disable();
    this.inventoryForm.controls.provider.disable();
    this.inventoryForm.controls.salePrice.disable();
    this.inventoryForm.controls.minimumStock.disable();
  }
}
