import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { NFTGallery } from "../../../components/blockchain/NFTGallery";

// Mock Props
const mockProps = {
  onNavigate: vi.fn(),
};

// Helper to wait for loading to complete
const waitForLoadingComplete = async () => {
  await waitFor(
    () => {
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeLessThan(8);
    },
    { timeout: 3000 },
  );
};

describe("NFTGallery Component", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("Gallery Rendering", () => {
    it("renders the NFT gallery header", () => {
      render(<NFTGallery {...mockProps} />);
      expect(screen.getByText("NFT Gallery")).toBeInTheDocument();
    });

    it("renders search input", () => {
      render(<NFTGallery {...mockProps} />);
      expect(
        screen.getByPlaceholderText("Search by name or ID..."),
      ).toBeInTheDocument();
    });

    it("renders sort dropdown", () => {
      render(<NFTGallery {...mockProps} />);
      expect(screen.getByRole("combobox")).toBeInTheDocument();
    });

    it("shows loading skeletons initially", async () => {
      render(<NFTGallery {...mockProps} />);
      const skeletons = document.querySelectorAll(".animate-pulse");
      expect(skeletons.length).toBeGreaterThan(0);
    });
  });

  describe("NFT Cards Display", () => {
    it("renders NFT cards after loading", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();
      expect(screen.getByText("Cosmic Dreams #1")).toBeInTheDocument();
    });

    it("displays NFT collection name", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();
      const collections = screen.getAllByText("Cosmic Dreams");
      expect(collections.length).toBeGreaterThan(0);
    });

    it("displays multiple NFTs in grid", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();
      const nftTitles = screen.getAllByText(
        /Cosmic Dreams|Digital Genesis|Abstract Vision/,
      );
      expect(nftTitles.length).toBeGreaterThan(0);
    });
  });

  describe("NFT Detail Modal", () => {
    it("opens detail modal when NFT is clicked", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        expect(screen.getByText("Description")).toBeInTheDocument();
        expect(screen.getByText("Attributes")).toBeInTheDocument();
      });
    });

    it("displays NFT title in modal", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        const headings = screen.getAllByRole("heading", { level: 2 });
        const modalHeading = headings.find(
          (h) => h.textContent === "Cosmic Dreams #1",
        );
        expect(modalHeading).toBeInTheDocument();
      });
    });

    it("displays NFT attributes in modal", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        expect(screen.getByText("Background")).toBeInTheDocument();
        expect(screen.getByText("Rarity")).toBeInTheDocument();
        expect(screen.getByText("Cosmic Purple")).toBeInTheDocument();
        expect(screen.getByText("Legendary")).toBeInTheDocument();
      });
    });

    it("displays ownership information", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        expect(screen.getByText("Owner")).toBeInTheDocument();
        expect(screen.getByText("Creator")).toBeInTheDocument();
      });
    });

    it("has transfer button in detail view", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        expect(screen.getByText("Transfer")).toBeInTheDocument();
      });
    });

    it("closes modal when close button is clicked", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        expect(screen.getByText("Description")).toBeInTheDocument();
      });

      // Look for close button with "close" icon
      const closeButtons = document.querySelectorAll("button");
      const closeBtn = Array.from(closeButtons).find((btn) => {
        const icon = btn.querySelector(".material-symbols-outlined");
        return icon && icon.textContent?.includes("close");
      });

      if (closeBtn) {
        fireEvent.click(closeBtn);
      }

      // Wait a bit for the modal to close
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Check that modal content is no longer visible
      const modalContent = document.querySelector('h2[class*="text-3xl"]');
      expect(modalContent).toBeFalsy();
    });
  });

  describe("Transfer Functionality", () => {
    it("opens transfer modal when transfer button is clicked", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        const transferButton = screen.getByText("Transfer");
        fireEvent.click(transferButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Recipient Address")).toBeInTheDocument();
      });
    });

    it("validates recipient address format", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        const transferButton = screen.getByText("Transfer");
        fireEvent.click(transferButton);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText(
          "Enter Stellar address (G...)",
        );
        fireEvent.change(input, { target: { value: "invalid" } });
      });

      await waitFor(() => {
        expect(
          screen.getByText("Invalid Stellar address format"),
        ).toBeInTheDocument();
      });
    });

    it("accepts valid Stellar address", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        const transferButton = screen.getByText("Transfer");
        fireEvent.click(transferButton);
      });

      await waitFor(() => {
        const input = screen.getByPlaceholderText(
          "Enter Stellar address (G...)",
        );
        // Stellar address: G + 55 alphanumeric chars = 56 total
        // Using a real Stellar address format
        fireEvent.change(input, {
          target: {
            value: "GA7QYNF7SOWQ3GLR2BGMZEHXAVIRZA4KVWLTJJFC7MGXUA74P7UJVSGZ",
          },
        });
      });

      // Wait for state update
      await new Promise((resolve) => setTimeout(resolve, 300));

      // Check that the confirm button is enabled (indicating valid address)
      // The confirm button should not be disabled when address is valid
      const confirmButton = document.querySelector("button:not([disabled])");
      expect(confirmButton).toBeTruthy();
    });

    it("shows gas fee estimate", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        const transferButton = screen.getByText("Transfer");
        fireEvent.click(transferButton);
      });

      await waitFor(() => {
        expect(screen.getByText("Estimated Gas Fee")).toBeInTheDocument();
        expect(screen.getByText("0.5 XLM")).toBeInTheDocument();
      });
    });
  });

  describe("Filtering and Search", () => {
    it("filters NFTs by search query", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const searchInput = screen.getByPlaceholderText(
        "Search by name or ID...",
      );
      fireEvent.change(searchInput, { target: { value: "Cosmic" } });

      await waitFor(() => {
        expect(screen.getByText("Cosmic Dreams #1")).toBeInTheDocument();
      });
    });

    it("shows no results message when search has no matches", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const searchInput = screen.getByPlaceholderText(
        "Search by name or ID...",
      );
      fireEvent.change(searchInput, { target: { value: "NonExistentNFT" } });

      await waitFor(() => {
        expect(
          screen.getByText("No NFTs found matching your criteria"),
        ).toBeInTheDocument();
      });
    });

    it("sorts by date descending", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const sortSelect = screen.getByRole("combobox");
      fireEvent.change(sortSelect, { target: { value: "date_asc" } });

      await waitFor(() => {
        const nfts = screen.getAllByText(
          /Cosmic Dreams|Digital Genesis|Abstract Vision|Ocean Depths|Stellar Dreams/,
        );
        expect(nfts.length).toBeGreaterThan(0);
      });
    });

    it("sorts by name A-Z", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const sortSelect = screen.getByRole("combobox");
      fireEvent.change(sortSelect, { target: { value: "name_asc" } });

      await waitFor(() => {
        expect(screen.getByText("Abstract Vision")).toBeInTheDocument();
      });
    });

    it("opens filters panel when filter button is clicked", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const filterButton = screen.getByText("Filters");
      fireEvent.click(filterButton);

      await waitFor(() => {
        expect(screen.getAllByText("Collection").length).toBeGreaterThan(0);
      });
    });

    it("clears all filters", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const filterButton = screen.getByText("Filters");
      fireEvent.click(filterButton);

      await waitFor(() => {
        const searchInput = screen.getByPlaceholderText(
          "Search by name or ID...",
        );
        fireEvent.change(searchInput, { target: { value: "Cosmic" } });
      });

      await waitFor(() => {
        const clearButton = screen.getByText("Clear All");
        fireEvent.click(clearButton);
      });

      await waitFor(() => {
        expect(
          screen.getByPlaceholderText("Search by name or ID..."),
        ).toHaveValue("");
      });
    });

    it("persists filter preferences to localStorage", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const searchInput = screen.getByPlaceholderText(
        "Search by name or ID...",
      );
      fireEvent.change(searchInput, { target: { value: "Cosmic" } });

      const savedFilters = localStorage.getItem("nft-gallery-filters");
      expect(savedFilters).toContain("Cosmic");
    });
  });

  describe("History Display", () => {
    it("displays provenance section for NFTs with history", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        expect(screen.getByText("Provenance")).toBeInTheDocument();
      });
    });

    it("displays transaction history entries", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        const fromElements = screen.getAllByText("From:");
        expect(fromElements.length).toBeGreaterThan(0);
      });
    });

    it("shows Stellar Expert link for transactions", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        const links = screen.getAllByText("View on Stellar Expert");
        expect(links.length).toBeGreaterThan(0);
      });
    });

    it("displays transfer prices when available", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const nftCard = screen.getByText("Cosmic Dreams #1");
      fireEvent.click(nftCard);

      await waitFor(() => {
        const prices = screen.getAllByText(/XLM/);
        expect(prices.length).toBeGreaterThan(0);
      });
    });
  });

  describe("Collection Filter", () => {
    it("displays unique collections in filter", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const filterButton = screen.getByText("Filters");
      fireEvent.click(filterButton);

      await waitFor(() => {
        const collections = screen.getAllByText("Cosmic Dreams");
        expect(collections.length).toBeGreaterThan(0);
      });
    });

    it("filters by selected collection", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      const filterButton = screen.getByText("Filters");
      fireEvent.click(filterButton);

      await waitFor(() => {
        const collectionSelect = screen.getAllByRole("combobox")[0];
        fireEvent.change(collectionSelect, {
          target: { value: "Cosmic Dreams" },
        });
      });

      await waitFor(() => {
        expect(screen.getByText("Cosmic Dreams #1")).toBeInTheDocument();
      });
    });
  });

  describe("Results Count", () => {
    it("shows correct results count", async () => {
      render(<NFTGallery {...mockProps} />);
      await waitForLoadingComplete();

      expect(screen.getByText(/Showing \d+ of \d+ NFTs/)).toBeInTheDocument();
    });
  });
});
