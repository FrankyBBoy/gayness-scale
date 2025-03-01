import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../core/services/user.service';
import { VoteService, Vote } from '../../core/services/vote.service';
import { SuggestionService, Suggestion, PaginatedSuggestions } from '../../core/services/suggestion.service';
import { Subscription, firstValueFrom } from 'rxjs';

interface UserStats {
  totalSuggestions: number;
  totalVotes: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit, OnDestroy {
  user: User | null = null;
  loading = true;
  error: string | null = null;
  remainingSuggestions = 5;
  recentVotes: Vote[] = [];
  recentSuggestions: Suggestion[] = [];
  stats: UserStats = {
    totalSuggestions: 0,
    totalVotes: 0
  };

  // Pagination for suggestions
  currentSuggestionPage = 1;
  suggestionsPerPage = 10;
  totalSuggestions = 0;
  loadingSuggestions = false;
  
  // Référence à l'objet Math pour l'utiliser dans le template
  Math = Math;

  private suggestionDescriptions = new Map<number, string>();
  private userSubscription: Subscription | null = null;

  constructor(
    private userService: UserService,
    private voteService: VoteService,
    private suggestionService: SuggestionService
  ) {}

  ngOnInit() {
    this.loadUserProfile();
    
    // Subscribe to user updates
    this.userSubscription = this.userService.currentUser$.subscribe(user => {
      if (user) {
        this.user = user;
        this.remainingSuggestions = 5 - (user.daily_suggestions_count || 0);
      }
    });
  }

  ngOnDestroy() {
    if (this.userSubscription) {
      this.userSubscription.unsubscribe();
    }
  }

  private loadUserProfile() {
    this.loading = true;
    this.error = null;

    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.user = user;
        if (user) {
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

  private async loadUserActivity(userId: string) {
    try {
      const [suggestionsData, votes] = await Promise.all([
        this.loadUserSuggestions(userId, this.currentSuggestionPage),
        firstValueFrom(this.voteService.getUserVotes(userId))
      ]);
      
      if (votes) {
        this.recentVotes = votes.items;
        this.loadVotedSuggestions(votes.items);
        
        this.stats = {
          totalSuggestions: this.totalSuggestions,
          totalVotes: votes.total
        };
      } else {
        this.stats = {
          totalSuggestions: this.totalSuggestions,
          totalVotes: 0
        };
      }

      this.loading = false;
    } catch (err) {
      this.error = 'Failed to load user activity';
      this.loading = false;
      console.error('Error loading user activity:', err);
    }
  }

  private async loadUserSuggestions(userId: string, page: number): Promise<PaginatedSuggestions | null> {
    this.loadingSuggestions = true;
    try {
      const suggestions = await firstValueFrom(
        this.suggestionService.getUserSuggestions(userId, page, this.suggestionsPerPage)
      );
      
      if (suggestions) {
        this.recentSuggestions = suggestions.items;
        this.totalSuggestions = suggestions.total;
        suggestions.items.forEach(s => this.suggestionDescriptions.set(s.id, s.description));
      }
      
      this.loadingSuggestions = false;
      return suggestions || null;
    } catch (err) {
      console.error('Error loading user suggestions:', err);
      this.loadingSuggestions = false;
      throw err;
    }
  }

  loadPage(page: number) {
    if (this.user && page !== this.currentSuggestionPage && page > 0 && page <= this.getTotalPages()) {
      this.currentSuggestionPage = page;
      this.loadUserSuggestions(this.user.id, page);
    }
  }

  getTotalPages(): number {
    return Math.ceil(this.totalSuggestions / this.suggestionsPerPage);
  }

  getPageNumbers(): number[] {
    const totalPages = this.getTotalPages();
    const currentPage = this.currentSuggestionPage;
    
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    
    if (currentPage <= 3) {
      return [1, 2, 3, 4, 5];
    }
    
    if (currentPage >= totalPages - 2) {
      return [totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages];
    }
    
    return [currentPage - 2, currentPage - 1, currentPage, currentPage + 1, currentPage + 2];
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

  getDescription(suggestionId: number): string {
    return this.suggestionDescriptions.get(suggestionId) || 'Loading...';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
} 