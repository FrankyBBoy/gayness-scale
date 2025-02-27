import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../core/services/user.service';
import { VoteService, Vote } from '../../core/services/vote.service';
import { SuggestionService, Suggestion } from '../../core/services/suggestion.service';

interface UserStats {
  totalSuggestions: number;
  totalVotes: number;
  winRate: number;
}

@Component({
  selector: 'app-profile',
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
                </div>
              </div>
            </div>
          } @else {
            <div class="bg-white shadow overflow-hidden sm:rounded-lg">
              <div class="px-4 py-5 sm:px-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900">Profile Information</h3>
                <p class="mt-1 max-w-2xl text-sm text-gray-500">Personal details and activity.</p>
              </div>
              <div class="border-t border-gray-200">
                <dl>
                  <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Email</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ user?.email }}</dd>
                  </div>
                  <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Remaining votes today</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ remainingVotes }}</dd>
                  </div>
                  <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Remaining suggestions today</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ remainingSuggestions }}</dd>
                  </div>
                </dl>
              </div>
            </div>

            <div class="mt-8 bg-white shadow overflow-hidden sm:rounded-lg">
              <div class="px-4 py-5 sm:px-6">
                <h3 class="text-lg leading-6 font-medium text-gray-900">Activity Statistics</h3>
              </div>
              <div class="border-t border-gray-200">
                <dl>
                  <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Total Suggestions</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ stats.totalSuggestions }}</dd>
                  </div>
                  <div class="bg-white px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Total Votes</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ stats.totalVotes }}</dd>
                  </div>
                  <div class="bg-gray-50 px-4 py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                    <dt class="text-sm font-medium text-gray-500">Win Rate</dt>
                    <dd class="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{{ stats.winRate }}%</dd>
                  </div>
                </dl>
              </div>
            </div>

            @if (recentSuggestions.length > 0) {
              <div class="mt-8">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Your Recent Suggestions</h3>
                <div class="bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul role="list" class="divide-y divide-gray-200">
                    @for (suggestion of recentSuggestions; track suggestion.id) {
                      <li class="px-4 py-4">
                        <div class="flex items-center justify-between">
                          <p class="text-sm font-medium text-gray-900">{{ suggestion.description }}</p>
                          <div class="text-sm text-gray-500">
                            ELO: {{ suggestion.elo_score }}
                          </div>
                        </div>
                      </li>
                    }
                  </ul>
                </div>
              </div>
            }

            @if (recentVotes.length > 0) {
              <div class="mt-8">
                <h3 class="text-lg leading-6 font-medium text-gray-900 mb-4">Your Recent Votes</h3>
                <div class="bg-white shadow overflow-hidden sm:rounded-lg">
                  <ul role="list" class="divide-y divide-gray-200">
                    @for (vote of recentVotes; track vote.id) {
                      <li class="px-4 py-4">
                        <div class="flex items-center justify-between">
                          <div class="text-sm text-gray-900">
                            <span class="font-medium">Winner:</span> {{ getDescription(vote.winner_id) }}
                            <br>
                            <span class="font-medium">Loser:</span> {{ getDescription(vote.loser_id) }}
                          </div>
                          <div class="text-sm text-gray-500">
                            {{ formatDate(vote.created_at) }}
                          </div>
                        </div>
                      </li>
                    }
                  </ul>
                </div>
              </div>
            }
          }
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class ProfileComponent implements OnInit {
  user: User | null = null;
  loading = true;
  error: string | null = null;
  remainingVotes = 10;
  remainingSuggestions = 5;
  recentVotes: Vote[] = [];
  recentSuggestions: Suggestion[] = [];
  stats: UserStats = {
    totalSuggestions: 0,
    totalVotes: 0,
    winRate: 0
  };

  private suggestionDescriptions = new Map<number, string>();

  constructor(
    private userService: UserService,
    private voteService: VoteService,
    private suggestionService: SuggestionService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
  }

  private loadUserProfile() {
    this.loading = true;
    this.error = null;

    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        if (user) {
          this.remainingVotes = 10 - (user.daily_votes_count || 0);
          this.remainingSuggestions = 5 - (user.daily_suggestions_count || 0);
          this.loadUserActivity(user.id);
        }
      },
      error: (err) => {
        this.error = 'Failed to load user profile';
        this.loading = false;
        console.error('Error loading user profile:', err);
      }
    });
  }

  private loadUserActivity(userId: string) {
    Promise.all([
      this.suggestionService.getUserSuggestions(userId).toPromise(),
      this.voteService.getUserVotes(userId).toPromise()
    ]).then(([suggestions, votes]) => {
      if (suggestions) {
        this.recentSuggestions = suggestions.items;
        suggestions.items.forEach(s => this.suggestionDescriptions.set(s.id, s.description));
      }
      if (votes) {
        this.recentVotes = votes.items;
        this.loadVotedSuggestions(votes.items);
      }

      this.stats = {
        totalSuggestions: this.recentSuggestions.length,
        totalVotes: this.recentVotes.length,
        winRate: this.calculateWinRate()
      };

      this.loading = false;
    }).catch(err => {
      this.error = 'Failed to load user activity';
      this.loading = false;
      console.error('Error loading user activity:', err);
    });
  }

  private loadVotedSuggestions(votes: Vote[]) {
    const suggestionIds = new Set<number>();
    votes.forEach(vote => {
      suggestionIds.add(vote.winner_id);
      suggestionIds.add(vote.loser_id);
    });

    suggestionIds.forEach(id => {
      if (!this.suggestionDescriptions.has(id)) {
        this.suggestionService.getSuggestionById(id).subscribe({
          next: (suggestion) => {
            this.suggestionDescriptions.set(suggestion.id, suggestion.description);
          },
          error: (err) => {
            console.error(`Error loading suggestion ${id}:`, err);
          }
        });
      }
    });
  }

  private calculateWinRate(): number {
    if (this.recentVotes.length === 0) return 0;
    const totalWins = this.recentVotes.filter(vote => 
      this.recentSuggestions.some(s => s.id === vote.winner_id)
    ).length;
    return Math.round((totalWins / this.recentVotes.length) * 100);
  }

  getDescription(suggestionId: number): string {
    return this.suggestionDescriptions.get(suggestionId) || 'Loading...';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
} 