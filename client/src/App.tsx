import { BrowserRouter, Route, Routes } from 'react-router-dom';
import { AppShell } from './components/AppShell';
import { ToastProvider } from './components/Toast';
import { SettingsProvider } from './context/SettingsContext';
import { Dashboard } from './pages/Dashboard';
import { Library } from './pages/Library';
import { Settings } from './pages/Settings';
import { DocumentsPage } from './pages/DocumentsPage';
import { SourcesPage } from './pages/SourcesPage';
import { ReaderPage } from './pages/ReaderPage';
import { NotesPage } from './pages/NotesPage';
import { ResearchHome } from './pages/ResearchHome';
import { NotFound } from './pages/NotFound';

export function App() {
  return (
    <SettingsProvider>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route element={<AppShell />}>
              <Route index element={<Dashboard />} />
              <Route path="library" element={<Library />} />
              <Route path="settings" element={<Settings />} />
              <Route path="research/:id" element={<ResearchHome />} />
              <Route path="research/:id/documents" element={<DocumentsPage />} />
              <Route path="research/:id/sources" element={<SourcesPage />} />
              <Route path="research/:id/reader" element={<ReaderPage />} />
              <Route path="research/:id/notes" element={<NotesPage />} />
              <Route path="*" element={<NotFound />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </ToastProvider>
    </SettingsProvider>
  );
}
