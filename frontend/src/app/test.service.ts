import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TestService {
  private apiUrl = '/api';  // Use relative URL since frontend and backend are on same domain

  constructor(private http: HttpClient) { }

  getCategories(): Observable<any> {
    return this.http.get(`${this.apiUrl}/categories/`);
  }
}