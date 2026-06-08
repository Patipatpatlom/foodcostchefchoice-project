import { prisma } from '../utils/db.js';

// Get all ingredients
export const getIngredients = async (req, res) => {
  try {
    const ingredients = await prisma.ingredient.findMany({
      where: { userId: req.user.id },
      orderBy: { name: 'asc' }
    });
    res.json(ingredients);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Create a new ingredient
export const createIngredient = async (req, res) => {
  try {
    const { name, category, purchasePrice, purchaseUnit, yieldPercentage } = req.body;
    const ingredient = await prisma.ingredient.create({
      data: { name, category, purchasePrice, purchaseUnit, yieldPercentage, userId: req.user.id }
    });
    res.status(201).json(ingredient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Get single ingredient
export const getIngredientById = async (req, res) => {
  try {
    const { id } = req.params;
    const ingredient = await prisma.ingredient.findFirst({
      where: { id: parseInt(id), userId: req.user.id }
    });
    if (!ingredient) return res.status(404).json({ error: 'Not found or unauthorized' });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Update an ingredient
export const updateIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, category, purchasePrice, purchaseUnit, yieldPercentage } = req.body;
    
    const existing = await prisma.ingredient.findFirst({ where: { id: parseInt(id), userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Not found or unauthorized' });

    const ingredient = await prisma.ingredient.update({
      where: { id: parseInt(id) },
      data: { name, category, purchasePrice, purchaseUnit, yieldPercentage }
    });
    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Delete an ingredient
export const deleteIngredient = async (req, res) => {
  try {
    const { id } = req.params;
    const existing = await prisma.ingredient.findFirst({ where: { id: parseInt(id), userId: req.user.id } });
    if (!existing) return res.status(404).json({ error: 'Not found or unauthorized' });

    await prisma.ingredient.delete({
      where: { id: parseInt(id) }
    });
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

// Upsert an ingredient's price
export const upsertIngredientPrice = async (req, res) => {
  try {
    const { name, purchasePrice, purchaseUnit, category = "Fresh Produce", yieldPercentage = 100 } = req.body;
    
    const ingredient = await prisma.ingredient.upsert({
      where: {
        name_userId: {
          name: name,
          userId: req.user.id
        }
      },
      update: {
        purchasePrice: purchasePrice,
        purchaseUnit: purchaseUnit
      },
      create: {
        name: name,
        category: category,
        purchasePrice: purchasePrice,
        purchaseUnit: purchaseUnit,
        yieldPercentage: yieldPercentage,
        userId: req.user.id
      }
    });

    res.json(ingredient);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
