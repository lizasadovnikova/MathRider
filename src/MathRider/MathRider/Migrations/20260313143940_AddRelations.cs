using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MathRider.Migrations
{
    /// <inheritdoc />
    public partial class AddRelations : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateIndex(
                name: "IX_Progresses_LevelId",
                table: "Progresses",
                column: "LevelId");

            migrationBuilder.CreateIndex(
                name: "IX_Progresses_UserId",
                table: "Progresses",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Progresses_Levels_LevelId",
                table: "Progresses",
                column: "LevelId",
                principalTable: "Levels",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);

            migrationBuilder.AddForeignKey(
                name: "FK_Progresses_Users_UserId",
                table: "Progresses",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id",
                onDelete: ReferentialAction.Cascade);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Progresses_Levels_LevelId",
                table: "Progresses");

            migrationBuilder.DropForeignKey(
                name: "FK_Progresses_Users_UserId",
                table: "Progresses");

            migrationBuilder.DropIndex(
                name: "IX_Progresses_LevelId",
                table: "Progresses");

            migrationBuilder.DropIndex(
                name: "IX_Progresses_UserId",
                table: "Progresses");
        }
    }
}
