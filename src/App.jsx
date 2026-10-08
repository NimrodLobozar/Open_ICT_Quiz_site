export default function App() {
  return (
    <div style={{ 
      backgroundColor: "#ffedd5", /* Mooie zachte lichtoranje achtergrond */
      minHeight: "100vh", 
      color: "#7c2d12", /* Donkeroranje/bruine tekst voor goed contrast */
      fontFamily: "Arial, sans-serif",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      alignItems: "center",
      padding: "20px",
      boxSizing: "border-box"
    }}>
      {/* Bovenste balk met instructie en de PIN */}
      <div style={{ 
        backgroundColor: "white", 
        color: "#333", 
        display: "flex", 
        borderRadius: "10px", 
        overflow: "hidden", 
        boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
        marginTop: "20px"
      }}>
        <div style={{ padding: "15px 25px", borderRight: "2px solid #eee", fontSize: "1rem", display: "flex", alignItems: "center" }}>
          Neem deel op&nbsp;<strong>je telefoon of laptop</strong>
          </div>
        <div style={{ padding: "15px 30px", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "#666" }}>Spel-PIN:</span>
          <span style={{ fontSize: "2.5rem", fontWeight: "bold", letterSpacing: "2px", color: "#ea580c" }}>464816</span>
        </div>
      </div>

      {/* Midden: Wachten op deelnemers (helder oranje vak) */}
      <div style={{ 
        backgroundColor: "#f97316", 
        color: "white",
        padding: "12px 35px", 
        borderRadius: "8px", 
        fontSize: "1.5rem",
        fontWeight: "bold",
        boxShadow: "0 4px 6px rgba(0,0,0,0.15)"
      }}>
        Wachten op deelnemers
      </div>

      {/* Rechtsonder knop */}
      <div style={{ width: "100%", display: "flex", justifyContent: "flex-end", paddingBottom: "20px" }}>
        <button style={{ 
          backgroundColor: "#c2410c", 
          color: "white", 
          border: "none", 
          padding: "10px 25px", 
          borderRadius: "5px", 
          fontWeight: "bold", 
          fontSize: "1rem", 
          cursor: "pointer",
          boxShadow: "0 2px 5px rgba(0,0,0,0.2)"
        }}>
          Start
        </button>
      </div>
    </div>
  );
}
