import { Component, OnInit, OnDestroy } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { Router, ActivatedRoute } from '@angular/router';
import { Subject, takeUntil, take } from 'rxjs';

@Component({
  selector: 'app-auth-callback',
  standalone: true,
  template: `
    <div class="flex items-center justify-center min-h-screen">
      <div class="text-center">
        <h2 class="text-xl font-semibold mb-2">Authenticating...</h2>
        <p class="text-gray-600">Please wait while we complete the authentication process.</p>
      </div>
    </div>
  `
})
export class AuthCallbackComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  private hasNavigated = false;

  constructor(
    private auth: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit() {
    // Log query parameters once
    this.route.queryParams.pipe(
      take(1)
    ).subscribe(params => {
      console.log('Callback - Query parameters:', params);
    });

    // Handle authentication state
    this.auth.isAuthenticated$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(
      isAuthenticated => {
        console.log('Callback - Authentication state:', isAuthenticated);
        if (isAuthenticated && !this.hasNavigated) {
          this.hasNavigated = true;
          console.log('Callback - Navigating to home');
          this.router.navigate(['/']);
        }
      }
    );

    // Log user profile once authenticated
    this.auth.user$.pipe(
      take(1)
    ).subscribe(
      user => {
        console.log('Callback - User profile:', user);
      }
    );
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
} 