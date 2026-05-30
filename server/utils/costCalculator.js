const CONVERSION_FACTORS = {
  // Mass
  'kg_g': 1000,
  'g_kg': 0.001,
  // Volume
  'liter_ml': 1000,
  'ml_liter': 0.001,
};

/**
 * Calculates the true cost of an ingredient used in a recipe.
 * 
 * Formula: True Cost = ((purchasePrice / conversionFactor) * usageQuantity) / (yieldPercentage / 100)
 * 
 * @param {number} purchasePrice - The price paid for the purchase unit.
 * @param {string} purchaseUnit - The unit the ingredient was purchased in (e.g., 'kg', 'liter').
 * @param {number} usageQuantity - The amount of the ingredient used in the recipe.
 * @param {string} usageUnit - The unit used in the recipe (e.g., 'g', 'ml').
 * @param {number} yieldPercentage - The usable percentage of the ingredient (1-100).
 * @returns {number} The calculated true cost.
 */
function calculateIngredientCost(purchasePrice, purchaseUnit, usageQuantity, usageUnit, yieldPercentage) {
  if (yieldPercentage <= 0 || yieldPercentage > 100) {
    throw new Error('Yield percentage must be between 1 and 100.');
  }

  let conversionFactor = 1;

  if (purchaseUnit !== usageUnit) {
    const conversionKey = `${purchaseUnit}_${usageUnit}`;
    if (CONVERSION_FACTORS[conversionKey]) {
      conversionFactor = CONVERSION_FACTORS[conversionKey];
    } else {
      throw new Error(`Unsupported unit conversion from ${purchaseUnit} to ${usageUnit}`);
    }
  }

  const costPerUsageUnit = purchasePrice / conversionFactor;
  const rawCost = costPerUsageUnit * usageQuantity;
  const trueCost = rawCost / (yieldPercentage / 100);

  return trueCost;
}

export { calculateIngredientCost };
