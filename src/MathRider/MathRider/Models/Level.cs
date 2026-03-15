namespace MathRider.Models
{
    public class Level
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public float StartPosX { get; set; }
        public float StartPosY { get; set; }
        public float FinishPosX { get; set; }
        public float FinishPosY { get; set; }
        public double VehicleMass { get; set; }
        public double EnginePower { get; set; }
        public List<LevelElement> Elements { get; set; } = new();
    }
}