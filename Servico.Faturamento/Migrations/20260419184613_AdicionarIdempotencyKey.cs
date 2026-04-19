using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Servico.Faturamento.Migrations
{
    /// <inheritdoc />
    public partial class AdicionarIdempotencyKey : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "IdempotencyKey",
                table: "NotasFiscais",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IdempotencyKey",
                table: "NotasFiscais");
        }
    }
}
