using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MathRider.Migrations
{
    /// <inheritdoc />
    public partial class AddIsCompletedToProgress : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsCompleted",
                table: "Progresses",
                type: "bit",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsCompleted",
                table: "Progresses");
        }
    }
}
