import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoteService } from '../../core/services/vote.service';
import { SuggestionService, Suggestion, PaginatedSuggestions } from '../../core/services/suggestion.service';
import { UserService, User } from '../../core/services/user.service';
import { Observable, forkJoin, of, firstValueFrom } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="border-4 border-dashed border-gray-200 rounded-lg p-4">
          <h2 class="text-2xl font-bold mb-4">Vote on Suggestions</h2>
          
          @if (loading) {
            <div class="flex justify-center items-center h-64">
              <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
            </div>
          } @else if (error) {
            <div class="bg-red-50 border-l-4 border-red-400 p-4">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">{{ error }}</p>
                </div>
              </div>
            </div>
          } @else if (currentSuggestions.length === 0) {
            <div class="text-center py-12">
              <p class="text-gray-500">No more suggestions to vote on today. Come back tomorrow!</p>
            </div>
          } @else {
            <div class="grid grid-cols-1 gap-6 sm:grid-cols-2">
              @for (suggestion of currentSuggestions; track suggestion.id) {
                <div class="bg-white overflow-hidden shadow rounded-lg">
                  <div class="px-4 py-5 sm:p-6">
                    <h3 class="text-lg font-medium text-gray-900">{{ suggestion.title }}</h3>
                    <p class="mt-1 text-sm text-gray-500">{{ suggestion.description }}</p>
                    <div class="mt-4 flex justify-between">
                      <button
                        (click)="voteForSuggestion(suggestion.id, 1)"
                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                      >
                        Vote Up
                      </button>
                      <button
                        (click)="voteForSuggestion(suggestion.id, 0)"
                        class="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
                      >
                        Vote Down
                      </button>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class VoteComponent implements OnInit {
  leftSuggestion: Suggestion | null = null;
  rightSuggestion: Suggestion | null = null;
  loading = true;
  error: string | null = null;
  votingEnabled = false;
  remainingVotes = 0;
  currentUser: User | null = null;
  currentSuggestions: Suggestion[] = [];
  currentPage = 1;
  pageSize = 10;

  constructor(
    private voteService: VoteService,
    private suggestionService: SuggestionService,
    private userService: UserService
  ) {}

  ngOnInit() {
    this.loadUserAndSuggestions();
  }

  loadUserAndSuggestions(): void {
    this.loading = true;
    this.error = null;

    // First get the current user to check voting limits
    this.userService.getCurrentUser().pipe(
      switchMap(user => {
        this.currentUser = user;
        this.votingEnabled = this.userService.canVoteToday(user);
        this.remainingVotes = this.userService.getRemainingVotes(user);
        
        if (!this.votingEnabled) {
          return of(null);
        }
        
        // Then load two random suggestions
        return this.loadRandomSuggestions();
      })
    ).subscribe({
      error: (err) => {
        this.error = 'Failed to load voting data. Please try again later.';
        this.loading = false;
        console.error('Error loading voting data:', err);
      }
    });
  }

  private loadRandomSuggestions(): Observable<[Suggestion, Suggestion]> {
    return this.suggestionService.getSuggestions(1, 10, 'approved').pipe(
      map(response => {
        const suggestions = response.items;
        if (suggestions.length < 2) {
          throw new Error('Not enough suggestions available for voting');
        }
        
        // Randomly select two different suggestions
        const shuffled = suggestions.sort(() => Math.random() - 0.5);
        this.leftSuggestion = shuffled[0];
        this.rightSuggestion = shuffled[1];
        this.loading = false;
        return [shuffled[0], shuffled[1]] as [Suggestion, Suggestion];
      }),
      catchError(err => {
        this.error = 'Not enough suggestions available for voting.';
        this.loading = false;
        throw err;
      })
    );
  }

  vote(winner: Suggestion, loser: Suggestion): void {
    if (!this.votingEnabled || !this.currentUser) {
      return;
    }

    this.loading = true;
    this.error = null;

    // Calculate scores: winner gets 1, loser gets 0
    const winnerScore = 1;
    const loserScore = 0;

    // Create both votes in parallel
    forkJoin([
      this.voteService.createVote(winner.id, winnerScore),
      this.voteService.createVote(loser.id, loserScore)
    ]).pipe(
      switchMap(() => this.userService.getCurrentUser()) // Refresh user data to update remaining votes
    ).subscribe({
      next: (user) => {
        this.currentUser = user;
        this.votingEnabled = this.userService.canVoteToday(user);
        this.remainingVotes = this.userService.getRemainingVotes(user);
        
        if (this.votingEnabled) {
          this.loadRandomSuggestions().subscribe();
        } else {
          this.loading = false;
        }
      },
      error: (err) => {
        this.error = 'Failed to submit vote. Please try again later.';
        this.loading = false;
        console.error('Error submitting vote:', err);
      }
    });
  }

  skipPair(): void {
    if (!this.votingEnabled) {
      return;
    }
    this.loadRandomSuggestions().subscribe();
  }

  loadSuggestions() {
    this.loading = true;
    this.error = null;
    
    this.suggestionService.getSuggestions(this.currentPage, this.pageSize, 'pending').subscribe({
      next: (response: PaginatedSuggestions) => {
        this.currentSuggestions = response.items;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load suggestions. Please try again later.';
        this.loading = false;
        console.error('Error loading suggestions:', err);
      }
    });
  }

  async voteForSuggestion(suggestionId: number, score: number) {
    try {
      await firstValueFrom(this.voteService.createVote(suggestionId, score));
      this.currentSuggestions = this.currentSuggestions.filter(s => s.id !== suggestionId);
      if (this.currentSuggestions.length === 0) {
        this.loadSuggestions();
      }
    } catch (err) {
      this.error = 'Failed to submit vote. Please try again later.';
      console.error('Error submitting vote:', err);
    }
  }
} 