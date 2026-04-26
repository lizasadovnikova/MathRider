using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MathRider.Migrations
{
    /// <inheritdoc />
    public partial class AddElementAngle : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<float>(
                name: "Angle",
                table: "LevelElements",
                type: "real",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Angle",
                table: "LevelElements");
        }
    }
}
