import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../core/services/user.service';
import { VoteService, Vote } from '../../core/services/vote.service';
import { SuggestionService, Suggestion } from '../../core/services/suggestion.service';
import { Subscription } from 'rxjs';

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
        totalVotes: this.recentVotes.length
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

  getDescription(suggestionId: number): string {
    return this.suggestionDescriptions.get(suggestionId) || 'Loading...';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString();
  }
} 