import { Injectable } from '@angular/core';
import { NotaFiscal, Produto } from '../models';

@Injectable({
  providedIn: 'root'
})
export class RelatorioService {

  constructor() { }

  exportarNotasCSV(notas: NotaFiscal[], nomeArquivo: string = 'notas-fiscais.csv'): void {
    const headers = ['ID', 'Número', 'Status', 'Data Criação', 'Total de Itens'];
    const rows: any[] = [];

    notas.forEach(nota => {
      rows.push([
        nota.id,
        nota.numeroSequencial,
        nota.status,
        new Date(nota.dataCriacao).toLocaleString('pt-BR'),
        nota.itens.length
      ]);
    });

    this.gerarCSV(headers, rows, nomeArquivo);
  }

  exportarProdutosCSV(produtos: Produto[], nomeArquivo: string = 'produtos.csv'): void {
    const headers = ['ID', 'Código', 'Descrição', 'Saldo'];
    const rows: any[] = [];

    produtos.forEach(produto => {
      rows.push([
        produto.id,
        produto.codigo,
        produto.descricao,
        produto.saldo
      ]);
    });

    this.gerarCSV(headers, rows, nomeArquivo);
  }

  exportarRelatorioCompleto(notas: NotaFiscal[], produtos: Produto[], nomeArquivo: string = 'relatorio-completo.csv'): void {
    let conteudo = '';

    // Seção de Notas Fiscais
    conteudo += 'NOTAS FISCAIS\n';
    const headersNotas = ['ID', 'Número', 'Status', 'Data Criação', 'Total de Itens'];
    conteudo += headersNotas.join(',') + '\n';

    notas.forEach(nota => {
      const row = [
        nota.id,
        nota.numeroSequencial,
        nota.status,
        new Date(nota.dataCriacao).toLocaleString('pt-BR'),
        nota.itens.length
      ];
      conteudo += this.escaparCSV(row.map(x => x.toString())) + '\n';
    });

    conteudo += '\n\nPRODUTOS\n';
    const headersProdutos = ['ID', 'Código', 'Descrição', 'Saldo'];
    conteudo += headersProdutos.join(',') + '\n';

    produtos.forEach(produto => {
      const row = [
        produto.id,
        produto.codigo,
        produto.descricao,
        produto.saldo
      ];
      conteudo += this.escaparCSV(row.map(x => x.toString())) + '\n';
    });

    this.downloadCSV(conteudo, nomeArquivo);
  }

  private gerarCSV(headers: string[], rows: any[], nomeArquivo: string): void {
    let conteudo = headers.join(',') + '\n';

    rows.forEach(row => {
      conteudo += this.escaparCSV(row.map((x: any) => x.toString())) + '\n';
    });

    this.downloadCSV(conteudo, nomeArquivo);
  }

  private escaparCSV(campos: string[]): string {
    return campos.map(campo => {
      if (campo.includes(',') || campo.includes('"') || campo.includes('\n')) {
        return `"${campo.replace(/"/g, '""')}"`;
      }
      return campo;
    }).join(',');
  }

  private downloadCSV(conteudo: string, nomeArquivo: string): void {
    const blob = new Blob([conteudo], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', nomeArquivo);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
