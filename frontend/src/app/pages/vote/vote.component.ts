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
  templateUrl: './vote.component.html',
  styleUrls: ['./vote.component.scss']
})
export class VoteComponent implements OnInit {
  leftSuggestion: Suggestion | null = null;
  rightSuggestion: Suggestion | null = null;
  loading = true;
  error: string | null = null;
  remainingCount = 0;
  remainingVotes = 0;
  isAuthenticated = false;
  votingEnabled = true;

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
        this.leftSuggestion = response.pair[0];
        this.rightSuggestion = response.pair[1];
        this.remainingCount = response.remainingCount;
        this.remainingVotes = response.remainingCount;
        this.loading = false;
      },
      error: err => {
        console.error('Error loading random pair:', err);
        if (err.status === 401) {
          this.error = 'Please log in to vote';
          this.isAuthenticated = false;
        } else if (err.status === 404) {
          console.log('NO_MORE_SUGGESTIONS');
          this.error = 'NO_MORE_SUGGESTIONS';
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
          this.votingEnabled = false;
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

  skipPair() {
    this.loadRandomPair();
  }

  navigateToSuggest() {
    this.router.navigate(['/suggest']);
  }
} 