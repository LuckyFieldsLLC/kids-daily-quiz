import React from 'react';

interface LevelSelectorProps {
  label: string;
  options: { [key: number]: string };
  selectedValue: number;
  onChange: (value: number) => void;
  name: string;
}

const LevelSelector: React.FC<LevelSelectorProps> = ({ label, options, selectedValue, onChange, name }) => {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">{label}</label>
      <div className="flex rounded-md shadow-sm" role="radiogroup">
        {Object.entries(options).map(([value, text], index) => {
          const numValue = parseInt(value, 10);
          const isSelected = selectedValue === numValue;
          const positionClasses = index === 0 ? 'rounded-l-md' : index === Object.keys(options).length - 1 ? 'rounded-r-md' : '';
          const borderClasses = index > 0 ? '-ml-px' : '';

          return (
            <button
              type="button"
              key={value}
              name={name}
              onClick={() => onChange(numValue)}
              role="radio"
              aria-checked={isSelected}
              className={`
                relative w-full inline-flex items-center justify-center px-4 py-2 text-sm font-medium border border-gray-300
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:z-10
                transition-colors duration-150
                ${positionClasses}
                ${borderClasses}
                ${isSelected ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 hover:bg-gray-50'}
              `}
            >
              {text}
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default LevelSelector;
