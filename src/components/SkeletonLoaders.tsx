import React from 'react';
import partLoadImg from '../assets/part-load.webp';
import diagramLoadImg from '../assets/diagram-load.webp';

const partLoadUrl = typeof partLoadImg === 'string' ? partLoadImg : (partLoadImg?.src || '/src/assets/part-load.webp');
const diagramLoadUrl = typeof diagramLoadImg === 'string' ? diagramLoadImg : (diagramLoadImg?.src || '/src/assets/diagram-load.webp');

/**
 * Skeleton loader for individual product cards in the parts catalog (/catalogo)
 */
export const ProductCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between h-full animate-pulse">
      <div>
        {/* Top badges skeleton */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="h-5 w-20 bg-slate-200 rounded-md"></div>
          <div className="h-5 w-16 bg-slate-200 rounded-md"></div>
        </div>

        {/* Image viewport skeleton with motorcycle silhouette */}
        <div className="relative aspect-4/3 bg-slate-100 rounded-xl mb-4 border border-slate-100 flex items-center justify-center p-4 overflow-hidden">
          <img
            src={partLoadUrl}
            alt="Cargando..."
            className="w-full h-full object-contain opacity-40 animate-pulse pointer-events-none select-none"
          />
        </div>

        {/* Title skeleton */}
        <div className="space-y-2 mb-3">
          <div className="h-4 bg-slate-200 rounded-md w-5/6"></div>
          <div className="h-3.5 bg-slate-200 rounded-md w-3/4"></div>
        </div>

        {/* OEM Code skeleton */}
        <div className="h-3 bg-slate-200 rounded-md w-1/2 mb-4"></div>
      </div>

      {/* Footer skeleton */}
      <div className="pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="space-y-1">
          <div className="h-3 bg-slate-200 rounded w-12"></div>
          <div className="h-5 bg-slate-200 rounded w-24"></div>
        </div>

        <div className="h-9 w-24 bg-slate-200 rounded-xl"></div>
      </div>
    </div>
  );
};

/**
 * Grid of ProductCardSkeletons for /catalogo
 */
export const ProductCatalogSkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
};

/**
 * Skeleton loader for diagram cards in the schematics catalog (/despieces)
 */
export const DiagramCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-xs animate-pulse">
      {/* Diagram image preview skeleton with motorcycle silhouette */}
      <div className="relative aspect-4/3 bg-slate-100 border-b border-slate-200 p-4 flex items-center justify-center overflow-hidden">
        <img
          src={diagramLoadUrl}
          alt="Cargando despiece..."
          className="w-full h-full object-contain opacity-35 animate-pulse pointer-events-none select-none"
        />
        <div className="absolute top-2 left-2 h-5 w-20 bg-slate-200 rounded-md"></div>
        <div className="absolute top-2 right-2 h-5 w-16 bg-slate-200 rounded-md"></div>
      </div>

      {/* Card body skeleton */}
      <div className="p-4 space-y-3">
        <div className="h-4 bg-slate-200 rounded-md w-4/5"></div>
        <div className="h-3 bg-slate-200 rounded-md w-3/5"></div>

        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div className="h-3 bg-slate-200 rounded w-20"></div>
          <div className="h-4 w-4 bg-slate-200 rounded-full"></div>
        </div>
      </div>
    </div>
  );
};

/**
 * Grid of DiagramCardSkeletons for /despieces
 */
export const DiagramCatalogSkeletonGrid: React.FC<{ count?: number }> = ({ count = 6 }) => {
  return (
    <div className="space-y-8">
      {/* Section Header Skeleton */}
      <div className="flex items-center justify-between pb-3 border-b-2 border-slate-200">
        <div className="h-7 w-48 bg-slate-200 rounded-lg animate-pulse"></div>
        <div className="h-5 w-24 bg-slate-200 rounded-md animate-pulse"></div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-5">
        {Array.from({ length: count }).map((_, i) => (
          <DiagramCardSkeleton key={i} />
        ))}
      </div>
    </div>
  );
};
