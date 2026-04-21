# 🚀 Passo a Passo: Deploy no Render

## ✅ Pré-requisitos

- [ ] Conta no GitHub
- [ ] Repositório Git com o código
- [ ] Conta no [Render.com](https://render.com)
- [ ] Arquivos criados: `Dockerfile`, `.dockerignore`, `render.yaml`

---

## 📋 Passo 1: Preparar o Repositório Git

### 1.1 Adicionar os arquivos Docker ao Git

```bash
cd c:\Users\User\Desktop\KORP\microsservicos
git add Dockerfile Servico.Faturamento/Dockerfile .dockerignore .env.example render.yaml DOCKER_EXPLICADO.md
git commit -m "feat: Add Docker and Render configuration"
git push
```

### 1.2 Verificar no GitHub

Acesse seu repositório no GitHub e confirme que os arquivos estão lá.

---

## 🔐 Passo 2: Configurar Variáveis de Ambiente

### 2.1 Atualizar appsettings.json

Seu `appsettings.json` **já tem a senha do banco!** ⚠️ Isso é perigoso em produção.

**Solução:** Fazer ele ler de variáveis de ambiente:

#### Opção A: Usando Configuration (recomendado)

Seu `Program.cs` já faz isso:

```csharp
builder.Configuration.GetConnectionString("ConexaoPadrao")
```

Isso funciona com variáveis de ambiente automaticamente! 

**Como funciona:**
- Em desenvolvimento: lê de `appsettings.json`
- Em produção (Render): lê de `ConnectionStrings__ConexaoPadrao` (variável de ambiente)

---

## 🌐 Passo 3: Criar Banco de Dados no Render

### 3.1 Acessar Render Dashboard

1. Vá em [dashboard.render.com](https://dashboard.render.com)
2. Clique em **"+ New"** → **"PostgreSQL"**

### 3.2 Configurar PostgreSQL

| Campo | Valor |
|-------|-------|
| **Name** | `postgres-korp` |
| **Database** | `railway` |
| **User** | `postgres` |
| **Region** | `São Paulo` ou mais próximo |
| **Plan** | Free (para teste) ou Standard |

### 3.3 Copiar Connection String

Depois de criado, você receberá algo como:

```
postgresql://postgres:senha@server.render.com:5432/railway
```

**⚠️ Guarde isso! Você precisará depois.**

---

## 🐳 Passo 4: Deploy do Serviço de Estoque

### 4.1 Criar Web Service

1. No Render Dashboard: **"+ New"** → **"Web Service"**
2. Selecione **"Deploy an existing repository"**
3. Conecte seu GitHub

### 4.2 Configurações Básicas

| Campo | Valor |
|-------|-------|
| **Name** | `microsservicos-estoque` |
| **Repository** | Seu repositório |
| **Branch** | `main` |
| **Root Directory** | `Servico.Estoque` |
| **Environment** | `Docker` |
| **Instance Type** | Free (ou upgraded) |

### 4.3 Configurar Variáveis de Ambiente

Na seção **"Environment"**, adicione:

```
ASPNETCORE_ENVIRONMENT=Production
ASPNETCORE_URLS=http://+:10000
ConnectionStrings__ConexaoPadrao=postgresql://postgres:SENHA@SERVER:5432/railway
```

⚠️ **Substitua:**
- `SENHA` pela senha do PostgreSQL
- `SERVER` pelo host do PostgreSQL

### 4.4 Deploy

Clique em **"Deploy Web Service"**

⏳ Aguarde ~5 minutos. Render vai:
1. Ler seu Dockerfile
2. Compilar o código
3. Iniciar o container
4. Expor em `https://microsservicos-estoque.onrender.com`

### 4.5 Verificar Deploy

```bash
# Teste a API
curl https://microsservicos-estoque.onrender.com/swagger/index.html
```

Se abrir o Swagger, funcionou! ✅

---

## 🐳 Passo 5: Deploy do Serviço de Faturamento

Repita os passos 4.1 a 4.5, mas com:

| Campo | Valor |
|-------|-------|
| **Name** | `microsservicos-faturamento` |
| **Root Directory** | `Servico.Faturamento` |

**Diferença importante:** Na variável de ambiente, adicione:

```
EstoqueServiceUrl=https://microsservicos-estoque.onrender.com
```

Assim Faturamento consegue chamar Estoque! 📞

---

## 🗄️ Passo 6: Migrations no Banco

Se não tiver criado as tabelas ainda:

### Opção A: Migrations automáticas (no Program.cs)

Adicione no seu `Program.cs` (antes de `app.Run()`):

```csharp
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<EstoqueContext>();
    db.Database.Migrate();
}
```

Assim, quando o container inicia, cria as tabelas automaticamente.

### Opção B: Executar migrations manualmente

No seu PC:

```bash
cd Servico.Estoque
dotnet ef database update --connection "postgresql://postgres:SENHA@SERVER:5432/railway"
```

---

## ✅ Verificação Final

Teste seus serviços:

```bash
# Estoque
curl https://microsservicos-estoque.onrender.com/api/produtos

# Faturamento (chama Estoque)
curl https://microsservicos-faturamento.onrender.com/api/notas-fiscais
```

Se funcionar, parabéns! 🎉

---

## 🚨 Troubleshooting

### Problema: "Build falhou"

**Solução:** Verifique os logs no Render:
1. Dashboard → Seu serviço → **"Logs"**
2. Procure por erros de compilação

### Problema: "Cannot connect to database"

**Solução:** Verifique `ConnectionStrings__ConexaoPadrao`:
1. Copie exatamente da conection string do PostgreSQL
2. Substitua o host por `localhost` se tiver em mente... não, use o host real!

### Problema: "Service A não consegue chamar Service B"

**Solução:** Use URLs completas com `https://`:

```csharp
// Errado (localhost não existe no container)
var url = "http://localhost:5001/api/...";

// Correto
var url = "https://microsservicos-estoque.onrender.com/api/...";
```

---

## 📊 Monitoramento

No Render Dashboard, você pode ver:

- **Logs** - saída da aplicação
- **Metrics** - CPU, memória, requisições
- **Events** - quando redeployou, etc

---

## 💡 Dicas Importantes

1. **Free tier:** Containers "adormecem" se inativos por 15 minutos
2. **CORS:** Seu frontend precisa ser servido via HTTPS também
3. **Banco de dados:** Guarde a connection string em um lugar seguro!
4. **Auto-deploy:** Sempre que fizer `git push`, Render faz deploy automaticamente

---

## Próximas Otimizações (depois)

- [ ] Adicionar CI/CD pipeline
- [ ] Implementar health checks
- [ ] Usar Secret Manager em vez de variáveis de ambiente
- [ ] Cache Docker para builds mais rápidos
- [ ] Upgrade de plano se não suportar carga

---

**Dúvidas?** Leia [DOCKER_EXPLICADO.md](./DOCKER_EXPLICADO.md) para entender melhor como tudo funciona!
