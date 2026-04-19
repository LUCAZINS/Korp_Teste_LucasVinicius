export interface Produto {
  id: number;
  codigo: number;
  descricao: string;
  saldo: number;
}

export interface NotaFiscal {
  id: number;
  numeroSequencial: number;
  status: 'Aberta' | 'Fechada';
  dataCriacao: string;
  idempotencyKey: string;
  itens: NotaFiscalItem[];
}

export interface NotaFiscalItem {
  id: number;
  notaFiscalId: number;
  produtoId: number;
  quantidade: number;
}

export interface CriarNotaFiscalRequest {
  itens: CriarNotaFiscalItemRequest[];
  idempotencyKey?: string;
}

export interface CriarNotaFiscalItemRequest {
  produtoId: number;
  quantidade: number;
}
