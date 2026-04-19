using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Servico.Faturamento.Context;
using Servico.Faturamento.Models;

namespace Servico.Faturamento.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class NotasFiscaisController : ControllerBase
    {
        private readonly FaturamentoContext _context;
        private readonly IHttpClientFactory _httpClientFactory;
        private readonly IConfiguration _configuration;
        private const int MaxRetries = 3;
        private const int RetryDelayMs = 1000;

        public NotasFiscaisController(FaturamentoContext context, IHttpClientFactory httpClientFactory, IConfiguration configuration)
        {
            _context = context;
            _httpClientFactory = httpClientFactory;
            _configuration = configuration;
        }

        [HttpGet]
        public IActionResult ObterTodos()
        {
            var notas = _context.NotasFiscais
                .Include(x => x.Itens)
                .ToList();

            return Ok(notas);
        }

        [HttpGet("{id}")]
        public IActionResult ObterPorId(int id)
        {
            var nota = _context.NotasFiscais
                .Include(x => x.Itens)
                .FirstOrDefault(x => x.Id == id);

            if (nota == null)
                return NotFound();

            return Ok(nota);
        }

        [HttpPost]
        public IActionResult Criar([FromBody] CriarNotaFiscalRequest request)
        {
            if (request.Itens == null || !request.Itens.Any())
                return BadRequest(new { erro = "A nota fiscal precisa de pelo menos um item" });

            // Idempotência: verificar se já existe nota com mesma chave
            var notaExistente = _context.NotasFiscais
                .Include(x => x.Itens)
                .FirstOrDefault(x => x.IdempotencyKey == request.IdempotencyKey);
            if (notaExistente != null)
                return Ok(new { mensagem = "Nota fiscal já foi criada (idempotência)", nota = notaExistente });

            var numeroSequencial = _context.NotasFiscais.Any()
                ? _context.NotasFiscais.Max(x => x.NumeroSequencial) + 1
                : 1;

            var itens = new List<NotaFiscalItem>();

            foreach (var item in request.Itens)
            {
                if (item.Quantidade <= 0)
                    return BadRequest(new { erro = "A quantidade deve ser maior que zero" });

                itens.Add(new NotaFiscalItem
                {
                    ProdutoId = item.ProdutoId,
                    Quantidade = item.Quantidade
                });
            }

            var notaFiscal = new NotaFiscal
            {
                NumeroSequencial = numeroSequencial,
                Status = EnumStatusNotaFiscal.Aberta,
                IdempotencyKey = request.IdempotencyKey,
                Itens = itens
            };

            _context.NotasFiscais.Add(notaFiscal);
            _context.SaveChanges();

            return CreatedAtAction(nameof(ObterPorId), new { id = notaFiscal.Id }, notaFiscal);
        }

        [HttpPost("{id}/imprimir")]
        public async Task<IActionResult> Imprimir(int id)
        {
            using var transaction = _context.Database.BeginTransaction();

            var nota = _context.NotasFiscais
                .Include(x => x.Itens)
                .FirstOrDefault(x => x.Id == id);

            if (nota == null)
            {
                transaction.Rollback();
                return NotFound(new { erro = "Nota fiscal não encontrada" });
            }

            if (nota.Status != EnumStatusNotaFiscal.Aberta)
            {
                transaction.Rollback();
                return BadRequest(new { erro = "Somente notas em aberto podem ser impressas" });
            }

            var estoqueUrl = _configuration["EstoqueServiceUrl"] ?? "http://localhost:5001";
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);

            try
            {
                foreach (var item in nota.Itens)
                {
                    var sucesso = await BaixarSaldoComRetry(item.ProdutoId, item.Quantidade);

                    if (!sucesso)
                    {
                        transaction.Rollback();
                        return StatusCode(503, new { 
                            erro = $"Falha ao baixar saldo do produto {item.ProdutoId} após {MaxRetries} tentativas. Serviço de estoque pode estar indisponível." 
                        });
                    }
                }

                nota.Status = EnumStatusNotaFiscal.Fechada;
                _context.NotasFiscais.Update(nota);
                _context.SaveChanges();
                transaction.Commit();

                return Ok(new
                {
                    mensagem = "Nota fiscal impressa com sucesso",
                    notaFiscalId = nota.Id,
                    numeroSequencial = nota.NumeroSequencial,
                    status = nota.Status
                });
            }
            catch (HttpRequestException ex)
            {
                transaction.Rollback();
                return BadRequest(new { erro = $"Falha ao conectar com o serviço de estoque: {ex.Message}" });
            }
            catch (TaskCanceledException ex)
            {
                transaction.Rollback();
                return BadRequest(new { erro = $"Timeout ao conectar com o serviço de estoque: {ex.Message}" });
            }
            catch (Exception ex)
            {
                transaction.Rollback();
                return StatusCode(500, new { erro = $"Erro inesperado: {ex.Message}" });
            }
        }

        [HttpDelete("{id}")]
        public IActionResult Deletar(int id)
        {
            var nota = _context.NotasFiscais.Find(id);
            if (nota == null)
                return NotFound(new { erro = "Nota fiscal não encontrada" });

            _context.NotasFiscais.Remove(nota);
            _context.SaveChanges();

            return NoContent();
        }

        private async Task<bool> BaixarSaldoComRetry(int produtoId, int quantidade)
        {
            var estoqueUrl = _configuration["EstoqueServiceUrl"] ?? "http://localhost:5001";
            var client = _httpClientFactory.CreateClient();
            client.Timeout = TimeSpan.FromSeconds(10);

            for (int tentativa = 0; tentativa < MaxRetries; tentativa++)
            {
                try
                {
                    var url = $"{estoqueUrl}/api/produtos/{produtoId}/baixar-saldo";
                    var content = new StringContent(
                        System.Text.Json.JsonSerializer.Serialize(new { quantidade = quantidade }),
                        System.Text.Encoding.UTF8,
                        "application/json"
                    );

                    var response = await client.PostAsync(url, content);

                    if (response.IsSuccessStatusCode)
                        return true;

                    if (tentativa < MaxRetries - 1)
                        await Task.Delay(RetryDelayMs * (tentativa + 1));
                }
                catch (HttpRequestException) when (tentativa < MaxRetries - 1)
                {
                    await Task.Delay(RetryDelayMs * (tentativa + 1));
                }
            }

            return false;
        }
    }

    public class CriarNotaFiscalRequest
    {
        public List<CriarNotaFiscalItemRequest> Itens { get; set; } = new();
        public string IdempotencyKey { get; set; } = Guid.NewGuid().ToString();
    }

    public class CriarNotaFiscalItemRequest
    {
        public int ProdutoId { get; set; }
        public int Quantidade { get; set; }
    }
}
