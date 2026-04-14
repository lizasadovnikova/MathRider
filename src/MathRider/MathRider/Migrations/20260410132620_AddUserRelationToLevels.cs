using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace MathRider.Migrations
{
    /// <inheritdoc />
    public partial class AddUserRelationToLevels : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "UserId",
                table: "Levels",
                type: "int",
                nullable: false,
                defaultValue: 0);
            migrationBuilder.Sql("INSERT INTO Users (Username, PasswordHash, Role) VALUES ('Admin', 'fake', 'Admin');");

            migrationBuilder.Sql("UPDATE Levels SET UserId = 1;");

            migrationBuilder.CreateIndex(
                name: "IX_Levels_UserId",
                table: "Levels",
                column: "UserId");

            migrationBuilder.AddForeignKey(
                name: "FK_Levels_Users_UserId",
                table: "Levels",
                column: "UserId",
                principalTable: "Users",
                principalColumn: "Id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_Levels_Users_UserId",
                table: "Levels");

            migrationBuilder.DropIndex(
                name: "IX_Levels_UserId",
                table: "Levels");

            migrationBuilder.DropColumn(
                name: "UserId",
                table: "Levels");
        }
    }
}
