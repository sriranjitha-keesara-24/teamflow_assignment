const express = require('express');
const { protect } = require('../middleware/authMiddleware');
const { validate } = require('../middleware/validateRequest');
const { createRCASchema, updateRCASchema } = require('../validators/rcaValidator');
const {
  getRCAs,
  getAllRCAs,
  getRCA,
  createRCA,
  updateRCA,
  submitRCA,
  reviewRCA,
  deleteRCA,
  reassignReviewer,
  escalateRCA,
} = require('../controllers/rcaController');

// ── Project-scoped router (mergeParams to access :projectId) ──────
const projectRcaRouter = express.Router({ mergeParams: true });
projectRcaRouter.use(protect);
projectRcaRouter.route('/').get(getRCAs).post(validate(createRCASchema), createRCA);

// ── Standalone router for /api/v1/rca ─────────────────────────────
const rcaRouter = express.Router();
rcaRouter.use(protect);
rcaRouter.get('/', getAllRCAs);                            // GET all (cross-project)
rcaRouter.get('/:id', getRCA);                            // GET one
rcaRouter.put('/:id', validate(updateRCASchema), updateRCA);                         // UPDATE
rcaRouter.delete('/:id', deleteRCA);                      // DELETE
rcaRouter.put('/:id/submit', submitRCA);                  // SUBMIT
rcaRouter.put('/:id/review', reviewRCA);                  // REVIEW
rcaRouter.put('/:id/reassign', reassignReviewer);          // REASSIGN Reviewer
rcaRouter.put('/:id/escalate', escalateRCA);              // ESCALATE Reviewer

module.exports = { projectRcaRouter, rcaRouter };
