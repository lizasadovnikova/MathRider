using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MathRider.Migrations
{
    /// <inheritdoc />
    public partial class AddDifficultyAndCategory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Category",
                table: "Levels",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "Difficulty",
                table: "Levels",
                type: "int",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Category",
                table: "Levels");

            migrationBuilder.DropColumn(
                name: "Difficulty",
                table: "Levels");
        }
    }
}
