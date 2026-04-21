import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NotaFiscal, CriarNotaFiscalRequest } from '../models';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FaturamentoService {
  private apiUrl = `${environment.faturamentoApiUrl}/api/notasfiscais`;

  constructor(private http: HttpClient) { }

  obterTodasNotas(): Observable<NotaFiscal[]> {
    return this.http.get<NotaFiscal[]>(this.apiUrl);
  }

  obterNotaPorId(id: number): Observable<NotaFiscal> {
    return this.http.get<NotaFiscal>(`${this.apiUrl}/${id}`);
  }

  criarNotaFiscal(request: CriarNotaFiscalRequest): Observable<NotaFiscal> {
    return this.http.post<NotaFiscal>(this.apiUrl, request);
  }

  imprimirNotaFiscal(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/${id}/imprimir`, {});
  }

  deletarNotaFiscal(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
}
