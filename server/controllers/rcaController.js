const RCA = require('../models/RCA');
const Project = require('../models/Project');
const Review = require('../models/Review');
const ActivityLog = require('../models/ActivityLog');
const { createNotification } = require('../services/notificationService');

/**
 * @desc    Get all RCAs for a project
 * @route   GET /api/v1/projects/:projectId/rca
 * @access  Private
 */
const getRCAs = async (req, res, next) => {
  try {
    const { status, search } = req.query;
    const query = { project: req.params.projectId };
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { incidentDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const rcas = await RCA.find(query)
      .populate('submitter', 'name avatar')
      .populate('reviewer', 'name avatar')
      .populate('task', 'title')
      .populate('project', 'name')
      .sort('-createdAt');

    res.json({ success: true, data: rcas });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get all RCAs across all projects the user is a member of
 * @route   GET /api/v1/rca
 * @access  Private
 */
const getAllRCAs = async (req, res, next) => {
  try {
    const { status, search, projectId } = req.query;

    // Find projects the user is part of (as owner or member)
    const userProjects = await Project.find({
      $or: [
        { owner: req.user._id },
        { 'members.user': req.user._id },
      ],
    }).select('_id');

    const projectIds = userProjects.map((p) => p._id);

    const query = { project: { $in: projectIds } };
    if (projectId) query.project = projectId;
    if (status) query.status = status;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { incidentDescription: { $regex: search, $options: 'i' } },
      ];
    }

    const rcas = await RCA.find(query)
      .populate('submitter', 'name avatar')
      .populate('reviewer', 'name avatar')
      .populate('task', 'title')
      .populate('project', 'name')
      .sort('-createdAt');

    res.json({ success: true, data: rcas });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Get single RCA
 * @route   GET /api/v1/rca/:id
 * @access  Private
 */
const getRCA = async (req, res, next) => {
  try {
    const rca = await RCA.findById(req.params.id)
      .populate('submitter', 'name avatar email')
      .populate('reviewer', 'name avatar email')
      .populate('task', 'title status')
      .populate('project', 'name');

    if (!rca) {
      return res.status(404).json({ success: false, message: 'RCA not found' });
    }
    res.json({ success: true, data: rca });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Create an RCA
 * @route   POST /api/v1/projects/:projectId/rca
 * @access  Private
 */
const createRCA = async (req, res, next) => {
  try {
    const {
      title,
      task,
      incidentDescription,
      impact,
      rootCause,
      resolutionSteps,
      reviewer,
    } = req.body;

    const rca = await RCA.create({
      title,
      project: req.params.projectId,
      task: task || null,
      submitter: req.user._id,
      reviewer: reviewer || null,
      incidentDescription,
      impact,
      rootCause,
      resolutionSteps,
      status: 'Draft',
    });

    await rca.populate('submitter', 'name avatar');

    await ActivityLog.create({
      action: 'RCA_CREATED',
      entity: 'RCA',
      entityId: rca._id,
      user: req.user._id,
      details: `Created RCA: "${title}"`,
      project: req.params.projectId,
    });

    res.status(201).json({ success: true, data: rca });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Update an RCA
 * @route   PUT /api/v1/rca/:id
 * @access  Private
 */
const updateRCA = async (req, res, next) => {
  try {
    let rca = await RCA.findById(req.params.id);
    if (!rca) {
      return res.status(404).json({ success: false, message: 'RCA not found' });
    }

    // Only submitter can edit (in Draft or Needs Revision)
    if (rca.submitter.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }
    if (!['Draft', 'Needs Revision'].includes(rca.status)) {
      return res.status(400).json({ success: false, message: `Cannot edit RCA in "${rca.status}" status` });
    }

    const allowed = ['title', 'incidentDescription', 'impact', 'rootCause', 'resolutionSteps', 'task', 'reviewer'];
    allowed.forEach((field) => {
      if (req.body[field] !== undefined) rca[field] = req.body[field];
    });

    await rca.save();
    await rca.populate('submitter', 'name avatar');
    await rca.populate('reviewer', 'name avatar');

    res.json({ success: true, data: rca });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Submit RCA for review
 * @route   PUT /api/v1/rca/:id/submit
 * @access  Private (submitter only)
 */
const submitRCA = async (req, res, next) => {
  try {
    const rca = await RCA.findById(req.params.id);
    if (!rca) {
      return res.status(404).json({ success: false, message: 'RCA not found' });
    }
    if (rca.submitter.toString() !== req.user._id.toString()) {
      return res.status(403).json({ success: false, message: 'Only submitter can submit' });
    }
    if (!['Draft', 'Needs Revision'].includes(rca.status)) {
      return res.status(400).json({ success: false, message: `Cannot submit RCA in "${rca.status}" status` });
    }
    if (!rca.reviewer) {
      return res.status(400).json({ success: false, message: 'Please assign a reviewer before submitting' });
    }

    rca.status = 'Submitted';
    await rca.save();

    await ActivityLog.create({
      action: 'RCA_SUBMITTED',
      entity: 'RCA',
      entityId: rca._id,
      user: req.user._id,
      details: `Submitted RCA: "${rca.title}"`,
      project: rca.project,
    });

    await rca.populate('submitter', 'name avatar');
    await rca.populate('reviewer', 'name avatar');

    // Notify assigned reviewer
    if (rca.reviewer) {
      createNotification({
        recipient: rca.reviewer._id,
        type: 'RCA_SUBMITTED',
        title: 'New RCA Report Submitted',
        message: `${rca.submitter.name} submitted an RCA report "${rca.title}" for your review`,
        link: `/projects/${rca.project}/rca`,
        relatedEntity: { type: 'RCA', id: rca._id },
      }).catch((err) => {
        console.error('Error sending RCA submission notification:', err);
      });
    }

    res.json({ success: true, data: rca });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Review an RCA (approve / reject / needs revision)
 * @route   PUT /api/v1/rca/:id/review
 * @access  Private (reviewer only)
 */
const reviewRCA = async (req, res, next) => {
  try {
    const { decision, reviewComments } = req.body;
    if (!['Approved', 'Rejected', 'Needs Revision'].includes(decision)) {
      return res.status(400).json({ success: false, message: 'Invalid decision' });
    }

    const rca = await RCA.findById(req.params.id);
    if (!rca) {
      return res.status(404).json({ success: false, message: 'RCA not found' });
    }
    if (rca.reviewer?.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Only the assigned reviewer can review' });
    }
    if (!['Submitted', 'Under Review'].includes(rca.status)) {
      return res.status(400).json({ success: false, message: `Cannot review RCA in "${rca.status}" status` });
    }

    rca.status = decision;
    rca.reviewComments = reviewComments || '';
    await rca.save();

    await Review.create({
      rca: rca._id,
      reviewer: req.user._id,
      status: decision,
      comments: reviewComments || '',
    });

    await ActivityLog.create({
      action: `RCA_${decision.toUpperCase().replace(/\s+/g, '_')}`,
      entity: 'RCA',
      entityId: rca._id,
      user: req.user._id,
      details: `${decision} RCA: "${rca.title}"`,
      project: rca.project,
    });

    await rca.populate('submitter', 'name avatar');
    await rca.populate('reviewer', 'name avatar');

    // Notify submitter of review outcome
    if (rca.submitter) {
      const reviewerName = rca.reviewer?.name || 'Reviewer';
      createNotification({
        recipient: rca.submitter._id,
        type: 'REVIEW_OUTCOME',
        title: `RCA Review Outcome: ${decision}`,
        message: `${reviewerName} has reviewed and marked your RCA report "${rca.title}" as: ${decision}`,
        link: `/projects/${rca.project}/rca`,
        relatedEntity: { type: 'RCA', id: rca._id },
      }).catch((err) => {
        console.error('Error sending RCA review outcome notification:', err);
      });
    }

    res.json({ success: true, data: rca });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Delete an RCA
 * @route   DELETE /api/v1/rca/:id
 * @access  Private (submitter or admin)
 */
const deleteRCA = async (req, res, next) => {
  try {
    const rca = await RCA.findById(req.params.id);
    if (!rca) {
      return res.status(404).json({ success: false, message: 'RCA not found' });
    }
    if (rca.submitter.toString() !== req.user._id.toString() && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await rca.deleteOne();
    res.json({ success: true, message: 'RCA deleted' });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Reassign RCA reviewer
 * @route   PUT /api/v1/rca/:id/reassign
 * @access  Private
 */
const reassignReviewer = async (req, res, next) => {
  try {
    const { newReviewerId } = req.body;
    if (!newReviewerId) {
      return res.status(400).json({ success: false, message: 'Please provide a new reviewer' });
    }

    const rca = await RCA.findById(req.params.id);
    if (!rca) {
      return res.status(404).json({ success: false, message: 'RCA not found' });
    }

    const project = await Project.findById(rca.project);
    const isOwner = project.owner.toString() === req.user._id.toString();
    const isLead = project.members?.some(
      (m) => m.user.toString() === req.user._id.toString() && m.role === 'Lead'
    );
    const isSubmitter = rca.submitter.toString() === req.user._id.toString();

    if (!isSubmitter && !isOwner && !isLead && req.user.role !== 'Admin') {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    rca.reviewer = newReviewerId;
    await rca.save();
    await rca.populate('submitter', 'name avatar');
    await rca.populate('reviewer', 'name avatar');

    if (rca.status === 'Submitted') {
      createNotification({
        recipient: newReviewerId,
        type: 'RCA_SUBMITTED',
        title: 'RCA Assigned for Review (Reassignment)',
        message: `${rca.submitter.name}'s RCA report "${rca.title}" has been reassigned to you for review`,
        link: `/projects/${rca.project}/rca`,
        relatedEntity: { type: 'RCA', id: rca._id },
      }).catch((err) => {
        console.error('Error sending reassignment notification:', err);
      });
    }

    await ActivityLog.create({
      action: 'RCA_REASSIGNED',
      entity: 'RCA',
      entityId: rca._id,
      user: req.user._id,
      details: `Reassigned reviewer of RCA: "${rca.title}"`,
      project: rca.project,
    });

    res.json({ success: true, data: rca });
  } catch (err) {
    next(err);
  }
};

/**
 * @desc    Escalate RCA (assign project lead or project owner as reviewer)
 * @route   PUT /api/v1/rca/:id/escalate
 * @access  Private
 */
const escalateRCA = async (req, res, next) => {
  try {
    const rca = await RCA.findById(req.params.id);
    if (!rca) {
      return res.status(404).json({ success: false, message: 'RCA not found' });
    }

    const project = await Project.findById(rca.project);
    if (!project) {
      return res.status(404).json({ success: false, message: 'Project not found' });
    }

    const projectOwnerId = project.owner;
    
    rca.reviewer = projectOwnerId;
    rca.status = 'Submitted';
    await rca.save();
    
    await rca.populate('submitter', 'name avatar');
    await rca.populate('reviewer', 'name avatar');

    createNotification({
      recipient: projectOwnerId,
      type: 'RCA_SUBMITTED',
      title: 'ESCALATED: RCA Assigned for Review',
      message: `${rca.submitter.name}'s RCA report "${rca.title}" has been ESCALATED to you for review`,
      link: `/projects/${rca.project}/rca`,
      relatedEntity: { type: 'RCA', id: rca._id },
    }).catch((err) => {
      console.error('Error sending escalation notification:', err);
    });

    await ActivityLog.create({
      action: 'RCA_ESCALATED',
      entity: 'RCA',
      entityId: rca._id,
      user: req.user._id,
      details: `Escalated RCA: "${rca.title}" to project owner`,
      project: rca.project,
    });

    res.json({ success: true, data: rca });
  } catch (err) {
    next(err);
  }
};

module.exports = {
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
};
