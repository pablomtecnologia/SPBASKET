import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { tap, map, catchError } from 'rxjs/operators';

interface User {
  id?: number;
  username: string;
  email: string;
  nombre?: string;
  apellidos?: string;
  rol?: string;
  licencia?: string;
  foto?: string;
  avatar?: string; // New
  telefono?: string; // New
  token?: string; // JWT
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject: BehaviorSubject<User | null>;
  public currentUser: Observable<User | null>;

  private apiUrl = 'https://common-lions-grab.loca.lt/api'; // backend URL

  constructor(private http: HttpClient) {
    const stored = localStorage.getItem('currentUser');
    this.currentUserSubject = new BehaviorSubject<User | null>(
      stored ? JSON.parse(stored) : null
    );
    this.currentUser = this.currentUserSubject.asObservable();
  }

  /** Login against backend, returns observable emitting true on success */
  login(username: string, password: string): Observable<boolean> {
    return this.http
      .post<any>(
        `${this.apiUrl}/login`,
        { username, password }
      )
      .pipe(
        tap(res => {
          const user: User = {
            id: res.id,
            username: res.username,
            email: res.email,
            token: res.token,
            nombre: res.nombre,
            apellidos: res.apellidos,
            rol: res.rol,
            licencia: res.licencia,
            foto: res.foto
          };
          localStorage.setItem('currentUser', JSON.stringify(user));
          this.currentUserSubject.next(user);
        }),
        map(() => true),
        catchError((error) => {
          console.error('Login error:', error);
          return of(false);
        })
      );
  }

  logout(): void {
    localStorage.removeItem('currentUser');
    this.currentUserSubject.next(null);
  }

  /** Simple check: token exists */
  isAuthenticated(): boolean {
    const user = this.currentUserValue;
    return !!user?.token;
  }

  /** Check if current user is admin */
  isAdmin(): boolean {
    const user = this.currentUserValue;
    return user?.rol === 'admin';
  }

  /** Helper to get auth headers for protected calls */
  getAuthHeaders(): HttpHeaders {
    const token = this.currentUserValue?.token ?? '';
    return new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'Bypass-Tunnel-Reminder': 'true'
    });
  }

  get currentUserValue(): User | null {
    return this.currentUserSubject.value;
  }

  updateCurrentUser(user: User) {
    // Mantener el token actual si el user viene sin token (normal en updateProfile)
    const currentUser = this.currentUserSubject.value;
    if (currentUser?.token && !user.token) {
      user.token = currentUser.token;
    }
    localStorage.setItem('currentUser', JSON.stringify(user));
    this.currentUserSubject.next(user);
  }
}
