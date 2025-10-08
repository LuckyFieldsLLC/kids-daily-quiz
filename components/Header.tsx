import React from 'react';
import { Cog6ToothIcon, QuestionMarkCircleIcon } from '@heroicons/react/24/outline';
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
               <Button variant="ghost" size="md" onClick={onSettings} aria-label="設定" leftIcon={<Cog6ToothIcon className="h-5 w-5" aria-hidden="true" />}>設定</Button>
             </Tooltip>
                </>
              )}
              <Tooltip text="このアプリの使い方を表示します。">
                <Button variant="ghost" size="md" onClick={onHelp} leftIcon={<QuestionMarkCircleIcon className="h-5 w-5" aria-hidden="true" />}>ヘルプ</Button>
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