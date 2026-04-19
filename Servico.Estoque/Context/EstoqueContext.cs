using Microsoft.EntityFrameworkCore;
using Servico.Estoque.Models;

namespace Servico.Estoque.Context
{
    public class EstoqueContext : DbContext
    {
        public EstoqueContext(DbContextOptions<EstoqueContext> options) : base(options)
        {
        }

        public DbSet<Produto> Produtos { get; set; }
    }
}
