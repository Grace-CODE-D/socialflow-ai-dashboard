import React, { useState } from 'react';
import { Card } from './ui/Card';
import { LazyImage } from './LazyImage';
import { useVirtualScroll } from '../hooks/useLazyLoad';
import { ViewProps } from '../types';

const MaterialIcon = ({ name, className }: { name: string, className?: string }) => (
  <span className={`material-symbols-outlined ${className}`}>{name}</span>
);

const mockNFTs = Array.from({ length: 100 }, (_, i) => ({
  id: i + 1,
  name: `NFT Collection #${i + 1}`,
  image: `https://picsum.photos/300/300?random=${i}`,
  price: (Math.random() * 10).toFixed(2),
  creator: `Creator ${Math.floor(Math.random() * 20) + 1}`
}));

export const NFTGallery: React.FC<ViewProps> = () => {
  const [nfts] = useState(mockNFTs);
  const ITEM_HEIGHT = 120;
  const CONTAINER_HEIGHT = 600;

  const { visibleItems, offsetY, totalHeight, onScroll } = useVirtualScroll(
    nfts,
    ITEM_HEIGHT,
    CONTAINER_HEIGHT
  );

  return (
    <div className="p-7 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-2xl font-bold text-white">NFT Gallery</h2>
        <button className="flex items-center gap-2 bg-primary-blue hover:bg-blue-700 text-white px-4 py-2 rounded-2xl transition-colors">
          <MaterialIcon name="add" />
          <span className="text-sm font-medium">Mint NFT</span>
        </button>
      </div>

      <Card className="flex-1 overflow-hidden">
        <div
          className="h-full overflow-y-auto"
          onScroll={onScroll}
          style={{ height: CONTAINER_HEIGHT }}
        >
          <div style={{ height: totalHeight, position: 'relative' }}>
            <div style={{ transform: `translateY(${offsetY}px)` }}>
              {visibleItems.map((nft) => (
                <div
                  key={nft.id}
                  className="flex items-center gap-4 p-4 border-b border-dark-border hover:bg-white/5 transition-colors cursor-pointer"
                  style={{ height: ITEM_HEIGHT }}
                >
                  <LazyImage
                    src={nft.image}
                    alt={nft.name}
                    className="w-20 h-20 rounded-lg object-cover"
                  />
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{nft.name}</h3>
                    <p className="text-sm text-gray-subtext">{nft.creator}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-primary-blue font-bold">{nft.price} XLM</p>
                    <button className="text-xs text-gray-subtext hover:text-white mt-1">
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
};
