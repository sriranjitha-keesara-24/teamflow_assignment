const reportService = require('../Services/reportService.js');
const Task = require('../models/Task');
const RCA = require('../models/RCA');
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

module.exports = {
    getProjectDashboardReport,
    exportProjectData,
};
