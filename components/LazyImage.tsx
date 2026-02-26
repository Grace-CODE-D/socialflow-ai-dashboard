import React from 'react';
import { useIntersectionObserver } from '../hooks/useLazyLoad';
import { ImageSkeleton } from './ui/Skeleton';

interface LazyImageProps {
  src: string;
  alt: string;
  className?: string;
}

export const LazyImage: React.FC<LazyImageProps> = ({ src, alt, className = '' }) => {
  const { ref, isVisible } = useIntersectionObserver();
  const [loaded, setLoaded] = React.useState(false);

  return (
    <div ref={ref} className={`relative ${className}`}>
      {!loaded && <ImageSkeleton className="absolute inset-0" />}
      {isVisible && (
        <img
          src={src}
          alt={alt}
          className={`${className} transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
          onLoad={() => setLoaded(true)}
        />
      )}
    </div>
  );
};
