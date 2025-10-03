import React from 'react';
import { Link, Route, BrowserRouter as Router, Routes } from 'react-router-dom';

import Footer from './components/Footer';
import Header from './components/Header';
import { AuthProvider } from './contexts/AuthContext';

import HistoryPage from './pages/HistoryPage'; // 履歴・再挑戦
import ImportPage from './pages/ImportPage'; // CSVインポート
import QuizPage from './pages/QuizPage'; // AI生成＋フォーム

// 共通のレイアウトコンポーネント
const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen font-sans bg-gray-50">
      <Header
        appName="Kids Daily Quiz"
        appIcon="🧩"
        appTheme="blue"
        onAddNew={() => {}}
        onGenerateAi={() => {}}
        onSettings={() => {}}
        onGoHome={() => {}}
        onHelp={() => {}}
      />
      <nav className="p-4 bg-gray-200 flex gap-4">
        <Link to="/" className="hover:underline">
          AIクイズ
        </Link>
        <Link to="/import" className="hover:underline">
          CSVインポート
        </Link>
        <Link to="/history" className="hover:underline">
          履歴
        </Link>
      </nav>
      <main className="container mx-auto px-4 py-8 flex-grow">{children}</main>
      <Footer appTheme="blue" appName="Kids Daily Quiz" />
    </div>
  );
};

const App: React.FC = () => (
  <AuthProvider>
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<QuizPage />} />
          <Route path="/import" element={<ImportPage />} />
          <Route path="/history" element={<HistoryPage />} />
        </Routes>
      </Layout>
    </Router>
  </AuthProvider>
);

export default App;
