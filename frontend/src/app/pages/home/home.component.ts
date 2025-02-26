import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SuggestionService, Suggestion, PaginatedSuggestions } from '../../core/services/suggestion.service';
import { VoteService } from '../../core/services/vote.service';
import { UserService } from '../../core/services/user.service';
import { Observable, map } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  suggestions: Suggestion[] = [];
  currentPage = 1;
  pageSize = 10;
  totalItems = 0;
  loading = true;
  error: string | null = null;

  constructor(
    private suggestionService: SuggestionService,
    private voteService: VoteService,
    private userService: UserService
  ) {}

  ngOnInit(): void {
    this.loadSuggestions();
  }

  loadSuggestions(): void {
    this.loading = true;
    this.error = null;

    this.suggestionService.getSuggestions(this.currentPage, this.pageSize, 'approved')
      .subscribe({
        next: (response: PaginatedSuggestions) => {
          this.suggestions = response.items;
          this.totalItems = response.total;
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load suggestions. Please try again later.';
          this.loading = false;
          console.error('Error loading suggestions:', err);
        }
      });
  }

  onPageChange(page: number): void {
    this.currentPage = page;
    this.loadSuggestions();
  }

  get totalPages(): number {
    return Math.ceil(this.totalItems / this.pageSize);
  }

  get pages(): number[] {
    const total = this.totalPages;
    const current = this.currentPage;
    const range = 2;
    
    const start = Math.max(1, current - range);
    const end = Math.min(total, current + range);
    
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }
} 