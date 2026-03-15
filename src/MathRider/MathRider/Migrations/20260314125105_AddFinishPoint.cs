using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MathRider.Migrations
{
    /// <inheritdoc />
    public partial class AddFinishPoint : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FormulaX",
                table: "Levels");

            migrationBuilder.DropColumn(
                name: "FormulaY",
                table: "Levels");

            migrationBuilder.DropColumn(
                name: "IsParametric",
                table: "Levels");

            migrationBuilder.AddColumn<float>(
                name: "FinishPosX",
                table: "Levels",
                type: "real",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "FinishPosY",
                table: "Levels",
                type: "real",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "StartPosX",
                table: "Levels",
                type: "real",
                nullable: false,
                defaultValue: 0f);

            migrationBuilder.AddColumn<float>(
                name: "StartPosY",
                table: "Levels",
                type: "real",
                nullable: false,
                defaultValue: 0f);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "FinishPosX",
                table: "Levels");

            migrationBuilder.DropColumn(
                name: "FinishPosY",
                table: "Levels");

            migrationBuilder.DropColumn(
                name: "StartPosX",
                table: "Levels");

            migrationBuilder.DropColumn(
                name: "StartPosY",
                table: "Levels");

            migrationBuilder.AddColumn<string>(
                name: "FormulaX",
                table: "Levels",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<string>(
                name: "FormulaY",
                table: "Levels",
                type: "nvarchar(max)",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<bool>(
                name: "IsParametric",
                table: "Levels",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }
    }
}
