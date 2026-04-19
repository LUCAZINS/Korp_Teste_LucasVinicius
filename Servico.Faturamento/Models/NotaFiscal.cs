namespace Servico.Faturamento.Models
{
    public class NotaFiscal
    {
        public int Id { get; set; }
        public int NumeroSequencial { get; set; }
        public EnumStatusNotaFiscal Status { get; set; } = EnumStatusNotaFiscal.Aberta;
        public DateTime DataCriacao { get; set; } = DateTime.UtcNow;
        public string IdempotencyKey { get; set; } = Guid.NewGuid().ToString();
        
        public ICollection<NotaFiscalItem> Itens { get; set; } = new List<NotaFiscalItem>();
    }
}
