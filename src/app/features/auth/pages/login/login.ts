import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';

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

  loginRequest: LoginRequest = {
    username: '',
    password: '',
  };

  currentYear = new Date().getFullYear();

  passwordVisible = false;

  togglePasswordVisibility(): void {
    this.passwordVisible = !this.passwordVisible;
  }

  login(): void {
    this.authService.login(this.loginRequest).subscribe({
      next: (response) => {
        console.log('Login exitoso:', response);
      },
      error: (error) => {
        console.error('Error en login:', error);
      },
    });
  }
}
