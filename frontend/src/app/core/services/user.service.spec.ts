import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { UserService, User } from './user.service';
import { AuthService } from './auth.service';
import { environment } from '../../../environments/environment';
import { of } from 'rxjs';

describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;
  let authServiceSpy: jasmine.SpyObj<AuthService>;
  const apiUrl = `${environment.api.serverUrl}/api/users`;

  const mockUser: User = {
    id: 'auth0|123456',
    email: 'user@example.com',
    daily_suggestions_count: 1,
    last_suggestion_date: new Date().toISOString(),
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  // Create a mock Auth0 user that matches the User interface
  const mockAuth0User: User = {
    id: 'auth0|123456',
    email: 'user@example.com',
    daily_suggestions_count: 0,
    last_suggestion_date: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  beforeEach(() => {
    const spy = jasmine.createSpyObj('AuthService', ['getUser']);
    
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [
        UserService,
        { provide: AuthService, useValue: spy }
      ]
    });
    
    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
    authServiceSpy = TestBed.inject(AuthService) as jasmine.SpyObj<AuthService>;
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should get current user and sync with backend', () => {
    authServiceSpy.getUser.and.returnValue(of(mockAuth0User));
    
    service.getCurrentUser().subscribe(user => {
      expect(user).toEqual(mockUser);
    });
    
    // First, it should call the sync endpoint
    const syncReq = httpMock.expectOne(`${apiUrl}/sync`);
    expect(syncReq.request.method).toBe('POST');
    expect(syncReq.request.body).toEqual({
      id: 'auth0|123456',
      email: 'user@example.com',
      name: 'user'
    });
    syncReq.flush(mockUser);
    
    // Then, it should get the user data
    const userReq = httpMock.expectOne(apiUrl);
    expect(userReq.request.method).toBe('GET');
    userReq.flush(mockUser);
  });

  it('should refresh user data', () => {
    service.refreshUserData().subscribe(user => {
      expect(user).toEqual(mockUser);
    });
    
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should get user by ID', () => {
    service.getUserById('auth0|123456').subscribe(user => {
      expect(user).toEqual(mockUser);
    });
    
    const req = httpMock.expectOne(`${apiUrl}/auth0|123456`);
    expect(req.request.method).toBe('GET');
    req.flush(mockUser);
  });

  it('should create or update user', () => {
    service.createOrUpdateUser('New Name').subscribe(user => {
      expect(user).toEqual(mockUser);
    });
    
    const req = httpMock.expectOne(`${apiUrl}/update`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({ name: 'New Name' });
    req.flush(mockUser);
  });

  it('should check if user can suggest', () => {
    // User with 1 suggestion (can suggest more)
    expect(service.canSuggest(mockUser)).toBeTrue();
    
    // User with max suggestions (cannot suggest more)
    const maxSuggestionsUser: User = {
      ...mockUser,
      daily_suggestions_count: 5
    };
    expect(service.canSuggest(maxSuggestionsUser)).toBeFalse();
  });

  it('should calculate remaining suggestions', () => {
    // User with 1 suggestion (4 remaining)
    expect(service.getRemainingSuggestions(mockUser)).toBe(4);
    
    // User with max suggestions (0 remaining)
    const maxSuggestionsUser: User = {
      ...mockUser,
      daily_suggestions_count: 5
    };
    expect(service.getRemainingSuggestions(maxSuggestionsUser)).toBe(0);
  });
}); 