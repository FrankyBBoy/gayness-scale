import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { SuggestionService, Suggestion, PaginatedSuggestions } from './suggestion.service';
import { UserService } from './user.service';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';
import { User } from './user.service';

describe('SuggestionService', () => {
  let service: SuggestionService;
  let httpMock: HttpTestingController;
  let userServiceSpy: jasmine.SpyObj<UserService>;
  const apiUrl = `${environment.apiUrl}/api/suggestions`;

  beforeEach(() => {
    const spy = jasmine.createSpyObj('UserService', ['refreshUserData']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        SuggestionService,
        { provide: UserService, useValue: spy }
      ]
    });
    
    service = TestBed.inject(SuggestionService);
    httpMock = TestBed.inject(HttpTestingController);
    userServiceSpy = TestBed.inject(UserService) as jasmine.SpyObj<UserService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a suggestion and refresh user data', () => {
    const mockSuggestion: Suggestion = {
      id: 1,
      description: 'Test suggestion',
      user_id: 'user1',
      elo_score: 1500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const mockUser: User = {
      id: 'user1',
      email: 'user@example.com',
      daily_votes_count: 0,
      daily_suggestions_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    userServiceSpy.refreshUserData.and.returnValue(of(mockUser));
    
    service.createSuggestion('Test suggestion').subscribe(suggestion => {
      expect(suggestion).toEqual(mockSuggestion);
    });
    
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ description: 'Test suggestion' });
    req.flush(mockSuggestion);
    
    expect(userServiceSpy.refreshUserData).toHaveBeenCalled();
  });

  it('should get paginated suggestions', () => {
    const mockResponse: PaginatedSuggestions = {
      items: [
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
          elo_score: 1520,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      total: 2,
      page: 1,
      per_page: 10
    };
    
    service.getSuggestions(1, 10).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
    
    const req = httpMock.expectOne(`${apiUrl}?page=1&per_page=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get top suggestions by ELO score', () => {
    const mockResponse: PaginatedSuggestions = {
      items: [
        {
          id: 2,
          description: 'Suggestion 2',
          user_id: 'user2',
          elo_score: 1600,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 1,
          description: 'Suggestion 1',
          user_id: 'user1',
          elo_score: 1550,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      total: 2,
      page: 1,
      per_page: 10
    };
    
    service.getTopSuggestionsByElo(1, 10).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
    
    const req = httpMock.expectOne(`${apiUrl}?page=1&per_page=10&sort_by=elo_score&sort_order=desc`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get a random pair of suggestions', () => {
    const mockSuggestion1: Suggestion = {
      id: 1,
      description: 'Suggestion 1',
      user_id: 'user1',
      elo_score: 1500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const mockSuggestion2: Suggestion = {
      id: 2,
      description: 'Suggestion 2',
      user_id: 'user2',
      elo_score: 1500,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const mockPair = {
      pair: [mockSuggestion1, mockSuggestion2] as [Suggestion, Suggestion]
    };
    
    service.getRandomPair().subscribe(response => {
      expect(response).toEqual(mockPair);
    });
    
    const req = httpMock.expectOne(`${apiUrl}/random-pair`);
    expect(req.request.method).toBe('GET');
    req.flush(mockPair);
  });
}); 