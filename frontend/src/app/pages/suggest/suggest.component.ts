import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SuggestionService } from '../../core/services/suggestion.service';

@Component({
  selector: 'app-suggest',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div class="px-4 py-6 sm:px-0">
        <div class="bg-white shadow sm:rounded-lg">
          <div class="px-4 py-5 sm:p-6">
            <h3 class="text-lg font-medium leading-6 text-gray-900">Add a New Suggestion</h3>
            <div class="mt-2 max-w-xl text-sm text-gray-500">
              <p>Submit your suggestion for others to vote on. Be creative and respectful!</p>
            </div>
            
            @if (error) {
              <div class="mt-4 bg-red-50 border-l-4 border-red-400 p-4">
                <div class="flex">
                  <div class="flex-shrink-0">
                    <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                    </svg>
                  </div>
                  <div class="ml-3">
                    <p class="text-sm text-red-700">{{ error }}</p>
                  </div>
                </div>
              </div>
            }

            <form [formGroup]="suggestionForm" (ngSubmit)="onSubmit()" class="mt-5">
              <div class="space-y-6">
                <div>
                  <label for="title" class="block text-sm font-medium text-gray-700">Title</label>
                  <div class="mt-1">
                    <input
                      type="text"
                      name="title"
                      id="title"
                      formControlName="title"
                      class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Enter a title for your suggestion"
                    >
                  </div>
                  @if (suggestionForm.get('title')?.errors?.['required'] && suggestionForm.get('title')?.touched) {
                    <p class="mt-2 text-sm text-red-600">Title is required</p>
                  }
                </div>

                <div>
                  <label for="description" class="block text-sm font-medium text-gray-700">Description</label>
                  <div class="mt-1">
                    <textarea
                      id="description"
                      name="description"
                      formControlName="description"
                      rows="3"
                      class="shadow-sm focus:ring-indigo-500 focus:border-indigo-500 block w-full sm:text-sm border-gray-300 rounded-md"
                      placeholder="Provide more details about your suggestion"
                    ></textarea>
                  </div>
                  @if (suggestionForm.get('description')?.errors?.['required'] && suggestionForm.get('description')?.touched) {
                    <p class="mt-2 text-sm text-red-600">Description is required</p>
                  }
                </div>

                <div class="flex justify-end">
                  <button
                    type="submit"
                    [disabled]="suggestionForm.invalid || loading"
                    class="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
                  >
                    @if (loading) {
                      <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Submitting...
                    } @else {
                      Submit Suggestion
                    }
                  </button>
                </div>
              </div>
            </form>
          </div>
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
      title: ['', [Validators.required, Validators.minLength(3)]],
      description: ['', [Validators.required, Validators.minLength(10)]]
    });
  }

  async onSubmit() {
    if (this.suggestionForm.invalid) return;

    try {
      this.loading = true;
      this.error = null;
      
      await this.suggestionService.createSuggestion({
        title: this.suggestionForm.get('title')?.value,
        description: this.suggestionForm.get('description')?.value
      });

      this.router.navigate(['/']);
    } catch (err: any) {
      this.error = err.message || 'Failed to submit suggestion. Please try again later.';
    } finally {
      this.loading = false;
    }
  }
} 