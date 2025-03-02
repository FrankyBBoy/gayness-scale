import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { VoteService, Vote, PaginatedVotes } from './vote.service';
import { environment } from '../../../environments/environment';

describe('VoteService', () => {
  let service: VoteService;
  let httpMock: HttpTestingController;
  const apiUrl = `${environment.apiUrl}/api/votes`;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [VoteService]
    });
    
    service = TestBed.inject(VoteService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should create a vote with correct winner and loser IDs', () => {
    const mockVote: Vote = {
      id: 1,
      winner_id: 2,
      loser_id: 3,
      user_id: 'user1',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    service.createVote(2, 3).subscribe(vote => {
      expect(vote).toEqual(mockVote);
    });
    
    const req = httpMock.expectOne(apiUrl);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual({
      winner_id: 2,
      loser_id: 3
    });
    req.flush(mockVote);
  });

  it('should get user votes with pagination', () => {
    const mockResponse: PaginatedVotes = {
      items: [
        {
          id: 1,
          winner_id: 2,
          loser_id: 3,
          user_id: 'user1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: 2,
          winner_id: 4,
          loser_id: 5,
          user_id: 'user1',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ],
      total: 2,
      page: 1,
      per_page: 10
    };
    
    service.getUserVotes('user1', 1, 10).subscribe(response => {
      expect(response).toEqual(mockResponse);
    });
    
    const req = httpMock.expectOne(`${apiUrl}/user/user1?page=1&per_page=10`);
    expect(req.request.method).toBe('GET');
    req.flush(mockResponse);
  });

  it('should get votes for a specific suggestion', () => {
    const mockVotes: Vote[] = [
      {
        id: 1,
        winner_id: 2,
        loser_id: 3,
        user_id: 'user1',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      },
      {
        id: 2,
        winner_id: 2,
        loser_id: 4,
        user_id: 'user2',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ];
    
    service.getSuggestionVotes(2).subscribe(votes => {
      expect(votes).toEqual(mockVotes);
    });
    
    const req = httpMock.expectOne(`${apiUrl}/suggestion/2`);
    expect(req.request.method).toBe('GET');
    req.flush(mockVotes);
  });
}); 