import { LearnerTestsPage } from './pages/LearnerTestsPage'
import { AdminPanelPage } from './pages/AdminPanelPage'

function App() {
  const user = JSON.parse(localStorage.getItem('quizly_user') || 'null')
  return window.location.pathname.startsWith('/admin') || user?.role === 'admin' ? <AdminPanelPage /> : <LearnerTestsPage />
}

export default App
