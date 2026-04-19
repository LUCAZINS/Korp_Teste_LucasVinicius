import { Injectable } from '@angular/core';

export interface LogEntrada {
  id: string;
  timestamp: Date;
  operacao: string;
  descricao: string;
  tipo: 'criar' | 'atualizar' | 'deletar' | 'imprimir' | 'outro';
}

@Injectable({
  providedIn: 'root'
})
export class AuditoriaService {
  private logs: LogEntrada[] = [];
  private readonly maxLogs = 1000;

  constructor() {
    this.carregarLogs();
  }

  registrar(operacao: string, descricao: string, tipo: 'criar' | 'atualizar' | 'deletar' | 'imprimir' | 'outro' = 'outro'): void {
    const log: LogEntrada = {
      id: this.gerarId(),
      timestamp: new Date(),
      operacao,
      descricao,
      tipo
    };

    this.logs.unshift(log);

    // Manter apenas os últimos N registros
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(0, this.maxLogs);
    }

    this.salvarLogs();
  }

  obterLogs(filtroTipo?: string): LogEntrada[] {
    if (filtroTipo) {
      return this.logs.filter(log => log.tipo === filtroTipo);
    }
    return [...this.logs];
  }

  obterLogsRecentes(quantidade: number = 50): LogEntrada[] {
    return this.logs.slice(0, quantidade);
  }

  limparLogs(): void {
    this.logs = [];
    this.salvarLogs();
  }

  private salvarLogs(): void {
    try {
      localStorage.setItem('auditoria_logs', JSON.stringify(this.logs));
    } catch (e) {
      console.error('Erro ao salvar logs:', e);
    }
  }

  private carregarLogs(): void {
    try {
      const logsJSON = localStorage.getItem('auditoria_logs');
      if (logsJSON) {
        this.logs = JSON.parse(logsJSON).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (e) {
      console.error('Erro ao carregar logs:', e);
      this.logs = [];
    }
  }

  private gerarId(): string {
    return Date.now().toString(36) + Math.random().toString(36).substr(2);
  }
}
