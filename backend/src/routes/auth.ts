import { Router } from 'express';
import { register, login, refresh, logout, changePassword } from '../controllers/auth';
import { validate } from '../middleware/validate';
import { credentialsSchema, refreshTokenSchema, changePasswordSchema } from '../schemas/auth';
import { authenticate, AuthRequest } from '../middleware/authenticate';
import { sseTicketService } from '../services/SSETicketService';

const router = Router();

/**
 * @openapi
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Credentials'
 *     responses:
 *       201:
 *         description: User created — returns JWT tokens
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       400:
 *         description: Validation error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: Email already in use
 */
router.post('/register', validate(credentialsSchema), register);

/**
 * @openapi
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Authenticate and obtain JWT tokens
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Credentials'
 *     responses:
 *       200:
 *         description: Successful login
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid credentials
 *       400:
 *         description: Validation error
 */
router.post('/login', validate(credentialsSchema), login);

/**
 * @openapi
 * /auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refresh access token using a refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       200:
 *         description: New token pair issued
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AuthTokens'
 *       401:
 *         description: Invalid or expired refresh token
 */
router.post('/refresh', validate(refreshTokenSchema), refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Revoke a refresh token
 *     security: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/RefreshTokenRequest'
 *     responses:
 *       204:
 *         description: Token revoked
 *       400:
 *         description: Validation error
 */
router.post('/logout', validate(refreshTokenSchema), logout);

/**
 * @openapi
 * /auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Change the authenticated user's password
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/ChangePasswordRequest'
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error or wrong current password
 *       401:
 *         description: Unauthorized
 */
router.post('/change-password', authenticate, validate(changePasswordSchema), changePassword);

/**
 * @openapi
 * /auth/sse-ticket:
 *   post:
 *     tags: [Auth]
 *     summary: Generate a short-lived SSE ticket for real-time connections
 *     description: |
 *       Returns a single-use, 30-second ticket for establishing SSE connections
 *       without exposing the long-lived JWT in URL query parameters.
 *       The ticket can only be used once and expires after 30 seconds.
 *     responses:
 *       200:
 *         description: SSE ticket generated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ticket:
 *                   type: string
 *                   description: Single-use SSE ticket (hex-encoded, 64 chars)
 *                 expiresIn:
 *                   type: number
 *                   description: TTL in seconds (always 30)
 *       401:
 *         description: Unauthorized
 */
router.post('/sse-ticket', authenticate, (req: AuthRequest, res) => {
  const userId = req.user?.id;
  if (!userId) {
    res.status(401).json({ message: 'Unauthorized' });
    return;
  }

  const ticket = sseTicketService.generateTicket(userId);
  res.status(200).json({ ticket, expiresIn: 30 });
});

export default router;
