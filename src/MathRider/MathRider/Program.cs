using MathRider.Data;
using MathRider.Models;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddControllers();

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowReact", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(builder.Configuration.GetSection("AppSettings:Token").Value!)),
            ValidateIssuer = false,
            ValidateAudience = false
        };
    });

var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try
    {
        var context = services.GetRequiredService<AppDbContext>();
        var config = services.GetRequiredService<IConfiguration>();

        if (!context.Users.Any(u => u.Role == "Admin"))
        {
            var adminUser = config["AdminAccount:Username"];
            var adminPass = config["AdminAccount:Password"];

            if (!string.IsNullOrEmpty(adminUser) && !string.IsNullOrEmpty(adminPass))
            {
                var hashedPassword = BCrypt.Net.BCrypt.HashPassword(adminPass);

                context.Users.Add(new User
                {
                    Username = adminUser,
                    PasswordHash = hashedPassword,
                    Role = "Admin"
                });

                context.SaveChanges();
                Console.WriteLine("Обліковий запис Адміна успішно створено з Секретів!");
            }
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Помилка при створенні адміна: {ex.Message}");
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseCors("AllowReact");
app.UseHttpsRedirection();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();