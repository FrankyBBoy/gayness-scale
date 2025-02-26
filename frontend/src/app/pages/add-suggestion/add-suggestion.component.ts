import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SuggestionService } from '../../core/services/suggestion.service';
import { UserService, User } from '../../core/services/user.service';

@Component({
  selector: 'app-add-suggestion',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './add-suggestion.component.html',
  styleUrls: ['./add-suggestion.component.css']
})
export class AddSuggestionComponent implements OnInit {
  suggestionForm: FormGroup;
  loading = false;
  error: string | null = null;
  currentUser: User | null = null;
  canSuggest = false;
  remainingSuggestions = 0;

  constructor(
    private fb: FormBuilder,
    private suggestionService: SuggestionService,
    private userService: UserService,
    private router: Router
  ) {
    this.suggestionForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(3), Validators.maxLength(100)]],
      description: ['', [Validators.maxLength(500)]]
    });
  }

  ngOnInit(): void {
    this.checkUserLimits();
  }

  private checkUserLimits(): void {
    this.loading = true;
    this.error = null;

    this.userService.getCurrentUser().subscribe({
      next: (user) => {
        this.currentUser = user;
        this.canSuggest = this.userService.canSuggestToday(user);
        this.remainingSuggestions = this.userService.getRemainingSuggestions(user);
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Failed to load user data. Please try again later.';
        this.loading = false;
        console.error('Error loading user data:', err);
      }
    });
  }

  onSubmit(): void {
    if (this.suggestionForm.invalid || !this.canSuggest || this.loading) {
      return;
    }

    this.loading = true;
    this.error = null;

    const formValue = this.suggestionForm.value;
    
    this.suggestionService.createSuggestion({
      title: formValue.title.trim(),
      description: formValue.description?.trim() || null
    }).subscribe({
      next: () => {
        // Redirect to home page after successful submission
        this.router.navigate(['/']);
      },
      error: (err) => {
        this.error = 'Failed to submit suggestion. Please try again later.';
        this.loading = false;
        console.error('Error submitting suggestion:', err);
      }
    });
  }

  // Form validation helpers
  get titleControl() {
    return this.suggestionForm.get('title');
  }

  get descriptionControl() {
    return this.suggestionForm.get('description');
  }

  get titleErrorMessage(): string {
    const control = this.titleControl;
    if (!control) return '';
    
    if (control.hasError('required')) {
      return 'Title is required';
    }
    if (control.hasError('minlength')) {
      return 'Title must be at least 3 characters long';
    }
    if (control.hasError('maxlength')) {
      return 'Title cannot exceed 100 characters';
    }
    return '';
  }

  get descriptionErrorMessage(): string {
    const control = this.descriptionControl;
    if (!control) return '';
    
    if (control.hasError('maxlength')) {
      return 'Description cannot exceed 500 characters';
    }
    return '';
  }
} 