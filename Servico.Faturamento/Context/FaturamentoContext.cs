using Microsoft.EntityFrameworkCore;
using Servico.Faturamento.Models;

namespace Servico.Faturamento.Context
{
    public class FaturamentoContext : DbContext
    {
        public FaturamentoContext(DbContextOptions<FaturamentoContext> options) : base(options)
        {
        }

        public DbSet<NotaFiscal> NotasFiscais { get; set; }
        public DbSet<NotaFiscalItem> NotasFiscaisItens { get; set; }
    }
}
