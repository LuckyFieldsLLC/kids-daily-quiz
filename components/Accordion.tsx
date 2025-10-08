import React, { useState, ReactNode } from 'react';
import { ChevronDownIcon } from '@heroicons/react/24/outline';

interface AccordionProps {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}

const Accordion: React.FC<AccordionProps> = ({ title, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="border border-gray-200 rounded-md">
      <button
        onClick={toggleAccordion}
        className="w-full flex justify-between items-center p-4 text-left bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-300 rounded-md"
        aria-expanded={isOpen}
      >
        <span className="font-semibold text-gray-800">{title}</span>
        <ChevronDownIcon className={`h-5 w-5 text-gray-500 transform transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-screen' : 'max-h-0'}`}
        style={{ transition: 'max-height 0.3s ease-in-out' }}
      >
        <div className="bg-white text-gray-700">
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;