using System.Text.Json.Serialization;

namespace Servico.Faturamento.Models
{
    public class NotaFiscalItem
    {
        public int Id { get; set; }
        
        public int NotaFiscalId { get; set; }
        [JsonIgnore]
        public NotaFiscal NotaFiscal { get; set; }
        
        public int ProdutoId { get; set; }
        public int Quantidade { get; set; }
    }
}
