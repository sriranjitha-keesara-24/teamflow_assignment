const reportService = require('../Services/reportService');
const Task = require('../models/Task');
const RCA = require('../models/RCA');
const User = require('../models/User');
const Project = require('../models/Project');
const { exportToCsvString } = require('../utils/csvExporter');

/**
 * @desc    Get dashboard analytics for a project
 * @route   GET /api/v1/projects/:projectId/reports/dashboard
 * @access  Private
 */
const getProjectDashboardReport = async (req, res, next) => {
    try {
        const { startDate, endDate } = req.query;
        const reportData = await reportService.getProjectReportData(
            req.params.projectId,
            startDate,
            endDate
        );
        res.json({ success: true, data: reportData });
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Export CSV data
 * @route   GET /api/v1/projects/:projectId/reports/export
 * @access  Private
 */
const exportProjectData = async (req, res, next) => {
    try {
        const { type } = req.query;
        const { projectId } = req.params;

        if (type === 'tasks') {
            const tasks = await Task.find({ project: projectId }).populate('assignees', 'name email');
            const headers = [
                { id: 'title', title: 'Task Title' },
                { id: 'description', title: 'Description' },
                { id: 'status', title: 'Status' },
                { id: 'priority', title: 'Priority' },
                { id: 'dueDate', title: 'Due Date' },
                { id: 'assignees', title: 'Assignees' },
            ];

            const records = tasks.map((t) => ({
                title: t.title,
                description: t.description || '',
                status: t.status,
                priority: t.priority,
                dueDate: t.dueDate ? t.dueDate.toISOString().split('T')[0] : '',
                assignees: t.assignees.map((a) => a.name).join('; '),
            }));

            const csv = exportToCsvString(headers, records);
            res.header('Content-Type', 'text/csv');
            res.attachment(`project-${projectId}-tasks.csv`);
            return res.send(csv);
        } else if (type === 'rca') {
            const rcas = await RCA.find({ project: projectId })
                .populate('submitter', 'name email')
                .populate('reviewer', 'name email');

            const headers = [
                { id: 'title', title: 'RCA Title' },
                { id: 'status', title: 'Status' },
                { id: 'incidentDescription', title: 'Incident Description' },
                { id: 'impact', title: 'Impact' },
                { id: 'rootCause', title: 'Root Cause' },
                { id: 'resolutionSteps', title: 'Resolution Steps' },
                { id: 'submitter', title: 'Submitter' },
                { id: 'reviewer', title: 'Reviewer' },
            ];

            const records = rcas.map((r) => ({
                title: r.title,
                status: r.status,
                incidentDescription: r.incidentDescription,
                impact: r.impact || '',
                rootCause: r.rootCause || '',
                resolutionSteps: r.resolutionSteps || '',
                submitter: r.submitter?.name || '',
                reviewer: r.reviewer?.name || '',
            }));

            const csv = exportToCsvString(headers, records);
            res.header('Content-Type', 'text/csv');
            res.attachment(`project-${projectId}-rca.csv`);
            return res.send(csv);
        } else {
            return res.status(400).json({ success: false, message: 'Invalid export type. Use "tasks" or "rca".' });
        }
    } catch (err) {
        next(err);
    }
};

/**
 * @desc    Get advanced project analytics (burndown, workload, cycle time, time report)
 * @route   GET /api/v1/projects/:projectId/reports/advanced
 * @access  Private
 */
const getAdvancedProjectReport = async (req, res, next) => {
    try {
        const { projectId } = req.params;
        const project = await Project.findById(projectId).populate('members.user', 'name email avatar');
        if (!project) {
            return res.status(404).json({ success: false, message: 'Project not found' });
        }

        const tasks = await Task.find({ project: projectId }).populate('assignees', 'name email avatar');

        // 1. Team Workload View
        const workloadMap = {};
        project.members.forEach(m => {
            if (m.user) {
                workloadMap[m.user._id.toString()] = {
                    name: m.user.name,
                    avatar: m.user.avatar,
                    email: m.user.email,
                    todo: 0,
                    inProgress: 0,
                    review: 0,
                    completed: 0,
                    totalOpen: 0
                };
            }
        });

        const ownerId = project.owner.toString();
        if (!workloadMap[ownerId]) {
            const ownerObj = await User.findById(ownerId);
            if (ownerObj) {
                workloadMap[ownerId] = {
                    name: ownerObj.name,
                    avatar: ownerObj.avatar,
                    email: ownerObj.email,
                    todo: 0,
                    inProgress: 0,
                    review: 0,
                    completed: 0,
                    totalOpen: 0
                };
            }
        }

        tasks.forEach(t => {
            t.assignees.forEach(a => {
                const uid = a._id.toString();
                if (workloadMap[uid]) {
                    if (t.status === 'Todo') { workloadMap[uid].todo++; workloadMap[uid].totalOpen++; }
                    else if (t.status === 'In Progress') { workloadMap[uid].inProgress++; workloadMap[uid].totalOpen++; }
                    else if (t.status === 'Review') { workloadMap[uid].review++; workloadMap[uid].totalOpen++; }
                    else if (t.status === 'Completed') { workloadMap[uid].completed++; }
                }
            });
        });
        const teamWorkload = Object.values(workloadMap);

        // 2. Cycle Time Metrics
        const timeLogStatus = {
            'Todo': { totalTime: 0, count: 0 },
            'In Progress': { totalTime: 0, count: 0 },
            'Review': { totalTime: 0, count: 0 }
        };

        tasks.forEach(t => {
            const history = t.statusHistory || [];
            for (let i = 0; i < history.length; i++) {
                const current = history[i];
                const nextEntry = history[i + 1];
                const start = new Date(current.updatedAt);
                const end = nextEntry ? new Date(nextEntry.updatedAt) : new Date();
                const diffDays = Math.max(0.01, (end - start) / (1000 * 60 * 60 * 24));

                if (timeLogStatus[current.status]) {
                    timeLogStatus[current.status].totalTime += diffDays;
                    timeLogStatus[current.status].count++;
                }
            }
        });

        const cycleTime = {
            'Todo': timeLogStatus['Todo'].count > 0 ? parseFloat((timeLogStatus['Todo'].totalTime / timeLogStatus['Todo'].count).toFixed(1)) : 0,
            'In Progress': timeLogStatus['In Progress'].count > 0 ? parseFloat((timeLogStatus['In Progress'].totalTime / timeLogStatus['In Progress'].count).toFixed(1)) : 0,
            'Review': timeLogStatus['Review'].count > 0 ? parseFloat((timeLogStatus['Review'].totalTime / timeLogStatus['Review'].count).toFixed(1)) : 0
        };

        // 3. Burndown Chart
        const burndown = [];
        const today = new Date();
        today.setHours(23, 59, 59, 999);

        const dateList = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date();
            d.setDate(today.getDate() - i);
            d.setHours(23, 59, 59, 999);
            dateList.push(d);
        }

        dateList.forEach(targetDate => {
            let openCount = 0;
            tasks.forEach(t => {
                const createdAt = new Date(t.createdAt);
                if (createdAt > targetDate) return;

                const history = t.statusHistory || [];
                let statusOnDate = 'Todo';

                let matchedEntry = null;
                history.forEach(h => {
                    const hTime = new Date(h.updatedAt);
                    if (hTime <= targetDate) {
                        if (!matchedEntry || hTime > new Date(matchedEntry.updatedAt)) {
                            matchedEntry = h;
                        }
                    }
                });

                if (matchedEntry) {
                    statusOnDate = matchedEntry.status;
                } else if (t.status) {
                    statusOnDate = t.status;
                }

                if (statusOnDate !== 'Completed') {
                    openCount++;
                }
            });

            burndown.push({
                date: targetDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
                openTasks: openCount
            });
        });

        // 4. Time Tracking Weekly Aggregation
        const userTimeLogsMap = {};
        project.members.forEach(m => {
            if (m.user) {
                userTimeLogsMap[m.user._id.toString()] = {
                    name: m.user.name,
                    avatar: m.user.avatar,
                    totalMinutes: 0
                };
            }
        });
        if (!userTimeLogsMap[ownerId]) {
            const ownerObj = await User.findById(ownerId);
            if (ownerObj) {
                userTimeLogsMap[ownerId] = {
                    name: ownerObj.name,
                    avatar: ownerObj.avatar,
                    totalMinutes: 0
                };
            }
        }

        tasks.forEach(t => {
            (t.timeLogs || []).forEach(l => {
                const uid = l.user.toString();
                if (userTimeLogsMap[uid]) {
                    userTimeLogsMap[uid].totalMinutes += l.duration || 0;
                }
            });
        });

        const timeReport = Object.values(userTimeLogsMap).map(u => ({
            ...u,
            totalHours: parseFloat((u.totalMinutes / 60).toFixed(1))
        }));

        res.status(200).json({
            success: true,
            data: {
                teamWorkload,
                cycleTime,
                burndown,
                timeReport,
                deadline: project.deadline
            }
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getProjectDashboardReport,
    exportProjectData,
    getAdvancedProjectReport,
};
