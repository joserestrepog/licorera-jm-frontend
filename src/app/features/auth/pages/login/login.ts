import { ChangeDetectorRef, Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { AuthService } from '../../services/auth.service';
import { LoginRequest } from '../../models/login-request.model';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
})
export class LoginComponent {
  private readonly authService = inject(AuthService);
  private readonly changeDetectorRef = inject(ChangeDetectorRef);
  private readonly router = inject(Router);

  loginRequest: LoginRequest = {
    username: '',
    password: '',
  };

  currentYear = new Date().getFullYear();

  passwordVisible = false;

  errorMessage = '';

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  login(): void {
    this.errorMessage = '';

    if (!this.loginRequest.username.trim()) {
      this.errorMessage = 'Ingresa tu usuario';
      return;
    }

    if (!this.loginRequest.password.trim()) {
      this.errorMessage = 'Ingresa tu contraseña';
      return;
    }

    this.authService.login(this.loginRequest).subscribe({
      next: () => {
        this.router.navigate(['/dashboard']);
      },

      error: (error) => {
        console.error('Error en login:', error);

        this.errorMessage = 'Usuario o contraseña incorrectos';

        this.changeDetectorRef.detectChanges();

        console.log('Mensaje asignado:', this.errorMessage);
      },
    });
  }
}
