namespace MathRider.Models
{
    public class Progress
    {
        public int Id { get; set; }
        public int UserId { get; set; }
        public User? User { get; set; }
        public int LevelId { get; set; }
        public Level? Level { get; set; } 
        public float BestTime { get; set; }
        public int StarsCollected { get; set; }
    }
}