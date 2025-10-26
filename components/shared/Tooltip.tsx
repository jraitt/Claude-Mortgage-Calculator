import React, { useState } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
}

export const Tooltip: React.FC<TooltipProps> = ({ content, children }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onClick={() => setIsVisible(!isVisible)}
        className="cursor-help"
      >
        {children}
      </div>
      {isVisible && (
        <div className="absolute z-50 w-64 px-3 py-2 text-sm text-white bg-gray-900 dark:bg-gray-700 rounded-lg shadow-lg -top-2 left-full ml-2 transform -translate-y-full">
          <div className="relative">
            {content}
            {/* Arrow pointing to the icon */}
            <div className="absolute top-1/2 -left-2 transform -translate-y-1/2">
              <div className="border-8 border-transparent border-r-gray-900 dark:border-r-gray-700"></div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
