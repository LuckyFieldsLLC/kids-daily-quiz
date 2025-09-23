import React from 'react';
import type { AppSettings } from '../types';

interface FooterProps {
    appTheme: AppSettings['appearance']['appTheme'];
    appName: string;
}

const themeClasses: { [key: string]: string } = {
    blue: 'bg-blue-800',
    sakura: 'bg-pink-800',
    green: 'bg-emerald-800',
    dark: 'bg-gray-900',
};

const Footer: React.FC<FooterProps> = ({ appTheme, appName }) => {
    const footerClass = themeClasses[appTheme] || themeClasses.blue;
    return (
        <footer className={`${footerClass} text-white text-center py-4 mt-8`}>
            <div className="container mx-auto px-4">
                <p>&copy; {new Date().getFullYear()} {appName}. All rights reserved.</p>
            </div>
        </footer>
    );
};

export default Footer;