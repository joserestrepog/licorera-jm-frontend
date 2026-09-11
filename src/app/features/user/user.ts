import { ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';

import { Sidebar } from '../dashboard/sidebar/sidebar';
import { Topbar } from '../dashboard/topbar/topbar';

import { UserService } from './user.service';
import { Role, User, UserRequest } from './user.model';

@Component({
  selector: 'app-user',
  standalone: true,
  imports: [Sidebar, Topbar, FormsModule, ReactiveFormsModule],
  templateUrl: './user.html',
  styleUrl: './user.css',
})
export class UserComponent implements OnInit {
  private readonly userService = inject(UserService);
  private readonly formBuilder = inject(FormBuilder).nonNullable;
  private readonly changeDetectorRef = inject(ChangeDetectorRef);

  users: User[] = [];
  filteredUsers: User[] = [];
  roles: Role[] = [];

  searchTerm = '';
  selectedStatus = 'ALL';

  selectedUser: User | null = null;

  showForm = false;
  showDetail = false;

  isEditing = false;
  isSaving = false;

  errorMessage = '';

  userForm = this.formBuilder.group({
    firstName: ['', [Validators.required, Validators.maxLength(50)]],
    lastName: ['', Validators.maxLength(50)],
    username: ['', [Validators.required, Validators.maxLength(50)]],
    password: ['', [Validators.required, Validators.minLength(6), Validators.maxLength(255)]],
    roleId: [0, [Validators.required, Validators.min(1)]],
  });

  ngOnInit(): void {
    this.loadUsers();
    this.loadRoles();
  }

  private loadUsers(): void {
    this.userService.findAll().subscribe({
      next: (users) => {
        this.users = users;
        this.applyFilters();
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar los usuarios:', error);
        this.errorMessage = 'No fue posible cargar los usuarios.';
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  private loadRoles(): void {
    this.userService.findRoles().subscribe({
      next: (roles) => {
        this.roles = roles.filter((role) => role.active);
        this.changeDetectorRef.detectChanges();
      },
      error: (error) => {
        console.error('Error al cargar los roles:', error);
        this.errorMessage = 'No fue posible cargar los roles.';
        this.changeDetectorRef.detectChanges();
      },
    });
  }

  applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();

    this.filteredUsers = this.users.filter((user) => {
      const fullName = `${user.firstName} ${user.lastName ?? ''}`.trim().toLowerCase();

      const matchesSearch =
        !search ||
        fullName.includes(search) ||
        user.username.toLowerCase().includes(search) ||
        user.roleName.toLowerCase().includes(search);

      const matchesStatus =
        this.selectedStatus === 'ALL' ||
        (this.selectedStatus === 'ACTIVE' && user.active) ||
        (this.selectedStatus === 'INACTIVE' && !user.active);

      return matchesSearch && matchesStatus;
    });
  }

  onSearchChange(): void {
    this.applyFilters();
  }

  onStatusChange(): void {
    this.applyFilters();
  }

  get activeUsers(): User[] {
    return this.users.filter((user) => user.active);
  }

  get inactiveUsers(): User[] {
    return this.users.filter((user) => !user.active);
  }

  openCreateForm(): void {
    this.isEditing = false;
    this.selectedUser = null;
    this.errorMessage = '';

    this.userForm.reset({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      roleId: this.roles.length > 0 ? this.roles[0].id : 0,
    });

    this.showDetail = false;
    this.showForm = true;
    this.isSaving = false;
  }

  openEditForm(user: User): void {
    this.isEditing = true;
    this.selectedUser = user;
    this.errorMessage = '';

    this.userForm.reset({
      firstName: user.firstName,
      lastName: user.lastName ?? '',
      username: user.username,
      password: '',
      roleId: user.roleId,
    });

    this.showDetail = false;
    this.showForm = true;
    this.isSaving = false;
  }

  closeForm(): void {
    this.showForm = false;
    this.isSaving = false;
    this.selectedUser = null;

    this.userForm.reset({
      firstName: '',
      lastName: '',
      username: '',
      password: '',
      roleId: 0,
    });
  }

  saveUser(): void {
    if (this.userForm.invalid) {
      this.userForm.markAllAsTouched();
      return;
    }

    this.isSaving = true;
    this.errorMessage = '';

    const formValue = this.userForm.getRawValue();

    const request: UserRequest = {
      firstName: formValue.firstName.trim(),
      lastName: formValue.lastName.trim() || null,
      username: formValue.username.trim(),
      password: formValue.password,
      roleId: formValue.roleId,
    };

    const operation =
      this.isEditing && this.selectedUser
        ? this.userService.update(this.selectedUser.id, request)
        : this.userService.create(request);

    operation.subscribe({
      next: () => {
        this.isSaving = false;
        this.closeForm();
        this.loadUsers();
      },
      error: (error) => {
        this.isSaving = false;

        console.error('Error al guardar el usuario:', error);

        this.errorMessage = error?.error?.message || 'No fue posible guardar el usuario.';
      },
    });
  }

  openUserDetail(user: User): void {
    this.selectedUser = user;
    this.showDetail = true;
    this.showForm = false;
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedUser = null;
  }

  deactivateUser(user: User): void {
    const confirmed = window.confirm(`¿Deseas desactivar el usuario "${user.username}"?`);

    if (!confirmed) {
      return;
    }

    this.userService.deactivate(user.id).subscribe({
      next: () => {
        this.closeDetail();
        this.loadUsers();
      },
      error: (error) => {
        console.error('Error al desactivar usuario:', error);
      },
    });
  }

  getStatusClass(user: User): string {
    return user.active ? 'active' : 'inactive';
  }

  getStatusLabel(user: User): string {
    return user.active ? 'Activo' : 'Inactivo';
  }
}
