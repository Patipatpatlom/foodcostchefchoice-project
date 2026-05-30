import { calculateIngredientCost } from '../utils/costCalculator.js';
import { prisma } from '../utils/db.js';

// Get all recipes
export const getRecipes = async (req, res) => {
  try {
    const recipes = await prisma.recipe.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });
    
    // Calculate costs for each recipe
    const recipesWithCosts = recipes.map(recipe => {
      let totalCost = 0;
      recipe.ingredients.forEach(recipeIng => {
        const { ingredient, usageQuantity, usageUnit } = recipeIng;
        try {
          totalCost += calculateIngredientCost(
            ingredient.purchasePrice,
            ingredient.purchaseUnit,
            usageQuantity,
            usageUnit,
            ingredient.yieldPercentage
          );
        } catch (err) {
          // ignore calculation errors for summary
        }
      });
      
      const foodCostPercentage = recipe.sellingPrice > 0 
        ? ((totalCost / recipe.sellingPrice) * 100).toFixed(1) 
        : 0;
        
      return {
        ...recipe,
        totalCost,
        foodCostPercentage: parseFloat(foodCostPercentage)
      };
    });
    
    res.json(recipesWithCosts);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new recipe
export const createRecipe = async (req, res) => {
  try {
    const { name, category, sellingPrice, description, ingredients } = req.body;
    
    const recipe = await prisma.recipe.create({
      data: {
        name,
        category: category || "Other",
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
        description,
        userId: req.user.id,
        ingredients: {
          create: ingredients.map(ing => ({
            ingredientId: ing.ingredientId,
            usageQuantity: ing.usageQuantity,
            usageUnit: ing.usageUnit
          }))
        }
      },
      include: {
        ingredients: true
      }
    });
    
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single recipe with calculated cost
export const getRecipeById = async (req, res) => {
  try {
    const { id } = req.params;
    const recipe = await prisma.recipe.findFirst({
      where: { id: parseInt(id), userId: req.user.id },
      include: {
        ingredients: {
          include: {
            ingredient: true
          }
        }
      }
    });
    
    if (!recipe) return res.status(404).json({ error: 'Not found' });
    
    let totalCost = 0;
    
    const calculatedIngredients = recipe.ingredients.map(recipeIng => {
      const { ingredient, usageQuantity, usageUnit } = recipeIng;
      let cost = 0;
      let error = null;
      try {
        cost = calculateIngredientCost(
          ingredient.purchasePrice,
          ingredient.purchaseUnit,
          usageQuantity,
          usageUnit,
          ingredient.yieldPercentage
        );
        totalCost += cost;
      } catch (err) {
        error = err.message;
      }
      
      return {
        ...recipeIng,
        calculatedCost: cost,
        error
      };
    });
    
    res.json({
      ...recipe,
      ingredients: calculatedIngredients,
      totalCost,
      costPerPortion: totalCost // Default to 1 portion for MVP
    });
    
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update a recipe
export const updateRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, sellingPrice, description, ingredients } = req.body;
    
    const existing = await prisma.recipe.findFirst({ where: { id: parseInt(id), userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Not found or unauthorized' });

    const recipe = await prisma.recipe.update({
      where: { id: parseInt(id) },
      data: {
        name,
        category: category || "Other",
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
        description,
        ingredients: {
          deleteMany: {},
          create: ingredients.map(ing => ({
            ingredientId: ing.ingredientId,
            usageQuantity: ing.usageQuantity,
            usageUnit: ing.usageUnit
          }))
        }
      },
      include: {
        ingredients: true
      }
    });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete a recipe
export const deleteRecipe = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.recipe.findFirst({ where: { id: parseInt(id), userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Not found or unauthorized' });

    await prisma.recipe.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
