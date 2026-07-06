const Joi = require('joi');

const objectId = Joi.string().regex(/^[0-9a-fA-F]{24}$/);

const createRCASchema = Joi.object({
  title: Joi.string().trim().max(200).required(),
  task: objectId.allow(null).empty('').default(null),
  incidentDescription: Joi.string().trim().max(10000).required(),
  impact: Joi.string().trim().max(5000).allow('').default(''),
  rootCause: Joi.string().trim().max(10000).allow('').default(''),
  resolutionSteps: Joi.string().trim().max(10000).allow('').default(''),
  reviewer: objectId.allow(null).empty('').default(null),
});

const updateRCASchema = Joi.object({
  title: Joi.string().trim().max(200),
  task: objectId.allow(null).empty(''),
  incidentDescription: Joi.string().trim().max(10000),
  impact: Joi.string().trim().max(5000).allow(''),
  rootCause: Joi.string().trim().max(10000).allow(''),
  resolutionSteps: Joi.string().trim().max(10000).allow(''),
  reviewer: objectId.allow(null).empty(''),
}).min(1);

module.exports = {
  createRCASchema,
  updateRCASchema,
};
