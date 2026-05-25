const express = require('express');
const router = express.Router();
const rateLimit = require('express-rate-limit');
const verifyJWT = require('../middleware/verifyJWT');
const {
  createRule,
  updateRule,
  deleteRule,
  listRules,
  getRuleHistory,
  downloadRule,
  shareRule,
  revokeShare,
} = require('../controllers/rulesController');

const shareLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  message: { message: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

router.use(verifyJWT);

/**
 * @openapi
 * tags:
 *   name: Rules
 *   description: CRUD operations and version history for user-owned rules
 */

/**
 * @openapi
 * /rules:
 *   get:
 *     summary: List all rules
 *     description: Returns all non-deleted rules belonging to the authenticated user, sorted by last update descending.
 *     tags: [Rules]
 *     security:
 *       - BearerAuth: []
 *     responses:
 *       200:
 *         description: Array of rule summaries.
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/RuleSummary'
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
 */
router.get('/', verifyJWT, listRules);

/**
 * @openapi
 * /rules:
 *   post:
 *     summary: Create a new rule
 *     description: |
 *       Creates a rule with its first version. `ruleId` must be unique per user
 *       (a deleted rule with the same `ruleId` is invisible and does not block creation).
 *     tags: [Rules]
 *     security:
 *       - BearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - ruleId
 *               - name
 *               - contentBase64
 *             properties:
 *               ruleId:
 *                 type: string
 *                 description: Stable identifier for the rule (e.g. the ESLint rule name).
 *                 example: no-console
 *               name:
 *                 type: string
 *                 description: Human-readable display name.
 *                 example: No Console Logs
 *               contentBase64:
 *                 type: string
 *                 format: byte
 *                 description: Base64-encoded rule file content.
 *                 example: bW9kdWxlLmV4cG9ydHMgPSB7IHJ1bGVzOiB7fSB9Ow==
 *     responses:
 *       201:
 *         description: Rule created successfully.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RuleSummary'
 *       400:
 *         description: Missing required fields.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       409:
 *         description: A rule with this `ruleId` already exists for the user.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/', verifyJWT, createRule);

/**
 * @openapi
 * /rules/{ruleId}:
 *   put:
 *     summary: Update a rule (add a new version)
 *     description: |
 *       Appends a new version to the rule's history. If `contentBase64` is identical
 *       to the latest version, the rule is returned unchanged (no duplicate version created).
 *       Optionally renames the rule via `name`.
 *     tags: [Rules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *         description: The rule's stable identifier.
 *         example: no-console
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - contentBase64
 *             properties:
 *               contentBase64:
 *                 type: string
 *                 format: byte
 *                 description: Base64-encoded new version content.
 *                 example: bW9kdWxlLmV4cG9ydHMgPSB7IHJ1bGVzOiB7fSB9Ow==
 *               name:
 *                 type: string
 *                 description: Optional new display name.
 *                 example: No Console Logs (updated)
 *     responses:
 *       200:
 *         description: Updated rule summary.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RuleSummary'
 *       400:
 *         description: Missing `contentBase64`.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Rule not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.put('/:ruleId', verifyJWT, updateRule);

/**
 * @openapi
 * /rules/{ruleId}:
 *   delete:
 *     summary: Delete a rule
 *     description: Soft-deletes the rule (sets `deletedAt`). The rule will no longer appear in listings or be accessible by the owner.
 *     tags: [Rules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *         example: no-console
 *     responses:
 *       204:
 *         description: Rule deleted (no body).
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Rule not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:ruleId', verifyJWT, deleteRule);

/**
 * @openapi
 * /rules/{ruleId}/history:
 *   get:
 *     summary: Get version history of a rule
 *     description: Returns all saved versions for a rule in chronological order (oldest first).
 *     tags: [Rules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *         example: no-console
 *     responses:
 *       200:
 *         description: Rule with full version history.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/RuleHistory'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Rule not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:ruleId/history', verifyJWT, getRuleHistory);

/**
 * @openapi
 * /rules/{ruleId}/download:
 *   get:
 *     summary: Download a rule version as a file
 *     description: |
 *       Decodes the Base64 content of a specific version and returns it as a downloadable
 *       JavaScript file. Defaults to the **latest** version when `version` is omitted.
 *     tags: [Rules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *         example: no-console
 *       - in: query
 *         name: version
 *         required: false
 *         schema:
 *           type: integer
 *           minimum: 0
 *         description: Zero-based version index. Omit to download the latest version.
 *         example: 0
 *     responses:
 *       200:
 *         description: Rule file download.
 *         headers:
 *           Content-Disposition:
 *             schema:
 *               type: string
 *             example: 'attachment; filename="No_Console_Logs_v1.js"'
 *         content:
 *           application/javascript:
 *             schema:
 *               type: string
 *               format: binary
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Rule or version not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.get('/:ruleId/download', verifyJWT, downloadRule);

/**
 * @openapi
 * /rules/{ruleId}/share:
 *   post:
 *     summary: Create a public share link for a rule
 *     description: |
 *       Generates a random `shareToken` for the rule (idempotent — repeated calls return the
 *       same token). The token can be used with `GET /share/{shareToken}` without authentication.
 *       Rate limited to **20 requests per 15 minutes**.
 *     tags: [Rules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *         example: no-console
 *     responses:
 *       200:
 *         description: Share token (new or existing).
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 shareToken:
 *                   type: string
 *                   example: a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Rule not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       429:
 *         description: Rate limit exceeded.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.post('/:ruleId/share', verifyJWT, shareLimiter, shareRule);

/**
 * @openapi
 * /rules/{ruleId}/share:
 *   delete:
 *     summary: Revoke the public share link
 *     description: Removes the `shareToken` from the rule. The previously shared URL will return 404.
 *     tags: [Rules]
 *     security:
 *       - BearerAuth: []
 *     parameters:
 *       - in: path
 *         name: ruleId
 *         required: true
 *         schema:
 *           type: string
 *         example: no-console
 *     responses:
 *       204:
 *         description: Share revoked (no body).
 *       400:
 *         description: Rule is not currently shared.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Rule not found.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
router.delete('/:ruleId/share', verifyJWT, revokeShare);

module.exports = router;
