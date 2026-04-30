import { HashRouter, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Home from './views/Home'
import PeriodForm from './views/PeriodForm'
import Dashboard from './views/Dashboard'
import DailyEntry from './views/DailyEntry'
import WeeklySummary from './views/WeeklySummary'
import Statistics from './views/Statistics'

export default function App() {
  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="period/new" element={<PeriodForm />} />
          <Route path="period/:id" element={<Dashboard />} />
          <Route path="period/:id/daily" element={<DailyEntry />} />
          <Route path="period/:id/weekly" element={<WeeklySummary />} />
          <Route path="period/:id/stats" element={<Statistics />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}
