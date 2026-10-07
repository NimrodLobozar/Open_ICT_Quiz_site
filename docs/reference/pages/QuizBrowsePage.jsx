// REFERENTIE — deze versie wordt NIET door de app gebruikt.
// Dit was de skeleton-versie van client/src/pages/QuizBrowsePage.jsx voordat die leeggehaald werd.
// Gebruik dit als voorbeeld/inspiratie; kopieer stukken over naar client/src/pages/QuizBrowsePage.jsx.
// Zie docs/reference/README.md.

import { App, Button, Card, Col, Empty, Input, Row, Spin, Tag, Typography } from 'antd'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api/http.js'

// Quiz-overzicht met zoekbalk (projectplan 3.1 stap 2).
// TODO(team, Fase 1–2 afmaken): filteren op beroepsrol, mooiere kaarten, laadstatus per zoekactie.
export default function QuizBrowsePage() {
  const navigate = useNavigate()
  const { message } = App.useApp()
  const [search, setSearch] = useState('')
  const [quizzes, setQuizzes] = useState(null) // null = nog aan het laden

  useEffect(() => {
    let cancelled = false
    api(`/quizzes?search=${encodeURIComponent(search)}`)
      .then((data) => !cancelled && setQuizzes(data))
      .catch((error) => {
        if (cancelled) return
        message.error(error.message)
        setQuizzes([])
      })
    return () => {
      cancelled = true
    }
  }, [search, message])

  return (
    <>
      <Typography.Title level={2}>Kies een quiz</Typography.Title>
      <Input.Search
        placeholder="Zoek op titel of omschrijving"
        allowClear
        enterButton
        size="large"
        onSearch={(value) => setSearch(value.trim())}
        style={{ marginBottom: 16 }}
      />

      {quizzes === null && <Spin size="large" style={{ display: 'block', margin: 40 }} />}
      {quizzes?.length === 0 && <Empty description="Geen quizzen gevonden" />}

      <Row gutter={[16, 16]}>
        {quizzes?.map((quiz) => (
          <Col xs={24} sm={12} lg={8} key={quiz.id}>
            <Card
              title={quiz.title}
              extra={quiz.role && <Tag color={quiz.role.color}>{quiz.role.name}</Tag>}
              actions={[
                <Button type="primary" key="host" onClick={() => navigate(`/host/new/${quiz.id}`)}>
                  Host
                </Button>,
              ]}
            >
              <Typography.Paragraph>{quiz.description}</Typography.Paragraph>
              <Typography.Text type="secondary">{quiz.questionCount} vragen</Typography.Text>
            </Card>
          </Col>
        ))}
      </Row>
    </>
  )
}
