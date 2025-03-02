import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { VoteService } from '../../core/services/vote.service';
import { SuggestionService, Suggestion } from '../../core/services/suggestion.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-vote',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './vote.component.html',
  styleUrls: ['./vote.component.scss']
})
export class VoteComponent implements OnInit {
  leftSuggestion: Suggestion | null = null;
  rightSuggestion: Suggestion | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private voteService: VoteService,
    private suggestionService: SuggestionService,
    private userService: UserService,
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.loadRandomPair();
  }

  login() {
    this.authService.login().subscribe();
  }

  loadRandomPair(): void {
    this.loading = true;
    this.error = null;
    
    this.suggestionService.getRandomPair().subscribe({
      next: (response) => {
        this.leftSuggestion = response.pair[0];
        this.rightSuggestion = response.pair[1];
        this.loading = false;
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        
        if (error.status === 404 || 
            (error.error && error.error.message && 
             error.error.message.includes('No more suggestions to vote on'))) {
          this.error = 'NO_MORE_SUGGESTIONS';
        } else {
          this.error = error.error?.message || 'Failed to load suggestions';
        }
      }
    });
  }

  vote(winner: Suggestion, loser: Suggestion): void {
    if (this.loading) return;
    
    this.loading = true;
    
    this.voteService.createVote(winner.id, loser.id).subscribe({
      next: () => {
        this.loadRandomPair();
      },
      error: (error: HttpErrorResponse) => {
        this.loading = false;
        this.error = error.error?.message || 'Failed to submit vote';
      }
    });
  }

  skipPair(): void {
    this.loadRandomPair();
  }

  navigateToSuggest(): void {
    this.router.navigate(['/suggest']);
  }
} 