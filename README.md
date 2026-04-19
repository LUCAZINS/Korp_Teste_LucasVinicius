# Sistema de Emissão de Notas Fiscais - Arquitetura Completa

Sistema completo com microsserviços em C# e frontend em Angular.

## Estrutura de Pastas

```
microsservicos/
├── Servico.Estoque/      # Microsserviço de Estoque (.NET 10)
│   ├── Models/
│   ├── Controllers/
│   ├── Context/
│   └── Migrations/
├── Servico.Faturamento/  # Microsserviço de Faturamento (.NET 10)
│   ├── Models/
│   ├── Controllers/
│   ├── Context/
│   └── Migrations/
├── frontend/             # Frontend Angular 17
│   ├── src/
│   ├── angular.json
│   └── package.json
└── Microsservicos.slnx   # Solução Visual Studio
```

## Como Executar

### 1. Backend - Serviço de Estoque

```bash
cd c:\Users\User\Desktop\DOTNET\microsservicos\Servico.Estoque
dotnet run
```

O serviço rodará em `http://localhost:5001`

### 2. Backend - Serviço de Faturamento

Em outro terminal:
```bash
cd c:\Users\User\Desktop\DOTNET\microsservicos\Servico.Faturamento
dotnet run
```

O serviço rodará em `http://localhost:5002`

### 3. Frontend - Angular

Em outro terminal (required Node.js instalado):
```bash
cd c:\Users\User\Desktop\DOTNET\microsservicos\frontend
npm install
ng serve --open
```

O frontend estará disponível em `http://localhost:4200`

## Endpoints Disponíveis

### Serviço de Estoque (5001)

**Produtos:**
- `GET /api/produtos` - Listar todos
- `GET /api/produtos/{id}` - Obter por ID
- `POST /api/produtos` - Criar novo
- `PUT /api/produtos/{id}` - Atualizar
- `DELETE /api/produtos/{id}` - Deletar
- `POST /api/produtos/{id}/baixar-saldo` - Baixar saldo (usado na impressão)

### Serviço de Faturamento (5002)

**Notas Fiscais:**
- `GET /api/notasfiscais` - Listar todas
- `GET /api/notasfiscais/{id}` - Obter por ID com itens
- `POST /api/notasfiscais` - Criar nova (com numeração sequencial automática)
- `POST /api/notasfiscais/{id}/imprimir` - Imprimir nota (fecha e baixa estoque)

## Fluxo da Aplicação

1. **Criar Produtos** (via Angular ou Swagger)
   - Acesso ao Serviço de Estoque

2. **Criar Nota Fiscal** (via Angular)
   - O Faturamento registra a nota com status "Aberta"
   - Numeração é gerada automaticamente (1, 2, 3...)

3. **Imprimir Nota Fiscal** (via Angular)
   - Faturamento chama Estoque para validar e baixar saldo
   - Se sucesso: nota passa para "Fechada", estoque é atualizado
   - Se falha: nota permanece "Aberta", saldo não é alterado

## Tratamento de Falhas

- **Timeout**: 10 segundos na chamada HTTP entre microsserviços
- **Fallback**: Se Estoque falhar, Faturamento retorna erro claro
- **Transação**: Rollback automático se algo der errado na impressão
- **Validação**: Saldo insuficiente, produto não encontrado, nota já fechada

## Banco de Dados

**PostgreSQL via Railway**
- Host: roundhouse.proxy.rlwy.net
- Port: 59488
- Database: railway
- User: postgres

Tabelas:
- produtos (Estoque)
- "NotasFiscais" (Faturamento)
- "NotasFiscaisItens" (Faturamento)

## Diagrama de Comunicação

```
┌─────────────────────────────┐
│   Frontend Angular 4200     │
├─────────────────────────────┤
│                             │
│  Componentes:               │
│  - Produtos                 │
│  - Notas Fiscais            │
│                             │
│  Serviços:                  │
│  - EstoqueService (5001)    │
│  - FaturamentoService (5002)│
└──────────────┬──────────────┘
               │
      ┌────────┴────────┐
      │                 │
      ▼                 ▼
┌──────────────┐  ┌──────────────┐
│   Estoque    │  │ Faturamento  │
│    5001      │  │    5002      │
├──────────────┤  ├──────────────┤
│              │  │              │
│ Produtos     │  │ Notas        │
│ BaixarSaldo  │  │ Imprimir     │
│              │  │ (chama API)  │
└──────┬───────┘  └───────┬──────┘
       │                  │
       └──────────┬───────┘
                  │
                  ▼
          ┌──────────────────┐
          │   PostgreSQL     │
          │   Railway        │
          └──────────────────┘
```

## Tecnologias Utilizadas

**Backend:**
- .NET 10 / C#
- ASP.NET Core (Web API)
- Entity Framework Core
- PostgreSQL

**Frontend:**
- Angular 17
- TypeScript
- RxJS
- FormsModule

## Próximos Passos (Recomendados)

1. Adicionar autenticação (JWT)
2. Implementar logging mais robusto
3. Adicionar health checks entre serviços
4. Implementar circuit breaker (Polly)
5. Adicionar unit tests
6. Documentar API OpenAPI/Swagger
7. Containerizar com Docker
8. Gerar relatórios de nota fiscal em PDF

## Notas Importantes

- Certifique-se de que as portas 5001, 5002 e 4200 estão livres
- O banco de dados PostgreSQL está online e acessível
- CORS está configurado para aceitar requisições do frontend
- As migrations já foram executadas no banco
