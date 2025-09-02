import { Injectable } from '@angular/core';
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from './auth.service';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  
  constructor(private authService: AuthService) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    // Get the auth token
    const token = this.authService.getAuthToken();
    
    // If we have a token, add it to the request
    if (token) {
      const authReq = req.clone({
        setHeaders: {
          Authorization: `Token ${token}`
        }
      });
      return next.handle(authReq);
    }
    
    // If no token, proceed with original request
    return next.handle(req);
  }
}