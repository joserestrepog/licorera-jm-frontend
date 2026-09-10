import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';

import { Sidebar } from '../../../dashboard/components/sidebar/sidebar';
import { Topbar } from '../../../dashboard/components/topbar/topbar';

import { ProductService } from '../../services/product.service';
import { Product } from '../../models/product.model';

import { CategoryService } from '../../../categories/services/category.service';
import { Category } from '../../../categories/models/category.model';

@Component({
  selector: 'app-products',
  standalone: true,
  imports: [Sidebar, Topbar, CurrencyPipe, FormsModule, ReactiveFormsModule],
  templateUrl: './products.html',
  styleUrl: './products.css',
})
export class ProductsComponent implements OnInit {
  private readonly productService = inject(ProductService);
  private readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  products: Product[] = [];
  categories: Category[] = [];
  filteredProducts: Product[] = [];

  searchTerm = '';
  selectedCategoryId = 0;

  showProductForm = false;
  showProductDetail = false;

  selectedProduct: Product | null = null;

  isEditing = false;
  isSaving = false;

  productForm = this.formBuilder.group({
    barcode: ['', [Validators.required, Validators.maxLength(50)]],
    name: ['', [Validators.required, Validators.maxLength(100)]],
    categoryId: [0, [Validators.required, Validators.min(1)]],
    provider: ['', Validators.maxLength(100)],
    purchasePrice: [0, [Validators.required, Validators.min(0)]],
    salePrice: [0, [Validators.required, Validators.min(0)]],
    minimumStock: [0, [Validators.required, Validators.min(0)]],
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadCategories();
  }

  private loadProducts(): void {
    this.productService.findAll().subscribe({
      next: (products) => {
        this.products = products.filter((product) => product.active);
        this.applyFilters();
        this.changeDetectorRef.detectChanges();
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
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      },
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredProducts = this.products.filter((product) => {
      const matchesSearch =
        !search ||
        product.name.toLowerCase().includes(search) ||
        product.barcode.toLowerCase().includes(search) ||
        (product.provider?.toLowerCase().includes(search) ?? false);

      const matchesCategory =
        this.selectedCategoryId === 0 || product.categoryId === this.selectedCategoryId;

      return matchesSearch && matchesCategory;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onCategoryChange(): void {
    this.applyFilters();
  }

  openEditForm(product: Product): void {
    this.isEditing = true;
    this.selectedProduct = product;

    this.productForm.patchValue({
      barcode: product.barcode,
      name: product.name,
      categoryId: product.categoryId,
      provider: product.provider ?? '',
      purchasePrice: product.purchasePrice,
      salePrice: product.salePrice,
      minimumStock: product.minimumStock,
    });

    // Cerrar el modal de detalle al entrar en edición.
    this.showProductDetail = false;

    // Mostrar el formulario de edición.
    this.showProductForm = true;

    this.changeDetectorRef.detectChanges();
  }

  closeProductForm(): void {
    this.showProductForm = false;
    this.isEditing = false;
    this.selectedProduct = null;
    this.isSaving = false;
  }

  openProductDetail(product: Product): void {
    this.selectedProduct = product;
    this.showProductDetail = true;
  }

  closeProductDetail(): void {
    this.showProductDetail = false;
    this.selectedProduct = null;
  }

  saveProduct(): void {
    if (this.productForm.invalid) {
      this.productForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.productForm.getRawValue();

    const request = {
      barcode: formValue.barcode.trim(),
      name: formValue.name.trim(),
      categoryId: formValue.categoryId,
      provider: formValue.provider.trim() || null,
      purchasePrice: formValue.purchasePrice,
      salePrice: formValue.salePrice,
      minimumStock: formValue.minimumStock,
    };

    if (this.isEditing && this.selectedProduct) {
      this.productService.update(this.selectedProduct.id, request).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeProductForm();
          this.loadProducts();
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error al actualizar producto:', error);
        },
      });

      return;
    }

    this.productService.create(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeProductForm();
        this.loadProducts();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al crear producto:', error);
      },
    });
  }

  deactivateProduct(product: Product): void {
    const confirmed = window.confirm(`¿Deseas desactivar el producto "${product.name}"?`);

    if (!confirmed) {
      return;
    }

    this.productService.deactivate(product.id).subscribe({
      next: () => {
        this.closeProductDetail();
        this.loadProducts();
      },
      error: (error) => {
        console.error('Error al desactivar producto:', error);
      },
    });
  }

  isLowStock(product: Product): boolean {
    return product.currentStock <= product.minimumStock;
  }
}
