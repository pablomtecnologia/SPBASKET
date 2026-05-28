import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class VisitService {
    private apiUrl = environment.apiUrl;

    constructor(private http: HttpClient) { }

    recordVisit(path: string, userId?: number): Observable<any> {
        return this.http.post(`${this.apiUrl}/visits`, { path, userId });
    }

    getVisitsCount(): Observable<{ total: number }> {
        return this.http.get<{ total: number }>(`${this.apiUrl}/visits/count`);
    }
}
