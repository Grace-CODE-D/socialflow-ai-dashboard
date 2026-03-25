import { Router } from 'express';
import { toggleListingVisibility, searchListings } from '../controllers/ListingController';
import { authMiddleware } from '../middleware/authMiddleware';

const router = Router();

// search should be accessible without auth, maybe
router.get('/search', searchListings);

// PATCH to toggle visibility using mentor's token
router.patch('/:id/visibility', authMiddleware, toggleListingVisibility);

export default router;
