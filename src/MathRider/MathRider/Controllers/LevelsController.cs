using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MathRider.Data;
using MathRider.Models;

namespace MathRider.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LevelsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LevelsController(AppDbContext context)
        {
            _context = context;
        }

        // GET: api/levels
        [HttpGet]
        public async Task<ActionResult<IEnumerable<Level>>> GetLevels()
        {
            return await _context.Levels
                .Include(l => l.Elements)
                .ToListAsync();
        }

        // POST: api/levels
        [HttpPost]
        public async Task<ActionResult<Level>> PostLevel(Level level)
        {
            _context.Levels.Add(level);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetLevels), new { id = level.Id }, level);
        }

        // PUT: api/levels/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLevel(int id, Level level)
        {
            if (id != level.Id)
            {
                return BadRequest("ID в URL не збігається з ID в тілі запиту.");
            }

            _context.Entry(level).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.Levels.Any(e => e.Id == id))
                {
                    return NotFound("Рівень не знайдено.");
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/levels/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLevel(int id)
        {
            var level = await _context.Levels.FindAsync(id);
            if (level == null)
            {
                return NotFound("Рівень не знайдено.");
            }

            _context.Levels.Remove(level);
            await _context.SaveChangesAsync();

            return NoContent();
        }
    }
}