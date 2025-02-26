import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../core/services/user.service';
import { SuggestionService, Suggestion } from '../../core/services/suggestion.service';
import { VoteService, Vote } from '../../core/services/vote.service';
import { forkJoin } from 'rxjs';

interface UserStats {
  totalSuggestions: number;
  approvedSuggestions: number;
  pendingSuggestions: number;
  totalVotes: number;
  averageScore: number;
}

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  currentUser: User | null = null;
  userStats: UserStats | null = null;
  recentSuggestions: Suggestion[] = [];
  recentVotes: Vote[] = [];
  loading = true;
  error: string | null = null;

  constructor(
    private userService: UserService,
    private suggestionService: SuggestionService,
    private voteService: VoteService
  ) {}

  ngOnInit(): void {
    this.loadUserProfile();
  }

  private loadUserProfile(): void {
    this.loading = true;
    this.error = null;

    // Get current user first
    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        
        // Then load all user data in parallel
        forkJoin({
          suggestions: this.suggestionService.getSuggestions(1, 5), // Get last 5 suggestions
          votes: this.voteService.getUserVotes(user.id, 1, 5) // Get last 5 votes
        }).subscribe({
          next: (data) => {
            // Process suggestions
            this.recentSuggestions = data.suggestions.items;
            const suggestions = data.suggestions.items;
            
            // Calculate suggestion stats
            this.userStats = {
              totalSuggestions: data.suggestions.total,
              approvedSuggestions: suggestions.filter(s => s.status === 'approved').length,
              pendingSuggestions: suggestions.filter(s => s.status === 'pending').length,
              totalVotes: data.votes.total,
              averageScore: this.calculateAverageScore(data.votes.votes)
            };

            // Store recent votes
            this.recentVotes = data.votes.votes;
            
            this.loading = false;
          },
          error: (err) => {
            this.error = 'Failed to load profile data. Please try again later.';
            this.loading = false;
            console.error('Error loading profile data:', err);
          }
        });
      },
      error: (err) => {
        this.error = 'Failed to load user data. Please try again later.';
        this.loading = false;
        console.error('Error loading user data:', err);
      }
    });
  }

  private calculateAverageScore(votes: Vote[]): number {
    if (!votes.length) return 0;
    return Math.round(votes.reduce((acc, vote) => acc + vote.score, 0) / votes.length);
  }

  get remainingVotes(): number {
    return this.currentUser ? this.userService.getRemainingVotes(this.currentUser) : 0;
  }

  get remainingSuggestions(): number {
    return this.currentUser ? this.userService.getRemainingSuggestions(this.currentUser) : 0;
  }
} 