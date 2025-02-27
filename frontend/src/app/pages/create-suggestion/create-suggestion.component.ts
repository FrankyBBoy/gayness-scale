import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { SuggestionService } from '../../core/services/suggestion.service';

@Component({
  selector: 'app-create-suggestion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './create-suggestion.component.html',
  styleUrls: ['./create-suggestion.component.css']
})
export class CreateSuggestionComponent {
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

  onSubmit(): void {
    if (this.suggestionForm.invalid) {
      return;
    }

    this.loading = true;
    this.error = null;

    const { description } = this.suggestionForm.value;

    this.suggestionService.createSuggestion(description).subscribe({
      next: () => {
        this.router.navigate(['/profile']);
      },
      error: (err) => {
        this.error = 'Failed to create suggestion. Please try again later.';
        this.loading = false;
        console.error('Error creating suggestion:', err);
      }
    });
  }
} 