import PageRings from "../../components/PageRings.jsx";
import QuestionProgress from "../../components/QuestionProgress.jsx";
import QuizHeader from "../../components/QuizHeader.jsx";
import "./QuestionPage.css";

/**
 * Wat de vraagschermen van de host delen: achtergrond, bovenbalk en "Vraag 3 van 8".
 * @param {{ code: string, index?: number, total?: number, aside?: React.ReactNode,
 *   actions?: React.ReactNode, variant: "preview" | "answers" | "leaderboard", children: React.ReactNode }} props
 *   index telt vanaf 0, net als questionIndex in de socket-events. Zonder index geen "Vraag 3 van 8".
 */
export default function HostQuestionLayout({
  code,
  index,
  total,
  aside,
  actions,
  variant,
  children,
}) {
  return (
    <div className="page host-question">
      <PageRings />
      <QuizHeader code={code} large />

      <main className={`page__main host-question__main host-question__main--${variant}`}>
        {index != null && (
          <div className="host-question__top">
            <QuestionProgress index={index} total={total} size="large" />
            {aside}
          </div>
        )}
        {children}
        {actions && <div className="host-question__actions">{actions}</div>}
      </main>
    </div>
  );
}
