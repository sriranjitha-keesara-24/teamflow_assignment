const cron = require('node-cron');
const Task = require('../models/Task');
const { createNotification } = require('../Services/NotificationService');
const { logger } = require('../utils/logger');

// Run every day at 8:00 AM (0 8 * * *)
const startDeadlineCron = () => {
  logger.info('Initializing deadline reminder cron job...');
  
  cron.schedule('0 8 * * *', async () => {
    logger.info('Running deadline reminder cron job...');
    try {
      const now = new Date();
      const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      
      // Find tasks that are not completed, have a dueDate, and are due in the next 24 hours
      const tasks = await Task.find({
        status: { $ne: 'Completed' },
        dueDate: { $gte: now, $lte: in24Hours }
      }).populate('assignees', '_id name email');

      logger.info(`Found ${tasks.length} tasks due in the next 24 hours for deadline alerts.`);

      for (const task of tasks) {
        if (!task.assignees || task.assignees.length === 0) continue;
        
        for (const assignee of task.assignees) {
          try {
            await createNotification({
              recipient: assignee._id,
              type: 'DEADLINE_APPROACHING',
              title: 'Task Deadline Approaching',
              message: `The task "${task.title}" is due on ${task.dueDate.toLocaleDateString()} at ${task.dueDate.toLocaleTimeString()}`,
              link: `/tasks/${task._id}`,
              relatedEntity: {
                type: 'Task',
                id: task._id
              }
            });
            logger.info(`Sent deadline warning to ${assignee.name} for task: ${task.title}`);
          } catch (notifErr) {
            logger.error(`Error notifying user ${assignee._id} for task ${task._id}: ${notifErr.message}`);
          }
        }
      }
    } catch (err) {
      logger.error(`Error in deadline reminder cron: ${err.message}`);
    }
  });
};

module.exports = { startDeadlineCron };
