import { Progress } from 'antd'

/**
 * TODO(team, Fase 4): aftellende timer voor een vraag.
 * - Krijgt `startsAt` (tijdstip van de server, ms) en `timeLimitSec` uit `question:show`.
 * - Reken de resterende tijd uit met Date.now() in een setInterval (opruimen in useEffect!).
 * - De SERVER bepaalt wanneer de vraag echt eindigt; deze timer is alleen voor de weergave.
 * @param {{ startsAt: number, timeLimitSec: number }} props
 */
export default function QuestionTimer({ timeLimitSec }) {
  return <Progress type="circle" percent={100} format={() => timeLimitSec} size={80} />
}
