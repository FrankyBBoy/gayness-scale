import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { UserService } from '../../services/user.service';
import { switchMap, catchError, of } from 'rxjs';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="flex justify-center items-center h-screen">
      <div class="text-center">
        <p class="text-lg">Authentification en cours...</p>
      </div>
    </div>
  `,
  styles: []
})
export class AuthCallbackComponent implements OnInit {
  constructor(
    private router: Router,
    private auth: AuthService,
    private auth0: Auth0Service,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.handleCallback();
  }

  private handleCallback() {
    this.auth0.isAuthenticated$.subscribe({
      next: (isAuthenticated: boolean) => {
        if (isAuthenticated) {
          this.auth0.user$.pipe(
            switchMap(user => {
              if (user) {
                // Synchroniser l'utilisateur avec le backend
                return this.userService.getCurrentUser().pipe(
                  catchError(error => {
                    console.error('Error creating/updating user:', error);
                    return of(null);
                  })
                );
              }
              return of(null);
            })
          ).subscribe({
            next: (user) => {
              this.router.navigate(['/']);
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