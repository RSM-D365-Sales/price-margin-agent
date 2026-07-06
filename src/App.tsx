import { HashRouter, Route, Routes } from 'react-router-dom'
import { AppShell } from './components/AppShell'
import { Overview } from './pages/Overview'
import { Overrides } from './pages/Overrides'
import { ThresholdTest } from './pages/ThresholdTest'
import { PriceHistory } from './pages/PriceHistory'
import { Recommendations } from './pages/Recommendations'
import { Setup } from './pages/Setup'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route path="/" element={<Overview />} />
          <Route path="/overrides" element={<Overrides />} />
          <Route path="/threshold-test" element={<ThresholdTest />} />
          <Route path="/price-history" element={<PriceHistory />} />
          <Route path="/recommendations" element={<Recommendations />} />
          <Route path="/setup" element={<Setup />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
