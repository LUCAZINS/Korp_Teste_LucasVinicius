import { Component, OnInit } from '@angular/core';
import { FaturamentoService } from '../../services/faturamento.service';
import { EstoqueService } from '../../services/estoque.service';
import { NotaFiscal, Produto } from '../../models';

@Component({
  selector: 'app-dashboard',
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
})
export class DashboardComponent implements OnInit {
  notas: NotaFiscal[] = [];
  produtos: Produto[] = [];
  loading = false;
  error = '';

  totalNotas = 0;
  notasAbertas = 0;
  notasFechadas = 0;
  totalProdutos = 0;
  produtosComBaixoSaldo = 0;
  totalMovimentacao = 0;

  constructor(
    private faturamentoService: FaturamentoService,
    private estoqueService: EstoqueService
  ) { }

  ngOnInit(): void {
    this.carregarDados();
  }

  carregarDados(): void {
    this.loading = true;
    this.error = '';

    this.faturamentoService.obterTodasNotas().subscribe({
      next: (notas) => {
        this.notas = notas;
        this.calcularEstatisticasNotas();
        this.carregarProdutos();
      },
      error: (err) => {
        this.error = 'Erro ao carregar notas: ' + (err.message || 'Erro desconhecido');
        this.loading = false;
      }
    });
  }

  carregarProdutos(): void {
    this.estoqueService.obterTodosProdutos().subscribe({
      next: (produtos) => {
        this.produtos = produtos;
        this.calcularEstatisticasProdutos();
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar produtos: ' + (err.message || 'Erro desconhecido');
        this.loading = false;
      }
    });
  }

  calcularEstatisticasNotas(): void {
    this.totalNotas = this.notas.length;
    this.notasAbertas = this.notas.filter(n => n.status === 'Aberta').length;
    this.notasFechadas = this.notas.filter(n => n.status === 'Fechada').length;
  }

  calcularEstatisticasProdutos(): void {
    this.totalProdutos = this.produtos.length;
    this.produtosComBaixoSaldo = this.produtos.filter(p => p.saldo < 5).length;
    
    // Calcular movimentação total de estoque (quantidade usada em notas fechadas)
    this.totalMovimentacao = 0;
    this.notas
      .filter(n => n.status === 'Fechada')
      .forEach(nota => {
        nota.itens.forEach(item => {
          this.totalMovimentacao += item.quantidade;
        });
      });
  }

  obterProdutosComBaixoSaldo(): Produto[] {
    return this.produtos
      .filter(p => p.saldo < 5)
      .sort((a, b) => a.saldo - b.saldo)
      .slice(0, 5);
  }
}
