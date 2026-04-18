// Removed unused React import
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { CompanyProvider } from './context/CompanyContext';
import { Layout } from './components/Layout';
import { Dashboard } from './pages/Dashboard';
import { UploadModule } from './pages/UploadModule';
import { ReconciliationView } from './pages/ReconciliationView';
import { Login } from './pages/Login';
import { Signup } from './pages/Signup';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
  return (
    <CompanyProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route element={<ProtectedRoute />}>
            <Route path="/" element={<Layout />}>
              <Route index element={<Dashboard />} />
              <Route path="upload" element={<UploadModule />} />
              <Route path="reconciliation" element={<ReconciliationView />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>
        </Routes>
      </BrowserRouter>
    </CompanyProvider>
  );
}

export default App;
