import express from 'express';
import {
  getRecipes,
  createRecipe,
  getRecipeById,
  updateRecipe,
  deleteRecipe
} from '../controllers/recipeController.js';
import { requireRole } from '../middleware/requireRole.js';

const router = express.Router();

router.route('/')
  .get(getRecipes)
  .post(createRecipe);

router.route('/:id')
  .get(getRecipeById)
  .put(requireRole(['EXECUTIVE_CHEF', 'SOUS_CHEF']), updateRecipe)
  .delete(requireRole(['EXECUTIVE_CHEF', 'SOUS_CHEF']), deleteRecipe);

export default router;
