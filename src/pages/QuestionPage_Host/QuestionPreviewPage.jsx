import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useCountdown } from "../../hooks/useCountdown.js";
import {
  DEMO_CODE,
  demoIndexFromSearch,
  getDemoQuestion,
} from "../../data/demoGame.js";
import HostQuestionLayout from "./HostQuestionLayout.jsx";

/**
 * Host, fase QUESTION_PREVIEW: alleen de vraag, zodat iedereen hem eerst rustig kan lezen.
 * Na previewSeconds verschijnen de antwoorden (HostQuestionAnswers).
 * @param {{ code: string, question: QuestionShow, onShowAnswers?: () => void }} props
 *   question = de payload van question:show. onShowAnswers slaat de leestijd over.
 */
export function HostQuestionPreview({ code, question, onShowAnswers }) {
  const msLeft = useCountdown(question.startsAt);
  const previewMs = question.previewSeconds * 1000;
  // Hoe ver de leestijd is: 0 = net begonnen, 1 = antwoorden komen nu.
  const elapsed = previewMs > 0 ? 1 - msLeft / previewMs : 1;
  const secondsLeft = Math.ceil(msLeft / 1000);

  return (
    <HostQuestionLayout
      code={code}
      index={question.index}
      total={question.total}
      variant="preview"
      actions={
        onShowAnswers && (
          <button
            type="button"
            className="host-question__button"
            onClick={onShowAnswers}
          >
            <svg aria-hidden="true" width="20" height="20" viewBox="0 0 24 24">
              <path d="M5 5l9 7-9 7z" />
              <path d="M18 5v14" />
            </svg>
            Antwoorden nu tonen
          </button>
        )
      }
    >
      <div className="host-question__preview">
        <h1 className="host-question__preview-text">{question.text}</h1>
        <div className="host-question__reading">
          <div className="host-question__reading-bar" aria-hidden="true">
            <div style={{ width: `${Math.min(1, elapsed) * 100}%` }} />
          </div>
          <span className="host-question__reading-label">
            {secondsLeft > 0 ? (
              <>
                Antwoorden verschijnen over <strong>{secondsLeft}</strong>{" "}
                {secondsLeft === 1 ? "seconde" : "seconden"}
              </>
            ) : (
              "Antwoorden verschijnen…"
            )}
          </span>
        </div>
      </div>
    </HostQuestionLayout>
  );
}

// Demo op /question?vraag=3 met nepdata. Na de leestijd (of met de knop) door naar de antwoorden.
const DEMO_PREVIEW_SECONDS = 5;

export default function QuestionPreviewPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const index = demoIndexFromSearch(searchParams);
  // useState met een functie: het tijdstip wordt één keer bepaald, niet bij elke render opnieuw.
  const [startsAt] = useState(() => Date.now() + DEMO_PREVIEW_SECONDS * 1000);
  const question = getDemoQuestion(index, {
    startsAt,
    previewSeconds: DEMO_PREVIEW_SECONDS,
  });
  const answersUrl = `/question-answers?vraag=${index + 1}`;

  // In het echt beslist de server wanneer de antwoorden komen. In de demo doet een timer dat.
  useEffect(() => {
    const timer = setTimeout(
      () => navigate(answersUrl),
      startsAt - Date.now(),
    );
    return () => clearTimeout(timer);
  }, [navigate, answersUrl, startsAt]);

  return (
    <HostQuestionPreview
      code={DEMO_CODE}
      question={question}
      onShowAnswers={() => navigate(answersUrl)}
    />
  );
}

/**
 * @typedef {{ index: number, total: number, text: string, options: Array<{ id: number, text: string }>,
 *   timeLimitSec: number, previewSeconds: number, startsAt: number }} QuestionShow
 */
