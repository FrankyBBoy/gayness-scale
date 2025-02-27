import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoteService } from '../../core/services/vote.service';
import { SuggestionService, Suggestion } from '../../core/services/suggestion.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
          @if (loading) {
            <div class="flex justify-center items-center min-h-[400px]">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
            </div>
          } @else if (error) {
            <div class="bg-red-50 border-l-4 border-red-400 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">{{ error }}</p>
                  @if (!isAuthenticated) {
                    <button
                      (click)="login()"
                      class="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                    >
                      Log in to vote
                    </button>
                  }
                </div>
              </div>
            </div>
          } @else if (!currentPair) {
            <div class="text-center">
              <h3 class="text-lg font-medium text-gray-900">No more suggestions to vote on</h3>
              <p class="mt-1 text-sm text-gray-500">Please come back later or add your own suggestions!</p>
            </div>
          } @else {
            <div class="bg-white shadow overflow-hidden sm:rounded-lg">
              <div class="px-4 py-5 sm:p-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900">Choose the gayer option</h3>
                <div class="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <button
                    (click)="vote(currentPair[0], currentPair[1])"
                    class="relative block w-full rounded-lg p-6 bg-white border border-gray-300 shadow-sm space-y-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <div class="flex items-center space-x-3">
                      <h3 class="text-sm font-medium text-gray-900">
                        {{ currentPair[0].description }}
                      </h3>
                    </div>
                    <div class="text-sm text-gray-500">
                      ELO: {{ currentPair[0].elo_score }}
                    </div>
                  </button>

                  <button
                    (click)="vote(currentPair[1], currentPair[0])"
                    class="relative block w-full rounded-lg p-6 bg-white border border-gray-300 shadow-sm space-y-3 hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                  >
                    <div class="flex items-center space-x-3">
                      <h3 class="text-sm font-medium text-gray-900">
                        {{ currentPair[1].description }}
                      </h3>
                    </div>
                    <div class="text-sm text-gray-500">
                      ELO: {{ currentPair[1].elo_score }}
                    </div>
                  </button>
                </div>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class VoteComponent implements OnInit {
  currentPair: [Suggestion, Suggestion] | null = null;
  loading = true;
  error: string | null = null;
  remainingCount = 0;
  isAuthenticated = false;

  constructor(
    private voteService: VoteService,
    private suggestionService: SuggestionService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit() {
    console.log('Vote component initialized');
    this.authService.isAuthenticated().subscribe(
      isAuthenticated => {
        console.log('Authentication status in component:', isAuthenticated);
        this.isAuthenticated = isAuthenticated;
        if (isAuthenticated) {
          this.authService.getAccessToken().subscribe(token => {
            console.log('Token received in component:', token ? 'yes' : 'no');
            this.loadRandomPair();
          });
        } else {
          this.error = 'Please log in to vote';
          this.loading = false;
        }
      }
    );
  }

  login() {
    this.authService.login().subscribe();
  }

  private loadRandomPair() {
    this.loading = true;
    this.error = null;

    console.log('Loading random pair...');
    this.suggestionService.getRandomPair().subscribe({
      next: response => {
        console.log('Random pair loaded:', response);
        this.currentPair = response.pair;
        this.remainingCount = response.remainingCount;
        this.loading = false;
      },
      error: err => {
        console.error('Error loading random pair:', err);
        if (err.status === 401) {
          this.error = 'Please log in to vote';
          this.isAuthenticated = false;
        } else {
          this.error = 'Failed to load suggestions. Please try again later.';
        }
        this.loading = false;
      }
    });
  }

  vote(winner: Suggestion, loser: Suggestion) {
    if (!this.isAuthenticated) {
      this.error = 'Please log in to vote';
      return;
    }

    this.loading = true;
    this.error = null;

    this.voteService.createVote(winner.id, loser.id).subscribe({
      next: () => {
        this.loadRandomPair();
      },
      error: err => {
        console.error('Error creating vote:', err);
        if (err.status === 429) {
          this.error = 'You have reached your daily voting limit. Please try again tomorrow.';
        } else if (err.status === 401) {
          this.error = 'Please log in to vote';
          this.isAuthenticated = false;
        } else {
          this.error = 'Failed to submit vote. Please try again later.';
        }
        this.loading = false;
      }
    });
  }
} 