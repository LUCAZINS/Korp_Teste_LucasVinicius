using Microsoft.AspNetCore.Mvc;
using Servico.Estoque.Context;
using Servico.Estoque.Models;

namespace Servico.Estoque.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class ProdutosController : ControllerBase
    {
        private readonly EstoqueContext _context;

        public ProdutosController(EstoqueContext context)
        {
            _context = context;
        }

        [HttpGet]
        public IActionResult ObterTodos()
        {
            var produtos = _context.Produtos.ToList();
            return Ok(produtos);
        }

        [HttpGet("{id}")]
        public IActionResult ObterPorId(int id)
        {
            var produto = _context.Produtos.Find(id);
            if (produto == null)
                return NotFound();

            return Ok(produto);
        }

        [HttpPost]
        public IActionResult Criar([FromBody] CriarProdutoRequest request)
        {
            if (string.IsNullOrWhiteSpace(request.Descricao))
                return BadRequest(new { erro = "A descricao do produto é obrigatória" });

            var produto = new Produto
            {
                Codigo = request.Codigo,
                Descricao = request.Descricao,
                Saldo = request.Saldo
            };

            _context.Produtos.Add(produto);
            _context.SaveChanges();

            return CreatedAtAction(nameof(ObterPorId), new { id = produto.Id }, produto);
        }

        [HttpPut("{id}")]
        public IActionResult Atualizar(int id, [FromBody] CriarProdutoRequest request)
        {
            var produto = _context.Produtos.Find(id);
            if (produto == null)
                return NotFound();

            if (string.IsNullOrWhiteSpace(request.Descricao))
                return BadRequest(new { erro = "A descricao do produto é obrigatória" });

            produto.Codigo = request.Codigo;
            produto.Descricao = request.Descricao;
            produto.Saldo = request.Saldo;

            _context.Produtos.Update(produto);
            _context.SaveChanges();

            return Ok(produto);
        }

        [HttpDelete("{id}")]
        public IActionResult Deletar(int id)
        {
            var produto = _context.Produtos.Find(id);
            if (produto == null)
                return NotFound();

            _context.Produtos.Remove(produto);
            _context.SaveChanges();

            return NoContent();
        }

        [HttpPost("{id}/baixar-saldo")]
        public IActionResult BaixarSaldo(int id, [FromBody] BaixarSaldoRequest request)
        {
            var produto = _context.Produtos.Find(id);
            if (produto == null)
                return NotFound(new { erro = "Produto não encontrado" });

            if (request.Quantidade <= 0)
                return BadRequest(new { erro = "A quantidade deve ser maior que zero" });

            if (produto.Saldo < request.Quantidade)
                return BadRequest(new { erro = $"Saldo insuficiente. Disponível: {produto.Saldo}, solicitado: {request.Quantidade}" });

            produto.Saldo -= request.Quantidade;
            _context.Produtos.Update(produto);
            _context.SaveChanges();

            return Ok(new { mensagem = "Saldo baixado com sucesso", produto });
        }
    }

    public class CriarProdutoRequest
    {
        public int Codigo { get; set; }
        public string Descricao { get; set; }
        public decimal Saldo { get; set; }
    }

    public class BaixarSaldoRequest
    {
        public int Quantidade { get; set; }
    }
}
