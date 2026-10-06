import { Button, Col, Row } from 'antd'
import { answerColors } from '../theme.js'

/**
 * Grote gekleurde antwoordknoppen (2x2), voor de telefoon van de speler.
 * TODO(team, Fase 4):
 * - Bij klikken: emitWithAck(PLAYER_ANSWER, { questionIndex, optionId }).
 * - Na het kiezen alle knoppen uitschakelen en "Antwoord verstuurd!" tonen.
 * - Bij questionPreviewSeconds > 0: knoppen pas tonen na de leestijd.
 * @param {{ options: { id: number, text: string }[], disabled?: boolean, onAnswer: (optionId: number) => void }} props
 */
export default function AnswerButtons({ options, disabled, onAnswer }) {
  return (
    <Row gutter={[12, 12]}>
      {options.map((option, index) => (
        <Col xs={24} sm={12} key={option.id}>
          <Button
            block
            size="large"
            disabled={disabled}
            onClick={() => onAnswer?.(option.id)}
            style={{
              height: 80,
              whiteSpace: 'normal',
              color: '#fff',
              background: answerColors[index % answerColors.length],
              border: 'none',
            }}
          >
            {option.text}
          </Button>
        </Col>
      ))}
    </Row>
  )
}
