const Project = require('../models/Project');
const Task = require('../models/Task');
const RCA = require('../models/RCA');

/**
 * @route   GET /api/v1/search
 * @desc    Global platform search (projects, tasks, RCAs)
 * @access  Private
 */
const globalSearch = async (req, res, next) => {
    try {
        const q = req.query.q || '';
        if (!q.trim()) {
            return res.status(200).json({
                success: true,
                data: { projects: [], tasks: [], rcas: [] },
            });
        }

        const regex = new RegExp(q, 'i');
        const userId = req.user._id;
        const isAdmin = req.user.role === 'Admin';

        // 1. Search Projects user has access to
        let userProjectsQuery = {};
        if (!isAdmin) {
            userProjectsQuery = {
                $or: [{ owner: userId }, { 'members.user': userId }],
            };
        }
        const userProjects = await Project.find(userProjectsQuery).select('_id');
        const allowedProjectIds = userProjects.map((p) => p._id);

        const projectQuery = {
            _id: { $in: allowedProjectIds },
            $or: [
                { name: { $regex: regex } },
                { description: { $regex: regex } },
            ],
        };
        const projects = await Project.find(projectQuery).limit(5);

        // 2. Search Tasks user has access to
        const taskQuery = {
            project: { $in: allowedProjectIds },
            $or: [
                { title: { $regex: regex } },
                { description: { $regex: regex } },
                { tags: { $in: [regex] } },
            ],
        };
        const tasks = await Task.find(taskQuery)
            .populate('project', 'name')
            .limit(10);

        // 3. Search RCAs user has access to
        const rcaQuery = {
            project: { $in: allowedProjectIds },
            $or: [
                { title: { $regex: regex } },
                { rootCause: { $regex: regex } },
                { description: { $regex: regex } },
            ],
        };
        const rcas = await RCA.find(rcaQuery)
            .populate('project', 'name')
            .limit(5);

        res.status(200).json({
            success: true,
            data: {
                projects,
                tasks,
                rcas,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { globalSearch };
