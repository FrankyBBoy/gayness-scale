import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SuggestionService } from '../../core/services/suggestion.service';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-suggest',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './suggest.component.html',
  styleUrls: ['./suggest.component.css']
})
export class SuggestComponent {
  suggestionForm: FormGroup;
  loading = false;
  error: string | null = null;

  constructor(
    private fb: FormBuilder,
    private suggestionService: SuggestionService,
    private router: Router
  ) {
    this.suggestionForm = this.fb.group({
      description: ['', [Validators.required]]
    });
  }

  async onSubmit() {
    if (this.suggestionForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    const { description } = this.suggestionForm.value;
    
    this.suggestionService.createSuggestion(description).subscribe({
      next: () => {
        this.loading = false;
        this.router.navigate(['/profile']);
      },
      error: (err: HttpErrorResponse) => {
        console.error('Error creating suggestion:', err);
        
        if (err.status === 429) {
          this.error = 'You have reached your daily limit of 5 suggestions. Please try again tomorrow.';
        } else if (err.error && err.error.error) {
          // Si le backend renvoie un message d'erreur spécifique
          if (err.error.error.includes('Daily suggestion limit')) {
            this.error = 'You have reached your daily limit of 5 suggestions. Please try again tomorrow.';
          } else {
            this.error = err.error.error || 'Failed to create suggestion. Please try again later.';
          }
        } else {
          this.error = 'Failed to create suggestion. Please try again later.';
        }
        
        this.loading = false;
      }
    });
  }
} 