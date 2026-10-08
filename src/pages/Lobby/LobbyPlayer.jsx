import React from "react";

export default function LobbyPlayer() {
  return (
    <div
      style={{
        backgroundColor: "#ffedd5" /* Mooie zachte lichtoranje achtergrond */,
        minHeight: "100vh",
        color: "#7c2d12" /* Donkeroranje/bruine tekst voor goed contrast */,
        fontFamily: "Arial, sans-serif",
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "20px",
        boxSizing: "border-box",
      }}
    ></div>
  );
}
