namespace MathRider.Models
{
    public class LevelElement
    {
        public int Id { get; set; }
        public int LevelId { get; set; }
        public string Type { get; set; } = "Star";
        public float PosX { get; set; }
        public float PosY { get; set; }
        public float Width { get; set; } = 20;
        public float Height { get; set; } = 20;
    }
}