# Sistema de Emissão de Notas Fiscais - Frontend Angular

Frontend em Angular para o sistema de emissão de notas fiscais com arquitetura de microsserviços.

## Estrutura do Projeto

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/
│   │   │   ├── produtos/
│   │   │   │   ├── produtos.component.ts
│   │   │   │   ├── produtos.component.html
│   │   │   │   └── produtos.component.css
│   │   │   └── notas-fiscais/
│   │   │       ├── notas-fiscais.component.ts
│   │   │       ├── notas-fiscais.component.html
│   │   │       └── notas-fiscais.component.css
│   │   ├── models/
│   │   │   └── index.ts
│   │   ├── services/
│   │   │   ├── estoque.service.ts
│   │   │   └── faturamento.service.ts
│   │   ├── app-routing.module.ts
│   │   ├── app.module.ts
│   │   ├── app.component.ts
│   │   ├── app.component.html
│   │   └── app.component.css
│   ├── main.ts
│   ├── index.html
│   └── styles.css
├── angular.json
├── package.json
├── tsconfig.json
└── README.md
```

## Instalação (quando Node.js estiver no PATH)

```bash
npm install
ng serve --open
```

O frontend estará disponível em `http://localhost:4200`

## Funcionalidades

### 1. Produtos
- Listar todos os produtos
- Criar novo produto (Código, Descrição, Saldo)
- Editar produto existente
- Deletar produto

### 2. Notas Fiscais
- Listar todas as notas fiscais com status (Aberta/Fechada)
- Criar nova nota fiscal com múltiplos itens
- Adicionar produtos com quantidade à nota
- Imprimir nota (fecha a nota e baixa saldo no estoque)
- Indicador de processamento durante impressão

## Serviços Utilizados

### EstoqueService
- URL: `http://localhost:5001/api/produtos`
- Métodos: GET, POST, PUT, DELETE, POST (baixar-saldo)

### FaturamentoService
- URL: `http://localhost:5002/api/notasfiscais`
- Métodos: GET, POST, POST (imprimir)

## Tratamento de Erros

- Mensagens de erro claras para o usuário
- Timeout em chamadas HTTP
- Fallback em caso de falha de conexão com microsserviços

## Ciclos de Vida Angular Utilizados

- **ngOnInit**: Carregamento de dados ao inicializar componentes
- **ngOnDestroy**: Limpeza de subscriptions (recomendado adicionar)

## RxJS Utilizados

- **Observable**: Para chamadas HTTP
- **subscription**: Para observar respostas
- **operators**: map, catchError (recomendado estruturar melhor com pipes)

## Próximos Passos

1. Instalar Node.js e npm
2. Rodar `npm install` na pasta frontend
3. Rodar `ng serve` para iniciar o servidor de desenvolvimento
4. Acessar `http://localhost:4200` no navegador
