import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuggestionService, Suggestion } from '../../core/services/suggestion.service';
import { VoteService } from '../../core/services/vote.service';
import { UserService, User } from '../../core/services/user.service';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vote.component.html',
  styleUrls: ['./vote.component.css']
})
export class VoteComponent implements OnInit {
  leftSuggestion: Suggestion | null = null;
  rightSuggestion: Suggestion | null = null;
  loading = true;
  error: string | null = null;
  votingEnabled = false;
  remainingVotes = 0;
  currentUser: User | null = null;

  constructor(
    private suggestionService: SuggestionService,
    private voteService: VoteService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
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
} 