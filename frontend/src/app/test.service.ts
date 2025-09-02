import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private apiUrl = this.getApiUrl();

  constructor(private http: HttpClient) { }

  private getApiUrl(): string {
    // Check if we're running locally (localhost:4200 or localhost:80) 
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      return 'http://localhost:8000/api';  // Local development
    }
    return '/api';  // Production (Railway) - same domain
  }

  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories/`);
  }
}