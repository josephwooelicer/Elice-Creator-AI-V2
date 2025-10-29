import React from 'react';
import { HelpCircle, Settings } from '../components/icons/index';

const Header: React.FC = () => {
  return (
    <header className="bg-white shadow-sm fixed top-0 left-0 right-0 z-30">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <h1 className="text-xl font-bold text-slate-800">Elice Creator AI</h1>
            <span className="ml-2 bg-primary-lighter text-primary-text text-xs font-semibold px-2.5 py-0.5 rounded-full">Beta</span>
          </div>
          <div className="flex items-center space-x-4">
            <button className="text-slate-500 hover:text-slate-700">
              <HelpCircle className="w-6 h-6" />
            </button>
            <button className="text-slate-500 hover:text-slate-700">
              <Settings className="w-6 h-6" />
            </button>
            <div className="flex items-center justify-center w-9 h-9 bg-primary-light text-primary-dark rounded-full font-bold text-sm">
              EA
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
