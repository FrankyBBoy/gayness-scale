import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { UserService, User } from '../../core/services/user.service';
import { SuggestionService, Suggestion } from '../../core/services/suggestion.service';
import { VoteService, Vote } from '../../core/services/vote.service';

interface UserStats {
  totalSuggestions: number;
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
        console.log('user', user);
        
        // Load suggestions and votes separately for better error tracking
        this.suggestionService.getSuggestions(1, 5).subscribe({
          next: (suggestions) => {
            console.log('suggestions loaded:', suggestions);
            this.recentSuggestions = suggestions.items;
            
            // Now load votes
            this.voteService.getUserVotes(user.id, 1, 5).subscribe({
              next: (votes) => {
                console.log('votes loaded:', votes);
                this.recentVotes = votes.votes;
                
                // Calculate stats once we have both
                this.userStats = {
                  totalSuggestions: suggestions.total,
                  totalVotes: votes.total,
                  averageScore: this.calculateAverageScore(votes.votes)
                };
                
                console.log('userStats calculated:', this.userStats);
                this.loading = false;
              },
              error: (err) => {
                console.error('Error loading votes:', err);
                // Set empty votes but don't fail
                this.recentVotes = [];
                this.userStats = {
                  totalSuggestions: suggestions.total,
                  totalVotes: 0,
                  averageScore: 0
                };
                this.loading = false;
              }
            });
          },
          error: (err) => {
            console.error('Error loading suggestions:', err);
            // Set empty suggestions but continue with votes
            this.recentSuggestions = [];
            
            this.voteService.getUserVotes(user.id, 1, 5).subscribe({
              next: (votes) => {
                console.log('votes loaded (after suggestions error):', votes);
                this.recentVotes = votes.votes;
                this.userStats = {
                  totalSuggestions: 0,
                  totalVotes: votes.total,
                  averageScore: this.calculateAverageScore(votes.votes)
                };
                this.loading = false;
              },
              error: (voteErr) => {
                console.error('Error loading votes (after suggestions error):', voteErr);
                this.recentVotes = [];
                this.userStats = {
                  totalSuggestions: 0,
                  totalVotes: 0,
                  averageScore: 0
                };
                this.loading = false;
              }
            });
          }
        });
      },
      error: (err) => {
        console.error('Error loading user:', err);
        this.error = 'Failed to load user data. Please try again later.';
        this.loading = false;
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