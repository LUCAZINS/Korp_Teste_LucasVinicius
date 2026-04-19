import { Component, OnInit } from '@angular/core';
import { AuditoriaService, LogEntrada } from '../../services/auditoria.service';

@Component({
  selector: 'app-auditoria',
  templateUrl: './auditoria.component.html',
  styleUrls: ['./auditoria.component.css']
})
export class AuditoriaComponent implements OnInit {
  logs: LogEntrada[] = [];
  filtroTipo: string = '';
  paginaAtual = 1;
  registrosPorPagina = 20;
  totalPaginas = 0;

  constructor(private auditoriaService: AuditoriaService) { }

  ngOnInit(): void {
    this.carregarLogs();
  }

  carregarLogs(): void {
    this.logs = this.auditoriaService.obterLogs();
    this.calcularPaginacao();
  }

  get logsFiltrados(): LogEntrada[] {
    let filtrados = this.logs;

    if (this.filtroTipo && this.filtroTipo !== '') {
      filtrados = filtrados.filter(log => log.tipo === this.filtroTipo);
    }

    // Paginação
    this.totalPaginas = Math.ceil(filtrados.length / this.registrosPorPagina);
    if (this.paginaAtual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaAtual = this.totalPaginas;
    }
    const inicio = (this.paginaAtual - 1) * this.registrosPorPagina;
    const fim = inicio + this.registrosPorPagina;

    return filtrados.slice(inicio, fim);
  }

  calcularPaginacao(): void {
    this.totalPaginas = Math.ceil(this.logs.length / this.registrosPorPagina);
  }

  obterCorTipo(tipo: string): string {
    switch (tipo) {
      case 'criar':
        return '#28a745';
      case 'atualizar':
        return '#17a2b8';
      case 'deletar':
        return '#dc3545';
      case 'imprimir':
        return '#007bff';
      default:
        return '#6c757d';
    }
  }

  obterEmojiTipo(tipo: string): string {
    switch (tipo) {
      case 'criar':
        return '➕';
      case 'atualizar':
        return '✏️';
      case 'deletar':
        return '🗑️';
      case 'imprimir':
        return '🖨️';
      default:
        return '📝';
    }
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaAtual = pagina;
    }
  }

  limparLogs(): void {
    if (confirm('Tem certeza que deseja limpar todo o histórico de auditoria?')) {
      this.auditoriaService.limparLogs();
      this.carregarLogs();
    }
  }
}
