import express from 'express';
import {
  getIngredients,
  createIngredient,
  getIngredientById,
  updateIngredient,
  deleteIngredient
} from '../controllers/ingredientController.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

router.route('/')
  .get(getIngredients)
  .post(createIngredient);

router.route('/:id')
  .get(getIngredientById)
  .put(requireRole(['EXECUTIVE_CHEF', 'SOUS_CHEF']), updateIngredient)
  .delete(requireRole(['EXECUTIVE_CHEF', 'SOUS_CHEF']), deleteIngredient);

export default router;
