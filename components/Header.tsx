import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import Tooltip from './Tooltip';
import Button from './Button';
import type { AppSettings } from '../types';

interface HeaderProps {
  appName: string;
  appIcon: string;
  appTheme: AppSettings['appearance']['appTheme'];
  onAddNew: () => void;
  onGenerateAi: () => void;
  onSettings: () => void;
  onGoHome: () => void;
  onHelp: () => void;
}

const themeClasses: { [key: string]: string } = {
    blue: 'bg-blue-800',
    sakura: 'bg-pink-800',
    green: 'bg-emerald-800',
    dark: 'bg-gray-900',
};


const Header: React.FC<HeaderProps> = ({ appName, appIcon, appTheme, onAddNew, onGenerateAi, onSettings, onGoHome, onHelp }) => {
  const { user, login, logout, isAdmin } = useAuth();
  const headerClass = themeClasses[appTheme] || themeClasses.blue;

  return (
    <header className={`${headerClass} text-white shadow-md`}>
      <div className="container mx-auto px-4 py-3 flex justify-between items-center">
        <h1 onClick={onGoHome} className="text-2xl font-bold cursor-pointer hover:opacity-80 flex items-center gap-3">
            <span className="text-3xl">{appIcon}</span>
            {appName}
        </h1>
        <div className="flex items-center gap-2 md:gap-4">
          {user ? (
            <>
              {isAdmin && (
                <>
                   <Tooltip text="新しいクイズを手動で作成します。">
                     <Button variant="secondary" size="md" onClick={onAddNew}>新規作成</Button>
                   </Tooltip>
                  <Tooltip text="トピックを指定してAIにクイズを自動生成させます。">
                    <Button variant="primary" size="md" onClick={onGenerateAi} leftIcon={<span>🤖</span>}>AIで作成</Button>
                  </Tooltip>
                   <Tooltip text="データ保存先やAPIキーなどの設定を変更します。">
                      <Button variant="ghost" size="md" onClick={onSettings} aria-label="設定" leftIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>}>
                        設定
                      </Button>
                   </Tooltip>
                </>
              )}
              <Tooltip text="このアプリの使い方を表示します。">
                <Button variant="ghost" size="md" onClick={onHelp} leftIcon={<svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>}>
                  ヘルプ
                </Button>
              </Tooltip>
              <span className="font-medium hidden md:inline">{user.name}</span>
              <Button variant="outline" onClick={logout}>ログアウト</Button>
            </>
          ) : (
            <Button onClick={() => login('admin@example.com')} variant="primary">管理者としてログイン</Button>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;