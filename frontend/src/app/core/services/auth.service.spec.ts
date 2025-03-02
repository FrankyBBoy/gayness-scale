import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { of } from 'rxjs';

describe('AuthService', () => {
  let service: AuthService;
  let auth0ServiceMock: any;

  beforeEach(() => {
    auth0ServiceMock = {
      isAuthenticated$: of(true),
      user$: of({
        sub: 'auth0|123456',
        email: 'user@example.com',
        name: 'Test User'
      }),
      loginWithRedirect: jasmine.createSpy('loginWithRedirect'),
      logout: jasmine.createSpy('logout'),
      getAccessTokenSilently: jasmine.createSpy('getAccessTokenSilently')
    };

    TestBed.configureTestingModule({
      providers: [
        AuthService,
        { provide: Auth0Service, useValue: auth0ServiceMock }
      ]
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should check if user is authenticated', () => {
    service.isAuthenticated().subscribe(isAuthenticated => {
      expect(isAuthenticated).toBeTrue();
    });
  });

  it('should get user data', () => {
    service.getUser().subscribe(user => {
      expect(user).toBeTruthy();
      expect(user?.id).toBe('auth0|123456');
      expect(user?.email).toBe('user@example.com');
    });
  });

  it('should call loginWithRedirect when login is called', () => {
    auth0ServiceMock.loginWithRedirect.and.returnValue(Promise.resolve());
    
    service.login().subscribe();
    
    expect(auth0ServiceMock.loginWithRedirect).toHaveBeenCalled();
  });

  it('should call logout when logout is called', () => {
    auth0ServiceMock.logout.and.returnValue(Promise.resolve());
    
    service.logout().subscribe();
    
    expect(auth0ServiceMock.logout).toHaveBeenCalled();
  });

  it('should get access token', () => {
    auth0ServiceMock.getAccessTokenSilently.and.returnValue(Promise.resolve('test-token'));
    
    service.getAccessToken().subscribe(token => {
      expect(token).toBe('test-token');
    });
    
    expect(auth0ServiceMock.getAccessTokenSilently).toHaveBeenCalled();
  });
});
