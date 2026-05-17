using MathRider.Data;
using MathRider.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using MathRider.DTOs;

namespace MathRider.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class ProgressController : ControllerBase
    {
        private readonly AppDbContext _context;

        public ProgressController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/Progress/save
        [HttpPost("save")]
        public async Task<IActionResult> SaveProgress([FromBody] ProgressDto request)
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized("Не вдалося ідентифікувати користувача.");
            }

            var existingProgress = await _context.Progresses
                .FirstOrDefaultAsync(p => p.UserId == userId && p.LevelId == request.LevelId);

            if (existingProgress == null)
            {
                // Перше проходження
                var newProgress = new Progress
                {
                    UserId = userId,
                    LevelId = request.LevelId,
                    BestTime = request.Time,
                    StarsCollected = request.Stars,
                    IsCompleted = true // Рівень пройдено
                };
                _context.Progresses.Add(newProgress);
            }
            else
            {
                // Оновлення рекордів
                if (request.Time < existingProgress.BestTime || existingProgress.BestTime == 0)
                {
                    existingProgress.BestTime = request.Time;
                }

                if (request.Stars > existingProgress.StarsCollected)
                {
                    existingProgress.StarsCollected = request.Stars;
                }

                existingProgress.IsCompleted = true;
            }

            await _context.SaveChangesAsync();
            return Ok(new { message = "Прогрес успішно збережено!" });
        }

        // GET: api/Progress/my
        [HttpGet("my")]
        public async Task<IActionResult> GetMyProgress()
        {
            var userIdString = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userIdString) || !int.TryParse(userIdString, out int userId))
            {
                return Unauthorized();
            }

            var myProgress = await _context.Progresses
                .Where(p => p.UserId == userId)
                .Select(p => new
                {
                    p.LevelId,
                    p.BestTime,
                    p.StarsCollected,
                    p.IsCompleted
                })
                .ToListAsync();

            return Ok(myProgress);
        }
    }
}