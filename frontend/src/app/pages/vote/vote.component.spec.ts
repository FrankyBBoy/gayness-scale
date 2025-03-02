import { ComponentFixture, TestBed } from '@angular/core/testing';
import { VoteComponent } from './vote.component';
import { VoteService, Vote } from '../../core/services/vote.service';
import { SuggestionService, Suggestion } from '../../core/services/suggestion.service';
import { UserService } from '../../core/services/user.service';
import { AuthService } from '../../core/services/auth.service';
import { Router } from '@angular/router';
import { of, throwError } from 'rxjs';
import { HttpErrorResponse } from '@angular/common/http';
import { NO_ERRORS_SCHEMA } from '@angular/core';

describe('VoteComponent', () => {
  let component: VoteComponent;
  let fixture: ComponentFixture<VoteComponent>;
  let suggestionServiceSpy: jasmine.SpyObj<SuggestionService>;
  let voteServiceSpy: jasmine.SpyObj<VoteService>;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  let routerSpy: jasmine.SpyObj<Router>;

  const mockSuggestions: Suggestion[] = [
    {
      id: 1,
      description: 'Suggestion 1',
      user_id: 'user1',
      elo_score: 1500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      description: 'Suggestion 2',
      user_id: 'user2',
      elo_score: 1500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ];

  const mockVote: Vote = {
    id: 1,
    winner_id: 1,
    loser_id: 2,
    user_id: 'user1',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(async () => {
    const suggestionSpy = jasmine.createSpyObj('SuggestionService', ['getRandomPair']);
    const voteSpy = jasmine.createSpyObj('VoteService', ['createVote']);
    const userSpy = jasmine.createSpyObj('UserService', ['getCurrentUser']);
    const authSpy = jasmine.createSpyObj('AuthService', ['login']);
    const routerSpyObj = jasmine.createSpyObj('Router', ['navigate']);

    await TestBed.configureTestingModule({
      imports: [VoteComponent],
      providers: [
        { provide: SuggestionService, useValue: suggestionSpy },
        { provide: VoteService, useValue: voteSpy },
        { provide: UserService, useValue: userSpy },
        { provide: AuthService, useValue: authSpy },
        { provide: Router, useValue: routerSpyObj }
      ],
      schemas: [NO_ERRORS_SCHEMA] // Ignore unknown elements and attributes
    }).compileComponents();

    suggestionServiceSpy = TestBed.inject(SuggestionService) as jasmine.SpyObj<SuggestionService>;
    voteServiceSpy = TestBed.inject(VoteService) as jasmine.SpyObj<VoteService>;
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
    routerSpy = TestBed.inject(Router) as jasmine.SpyObj<Router>;
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(VoteComponent);
    component = fixture.componentInstance;
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should load random pair on init', () => {
    suggestionServiceSpy.getRandomPair.and.returnValue(of({ pair: [mockSuggestions[0], mockSuggestions[1]] as [Suggestion, Suggestion] }));
    
    fixture.detectChanges(); // Triggers ngOnInit
    
    expect(suggestionServiceSpy.getRandomPair).toHaveBeenCalled();
    expect(component.leftSuggestion).toEqual(mockSuggestions[0]);
    expect(component.rightSuggestion).toEqual(mockSuggestions[1]);
    expect(component.loading).toBeFalse();
    expect(component.error).toBeNull();
  });

  it('should handle error when loading random pair', () => {
    const errorResponse = new HttpErrorResponse({
      error: { message: 'No more suggestions to vote on' },
      status: 404,
      statusText: 'Not Found'
    });
    
    suggestionServiceSpy.getRandomPair.and.returnValue(throwError(() => errorResponse));
    
    fixture.detectChanges(); // Triggers ngOnInit
    
    expect(suggestionServiceSpy.getRandomPair).toHaveBeenCalled();
    expect(component.loading).toBeFalse();
    expect(component.error).toBe('NO_MORE_SUGGESTIONS');
  });

  it('should submit vote and load new pair', () => {
    // Setup initial state
    component.leftSuggestion = mockSuggestions[0];
    component.rightSuggestion = mockSuggestions[1];
    component.loading = false;
    
    // Mock vote service response
    voteServiceSpy.createVote.and.returnValue(of(mockVote));
    
    // Mock next pair to be loaded
    const nextPair = [
      { ...mockSuggestions[0], id: 3 },
      { ...mockSuggestions[1], id: 4 }
    ];
    suggestionServiceSpy.getRandomPair.and.returnValue(of({ pair: nextPair as [Suggestion, Suggestion] }));
    
    // Vote for left suggestion
    component.vote(mockSuggestions[0], mockSuggestions[1]);
    
    // Verify vote was submitted
    expect(voteServiceSpy.createVote).toHaveBeenCalledWith(mockSuggestions[0].id, mockSuggestions[1].id);
    
    // Verify new pair was loaded
    expect(suggestionServiceSpy.getRandomPair).toHaveBeenCalled();
  });

  it('should skip current pair and load new pair', () => {
    // Setup initial state
    component.leftSuggestion = mockSuggestions[0];
    component.rightSuggestion = mockSuggestions[1];
    component.loading = false;
    
    // Mock next pair to be loaded
    const nextPair = [
      { ...mockSuggestions[0], id: 3 },
      { ...mockSuggestions[1], id: 4 }
    ];
    suggestionServiceSpy.getRandomPair.and.returnValue(of({ pair: nextPair as [Suggestion, Suggestion] }));
    
    // Skip current pair
    component.skipPair();
    
    // Verify new pair was loaded
    expect(suggestionServiceSpy.getRandomPair).toHaveBeenCalled();
  });

  it('should navigate to suggest page', () => {
    component.navigateToSuggest();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/suggest']);
  });
}); 