using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using MathRider.Data;
using MathRider.Models;

namespace MathRider.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class LevelElementsController : ControllerBase
    {
        private readonly AppDbContext _context;

        public LevelElementsController(AppDbContext context)
        {
            _context = context;
        }

        // POST: api/levelelements
        [HttpPost]
        public async Task<ActionResult<LevelElement>> PostLevelElement(LevelElement newElement)
        {
            if (newElement.Type != "Star" && newElement.Type != "Obstacle")
            {
                return BadRequest(new { message = "Помилка: Невідомий тип об'єкта. Дозволені лише 'Star' або 'Obstacle'." });
            }

            if (newElement.Type == "Star")
            {
                // Примусово ставимо 30x30 для зірок, ігноруючи те, що прийшло в запиті
                newElement.Width = 30;
                newElement.Height = 30;
            }
            else if (newElement.Type == "Obstacle")
            {
                if (newElement.Width <= 0 || newElement.Height <= 0)
                {
                    return BadRequest(new { message = "Помилка: Розмір перешкоди має бути більшим за нуль." });
                }
            }

            var existingElements = await _context.LevelElements
                .Where(e => e.LevelId == newElement.LevelId)
                .ToListAsync();

            foreach (var el in existingElements)
            {
                bool overlapX = newElement.PosX < (el.PosX + el.Width) &&
                                (newElement.PosX + newElement.Width) > el.PosX;

                bool overlapY = newElement.PosY < (el.PosY + el.Height) &&
                                (newElement.PosY + newElement.Height) > el.PosY;

                if (overlapX && overlapY)
                {
                    return BadRequest(new { message = "Помилка: Елемент накладається на вже існуючий об'єкт." });
                }
            }

            _context.LevelElements.Add(newElement);
            await _context.SaveChangesAsync();

            return CreatedAtAction("GetLevelElement", new { id = newElement.Id }, newElement);
        }

        // PUT: api/levelelements/5
        [HttpPut("{id}")]
        public async Task<IActionResult> PutLevelElement(int id, LevelElement updatedElement)
        {
            if (id != updatedElement.Id)
            {
                return BadRequest(new { message = "ID в URL не збігається з ID в тілі запиту." });
            }

            if (updatedElement.Type != "Star" && updatedElement.Type != "Obstacle")
            {
                return BadRequest(new { message = "Помилка: Невідомий тип об'єкта." });
            }

            if (updatedElement.Type == "Star")
            {
                updatedElement.Width = 20;
                updatedElement.Height = 20;
            }
            else if (updatedElement.Type == "Obstacle")
            {
                if (updatedElement.Width <= 0 || updatedElement.Height <= 0)
                {
                    return BadRequest(new { message = "Помилка: Розмір перешкоди має бути більшим за нуль." });
                }
            }

            var existingElements = await _context.LevelElements
                .Where(e => e.LevelId == updatedElement.LevelId && e.Id != id)
                .ToListAsync();

            foreach (var el in existingElements)
            {
                bool overlapX = updatedElement.PosX < (el.PosX + el.Width) &&
                                (updatedElement.PosX + updatedElement.Width) > el.PosX;

                bool overlapY = updatedElement.PosY < (el.PosY + el.Height) &&
                                (updatedElement.PosY + updatedElement.Height) > el.PosY;

                if (overlapX && overlapY)
                {
                    return BadRequest(new { message = "Помилка: Після переміщення елемент накладається на інший об'єкт." });
                }
            }

            _context.Entry(updatedElement).State = EntityState.Modified;

            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateConcurrencyException)
            {
                if (!_context.LevelElements.Any(e => e.Id == id))
                {
                    return NotFound(new { message = "Елемент не знайдено." });
                }
                else
                {
                    throw;
                }
            }

            return NoContent();
        }

        // DELETE: api/levelelements/5
        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteLevelElement(int id)
        {
            var element = await _context.LevelElements.FindAsync(id);
            if (element == null)
            {
                return NotFound();
            }

            _context.LevelElements.Remove(element);
            await _context.SaveChangesAsync();

            return NoContent();
        }

        [HttpGet("{id}")]
        public async Task<ActionResult<LevelElement>> GetLevelElement(int id)
        {
            var element = await _context.LevelElements.FindAsync(id);
            if (element == null) return NotFound();
            return element;
        }
    }
}