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
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
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