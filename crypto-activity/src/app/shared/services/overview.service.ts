import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OverviewService {

  constructor(private http: HttpClient) { }

  getOverviewData(form:any) {
    return this.http.post(environment.apiUrl + 'overview', form);
  }


}
