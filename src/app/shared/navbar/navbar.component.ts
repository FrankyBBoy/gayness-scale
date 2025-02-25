import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <nav class="bg-white shadow">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex justify-between h-16">
          <div class="flex">
            <div class="flex-shrink-0 flex items-center">
              <a routerLink="/" class="text-xl font-bold text-gray-800">Gayness Scale</a>
            </div>
            <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
              <a routerLink="/" 
                 class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                Home
              </a>
              @if (auth.isAuthenticated$ | async) {
                <a routerLink="/vote" 
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Vote
                </a>
                <a routerLink="/add-suggestion" 
                   class="border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700 inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  Add Suggestion
                </a>
              }
            </div>
          </div>
          <div class="flex items-center">
            @if (auth.isAuthenticated$ | async) {
              <div class="mr-4 text-sm text-gray-600">
                {{ (auth.user$ | async)?.email }}
              </div>
              <button (click)="auth.logout()" 
                      class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                Logout
              </button>
            } @else {
              <button (click)="auth.login()" 
                      class="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">
                Login
              </button>
            }
          </div>
        </div>
      </div>
    </nav>
  `,
  styles: ``
})
export class NavbarComponent implements OnInit {
  constructor(public auth: AuthService) {}

  ngOnInit() {
    // Subscribe to authentication state changes
    this.auth.isAuthenticated$.subscribe(
      isAuthenticated => console.log('Is authenticated:', isAuthenticated)
    );

    // Subscribe to user profile
    this.auth.user$.subscribe(
      user => console.log('User profile:', user)
    );
  }
}
