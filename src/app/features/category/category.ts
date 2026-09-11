import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { Sidebar } from '../dashboard/sidebar/sidebar';
import { Topbar } from '../dashboard/topbar/topbar';

import { CategoryService } from './category.service';
import { Category } from './category.model';

@Component({
  selector: 'app-category',
  standalone: true,
  imports: [Sidebar, Topbar, FormsModule, ReactiveFormsModule],
  templateUrl: './category.html',
  styleUrl: './category.css',
})
export class CategoryComponent implements OnInit {
  private readonly categoryService = inject(CategoryService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  categories: Category[] = [];
  filteredCategories: Category[] = [];

  searchTerm = '';

  showCategoryForm = false;
  showCategoryDetail = false;

  selectedCategory: Category | null = null;

  isEditing = false;
  isSaving = false;

  categoryForm = this.formBuilder.group({
    name: ['', [Validators.required, Validators.maxLength(100)]],
    description: ['', Validators.maxLength(255)],
  });

  ngOnInit(): void {
    this.loadCategories();
  }

  private loadCategories(): void {
    this.categoryService.findAll().subscribe({
      next: (categories) => {
        this.categories = categories.filter((category) => category.active);
        this.applyFilters();
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar categorías:', error);
      },
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredCategories = this.categories.filter((category) => {
      return (
        !search ||
        category.name.toLowerCase().includes(search) ||
        (category.description?.toLowerCase().includes(search) ?? false)
      );
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  openNewCategoryForm(): void {
    this.isEditing = false;
    this.selectedCategory = null;
    this.categoryForm.reset({
      name: '',
      description: '',
    });

    this.showCategoryDetail = false;
    this.showCategoryForm = true;
  }

  openEditForm(category: Category): void {
    this.isEditing = true;
    this.selectedCategory = category;

    this.categoryForm.patchValue({
      name: category.name,
      description: category.description ?? '',
    });

    this.showCategoryDetail = false;
    this.showCategoryForm = true;

    this.changeDetectorRef.detectChanges();
  }

  closeCategoryForm(): void {
    this.showCategoryForm = false;
    this.isEditing = false;
    this.selectedCategory = null;
    this.isSaving = false;

    this.categoryForm.reset({
      name: '',
      description: '',
    });
  }

  openCategoryDetail(category: Category): void {
    this.selectedCategory = category;
    this.showCategoryDetail = true;
  }

  closeCategoryDetail(): void {
    this.showCategoryDetail = false;
    this.selectedCategory = null;
  }

  saveCategory(): void {
    if (this.categoryForm.invalid) {
      this.categoryForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;

    const formValue = this.categoryForm.getRawValue();

    const request = {
      name: formValue.name.trim(),
      description: formValue.description.trim() || null,
    };

    if (this.isEditing && this.selectedCategory) {
      this.categoryService.update(this.selectedCategory.id, request).subscribe({
        next: () => {
          this.isSaving = false;
          this.closeCategoryForm();
          this.loadCategories();
        },
        error: (error) => {
          this.isSaving = false;
          console.error('Error al actualizar categoría:', error);
        },
      });

      return;
    }

    this.categoryService.create(request).subscribe({
      next: () => {
        this.isSaving = false;
        this.closeCategoryForm();
        this.loadCategories();
      },
      error: (error) => {
        this.isSaving = false;
        console.error('Error al crear categoría:', error);
      },
    });
  }

  deactivateCategory(category: Category): void {
    const confirmed = window.confirm(`¿Deseas desactivar la categoría "${category.name}"?`);

    if (!confirmed) {
      return;
    }

    this.categoryService.deactivate(category.id).subscribe({
      next: () => {
        this.closeCategoryDetail();
        this.loadCategories();
      },
      error: (error) => {
        console.error('Error al desactivar categoría:', error);
      },
    });
  }
}
