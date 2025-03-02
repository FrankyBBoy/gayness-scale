import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { RouterTestingModule } from '@angular/router/testing';
import { NavbarComponent } from './layout/navbar/navbar.component';
import { FooterComponent } from './layout/footer/footer.component';
import { NO_ERRORS_SCHEMA } from '@angular/core';
import { AuthService as Auth0Service } from '@auth0/auth0-angular';
import { of } from 'rxjs';

describe('AppComponent', () => {
  beforeEach(async () => {
    const auth0ServiceMock = {
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

    await TestBed.configureTestingModule({
      imports: [
        AppComponent,
        RouterTestingModule
      ],
      providers: [
        { provide: Auth0Service, useValue: auth0ServiceMock }
      ],
      schemas: [NO_ERRORS_SCHEMA] // To ignore custom elements like app-navbar
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });
});
