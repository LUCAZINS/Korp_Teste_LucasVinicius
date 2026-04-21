# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Copiar arquivo de projeto
COPY ["Servico.Estoque.csproj", "./"]

# Restaurar dependências
RUN dotnet restore "Servico.Estoque.csproj"

# Copiar código fonte
COPY . .

# Compilar em Release
RUN dotnet build "Servico.Estoque.csproj" -c Release -o /app/build

# Stage 2: Publicar
FROM build AS publish
RUN dotnet publish "Servico.Estoque.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Stage 3: Runtime
FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app

# Copiar arquivos publicados
COPY --from=publish /app/publish .

# Expor porta (Render vai injetar PORT automaticamente)
EXPOSE 8080

# Definir variáveis de ambiente padrão
ENV ASPNETCORE_URLS=http://+:8080 \
    ASPNETCORE_ENVIRONMENT=Production

# Iniciar aplicação
ENTRYPOINT ["dotnet", "Servico.Estoque.dll"]
