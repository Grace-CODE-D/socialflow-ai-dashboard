import React, { useState, useEffect, useMemo, useCallback } from "react";
import { Card } from "../ui/Card";
import {
  ViewProps,
  NFT,
  NFTTransfer,
  NFTFilterState,
  NFTSortOption,
} from "../../types";

const MaterialIcon = ({
  name,
  className,
}: {
  name: string;
  className?: string;
}) => <span className={`material-symbols-outlined ${className}`}>{name}</span>;

// Mock NFT Data
const mockNFTs: NFT[] = [
  {
    id: "1",
    tokenId: "1234",
    contractAddress: "GABC123...",
    title: "Cosmic Dreams #1",
    description:
      "A unique digital artwork representing the infinite cosmos and dreams of the future.",
    image: "https://picsum.photos/seed/nft1/400/400",
    imageThumbnail: "https://picsum.photos/seed/nft1/200/200",
    externalUrl: "https://stellar.expert/tx/abc123",
    attributes: [
      { trait_type: "Background", value: "Cosmic Purple" },
      { trait_type: "Rarity", value: "Legendary" },
      { trait_type: "Edition", value: "1 of 1" },
    ],
    collection: "Cosmic Dreams",
    collectionImage: "https://picsum.photos/seed/collection1/50/50",
    owner: "GABCD123456789",
    creator: "GCREATOR123456",
    createdAt: "2024-01-15T10:30:00Z",
    updatedAt: "2024-01-20T15:45:00Z",
    ipfsImage: "ipfs://Qm123...",
  },
  {
    id: "2",
    tokenId: "1235",
    contractAddress: "GDEF456...",
    title: "Digital Genesis",
    description:
      "The beginning of a new digital era. A piece of history in the making.",
    image: "https://picsum.photos/seed/nft2/400/400",
    imageThumbnail: "https://picsum.photos/seed/nft2/200/200",
    attributes: [
      { trait_type: "Background", value: "Neon Blue" },
      { trait_type: "Rarity", value: "Rare" },
      { trait_type: "Style", value: "Abstract" },
    ],
    collection: "Digital Genesis",
    owner: "GOWNER456789",
    creator: "GARTIST987654",
    createdAt: "2024-02-10T08:00:00Z",
    updatedAt: "2024-02-15T12:00:00Z",
  },
  {
    id: "3",
    tokenId: "1236",
    contractAddress: "GHIJ789...",
    title: "Stellar Dreams",
    description: "Reach for the stars with this exclusive digital collectible.",
    image: "https://picsum.photos/seed/nft3/400/400",
    imageThumbnail: "https://picsum.photos/seed/nft3/200/200",
    attributes: [
      { trait_type: "Background", value: "Stellar Gold" },
      { trait_type: "Rarity", value: "Epic" },
      { trait_type: "Theme", value: "Space" },
    ],
    collection: "Cosmic Dreams",
    collectionImage: "https://picsum.photos/seed/collection1/50/50",
    owner: "GME123456789",
    creator: "GCREATOR123456",
    createdAt: "2024-03-05T14:20:00Z",
    updatedAt: "2024-03-10T09:30:00Z",
    ipfsImage: "ipfs://Qm456...",
  },
  {
    id: "4",
    tokenId: "1237",
    contractAddress: "GKLM012...",
    title: "Abstract Vision",
    description: "A mesmerizing abstract piece that challenges perception.",
    image: "https://picsum.photos/seed/nft4/400/400",
    imageThumbnail: "https://picsum.photos/seed/nft4/200/200",
    attributes: [
      { trait_type: "Background", value: "Dark Matter" },
      { trait_type: "Rarity", value: "Common" },
      { trait_type: "Style", value: "Abstract" },
    ],
    collection: "Abstract Art",
    owner: "GOWNER789012",
    creator: "GARTIST456789",
    createdAt: "2024-03-20T11:00:00Z",
    updatedAt: "2024-03-25T16:00:00Z",
  },
  {
    id: "5",
    tokenId: "1238",
    contractAddress: "GNOP345...",
    title: "Cyber Punk 2077",
    description: "A futuristic tribute to the cyberpunk aesthetic.",
    image: "https://picsum.photos/seed/nft5/400/400",
    imageThumbnail: "https://picsum.photos/seed/nft5/200/200",
    externalUrl: "https://stellar.expert/tx/xyz789",
    attributes: [
      { trait_type: "Background", value: "Neon Pink" },
      { trait_type: "Rarity", value: "Ultra Rare" },
      { trait_type: "Theme", value: "Cyberpunk" },
    ],
    collection: "Digital Genesis",
    owner: "GCYBER678901",
    creator: "GARTIST987654",
    createdAt: "2024-04-01T09:15:00Z",
    updatedAt: "2024-04-05T14:30:00Z",
    ipfsImage: "ipfs://Qm789...",
  },
  {
    id: "6",
    tokenId: "1239",
    contractAddress: "GQRS678...",
    title: "Ocean Depths",
    description: "Explore the mysterious depths of the digital ocean.",
    image: "https://picsum.photos/seed/nft6/400/400",
    imageThumbnail: "https://picsum.photos/seed/nft6/200/200",
    attributes: [
      { trait_type: "Background", value: "Deep Ocean" },
      { trait_type: "Rarity", value: "Rare" },
      { trait_type: "Theme", value: "Ocean" },
    ],
    collection: "Nature Collection",
    owner: "GOCEAN123456",
    creator: "GNATURE789012",
    createdAt: "2024-04-10T13:45:00Z",
    updatedAt: "2024-04-15T10:20:00Z",
  },
];

// Mock transfer history
const mockTransfers: Record<string, NFTTransfer[]> = {
  "1": [
    {
      id: "t1",
      from: "GMINT123456",
      to: "GABCD123456789",
      timestamp: "2024-01-15T10:30:00Z",
      transactionHash: "tx123abc",
      price: "100 XLM",
    },
    {
      id: "t2",
      from: "GABCD123456789",
      to: "GSELLER456789",
      timestamp: "2024-01-18T14:20:00Z",
      transactionHash: "tx456def",
      price: "150 XLM",
    },
    {
      id: "t3",
      from: "GSELLER456789",
      to: "GABCD123456789",
      timestamp: "2024-01-20T15:45:00Z",
      transactionHash: "tx789ghi",
      price: "200 XLM",
    },
  ],
  "2": [
    {
      id: "t4",
      from: "GMINT789012",
      to: "GOWNER456789",
      timestamp: "2024-02-10T08:00:00Z",
      transactionHash: "tx101jkl",
      price: "75 XLM",
    },
  ],
  "3": [
    {
      id: "t5",
      from: "GMINT345678",
      to: "GINITIAL456",
      timestamp: "2024-03-05T14:20:00Z",
      transactionHash: "tx202mno",
      price: "250 XLM",
    },
    {
      id: "t6",
      from: "GINITIAL456",
      to: "GME123456789",
      timestamp: "2024-03-10T09:30:00Z",
      transactionHash: "tx303pqr",
      price: "300 XLM",
    },
  ],
};

// Get unique collections
const getCollections = (nfts: NFT[]): string[] => {
  const collections = new Set(nfts.map((nft) => nft.collection));
  return Array.from(collections);
};

// Loading Skeleton Component
const NFTCardSkeleton: React.FC = () => (
  <div className="animate-pulse">
    <div className="bg-dark-surface rounded-2xl overflow-hidden">
      <div className="aspect-square bg-dark-border animate-pulse"></div>
      <div className="p-4 space-y-3">
        <div className="h-4 bg-dark-border rounded w-3/4"></div>
        <div className="h-3 bg-dark-border rounded w-1/2"></div>
      </div>
    </div>
  </div>
);

// NFT Card Component
interface NFTCardProps {
  nft: NFT;
  onClick: (nft: NFT) => void;
}

const NFTCard: React.FC<NFTCardProps> = ({ nft, onClick }) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);

  return (
    <div
      onClick={() => onClick(nft)}
      className="group bg-dark-surface rounded-2xl overflow-hidden border border-dark-border hover:border-primary-blue/50 transition-all duration-300 cursor-pointer hover:shadow-lg hover:shadow-primary-blue/10"
    >
      <div className="aspect-square relative overflow-hidden bg-dark-border">
        {!imageLoaded && !imageError && (
          <div className="absolute inset-0 bg-dark-border animate-pulse"></div>
        )}
        <img
          src={nft.imageThumbnail}
          alt={nft.title}
          loading="lazy"
          onLoad={() => setImageLoaded(true)}
          onError={() => setImageError(true)}
          className={`w-full h-full object-cover transition-transform duration-300 group-hover:scale-105 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
        />
        {imageError && (
          <div className="absolute inset-0 flex items-center justify-center bg-dark-border">
            <MaterialIcon
              name="broken_image"
              className="text-4xl text-gray-subtext"
            />
          </div>
        )}
        <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="bg-black/60 backdrop-blur-sm px-2 py-1 rounded-lg text-xs text-white">
            #{nft.tokenId}
          </span>
        </div>
      </div>
      <div className="p-4">
        <h3 className="font-semibold text-white truncate">{nft.title}</h3>
        <p className="text-sm text-gray-subtext truncate">{nft.collection}</p>
      </div>
    </div>
  );
};

// NFT Detail Modal
interface NFTDetailModalProps {
  nft: NFT;
  transfers: NFTTransfer[];
  onClose: () => void;
  onTransfer: (nft: NFT) => void;
}

const NFTDetailModal: React.FC<NFTDetailModalProps> = ({
  nft,
  transfers,
  onClose,
  onTransfer,
}) => {
  const [showTransferModal, setShowTransferModal] = useState(false);

  const formatAddress = (addr: string) => {
    if (addr.length <= 12) return addr;
    return `${addr.slice(0, 6)}...${addr.slice(-4)}`;
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (showTransferModal) {
    return (
      <TransferModal nft={nft} onClose={() => setShowTransferModal(false)} />
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-dark-bg rounded-3xl max-w-4xl w-full max-h-[90vh] overflow-hidden border border-dark-border animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 p-2 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
        >
          <MaterialIcon name="close" />
        </button>

        <div className="flex flex-col lg:flex-row max-h-[90vh] overflow-y-auto">
          {/* Image Section */}
          <div className="lg:w-1/2 bg-dark-surface p-8 flex items-center justify-center">
            <img
              src={nft.image}
              alt={nft.title}
              className="max-w-full max-h-[400px] rounded-2xl object-contain"
            />
          </div>

          {/* Details Section */}
          <div className="lg:w-1/2 p-8 space-y-6 overflow-y-auto">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="px-3 py-1 bg-primary-blue/20 text-primary-blue text-xs rounded-full">
                  {nft.collection}
                </span>
                <span className="text-gray-subtext text-sm">
                  #{nft.tokenId}
                </span>
              </div>
              <h2 className="text-3xl font-bold text-white">{nft.title}</h2>
            </div>

            {nft.description && (
              <div>
                <h3 className="text-sm font-semibold text-gray-subtext mb-2">
                  Description
                </h3>
                <p className="text-white/80">{nft.description}</p>
              </div>
            )}

            {/* Attributes */}
            {nft.attributes.length > 0 && (
              <div>
                <h3 className="text-sm font-semibold text-gray-subtext mb-3">
                  Attributes
                </h3>
                <div className="flex flex-wrap gap-2">
                  {nft.attributes.map((attr, idx) => (
                    <div
                      key={idx}
                      className="px-4 py-2 bg-dark-surface rounded-xl border border-dark-border"
                    >
                      <p className="text-xs text-gray-subtext">
                        {attr.trait_type}
                      </p>
                      <p className="text-sm font-medium text-white">
                        {attr.value}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Ownership Info */}
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-dark-surface rounded-2xl">
                <p className="text-xs text-gray-subtext mb-1">Owner</p>
                <p className="text-sm font-mono text-white">
                  {formatAddress(nft.owner)}
                </p>
              </div>
              <div className="p-4 bg-dark-surface rounded-2xl">
                <p className="text-xs text-gray-subtext mb-1">Creator</p>
                <p className="text-sm font-mono text-white">
                  {formatAddress(nft.creator)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-dark-surface rounded-2xl">
                <p className="text-xs text-gray-subtext mb-1">Created</p>
                <p className="text-sm text-white">
                  {formatDate(nft.createdAt)}
                </p>
              </div>
              <div className="p-4 bg-dark-surface rounded-2xl">
                <p className="text-xs text-gray-subtext mb-1">Contract</p>
                <p className="text-sm font-mono text-white">
                  {formatAddress(nft.contractAddress)}
                </p>
              </div>
            </div>

            {/* IPFS Link */}
            {nft.ipfsImage && (
              <a
                href={nft.ipfsImage}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-primary-blue hover:text-blue-400 transition-colors"
              >
                <MaterialIcon name="link" />
                <span className="text-sm">View on IPFS</span>
              </a>
            )}

            {/* Actions */}
            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setShowTransferModal(true)}
                className="flex-1 flex items-center justify-center gap-2 bg-primary-blue hover:bg-blue-600 text-white py-3 rounded-2xl transition-colors"
              >
                <MaterialIcon name="send" />
                <span>Transfer</span>
              </button>
              {nft.externalUrl && (
                <a
                  href={nft.externalUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 bg-dark-surface hover:bg-dark-border text-white py-3 px-6 rounded-2xl transition-colors"
                >
                  <MaterialIcon name="open_in_new" />
                </a>
              )}
            </div>

            {/* Provenance / History */}
            {transfers.length > 0 && (
              <div className="pt-6 border-t border-dark-border">
                <h3 className="text-lg font-semibold text-white mb-4">
                  Provenance
                </h3>
                <div className="space-y-4">
                  {transfers.map((transfer, idx) => (
                    <div key={transfer.id} className="relative pl-6">
                      {/* Timeline line */}
                      {idx < transfers.length - 1 && (
                        <div className="absolute left-2 top-6 bottom-[-16px] w-0.5 bg-dark-border"></div>
                      )}
                      {/* Timeline dot */}
                      <div className="absolute left-0 top-1 w-4 h-4 rounded-full bg-primary-blue border-2 border-dark-bg"></div>

                      <div className="bg-dark-surface rounded-xl p-4">
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <p className="text-sm text-white">
                              <span className="text-gray-subtext">From:</span>{" "}
                              {formatAddress(transfer.from)}
                            </p>
                            <p className="text-sm text-white">
                              <span className="text-gray-subtext">To:</span>{" "}
                              {formatAddress(transfer.to)}
                            </p>
                          </div>
                          {transfer.price && (
                            <span className="px-2 py-1 bg-primary-teal/20 text-primary-teal text-xs rounded-lg">
                              {transfer.price}
                            </span>
                          )}
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-gray-subtext">
                            {formatDate(transfer.timestamp)}
                          </p>
                          <a
                            href={`https://stellar.expert/tx/${transfer.transactionHash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary-blue hover:text-blue-400 flex items-center gap-1"
                          >
                            View on Stellar Expert
                            <MaterialIcon
                              name="open_in_new"
                              className="text-xs"
                            />
                          </a>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

// Transfer Modal
interface TransferModalProps {
  nft: NFT;
  onClose: () => void;
}

const TransferModal: React.FC<TransferModalProps> = ({ nft, onClose }) => {
  const [recipientAddress, setRecipientAddress] = useState("");
  const [isValidAddress, setIsValidAddress] = useState<boolean | null>(null);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [isTransferring, setIsTransferring] = useState(false);
  const [transferSuccess, setTransferSuccess] = useState(false);

  // Simulated gas fee
  const gasFee = "0.5 XLM";

  // Validate Stellar address (simplified validation)
  const validateAddress = useCallback((address: string) => {
    if (!address) {
      setIsValidAddress(null);
      return;
    }
    // Basic Stellar address validation (starts with G, length 56)
    const isValid = /^G[A-Z0-9]{55}$/.test(address);
    setIsValidAddress(isValid);
  }, []);

  const handleAddressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.toUpperCase();
    setRecipientAddress(value);
    validateAddress(value);
  };

  const handleTransfer = async () => {
    setIsTransferring(true);
    // Simulate transfer transaction
    await new Promise((resolve) => setTimeout(resolve, 2000));
    setIsTransferring(false);
    setTransferSuccess(true);
  };

  if (transferSuccess) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div className="absolute inset-0 bg-black/70 backdrop-blur-sm"></div>
        <div className="relative bg-dark-bg rounded-3xl p-8 max-w-md w-full border border-dark-border animate-fade-in text-center">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-primary-teal/20 flex items-center justify-center">
            <MaterialIcon
              name="check_circle"
              className="text-5xl text-primary-teal"
            />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">
            Transfer Successful!
          </h2>
          <p className="text-gray-subtext mb-6">
            {nft.title} has been successfully transferred to{" "}
            {recipientAddress.slice(0, 6)}...{recipientAddress.slice(-4)}
          </p>
          <button
            onClick={onClose}
            className="w-full bg-primary-blue hover:bg-blue-600 text-white py-3 rounded-2xl transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      ></div>
      <div className="relative bg-dark-bg rounded-3xl max-w-md w-full p-6 border border-dark-border animate-fade-in">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-subtext hover:text-white transition-colors"
        >
          <MaterialIcon name="close" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary-blue/20 flex items-center justify-center">
            <MaterialIcon name="send" className="text-2xl text-primary-blue" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Transfer NFT</h2>
            <p className="text-sm text-gray-subtext">{nft.title}</p>
          </div>
        </div>

        {!isConfirmed ? (
          <>
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-subtext mb-2">
                Recipient Address
              </label>
              <input
                type="text"
                value={recipientAddress}
                onChange={handleAddressChange}
                placeholder="Enter Stellar address (G...)"
                className={`w-full px-4 py-3 bg-dark-surface border rounded-2xl text-white placeholder-gray-subtext focus:outline-none transition-colors ${
                  isValidAddress === true
                    ? "border-primary-teal focus:border-primary-teal"
                    : isValidAddress === false
                      ? "border-red-500 focus:border-red-500"
                      : "border-dark-border focus:border-primary-blue"
                }`}
              />
              {isValidAddress === false && (
                <p className="mt-2 text-sm text-red-400">
                  Invalid Stellar address format
                </p>
              )}
              <p className="mt-2 text-xs text-gray-subtext">
                Enter a valid Stellar public key (starts with G, 56 characters)
              </p>
            </div>

            <div className="p-4 bg-dark-surface rounded-2xl mb-6">
              <div className="flex justify-between items-center">
                <span className="text-gray-subtext">Estimated Gas Fee</span>
                <span className="text-white font-medium">{gasFee}</span>
              </div>
            </div>

            <button
              onClick={() => setIsConfirmed(true)}
              disabled={!isValidAddress}
              className={`w-full py-3 rounded-2xl transition-colors ${
                isValidAddress
                  ? "bg-primary-blue hover:bg-blue-600 text-white"
                  : "bg-dark-border text-gray-subtext cursor-not-allowed"
              }`}
            >
              Continue
            </button>
          </>
        ) : (
          <>
            <div className="p-4 bg-dark-surface rounded-2xl mb-6">
              <h3 className="text-sm font-medium text-gray-subtext mb-3">
                Transfer Summary
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-subtext">NFT</span>
                  <span className="text-white truncate max-w-[200px]">
                    {nft.title}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-subtext">To</span>
                  <span className="text-white font-mono text-sm">
                    {recipientAddress.slice(0, 10)}...
                    {recipientAddress.slice(-4)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-subtext">Gas Fee</span>
                  <span className="text-white">{gasFee}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setIsConfirmed(false)}
                className="flex-1 py-3 bg-dark-surface hover:bg-dark-border text-white rounded-2xl transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleTransfer}
                disabled={isTransferring}
                className="flex-1 py-3 bg-primary-teal hover:bg-teal-600 text-white rounded-2xl transition-colors flex items-center justify-center gap-2"
              >
                {isTransferring ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    <span>Transferring...</span>
                  </>
                ) : (
                  <>
                    <MaterialIcon name="check" />
                    <span>Confirm Transfer</span>
                  </>
                )}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

// Main NFT Gallery Component
export const NFTGallery: React.FC<ViewProps> = () => {
  const [nfts] = useState<NFT[]>(mockNFTs);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedNFT, setSelectedNFT] = useState<NFT | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);

  // Filter state
  const [filters, setFilters] = useState<NFTFilterState>({
    collection: null,
    searchQuery: "",
    dateFrom: null,
    dateTo: null,
    sortBy: "date_desc",
  });

  // Show filters panel
  const [showFilters, setShowFilters] = useState(false);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Persist filter preferences to localStorage
  useEffect(() => {
    const savedFilters = localStorage.getItem("nft-gallery-filters");
    if (savedFilters) {
      try {
        setFilters(JSON.parse(savedFilters));
      } catch (e) {
        console.error("Failed to parse saved filters");
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("nft-gallery-filters", JSON.stringify(filters));
  }, [filters]);

  const collections = useMemo(() => getCollections(nfts), [nfts]);

  // Filter and sort NFTs
  const filteredNFTs = useMemo(() => {
    let result = [...nfts];

    // Filter by collection
    if (filters.collection) {
      result = result.filter((nft) => nft.collection === filters.collection);
    }

    // Filter by search query
    if (filters.searchQuery) {
      const query = filters.searchQuery.toLowerCase();
      result = result.filter(
        (nft) =>
          nft.title.toLowerCase().includes(query) ||
          nft.tokenId.includes(query) ||
          nft.description.toLowerCase().includes(query),
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      result = result.filter(
        (nft) => new Date(nft.createdAt) >= new Date(filters.dateFrom!),
      );
    }
    if (filters.dateTo) {
      result = result.filter(
        (nft) => new Date(nft.createdAt) <= new Date(filters.dateTo!),
      );
    }

    // Sort
    switch (filters.sortBy) {
      case "date_desc":
        result.sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
        );
        break;
      case "date_asc":
        result.sort(
          (a, b) =>
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime(),
        );
        break;
      case "name_asc":
        result.sort((a, b) => a.title.localeCompare(b.title));
        break;
      case "name_desc":
        result.sort((a, b) => b.title.localeCompare(a.title));
        break;
      case "collection":
        result.sort((a, b) => a.collection.localeCompare(b.collection));
        break;
    }

    return result;
  }, [nfts, filters]);

  const handleNFTClick = (nft: NFT) => {
    setSelectedNFT(nft);
    setShowDetailModal(true);
  };

  const handleTransfer = (nft: NFT) => {
    setSelectedNFT(nft);
    setShowDetailModal(false);
  };

  const clearFilters = () => {
    setFilters({
      collection: null,
      searchQuery: "",
      dateFrom: null,
      dateTo: null,
      sortBy: "date_desc",
    });
  };

  const hasActiveFilters =
    filters.collection ||
    filters.searchQuery ||
    filters.dateFrom ||
    filters.dateTo;

  return (
    <div className="p-7 h-full flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex justify-between items-center mb-7">
        <h2 className="text-2xl font-bold text-white">NFT Gallery</h2>
        <div className="flex gap-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={`flex items-center gap-2 px-4 py-2 rounded-2xl transition-colors ${
              showFilters || hasActiveFilters
                ? "bg-primary-blue/20 text-primary-blue"
                : "bg-dark-surface text-gray-subtext hover:text-white"
            }`}
          >
            <MaterialIcon name="filter_list" />
            <span className="text-sm font-medium">Filters</span>
            {hasActiveFilters && (
              <span className="w-2 h-2 bg-primary-blue rounded-full"></span>
            )}
          </button>
        </div>
      </div>

      {/* Search and Sort Bar */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 relative">
          <MaterialIcon
            name="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-subtext"
          />
          <input
            type="text"
            placeholder="Search by name or ID..."
            value={filters.searchQuery}
            onChange={(e) =>
              setFilters((prev) => ({ ...prev, searchQuery: e.target.value }))
            }
            className="w-full pl-12 pr-4 py-3 bg-dark-surface border border-dark-border rounded-2xl text-white placeholder-gray-subtext focus:outline-none focus:border-primary-blue transition-colors"
          />
          {filters.searchQuery && (
            <button
              onClick={() =>
                setFilters((prev) => ({ ...prev, searchQuery: "" }))
              }
              className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-subtext hover:text-white"
            >
              <MaterialIcon name="close" className="text-sm" />
            </button>
          )}
        </div>
        <select
          value={filters.sortBy}
          onChange={(e) =>
            setFilters((prev) => ({
              ...prev,
              sortBy: e.target.value as NFTSortOption,
            }))
          }
          className="px-4 py-3 bg-dark-surface border border-dark-border rounded-2xl text-white focus:outline-none focus:border-primary-blue transition-colors cursor-pointer"
        >
          <option value="date_desc">Newest First</option>
          <option value="date_asc">Oldest First</option>
          <option value="name_asc">Name (A-Z)</option>
          <option value="name_desc">Name (Z-A)</option>
          <option value="collection">Collection</option>
        </select>
      </div>

      {/* Filters Panel */}
      {showFilters && (
        <Card className="mb-6 p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-sm font-semibold text-white">Filters</h3>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="text-sm text-primary-blue hover:text-blue-400"
              >
                Clear All
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Collection Filter */}
            <div>
              <label className="block text-xs text-gray-subtext mb-2">
                Collection
              </label>
              <select
                value={filters.collection || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    collection: e.target.value || null,
                  }))
                }
                className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-xl text-white text-sm focus:outline-none focus:border-primary-blue"
              >
                <option value="">All Collections</option>
                {collections.map((col) => (
                  <option key={col} value={col}>
                    {col}
                  </option>
                ))}
              </select>
            </div>

            {/* Date From */}
            <div>
              <label className="block text-xs text-gray-subtext mb-2">
                Created After
              </label>
              <input
                type="date"
                value={filters.dateFrom || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateFrom: e.target.value || null,
                  }))
                }
                className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-xl text-white text-sm focus:outline-none focus:border-primary-blue"
              />
            </div>

            {/* Date To */}
            <div>
              <label className="block text-xs text-gray-subtext mb-2">
                Created Before
              </label>
              <input
                type="date"
                value={filters.dateTo || ""}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    dateTo: e.target.value || null,
                  }))
                }
                className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-xl text-white text-sm focus:outline-none focus:border-primary-blue"
              />
            </div>

            {/* Sort */}
            <div>
              <label className="block text-xs text-gray-subtext mb-2">
                Sort By
              </label>
              <select
                value={filters.sortBy}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: e.target.value as NFTSortOption,
                  }))
                }
                className="w-full px-3 py-2 bg-dark-surface border border-dark-border rounded-xl text-white text-sm focus:outline-none focus:border-primary-blue"
              >
                <option value="date_desc">Newest</option>
                <option value="date_asc">Oldest</option>
                <option value="name_asc">Name A-Z</option>
                <option value="name_desc">Name Z-A</option>
                <option value="collection">Collection</option>
              </select>
            </div>
          </div>
        </Card>
      )}

      {/* Results Count */}
      <div className="flex justify-between items-center mb-4">
        <p className="text-sm text-gray-subtext">
          Showing {filteredNFTs.length} of {nfts.length} NFTs
        </p>
      </div>

      {/* NFT Grid */}
      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {Array.from({ length: 8 }).map((_, idx) => (
              <NFTCardSkeleton key={idx} />
            ))}
          </div>
        ) : filteredNFTs.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredNFTs.map((nft) => (
              <NFTCard key={nft.id} nft={nft} onClick={handleNFTClick} />
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-64 text-gray-subtext">
            <MaterialIcon
              name="image_not_supported"
              className="text-5xl mb-4"
            />
            <p>No NFTs found matching your criteria</p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 text-primary-blue hover:text-blue-400"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Detail Modal */}
      {showDetailModal && selectedNFT && (
        <NFTDetailModal
          nft={selectedNFT}
          transfers={mockTransfers[selectedNFT.id] || []}
          onClose={() => setShowDetailModal(false)}
          onTransfer={handleTransfer}
        />
      )}
    </div>
  );
};
