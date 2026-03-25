import { Request, Response } from 'express';
import { listingService } from '../services/ListingService';

export const toggleListingVisibility = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { isActive } = req.body;
    
    // In a real app, from auth token. Here fallback to body for testing
    const mentorId = (req as any).user?.id || req.body.mentorId;

    if (isActive === undefined) {
      return res.status(400).json({ success: false, message: 'isActive is required' });
    }

    if (!mentorId) {
      return res.status(401).json({ success: false, message: 'Unauthorized: Missing mentor ID' });
    }

    const updatedListing = await listingService.toggleVisibility(id, mentorId, isActive);
    
    res.json({
      success: true,
      message: `Listing visibility toggled. State: ${isActive ? 'Active' : 'Inactive'}`,
      data: updatedListing
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export const searchListings = async (req: Request, res: Response) => {
  try {
    const query = req.query.q as string || '';
    const listings = await listingService.searchListings(query);

    res.json({
      success: true,
      data: listings
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
};
