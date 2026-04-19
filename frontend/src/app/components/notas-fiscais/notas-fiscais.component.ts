import { Component, OnInit } from '@angular/core';
import { FaturamentoService } from '../../services/faturamento.service';
import { EstoqueService } from '../../services/estoque.service';
import { RelatorioService } from '../../services/relatorio.service';
import { AuditoriaService } from '../../services/auditoria.service';
import { NotaFiscal, Produto, CriarNotaFiscalItemRequest } from '../../models';

@Component({
  selector: 'app-notas-fiscais',
  templateUrl: './notas-fiscais.component.html',
  styleUrls: ['./notas-fiscais.component.css']
})
export class NotasFiscaisComponent implements OnInit {
  notas: NotaFiscal[] = [];
  produtos: Produto[] = [];
  loading = false;
  imprimindo = false;
  error = '';
  success = '';
  showForm = false;
  mostrarApenasAbertas = true;

  itens: CriarNotaFiscalItemRequest[] = [];
  produtoSelecionado: Produto | null = null;
  quantidadeSelecionada = 0;
  idempotencyKey: string = this.gerarUUID();

  filtroNumero: string = '';
  filtroStatus: string = '';
  filtroData: string = '';

  // Paginação
  paginaAtual = 1;
  registrosPorPagina = 10;
  ordem: 'asc' | 'desc' = 'desc';
  ordenarPor: 'numero' | 'status' | 'data' = 'data';

  get notasAbertas(): NotaFiscal[] {
    let notas = this.mostrarApenasAbertas 
      ? this.notas.filter(nota => nota.status === 'Aberta')
      : this.notas;

    // Aplicar filtros
    if (this.filtroNumero) {
      notas = notas.filter(nota => 
        nota.numeroSequencial.toString().includes(this.filtroNumero)
      );
    }

    if (this.filtroStatus && this.filtroStatus !== '') {
      notas = notas.filter(nota => nota.status === this.filtroStatus);
    }

    if (this.filtroData) {
      notas = notas.filter(nota => 
        nota.dataCriacao.split('T')[0] === this.filtroData
      );
    }

    // Aplicar ordenação
    notas = notas.sort((a, b) => {
      let valA: any, valB: any;

      if (this.ordenarPor === 'numero') {
        valA = a.numeroSequencial;
        valB = b.numeroSequencial;
      } else if (this.ordenarPor === 'status') {
        valA = a.status;
        valB = b.status;
      } else {
        valA = new Date(a.dataCriacao).getTime();
        valB = new Date(b.dataCriacao).getTime();
      }

      if (this.ordem === 'asc') {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });

    // Paginação
    this.totalPaginas = Math.ceil(notas.length / this.registrosPorPagina);
    if (this.paginaAtual > this.totalPaginas && this.totalPaginas > 0) {
      this.paginaAtual = this.totalPaginas;
    }
    const inicio = (this.paginaAtual - 1) * this.registrosPorPagina;
    const fim = inicio + this.registrosPorPagina;

    return notas.slice(inicio, fim);
  }

  totalPaginas = 0;

  alternarFiltro(): void {
    this.mostrarApenasAbertas = !this.mostrarApenasAbertas;
  }

  limparFiltros(): void {
    this.filtroNumero = '';
    this.filtroStatus = '';
    this.filtroData = '';
  }

  mudarOrdenacao(campo: 'numero' | 'status' | 'data'): void {
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

  exportarNotas(): void {
    this.relatorioService.exportarNotasCSV(this.notas, `notas-fiscais-${new Date().toISOString().split('T')[0]}.csv`);
  }

  constructor(
    private faturamentoService: FaturamentoService,
    private estoqueService: EstoqueService,
    private relatorioService: RelatorioService,
    private auditoriaService: AuditoriaService
  ) { }

  ngOnInit(): void {
    this.carregarNotas();
    this.carregarProdutos();
  }

  carregarNotas(): void {
    this.loading = true;
    this.error = '';
    this.faturamentoService.obterTodasNotas().subscribe({
      next: (data) => {
        this.notas = data;
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erro ao carregar notas: ' + (err.message || 'Erro desconhecido');
        this.loading = false;
      }
    });
  }

  carregarProdutos(): void {
    this.estoqueService.obterTodosProdutos().subscribe({
      next: (data) => {
        this.produtos = data;
      },
      error: (err) => {
        this.error = 'Erro ao carregar produtos: ' + (err.message || 'Erro desconhecido');
      }
    });
  }

  abrirFormulario(): void {
    this.showForm = true;
    this.itens = [];
    this.idempotencyKey = this.gerarUUID();
    this.produtoSelecionado = null;
    this.quantidadeSelecionada = 0;
  }

  gerarUUID(): string {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  fecharFormulario(): void {
    this.showForm = false;
    this.itens = [];
    this.produtoSelecionado = null;
    this.quantidadeSelecionada = 0;
  }

  adicionarItem(): void {
    if (!this.produtoSelecionado || this.quantidadeSelecionada <= 0) {
      this.error = 'Selecione um produto e uma quantidade válida';
      return;
    }

    const itemExistente = this.itens.find(i => i.produtoId === this.produtoSelecionado!.id);
    if (itemExistente) {
      itemExistente.quantidade += this.quantidadeSelecionada;
    } else {
      this.itens.push({
        produtoId: this.produtoSelecionado.id,
        quantidade: this.quantidadeSelecionada
      });
    }

    this.produtoSelecionado = null;
    this.quantidadeSelecionada = 0;
    this.error = '';
  }

  removerItem(produtoId: number): void {
    this.itens = this.itens.filter(i => i.produtoId !== produtoId);
  }

  obterNomeProduto(produtoId: number): string {
    const produto = this.produtos.find(p => p.id === produtoId);
    return produto ? produto.descricao : 'Produto desconhecido';
  }

  obterSaldoProduto(produtoId: number): number | null {
    const produto = this.produtos.find(p => p.id === produtoId);
    return produto ? produto.saldo : null;
  }

  temSaldoSuficiente(produtoId: number, quantidade: number): boolean {
    const saldo = this.obterSaldoProduto(produtoId);
    return saldo !== null && saldo >= quantidade;
  }

  notaPodeSerImpresa(): boolean {
    return this.itens.every(item => this.temSaldoSuficiente(item.produtoId, item.quantidade));
  }

  deletarNota(id: number): void {
    const nota = this.notas.find(n => n.id === id);
    if (!confirm('Tem certeza que deseja deletar esta nota fiscal?')) {
      return;
    }

    this.loading = true;
    this.error = '';

    this.faturamentoService.deletarNotaFiscal(id).subscribe({
      next: () => {
        this.success = 'Nota fiscal deletada com sucesso!';
        this.auditoriaService.registrar(
          'Deletar Nota Fiscal',
          `Nota nº ${nota?.numeroSequencial} deletada`,
          'deletar'
        );
        this.carregarNotas();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = 'Erro ao deletar nota: ' + (err.error?.erro || err.message || 'Erro desconhecido');
        this.auditoriaService.registrar(
          'Deletar Nota Fiscal - Erro',
          `Falha ao deletar nota nº ${nota?.numeroSequencial}: ${this.error}`,
          'outro'
        );
        this.loading = false;
      }
    });
  }

  criarNotaFiscal(): void {
    if (this.itens.length === 0) {
      this.error = 'A nota fiscal deve ter pelo menos um item';
      return;
    }

    this.loading = true;
    this.error = '';
    this.success = '';

    this.faturamentoService.criarNotaFiscal({ itens: this.itens, idempotencyKey: this.idempotencyKey }).subscribe({
      next: (notaCriada) => {
        this.success = 'Nota fiscal criada com sucesso!';
        this.auditoriaService.registrar(
          'Criar Nota Fiscal',
          `Nota nº ${notaCriada.numeroSequencial} criada com ${this.itens.length} item(ns)`,
          'criar'
        );
        this.carregarNotas();
        this.fecharFormulario();
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = 'Erro ao criar nota: ' + (err.error?.erro || err.message || 'Erro desconhecido');
        this.auditoriaService.registrar(
          'Criar Nota Fiscal - Erro',
          `Falha ao criar nota: ${this.error}`,
          'outro'
        );
        this.loading = false;
      }
    });
  }

  imprimirNotaFiscal(id: number): void {
    const nota = this.notas.find(n => n.id === id);
    if (!nota) return;

    if (nota.status !== 'Aberta') {
      this.error = 'Apenas notas abertas podem ser impressas';
      return;
    }

    if (!confirm(`Deseja imprimir a nota fiscal nº ${nota.numeroSequencial}?`)) {
      return;
    }

    this.imprimindo = true;
    this.error = '';
    this.success = '';

    this.faturamentoService.imprimirNotaFiscal(id).subscribe({
      next: (response) => {
        this.success = response.mensagem || 'Nota fiscal impressa com sucesso!';
        this.auditoriaService.registrar(
          'Imprimir Nota Fiscal',
          `Nota nº ${nota.numeroSequencial} impressa (status: Fechada)`,
          'imprimir'
        );
        this.carregarNotas();
        this.imprimindo = false;
        setTimeout(() => this.success = '', 3000);
      },
      error: (err) => {
        this.error = 'Erro ao imprimir nota: ' + (err.error?.erro || err.message || 'Erro desconhecido');
        this.auditoriaService.registrar(
          'Imprimir Nota Fiscal - Erro',
          `Falha ao imprimir nota nº ${nota.numeroSequencial}: ${this.error}`,
          'outro'
        );
        this.imprimindo = false;
      }
    });
  }
}
