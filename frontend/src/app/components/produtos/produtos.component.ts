import { Component, OnInit } from '@angular/core';
import { EstoqueService } from '../../services/estoque.service';
import { RelatorioService } from '../../services/relatorio.service';
import { AuditoriaService } from '../../services/auditoria.service';
import { Produto } from '../../models';

@Component({
  selector: 'app-produtos',
  templateUrl: './produtos.component.html',
  styleUrls: ['./produtos.component.css']
})
export class ProdutosComponent implements OnInit {
  produtos: Produto[] = [];
  loading = false;
  error = '';
  showForm = false;
  editingId: number | null = null;

  filtroCodigo: string = '';
  filtroDescricao: string = '';
  filtroSaldo: string = '';

  // Paginação
  paginaAtual = 1;
  registrosPorPagina = 10;
  totalPaginas = 0;
  ordem: 'asc' | 'desc' = 'asc';
  ordenarPor: 'codigo' | 'descricao' | 'saldo' = 'codigo';

  form = {
    codigo: 0,
    descricao: '',
    saldo: 0
  };

  constructor(
    private estoqueService: EstoqueService,
    private relatorioService: RelatorioService,
    private auditoriaService: AuditoriaService
  ) { }

  ngOnInit(): void {
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.loading = true;
    this.error = '';
    this.estoqueService.obterTodosProdutos().subscribe({
      next: (data) => {
        this.produtos = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar produtos: ' + (err.message || 'Erro desconhecido');
        this.loading = false;
      }
    });
  }

  abrirFormulario(): void {
    this.showForm = true;
    this.editingId = null;
    this.form = { codigo: 0, descricao: '', saldo: 0 };
  }

  fecharFormulario(): void {
    this.showForm = false;
    this.form = { codigo: 0, descricao: '', saldo: 0 };
  }

  salvarProduto(): void {
    if (!this.form.descricao.trim()) {
      this.error = 'Descrição é obrigatória';
      return;
    }

    this.loading = true;
    this.error = '';

    const request = {
      codigo: this.form.codigo,
      descricao: this.form.descricao,
      saldo: this.form.saldo
    };

    if (this.editingId) {
      this.estoqueService.atualizarProduto(this.editingId, request).subscribe({
        next: () => {
          this.auditoriaService.registrar(
            'Atualizar Produto',
            `Produto ${this.form.descricao} atualizado (Código: ${this.form.codigo}, Saldo: ${this.form.saldo})`,
            'atualizar'
          );
          this.carregarProdutos();
          this.fecharFormulario();
        },
        error: (err) => {
          this.error = 'Erro ao atualizar produto: ' + (err.message || 'Erro desconhecido');
          this.auditoriaService.registrar(
            'Atualizar Produto - Erro',
            `Falha ao atualizar ${this.form.descricao}: ${this.error}`,
            'outro'
          );
          this.loading = false;
        }
      });
    } else {
      this.estoqueService.criarProduto(request).subscribe({
        next: () => {
          this.auditoriaService.registrar(
            'Criar Produto',
            `Novo produto ${this.form.descricao} criado (Código: ${this.form.codigo}, Saldo: ${this.form.saldo})`,
            'criar'
          );
          this.carregarProdutos();
          this.fecharFormulario();
        },
        error: (err) => {
          this.error = 'Erro ao criar produto: ' + (err.message || 'Erro desconhecido');
          this.auditoriaService.registrar(
            'Criar Produto - Erro',
            `Falha ao criar ${this.form.descricao}: ${this.error}`,
            'outro'
          );
          this.loading = false;
        }
      });
    }
  }

  editarProduto(produto: Produto): void {
    this.editingId = produto.id;
    this.form = { ...produto };
    this.showForm = true;
  }

  deletarProduto(id: number): void {
    const produto = this.produtos.find(p => p.id === id);
    if (!confirm('Tem certeza que deseja deletar este produto?')) {
      return;
    }

    this.loading = true;
    this.error = '';
    this.estoqueService.deletarProduto(id).subscribe({
      next: () => {
        this.auditoriaService.registrar(
          'Deletar Produto',
          `Produto ${produto?.descricao} deletado`,
          'deletar'
        );
        this.carregarProdutos();
      },
      error: (err) => {
        this.error = 'Erro ao deletar produto: ' + (err.message || 'Erro desconhecido');
        this.auditoriaService.registrar(
          'Deletar Produto - Erro',
          `Falha ao deletar ${produto?.descricao}: ${this.error}`,
          'outro'
        );
        this.loading = false;
      }
    });
  }

  get produtosFiltrados(): Produto[] {
    let filtrados = this.produtos;

    if (this.filtroCodigo) {
      filtrados = filtrados.filter(p =>
        p.codigo.toString().includes(this.filtroCodigo)
      );
    }

    if (this.filtroDescricao) {
      filtrados = filtrados.filter(p =>
        p.descricao.toLowerCase().includes(this.filtroDescricao.toLowerCase())
      );
    }

    if (this.filtroSaldo) {
      const saldoMin = parseInt(this.filtroSaldo);
      filtrados = filtrados.filter(p => p.saldo <= saldoMin);
    }

    // Aplicar ordenação
    filtrados = filtrados.sort((a, b) => {
      let valA: any, valB: any;

      if (this.ordenarPor === 'codigo') {
        valA = a.codigo;
        valB = b.codigo;
      } else if (this.ordenarPor === 'descricao') {
        valA = a.descricao.toLowerCase();
        valB = b.descricao.toLowerCase();
      } else {
        valA = a.saldo;
        valB = b.saldo;
      }

      if (this.ordem === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });

    // Paginação
    this.totalPaginas = Math.ceil(filtrados.length / this.registrosPorPagina);
    if (this.paginaAtual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaAtual = this.totalPaginas;
    }
    const inicio = (this.paginaAtual - 1) * this.registrosPorPagina;
    const fim = inicio + this.registrosPorPagina;

    return filtrados.slice(inicio, fim);
  }

  limparFiltros(): void {
    this.filtroCodigo = '';
    this.filtroDescricao = '';
    this.filtroSaldo = '';
  }

  mudarOrdenacao(campo: 'codigo' | 'descricao' | 'saldo'): void {
    if (this.ordenarPor === campo) {
      this.ordem = this.ordem === 'asc' ? 'desc' : 'asc';
    } else {
      this.ordenarPor = campo;
      this.ordem = 'asc';
    }
    this.paginaAtual = 1;
  }

  irParaPagina(pagina: number): void {
    if (pagina >= 1 && pagina <= this.totalPaginas) {
      this.paginaAtual = pagina;
    }
  }

  exportarProdutos(): void {
    this.relatorioService.exportarProdutosCSV(this.produtos, `produtos-${new Date().toISOString().split('T')[0]}.csv`);
  }
}
