import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class ListingService {
  /**
   * Toggle the visibility of a listing
   * @param listingId ID of the listing
   * @param mentorId ID of the mentor (for authorization)
   * @param isActive Desired state
   */
  async toggleVisibility(listingId: string, mentorId: string, isActive: boolean) {
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    
    if (!listing) {
      throw new Error('Listing not found');
    }
    
    // Ensure only the mentor who owns the listing can toggle it
    if (listing.mentorId !== mentorId) {
      throw new Error('Unauthorized: You can only toggle your own listings');
    }

    return prisma.listing.update({
      where: { id: listingId },
      data: { isActive }
    });
  }

  /**
   * Search listings, excluding hidden ones
   * @param query Search string
   */
  async searchListings(query: string = '') {
    const q = query.trim();
    
    return prisma.listing.findMany({
      where: {
        isActive: true, // Hidden listings excluded from search
        ...(q ? {
          OR: [
            { title: { contains: q, mode: 'insensitive' } },
            { description: { contains: q, mode: 'insensitive' } }
          ]
        } : {})
      }
    });
  }
}

export const listingService = new ListingService();
