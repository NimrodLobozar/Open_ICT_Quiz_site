import { BrowserRouter, Routes, Route } from "react-router-dom";
import Lobby from "./lobby";

function App() {
  return (
    <BrowserRouter>
    <Routes>
      <route path="/lobby" element={<Lobby />}>

      </route>
    </Routes>
  </BrowserRouter>
  )
}

export default App
