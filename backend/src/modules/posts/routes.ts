import { Router } from 'express';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { createPost } from '../../controllers/PostController';
import { createPostSchema } from './schema';

const router = Router();

router.use(authenticate);

router.post('/', validate(createPostSchema), createPost);

export default router;
