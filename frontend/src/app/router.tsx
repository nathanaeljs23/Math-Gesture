import { BrowserRouter, Routes, Route } from "react-router-dom"

import Battle from "../pages/battle"
import LandingPage from "../pages/landingpage"
import Map from "../pages/map"
import WinScreen from "../pages/winscreen"

export default function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/Battle" element={<Battle />} />
        <Route path="/LandingPage" element={<LandingPage />} />
        <Route path="/Map" element={<Map />} />
        <Route path="/WinScreen" element={<WinScreen />} />
  

      </Routes>
    </BrowserRouter>
  )
}
