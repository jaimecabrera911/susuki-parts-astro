import React from 'react';
import { Package } from 'lucide-react';

interface ProductImageEmptyStateProps {
  className?: string;
}

export const ProductImageEmptyState: React.FC<ProductImageEmptyStateProps> = ({
  className = '',
}) => {
  return (
    <div
      className={`flex items-center justify-center bg-slate-100 text-slate-300 ${className}`}
    >
      <Package className="w-1/3 h-1/3 min-w-4 min-h-4 max-w-6 max-h-6" />
    </div>
  );
};