const express = require('express');
const router = express.Router();
const verifyJWT = require('../middleware/verifyJWT');
const googleAuth = require('../middleware/googleAuth');
const { googleAuthCallback, refresh, logout, getMe, extensionCallback } = require('../controllers/authController');

/**
 * @openapi
 * tags:
 *   name: Auth
 *   description: Google OAuth authentication and session management
 */

/**
 * @openapi
 * /auth/google:
 *   get:
 *     summary: Initiate Google OAuth login
 *     description: Redirects the user to Google's OAuth 2.0 consent screen. Not intended to be called directly from API clients — open in a browser.
 *     tags: [Auth]
 *     responses:
 *       302:
 *         description: Redirect to Google's OAuth consent screen.
 */
router.get('/google', googleAuth);

/**
 * @openapi
 * /auth/google/callback:
 *   get:
 *     summary: Google OAuth callback
 *     description: |
 *       Google redirects here after the user grants consent.
 *       On success the server sets an **httpOnly `jwt` cookie** (refresh token, 7 days)
 *       and redirects to `{CLIENT_URL}/auth/callback?token=<accessToken>`.
 *       On failure it redirects to `{CLIENT_URL}/auth/error?reason=unauthorized`.
 *     tags: [Auth]
 *     parameters:
 *       - in: query
 *         name: code
 *         required: true
 *         schema:
 *           type: string
 *         description: Authorization code returned by Google.
 *       - in: query
 *         name: state
 *         schema:
 *           type: string
 *         description: CSRF state parameter.
 *     responses:
 *       302:
 *         description: Redirect to client callback or error page.
 */
router.get('/google/callback', googleAuthCallback);

/**
 * @openapi
 * /auth/me:
 *   get:
 *     summary: Get the authenticated user
 *     description: Returns the current user's profile. Requires a valid Bearer access token.
 *     tags: [Auth]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: User profile (refreshToken field is omitted).
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/User'
 *       401:
 *         description: Missing or malformed Authorization header.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Token is invalid or expired.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: User record not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/me', verifyJWT, getMe);

/**
 * @openapi
 * /auth/refresh:
 *   get:
 *     summary: Refresh the access token
 *     description: |
 *       Reads the **`jwt` HttpOnly cookie** and issues a new short-lived access token (15 min).
 *       The cookie is set automatically after a successful Google OAuth login — browser clients
 *       send it automatically. Non-browser clients must pass the cookie explicitly.
 *     tags: [Auth]
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       200:
 *         description: New access token.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accessToken:
 *                   type: string
 *                   example: eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
 *       401:
 *         description: No refresh token cookie present.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Refresh token is invalid, expired, or does not match any user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/refresh', refresh);

/**
 * @openapi
 * /auth/logout:
 *   post:
 *     summary: Log out
 *     description: |
 *       Clears the server-side refresh token and removes the **`jwt` cookie**.
 *       Returns `204 No Content` whether or not the cookie was present.
 *     tags: [Auth]
 *     security:
 *       - CookieAuth: []
 *     responses:
 *       204:
 *         description: Logged out successfully (no body).
 */
router.post('/logout', logout);

router.get('/callback', extensionCallback);

module.exports = router;
