namespace Servico.Estoque.Models
{
    public class Produto
    {
        public int Id { get; set; }
        public int Codigo { get; set; }
        public string? Descricao { get; set; }
        public decimal Saldo { get; set; }
    }
}
