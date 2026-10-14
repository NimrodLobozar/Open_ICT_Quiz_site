import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import 'antd/dist/reset.css'
// index.css vóór App: dan komt de CSS van de pagina's erna en wint die bij gelijke selectors.
// Zo kan een pagina bijv. de padding van .page__main aanpassen in haar eigen CSS.
import './index.css'
import { BrowserRouter } from 'react-router-dom'
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>,
)
