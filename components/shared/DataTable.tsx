import React from 'react';

interface DataTableProps {
  headers: string[];
  rows: Array<Record<string, any>>;
  rowClassName?: (row: any, idx: number) => string;
  cellClassName?: (value: any, header: string, row: any) => string;
  maxHeight?: string;
  onScroll?: (e: React.UIEvent<HTMLDivElement>) => void;
  stickyHeader?: boolean;
}

export const DataTable: React.FC<DataTableProps> = ({
  headers,
  rows,
  rowClassName,
  cellClassName,
  maxHeight = 'max-h-96',
  onScroll,
  stickyHeader = true
}) => {
  return (
    <div className={`overflow-auto ${maxHeight}`} onScroll={onScroll}>
      <table className="w-full border-collapse bg-white dark:bg-gray-800">
        <thead className={`${stickyHeader ? 'sticky top-0' : ''} bg-gray-50 dark:bg-gray-700 z-10`}>
          <tr>
            {headers.map((header, idx) => (
              <th
                key={idx}
                className="border-b border-gray-200 dark:border-gray-600 p-3 text-left font-semibold text-gray-800 dark:text-gray-100"
              >
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIdx) => (
            <tr
              key={rowIdx}
              className={
                rowClassName
                  ? rowClassName(row, rowIdx)
                  : 'border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }
            >
              {headers.map((header, cellIdx) => {
                const value = row[header.toLowerCase().replace(/\s+/g, '_')];
                return (
                  <td
                    key={cellIdx}
                    className={
                      cellClassName
                        ? cellClassName(value, header, row)
                        : 'p-3 text-gray-700 dark:text-gray-300'
                    }
                  >
                    {value}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
