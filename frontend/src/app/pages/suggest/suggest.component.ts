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
  template: `
    <div class="min-h-screen bg-gray-50 py-12">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="max-w-3xl mx-auto">
          <h1 class="text-3xl font-bold text-gray-900 mb-8">Submit a New Suggestion</h1>

          @if (error) {
            <div class="bg-red-50 border-l-4 border-red-400 p-4 mb-6">
              <div class="flex">
                <div class="flex-shrink-0">
                  <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                  </svg>
                </div>
                <div class="ml-3">
                  <p class="text-sm text-red-700">{{ error }}</p>
                </div>
              </div>
            </div>
          }

          <form [formGroup]="suggestionForm" (ngSubmit)="onSubmit()" class="space-y-6 bg-white shadow px-4 py-5 sm:rounded-lg sm:p-6">
            <div>
              <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
              <div class="mt-1">
                <textarea
                  id="description"
                  formControlName="description"
                  rows="4"
                  class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter your suggestion here..."
                ></textarea>
                @if (suggestionForm.get('description')?.errors?.['required'] && suggestionForm.get('description')?.touched) {
                  <p class="mt-2 text-sm text-red-600">Description is required</p>
                }
              </div>
            </div>

            <div class="flex justify-end">
              <button
                type="submit"
                [disabled]="suggestionForm.invalid || loading"
                class="inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                @if (loading) {
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Submitting...
                } @else {
                  Submit
                }
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
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