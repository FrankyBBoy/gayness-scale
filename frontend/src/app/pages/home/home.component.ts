import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { SuggestionService, Suggestion } from '../../core/services/suggestion.service';
import { forkJoin } from 'rxjs';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {
  suggestions: Suggestion[] = [];
  latestSuggestions: Suggestion[] = [];
  loading = true;
  error: string | null = null;
  currentPage = 1;
  pageSize = 10;
  totalPages = 1;
  totalItems = 0;
  Math = Math;

  constructor(
    private suggestionService: SuggestionService,
    private router: Router
  ) {}

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading = true;
    this.error = null;

    // Utiliser forkJoin pour charger les deux ensembles de données en parallèle
    forkJoin({
      topSuggestions: this.suggestionService.getTopSuggestionsByElo(this.currentPage, this.pageSize),
      latestSuggestions: this.suggestionService.getLatestSuggestions(10)
    }).subscribe({
      next: (results) => {
        this.suggestions = results.topSuggestions.items;
        this.latestSuggestions = results.latestSuggestions;
        this.totalItems = results.topSuggestions.total;
        this.totalPages = Math.ceil(results.topSuggestions.total / this.pageSize);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load suggestions. Please try again later.';
        this.loading = false;
        console.error('Error loading suggestions:', err);
      }
    });
  }

  loadTopSuggestions() {
    this.loading = true;
    this.error = null;

    this.suggestionService.getTopSuggestionsByElo(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.suggestions = response.items;
          this.totalItems = response.total;
          this.totalPages = Math.ceil(response.total / this.pageSize);
          this.loading = false;
        },
        error: (err) => {
          this.error = 'Failed to load suggestions. Please try again later.';
          this.loading = false;
          console.error('Error loading suggestions:', err);
        }
      });
  }

  onPageChange(page: number) {
    this.currentPage = page;
    this.loadTopSuggestions();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  navigateToSuggest() {
    this.router.navigate(['/suggest']);
  }
} 