const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createTaskSchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  description: Joi.string().trim().max(5000).allow(''),
  project: objectId.required(),
  assignees: Joi.array().items(objectId).default([]),
  status: Joi.string().valid('Todo', 'In Progress', 'Review', 'Completed').default('Todo'),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical').default('Medium'),
  dueDate: Joi.date().allow(null).default(null),
  tags: Joi.array().items(Joi.string().trim().max(50)).default([]),
  subtasks: Joi.array()
    .items(
      Joi.object({
        title: Joi.string().trim().max(200).required(),
        completed: Joi.boolean().default(false),
      })
    )
    .default([]),
  recurrence: Joi.string().valid('None', 'Daily', 'Weekly', 'Monthly').default('None'),
});

const updateTaskSchema = Joi.object({
  title: Joi.string().trim().max(200),
  description: Joi.string().trim().max(5000).allow(''),
  assignees: Joi.array().items(objectId),
  status: Joi.string().valid('Todo', 'In Progress', 'Review', 'Completed'),
  priority: Joi.string().valid('Low', 'Medium', 'High', 'Critical'),
  dueDate: Joi.date().allow(null),
  tags: Joi.array().items(Joi.string().trim().max(50)),
  subtasks: Joi.array().items(
    Joi.object({
      _id: Joi.string(),
      title: Joi.string().trim().max(200).required(),
      completed: Joi.boolean().default(false),
    })
  ),
  order: Joi.number().integer(),
  recurrence: Joi.string().valid('None', 'Daily', 'Weekly', 'Monthly'),
}).min(1);

const reorderTasksSchema = Joi.object({
  tasks: Joi.array()
    .items(
      Joi.object({
        _id: objectId.required(),
        status: Joi.string().valid('Todo', 'In Progress', 'Review', 'Completed').required(),
        order: Joi.number().integer().required(),
      })
    )
    .min(1)
    .required(),
});

const addDependencySchema = Joi.object({
  predecessorId: objectId.required(),
  successorId: objectId.required(),
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  reorderTasksSchema,
  addDependencySchema,
};
