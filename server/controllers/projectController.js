const Project = require('../models/Project');
const Task = require('../models/Task');
const ActivityLog = require('../models/ActivityLog');
const { ApiError } = require('../middleware/errorMiddleware');

// ─── Helper: check if user is a project member or owner ──────────
const assertProjectAccess = async (projectId, userId) => {
    const project = await Project.findById(projectId);
    if (!project) throw new ApiError('Project not found', 404);

    const isOwner = project.owner.toString() === userId.toString();
    const isMember = project.members.some(
        (m) => m.user.toString() === userId.toString()
    );

    if (!isOwner && !isMember) {
        throw new ApiError('You are not a member of this project', 403);
    }

    return project;
};

// ─── CREATE ──────────────────────────────────────────────────────
const createProject = async (req, res, next) => {
    try {
        const { name, description, visibility, priority, deadline, tags } = req.body;

        const project = await Project.create({
            name,
            description,
            visibility,
            priority,
            deadline,
            tags,
            owner: req.user._id,
            members: [{ user: req.user._id, role: 'Lead' }],
        });

        await ActivityLog.create({
            action: 'Created project',
            entity: 'Project',
            entityId: project._id,
            user: req.user._id,
            project: project._id,
        });

        const populated = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        res.status(201).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// ─── GET ALL (user's projects) ───────────────────────────────────
const getProjects = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 20;
        const skip = (page - 1) * limit;
        const { status, search } = req.query;

        // User can see projects they own or are a member of
        const query = {
            $or: [
                { owner: req.user._id },
                { 'members.user': req.user._id },
            ],
        };

        // Admin can see all projects
        if (req.user.role === 'Admin') {
            delete query.$or;
        }

        if (status) query.status = status;
        if (search) {
            query.$and = query.$and || [];
            query.$and.push({
                $or: [
                    { name: { $regex: search, $options: 'i' } },
                    { description: { $regex: search, $options: 'i' } },
                ],
            });
        }

        const [projects, total] = await Promise.all([
            Project.find(query)
                .populate('owner', 'name email avatar')
                .populate('members.user', 'name email avatar')
                .sort({ updatedAt: -1 })
                .skip(skip)
                .limit(limit),
            Project.countDocuments(query),
        ]);

        // Attach task counts per project
        const projectIds = projects.map((p) => p._id);
        const taskCounts = await Task.aggregate([
            { $match: { project: { $in: projectIds } } },
            {
                $group: {
                    _id: '$project',
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                    overdue: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ['$status', 'Completed'] },
                                        { $ne: ['$dueDate', null] },
                                        { $lt: ['$dueDate', new Date()] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        const countMap = {};
        taskCounts.forEach((tc) => {
            countMap[tc._id.toString()] = {
                total: tc.total,
                completed: tc.completed,
                overdue: tc.overdue,
            };
        });

        const data = projects.map((p) => {
            const json = p.toJSON();
            json.taskStats = countMap[p._id.toString()] || { total: 0, completed: 0, overdue: 0 };
            return json;
        });

        res.status(200).json({
            success: true,
            data,
            pagination: { page, limit, total, pages: Math.ceil(total / limit) },
        });
    } catch (error) {
        next(error);
    }
};

// ─── GET BY ID ───────────────────────────────────────────────────
const getProjectById = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        if (!project) throw new ApiError('Project not found', 404);

        // Access check (member, owner, or admin)
        const isOwner = project.owner._id.toString() === req.user._id.toString();
        const isMember = project.members.some(
            (m) => m.user._id.toString() === req.user._id.toString()
        );
        if (!isOwner && !isMember && req.user.role !== 'Admin') {
            throw new ApiError('Not authorized to view this project', 403);
        }

        // Attach task stats
        const taskStats = await Task.aggregate([
            { $match: { project: project._id } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
                    review: { $sum: { $cond: [{ $eq: ['$status', 'Review'] }, 1, 0] } },
                    todo: { $sum: { $cond: [{ $eq: ['$status', 'Todo'] }, 1, 0] } },
                    overdue: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ['$status', 'Completed'] },
                                        { $ne: ['$dueDate', null] },
                                        { $lt: ['$dueDate', new Date()] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        const data = project.toJSON();
        data.taskStats = taskStats[0] || {
            total: 0,
            completed: 0,
            inProgress: 0,
            review: 0,
            todo: 0,
            overdue: 0,
        };

        res.status(200).json({ success: true, data });
    } catch (error) {
        next(error);
    }
};

// ─── UPDATE ──────────────────────────────────────────────────────
const updateProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) throw new ApiError('Project not found', 404);

        // Only owner, Lead, or Admin can update
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isLead = project.members.some(
            (m) => m.user.toString() === req.user._id.toString() && m.role === 'Lead'
        );
        if (!isOwner && !isLead && req.user.role !== 'Admin') {
            throw new ApiError('Not authorized to update this project', 403);
        }

        const allowedFields = ['name', 'description', 'status', 'visibility', 'priority', 'deadline', 'tags'];
        for (const field of allowedFields) {
            if (req.body[field] !== undefined) {
                project[field] = req.body[field];
            }
        }

        await project.save();

        await ActivityLog.create({
            action: 'Updated project',
            entity: 'Project',
            entityId: project._id,
            user: req.user._id,
            project: project._id,
            details: { fields: Object.keys(req.body).filter((k) => allowedFields.includes(k)) },
        });

        const populated = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// ─── DELETE ──────────────────────────────────────────────────────
const deleteProject = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) throw new ApiError('Project not found', 404);

        // Only owner or Admin can delete
        if (
            project.owner.toString() !== req.user._id.toString() &&
            req.user.role !== 'Admin'
        ) {
            throw new ApiError('Not authorized to delete this project', 403);
        }

        // Delete associated tasks
        await Task.deleteMany({ project: project._id });
        await project.deleteOne();

        await ActivityLog.create({
            action: 'Deleted project',
            entity: 'Project',
            entityId: project._id,
            user: req.user._id,
            details: { projectName: project.name },
        });

        res.status(200).json({ success: true, message: 'Project deleted' });
    } catch (error) {
        next(error);
    }
};

// ─── ADD MEMBER ──────────────────────────────────────────────────
const addMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) throw new ApiError('Project not found', 404);

        const { userId, role } = req.body;
        if (!userId) throw new ApiError('userId is required', 400);

        // Authorization: owner, Lead, or Admin
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isLead = project.members.some(
            (m) => m.user.toString() === req.user._id.toString() && m.role === 'Lead'
        );
        if (!isOwner && !isLead && req.user.role !== 'Admin') {
            throw new ApiError('Not authorized to add members', 403);
        }

        // Check if already a member
        const alreadyMember = project.members.some(
            (m) => m.user.toString() === userId
        );
        if (alreadyMember) {
            throw new ApiError('User is already a member of this project', 400);
        }

        project.members.push({ user: userId, role: role || 'Member' });
        await project.save();

        const populated = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// ─── REMOVE MEMBER ───────────────────────────────────────────────
const removeMember = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) throw new ApiError('Project not found', 404);

        const { userId } = req.params;

        // Can't remove the owner
        if (project.owner.toString() === userId) {
            throw new ApiError('Cannot remove the project owner', 400);
        }

        // Authorization
        const isOwner = project.owner.toString() === req.user._id.toString();
        const isLead = project.members.some(
            (m) => m.user.toString() === req.user._id.toString() && m.role === 'Lead'
        );
        if (!isOwner && !isLead && req.user.role !== 'Admin') {
            throw new ApiError('Not authorized to remove members', 403);
        }

        project.members = project.members.filter(
            (m) => m.user.toString() !== userId
        );
        await project.save();

        const populated = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// ─── UPDATE MEMBER ROLE ──────────────────────────────────────────
const updateMemberRole = async (req, res, next) => {
    try {
        const project = await Project.findById(req.params.id);
        if (!project) throw new ApiError('Project not found', 404);

        const { userId } = req.params;
        const { role } = req.body;

        if (!['Lead', 'Member', 'Viewer'].includes(role)) {
            throw new ApiError('Invalid role. Must be Lead, Member, or Viewer.', 400);
        }

        // Authorization: owner or Admin only
        if (
            project.owner.toString() !== req.user._id.toString() &&
            req.user.role !== 'Admin'
        ) {
            throw new ApiError('Not authorized to change member roles', 403);
        }

        const member = project.members.find(
            (m) => m.user.toString() === userId
        );
        if (!member) throw new ApiError('User is not a member of this project', 404);

        member.role = role;
        await project.save();

        const populated = await Project.findById(project._id)
            .populate('owner', 'name email avatar')
            .populate('members.user', 'name email avatar');

        res.status(200).json({ success: true, data: populated });
    } catch (error) {
        next(error);
    }
};

// ─── GET PROJECT STATS ───────────────────────────────────────────
const getProjectStats = async (req, res, next) => {
    try {
        await assertProjectAccess(req.params.id, req.user._id);

        const stats = await Task.aggregate([
            { $match: { project: require('mongoose').Types.ObjectId.createFromHexString(req.params.id) } },
            {
                $group: {
                    _id: null,
                    total: { $sum: 1 },
                    completed: { $sum: { $cond: [{ $eq: ['$status', 'Completed'] }, 1, 0] } },
                    inProgress: { $sum: { $cond: [{ $eq: ['$status', 'In Progress'] }, 1, 0] } },
                    review: { $sum: { $cond: [{ $eq: ['$status', 'Review'] }, 1, 0] } },
                    todo: { $sum: { $cond: [{ $eq: ['$status', 'Todo'] }, 1, 0] } },
                    overdue: {
                        $sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $ne: ['$status', 'Completed'] },
                                        { $ne: ['$dueDate', null] },
                                        { $lt: ['$dueDate', new Date()] },
                                    ],
                                },
                                1,
                                0,
                            ],
                        },
                    },
                },
            },
        ]);

        res.status(200).json({
            success: true,
            data: stats[0] || { total: 0, completed: 0, inProgress: 0, review: 0, todo: 0, overdue: 0 },
        });
    } catch (error) {
        next(error);
    }
};

// @route   GET /api/v1/projects/:projectId/activities
// @access  Private (Project members only)
const getProjectActivities = async (req, res, next) => {
    try {
        const projectId = req.params.projectId || req.params.id;
        const activities = await ActivityLog.find({ project: projectId })
            .populate("user", "name email avatar")
            .sort({ createdAt: -1 })
            .limit(30);

        res.status(200).json({ success: true, activities });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createProject,
    getProjects,
    getProjectById,
    updateProject,
    deleteProject,
    addMember,
    removeMember,
    updateMemberRole,
    getProjectStats,
    getProjectActivities,
};
