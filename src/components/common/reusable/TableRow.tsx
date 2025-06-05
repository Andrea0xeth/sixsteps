import React from 'react';
import { Tooltip } from './ReusableTable';

export interface TableCellProps {
  content: React.ReactNode;
  width: string;
  align?: 'left' | 'center' | 'right';
  tooltip?: string;
  customClasses?: string;
}

export interface TableRowProps {
  cells: TableCellProps[];
  onClick?: () => void;
  isHighlighted?: boolean;
  isSelected?: boolean;
  isLast?: boolean;
  hasWarning?: boolean;
  warningMessage?: string;
}

const TableRow: React.FC<TableRowProps> = ({ 
  cells, 
  onClick, 
  isHighlighted = false,
  isSelected = false,
  isLast = false,
  hasWarning = false,
  warningMessage = ''
}) => {
  return (
    <div 
      className={`
        flex items-center px-3 py-3 border-b border-gray-100 dark:border-dark-border-primary
        ${isLast ? 'rounded-b-lg' : ''}
        ${isSelected ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
        ${hasWarning ? 'bg-amber-50 dark:bg-amber-900/20 border-l-4 border-l-amber-500 dark:border-l-amber-400' : ''}
        ${!isSelected && !hasWarning && (isHighlighted ? 'bg-blue-50/50 dark:bg-blue-900/10' : 'hover:bg-blue-50/80 dark:hover:bg-blue-900/20')}
        transition-colors duration-150 
        ${onClick ? 'cursor-pointer' : ''}
        relative
        rounded-xl my-1
        bg-white dark:bg-dark-bg-secondary
      `}
      onClick={onClick}
    >
      {cells.map((cell, index) => (
        <div 
          key={index} 
          className={`${cell.width} ${cell.align === 'center' ? 'text-center' : cell.align === 'right' ? 'text-right' : ''} ${cell.customClasses || ''}`}
        >
          {cell.tooltip ? (
            <Tooltip text={cell.tooltip} position="top">
              {cell.content}
            </Tooltip>
          ) : (
            cell.content
          )}
        </div>
      ))}
    </div>
  );
};

export default TableRow;
