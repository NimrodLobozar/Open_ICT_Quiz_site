import React from "react";
import QuizHeader from "../../components/QuizHeader.jsx";
import './LobbyPlayer.css';

export default function LobbyPlayer() {
  return (
    <div className="page">
      <QuizHeader code="123456" />
      <main className="page__main">
        <h1 className="binnenKomst">JE BENT BINNEN,
          NAAM
        </h1>
      </main>
    </div>
  );
}
