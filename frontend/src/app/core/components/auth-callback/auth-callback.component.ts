import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 flex items-center justify-center">
      <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  `,
  styles: []
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private router: Router,
    private auth: AuthService,
    private auth0: Auth0Service
  ) {}

  ngOnInit() {
    this.handleCallback();
  }

  private handleCallback() {
    this.auth0.isAuthenticated$.subscribe({
      next: (isAuthenticated: boolean) => {
        if (isAuthenticated) {
          this.auth0.user$.subscribe({
            next: (user: any) => {
              if (user) {
                this.router.navigate(['/']);
              }
            },
            error: (error) => {
              console.error('Error getting user profile:', error);
              this.router.navigate(['/']);
            }
          });
        } else {
          this.router.navigate(['/']);
        }
      },
      error: (error) => {
        console.error('Error checking authentication:', error);
        this.router.navigate(['/']);
      }
    });
  }
} 