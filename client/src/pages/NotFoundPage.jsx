import { Button, Result } from 'antd'
import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <Result
      status="404"
      title="Pagina niet gevonden"
      subTitle="Deze pagina bestaat niet."
      extra={
        <Link to="/">
          <Button type="primary">Naar de startpagina</Button>
        </Link>
      }
    />
  )
}
