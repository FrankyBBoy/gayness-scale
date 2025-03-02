import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { ApiService } from './api.service';
import { environment } from '../../../environments/environment';

describe('ApiService', () => {
  let service: ApiService;
  let httpMock: HttpTestingController;
  const apiUrl = environment.api.serverUrl;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [ApiService]
    });
    service = TestBed.inject(ApiService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should perform GET request with correct URL and parameters', () => {
    const testData = { id: 1, name: 'Test' };
    const testParams = { page: '1', limit: '10' };

    service.get('/test', testParams).subscribe(data => {
      expect(data).toEqual(testData);
    });

    const req = httpMock.expectOne(`${apiUrl}/test?page=1&limit=10`);
    expect(req.request.method).toBe('GET');
    req.flush(testData);
  });

  it('should perform POST request with correct URL and body', () => {
    const testData = { id: 1, name: 'Test' };
    const testBody = { name: 'Test' };

    service.post('/test', testBody).subscribe(data => {
      expect(data).toEqual(testData);
    });

    const req = httpMock.expectOne(`${apiUrl}/test`);
    expect(req.request.method).toBe('POST');
    expect(req.request.body).toEqual(testBody);
    req.flush(testData);
  });

  it('should perform PUT request with correct URL and body', () => {
    const testData = { id: 1, name: 'Updated Test' };
    const testBody = { name: 'Updated Test' };

    service.put('/test/1', testBody).subscribe(data => {
      expect(data).toEqual(testData);
    });

    const req = httpMock.expectOne(`${apiUrl}/test/1`);
    expect(req.request.method).toBe('PUT');
    expect(req.request.body).toEqual(testBody);
    req.flush(testData);
  });

  it('should perform DELETE request with correct URL', () => {
    const testData = { success: true };

    service.delete('/test/1').subscribe(data => {
      expect(data).toEqual(testData);
    });

    const req = httpMock.expectOne(`${apiUrl}/test/1`);
    expect(req.request.method).toBe('DELETE');
    req.flush(testData);
  });
});
