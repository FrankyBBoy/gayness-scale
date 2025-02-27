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
      topSuggestions: this.suggestionService.getSuggestions(this.currentPage, this.pageSize),
      latestSuggestions: this.suggestionService.getLatestSuggestions(10)
    }).subscribe({
      next: (results) => {
        // Trier les suggestions par score ELO décroissant
        this.suggestions = results.topSuggestions.items.sort((a, b) => b.elo_score - a.elo_score);
        this.latestSuggestions = results.latestSuggestions;
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

  loadSuggestions() {
    this.loading = true;
    this.error = null;

    this.suggestionService.getSuggestions(this.currentPage, this.pageSize)
      .subscribe({
        next: (response) => {
          this.suggestions = response.items.sort((a, b) => b.elo_score - a.elo_score);
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
    this.loadSuggestions();
  }

  get pages(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  navigateToSuggest() {
    this.router.navigate(['/suggest']);
  }
} 