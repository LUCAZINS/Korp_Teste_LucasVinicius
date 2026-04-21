# 🐳 Como Docker Funciona - Guia Completo

## O que é Docker?

Docker é uma tecnologia de **containerização** - pense nele como um "pacote portável" que contém seu aplicativo + todas as dependências (bibliotecas, frameworks, sistema operacional minimalista).

### Analogia do Mundo Real

```
SEM Docker:
┌─────────────────────────────────────┐
│ Seu computador (Windows)            │
│ ├─ .NET 10                          │
│ ├─ PostgreSQL                       │
│ ├─ Node.js                          │
│ └─ Seu código                       │
└─────────────────────────────────────┘

Problema: Funciona no seu PC, mas no servidor pode não funcionar
(versões diferentes, bibliotecas faltando, conflitos)


COM Docker:
┌─────────────────────────────────────┐
│ Seu computador (qualquer SO)        │
│ ├─ Docker (gerenciador)             │
│ │  ├─ Container 1 (Estoque)         │
│ │  │  ├─ .NET 10                    │
│ │  │  ├─ PostgreSQL client          │
│ │  │  └─ Código do Estoque          │
│ │  └─ Container 2 (Faturamento)     │
│ │     ├─ .NET 10                    │
│ │     ├─ PostgreSQL client          │
│ │     └─ Código do Faturamento      │
└─────────────────────────────────────┘

Vantagem: Funciona igual em qualquer lugar (seu PC, servidor, Render, etc)
```

---

## Como Funciona Tecnicamente

### 1. **Dockerfile** = Receita de Bolo

Um Dockerfile é um arquivo com instruções para criar uma imagem Docker.

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
# ↑ Começa com uma imagem base (.NET 10)

WORKDIR /src
# ↑ Define o diretório de trabalho dentro do container

COPY ["Servico.Estoque.csproj", "./"]
# ↑ Copia arquivo do seu PC para dentro do container

RUN dotnet restore "Servico.Estoque.csproj"
# ↑ Executa comandos (instala dependências)

COPY . .
# ↑ Copia todo o código

RUN dotnet publish -c Release
# ↑ Compila o projeto

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
# ↑ Muda para imagem runtime (versão leve para executar)

EXPOSE 8080
# ↑ Expõe a porta 8080

ENTRYPOINT ["dotnet", "Servico.Estoque.dll"]
# ↑ Comando que executa quando o container inicia
```

### 2. **Multi-Stage Build** (o que nós fazemos)

Nossos Dockerfiles têm **3 estágios**:

```
STAGE 1: Build          (Imagem pesada, compila o código)
    ↓
STAGE 2: Publish        (Publica em Release)
    ↓
STAGE 3: Runtime        (Imagem leve, apenas para executar)
    ↓
    RESULTADO: Container otimizado e pequeno
```

**Por que isso é bom?** A imagem final fica ~100MB em vez de 2GB!

### 3. **Imagem vs Container**

```
📦 Imagem Docker = Arquivo (como um .ISO de Windows)
🚀 Container = Processo executando (como Windows aberto)

Analogia:
Imagem   = Fotografia da receita de bolo
Container = Bolo sendo feito na cozinha
```

### 4. **Como o Docker é executado**

```
1. Você faz: docker build -t meu-app .
   └─ Docker lê o Dockerfile e cria uma imagem
   
2. Você faz: docker run -p 8080:8080 meu-app
   └─ Docker cria um container e inicia a aplicação
   
3. Seu app roda em http://localhost:8080
```

---

## No Render: Como Funciona

No Render, o processo é automatizado:

```
1. Você faz push no GitHub
        ↓
2. Render detecta e puxa o código
        ↓
3. Render lê o Dockerfile
        ↓
4. Render constrói a imagem
        ↓
5. Render inicia um container
        ↓
6. Seu app fica online!
```

---

## Nossos Dockerfiles Explicados

### Para Servico.Estoque:

```dockerfile
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
# Usa SDK do .NET 10 para compilar
# SDK = tem compilador (pesado, ~500MB)

WORKDIR /src
COPY ["Servico.Estoque.csproj", "./"]
RUN dotnet restore "Servico.Estoque.csproj"
# Baixa todas as dependências NuGet

COPY . .
RUN dotnet build "Servico.Estoque.csproj" -c Release
# Compila em modo Release (otimizado)

FROM build AS publish
RUN dotnet publish "Servico.Estoque.csproj" -c Release -o /app/publish
# Publica (prepara para produção)
# Argumentos importantes:
# -c Release = otimiza o código
# -o /app/publish = copia arquivos compilados
# /p:UseAppHost=false = não cria executável nativo (melhor para containers)

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
# Runtime = só para executar (leve, ~100MB)
# Não tem compilador, só o necessário para rodar

WORKDIR /app
COPY --from=publish /app/publish .
# Copia arquivos compilados do stage anterior

EXPOSE 8080
# Abre a porta 8080 (Render injeta variáveis aqui)

ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production
# Define variáveis de ambiente

ENTRYPOINT ["dotnet", "Servico.Estoque.dll"]
# Inicia a aplicação
```

---

## .dockerignore

É como .gitignore, mas para Docker. Evita copiar arquivos desnecessários:

```
**/bin                 # Arquivos compilados (vamos compilar de novo)
**/obj                 # Objetos de compilação
**/.vs                 # Configurações do Visual Studio
**/.git                # Histórico do git (não precisa)
**/node_modules        # Dependências (vamos restaurar)
**/.env                # Senhas e chaves (não copia!)
```

---

## Variáveis de Ambiente

No `Program.cs` seu código faz:

```csharp
options.UseNpgsql(builder.Configuration.GetConnectionString("ConexaoPadrao"))
```

Isso lê de:
1. `appsettings.json` (local)
2. `appsettings.Production.json` (em produção)
3. Variáveis de ambiente (Render injeta aqui!)

**Como Render injeta:**

No `render.yaml` você coloca:

```yaml
- key: ConnectionStrings__ConexaoPadrao
  fromDatabase:
    name: postgres-korp
    property: connectionString
```

Render converte em uma variável de ambiente e seu código a lê automaticamente!

---

## Fluxo Completo

```
┌─────────────────────────────────────────────────────────┐
│ DESENVOLVIMENTO (Seu PC)                                │
│  $ dotnet run                                           │
│  → Lê appsettings.json                                  │
│  → Conecta em localhost:5432                           │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ TESTE LOCAL COM DOCKER (Seu PC)                         │
│  $ docker build -t estoque .                            │
│  $ docker run -e ConnectionStrings__ConexaoPadrao="..." │
│  → Executa em container                                │
└─────────────────────────────────────────────────────────┘
                        ↓
┌─────────────────────────────────────────────────────────┐
│ PRODUÇÃO (Render)                                       │
│  $ git push                                             │
│  → Render lê Dockerfile                                │
│  → Constrói imagem                                      │
│  → Injeta variáveis de ambiente                         │
│  → Inicia container                                     │
│  → App roda em https://microsservicos-estoque.onrender │
└─────────────────────────────────────────────────────────┘
```

---

## Próximas Ações

1. **Adicionar ao Git:**
   ```bash
   git add Dockerfile .dockerignore .env.example render.yaml
   git commit -m "Add Docker configuration for Render"
   git push
   ```

2. **Testar Localmente (opcional):**
   ```bash
   cd Servico.Estoque
   docker build -t estoque .
   ```

3. **No Render:**
   - Conecte seu repositório GitHub
   - Selecione "Deploy using Dockerfile"
   - Configure variáveis de ambiente
   - Render faz o resto automaticamente!

---

## Resumo em Uma Linha

**Docker = Suas dependências + seu código em um pacote que funciona em qualquer lugar**
