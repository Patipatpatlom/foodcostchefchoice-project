import React, { useState, useEffect, useRef } from 'react';
import { Plus, Trash2, Calculator, Save, GripVertical, Printer } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import api from '../utils/api';

// We duplicate the formula here for real-time frontend calculations
// True Cost = ((purchasePrice / conversionFactor) * usageQuantity) / (yieldPercentage / 100)
const CONVERSION_FACTORS = {
  'kg_g': 1000,
  'g_kg': 0.001,
  'liter_ml': 1000,
  'ml_liter': 0.001,
};

function calculateCost(purchasePrice, purchaseUnit, usageQuantity, usageUnit, yieldPercentage) {
  if (!usageQuantity || usageQuantity <= 0) return 0;
  
  let conversionFactor = 1;
  if (purchaseUnit !== usageUnit) {
    const conversionKey = `${purchaseUnit}_${usageUnit}`;
    if (CONVERSION_FACTORS[conversionKey]) {
      conversionFactor = CONVERSION_FACTORS[conversionKey];
    } else {
      return 0; // Unsupported conversion
    }
  }

  const costPerUsageUnit = purchasePrice / conversionFactor;
  const rawCost = costPerUsageUnit * usageQuantity;
  return rawCost / (yieldPercentage / 100);
}

export default function RecipeBuilder() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');
  
  const [recipeName, setRecipeName] = useState('');
  const [recipeCategory, setRecipeCategory] = useState('Main Course');
  const [availableIngredients, setAvailableIngredients] = useState([]);
  const [sellingPrice, setSellingPrice] = useState('');
  
  // recipeIngredients array will hold objects:
  // { localId, ingredient: {...}, usageQuantity, usageUnit, calculatedCost }
  const [recipeIngredients, setRecipeIngredients] = useState([]);

  // Drag and Drop refs
  const dragItem = useRef(null);
  const dragOverItem = useRef(null);

  useEffect(() => {
    // Fetch available ingredients from Master List
    api.get('/ingredients')
      .then(res => setAvailableIngredients(res.data))
      .catch(err => console.error(err));
      
    // If Edit Mode, fetch recipe details
    if (editId) {
      api.get(`/recipes/${editId}`)
        .then(res => {
          const data = res.data;
          setRecipeName(data.name);
          if (data.category) setRecipeCategory(data.category);
          if (data.sellingPrice) setSellingPrice(data.sellingPrice);
          
          if (data.ingredients) {
            const mappedIngredients = data.ingredients.map((ing, i) => ({
              localId: Date.now() + i,
              ingredient: ing.ingredient,
              usageQuantity: ing.usageQuantity,
              usageUnit: ing.usageUnit,
              calculatedCost: ing.calculatedCost || 0
            }));
            setRecipeIngredients(mappedIngredients);
          }
        })
        .catch(err => console.error("Error fetching recipe for edit:", err));
    }
  }, [editId]);

  const addIngredientRow = () => {
    if (availableIngredients.length === 0) {
      alert("Please add ingredients to the Master List first!");
      return;
    }
    
    const defaultIng = availableIngredients[0];
    const newRow = {
      localId: Date.now(),
      ingredient: defaultIng,
      usageQuantity: 0,
      usageUnit: defaultIng.purchaseUnit === 'kg' ? 'g' : defaultIng.purchaseUnit === 'liter' ? 'ml' : defaultIng.purchaseUnit,
      calculatedCost: 0
    };
    
    setRecipeIngredients([...recipeIngredients, newRow]);
  };

  const updateRow = (localId, field, value) => {
    setRecipeIngredients(prev => prev.map(row => {
      if (row.localId !== localId) return row;
      
      const updatedRow = { ...row, [field]: value };
      
      // If ingredient changed, update usageUnit context if needed
      if (field === 'ingredient') {
         updatedRow.usageUnit = value.purchaseUnit === 'kg' ? 'g' : value.purchaseUnit === 'liter' ? 'ml' : value.purchaseUnit;
      }
      
      // Recalculate cost
      updatedRow.calculatedCost = calculateCost(
        updatedRow.ingredient.purchasePrice,
        updatedRow.ingredient.purchaseUnit,
        parseFloat(updatedRow.usageQuantity),
        updatedRow.usageUnit,
        updatedRow.ingredient.yieldPercentage
      );
      
      return updatedRow;
    }));
  };

  const removeRow = (localId) => {
    setRecipeIngredients(prev => prev.filter(row => row.localId !== localId));
  };

  const handleDragStart = (e, index) => {
    dragItem.current = index;
    // Optional: Add some visual feedback during drag
    e.currentTarget.style.opacity = '0.5';
  };

  const handleDragEnter = (e, index) => {
    dragOverItem.current = index;
  };

  const handleDragEnd = (e) => {
    e.currentTarget.style.opacity = '1';
    
    const fromIndex = dragItem.current;
    const toIndex = dragOverItem.current;
    
    if (fromIndex === null || toIndex === null) return;
    if (fromIndex === toIndex) return;
    
    setRecipeIngredients(prev => {
      const copy = [...prev];
      const draggedItemContent = copy[fromIndex];
      // Safety check just in case
      if (!draggedItemContent) return prev;
      
      copy.splice(fromIndex, 1);
      copy.splice(toIndex, 0, draggedItemContent);
      return copy;
    });
    
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const scaleRecipe = (multiplier) => {
    setRecipeIngredients(prev => prev.map(row => {
      const newQuantity = parseFloat(row.usageQuantity || 0) * multiplier;
      return {
        ...row,
        usageQuantity: newQuantity,
        calculatedCost: calculateCost(
          row.ingredient.purchasePrice,
          row.ingredient.purchaseUnit,
          newQuantity,
          row.usageUnit,
          row.ingredient.yieldPercentage
        )
      };
    }));
  };

  const saveRecipe = async () => {
    if (!recipeName) return alert("Please enter a recipe name.");
    if (recipeIngredients.length === 0) return alert("Please add at least one ingredient.");
    
    try {
      const payload = {
        name: recipeName,
        category: recipeCategory,
        sellingPrice: sellingPrice ? parseFloat(sellingPrice) : 0,
        ingredients: recipeIngredients.map(row => ({
          ingredientId: row.ingredient.id,
          usageQuantity: parseFloat(row.usageQuantity),
          usageUnit: row.usageUnit
        }))
      };
      
      if (editId) {
        await api.put(`/recipes/${editId}`, payload);
        alert("Recipe Updated Successfully!");
      } else {
        await api.post('/recipes', payload);
        alert("Recipe Saved to Recipe Book!");
      }
      
      navigate('/recipes');
    } catch (error) {
      console.error(error);
      alert("Failed to save recipe.");
    }
  };

  const downloadRecipe = () => {
    if (!recipeName) return alert("Please enter a recipe name.");
    if (recipeIngredients.length === 0) return alert("Please add at least one ingredient.");

    // CSV Header
    let csvContent = "Ingredient,Usage Quantity,Unit,Calculated Cost (Baht)\n";
    
    // CSV Rows
    recipeIngredients.forEach(row => {
      // Escape commas in ingredient names if any
      const safeName = `"${row.ingredient.name.replace(/"/g, '""')}"`;
      csvContent += `${safeName},${row.usageQuantity},${row.usageUnit},${row.calculatedCost.toFixed(2)}\n`;
    });
    
    csvContent += `\nTotal Recipe Cost,,,${totalCost.toFixed(2)}\n`;
    csvContent += `Target Sale Price (30% Food Cost),,,${totalCost > 0 ? (totalCost / 0.3).toFixed(2) : '0.00'}\n`;

    // Add UTF-8 BOM so Excel opens it with correct encoding (Thai language support)
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${recipeName.replace(/\s+/g, '_')}_Costing.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const totalCost = recipeIngredients.reduce((sum, row) => sum + (row.calculatedCost || 0), 0);
  
  const foodCostPercentage = sellingPrice > 0 ? ((totalCost / parseFloat(sellingPrice)) * 100).toFixed(1) : 0;
  let marginColor = "bg-gray-100 text-gray-800 border-gray-200";
  if (sellingPrice > 0) {
    if (foodCostPercentage <= 30) marginColor = "bg-green-100 text-green-800 border-green-200";
    else if (foodCostPercentage <= 35) marginColor = "bg-yellow-100 text-yellow-800 border-yellow-200";
    else marginColor = "bg-red-100 text-red-800 border-red-200";
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 print:hidden">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">{editId ? 'Edit Recipe' : 'Recipe Builder'}</h2>
          <p className="text-gray-500">Design your recipe and see the true cost instantly.</p>
        </div>
        <div className="flex flex-wrap gap-3 w-full sm:w-auto">
          <button onClick={() => window.print()} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 flex-1 sm:flex-none">
            <Printer className="w-4 h-4" /> Print Recipe
          </button>
          <button onClick={downloadRecipe} className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 px-4 py-2 rounded-lg font-medium transition-colors shadow-sm flex-1 sm:flex-none text-center">
            Export .csv
          </button>
          <button onClick={saveRecipe} className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-medium transition-colors shadow-sm flex items-center justify-center gap-2 w-full sm:w-auto">
            <Save className="w-5 h-5" /> Save Recipe
          </button>
        </div>
      </div>

      <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 print:shadow-none print:border-none print:p-0 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 print:block">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2 print:hidden">Recipe Name</label>
            <input 
              type="text" 
              placeholder="e.g., Pan Seared Salmon with Avocado Salsa" 
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-lg font-medium transition-all print:hidden"
            />
            <h1 className="hidden print:block text-4xl font-bold text-gray-900 mb-2">{recipeName || 'Untitled Recipe'}</h1>
            <span className="hidden print:inline-block px-3 py-1 bg-gray-100 text-gray-800 rounded-full text-sm font-medium mb-6">
              {recipeCategory}
            </span>
          </div>
          
          <div className="print:hidden">
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select 
              value={recipeCategory} 
              onChange={(e) => setRecipeCategory(e.target.value)}
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 text-lg font-medium transition-all bg-white"
            >
              <option value="Main Course">Main Course</option>
              <option value="Appetizer">Appetizer</option>
              <option value="Dessert">Dessert</option>
              <option value="Beverage">Beverage</option>
              <option value="Soup">Soup</option>
              <option value="Salad">Salad</option>
              <option value="Other">Other</option>
            </select>
          </div>
        </div>

        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 print:hidden">
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
              <h3 className="text-lg font-bold text-gray-900">Ingredients</h3>
              {recipeIngredients.length > 0 && (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">
                  <span className="text-sm font-medium text-gray-500">Scale Recipe:</span>
                  <button onClick={() => scaleRecipe(0.5)} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 px-2 py-1 rounded font-medium">Half (0.5x)</button>
                  <button onClick={() => scaleRecipe(2)} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 px-2 py-1 rounded font-medium">Double (2x)</button>
                  <button onClick={() => scaleRecipe(5)} className="text-xs bg-white border border-gray-300 hover:bg-gray-100 px-2 py-1 rounded font-medium">5x</button>
                </div>
              )}
            </div>
            <button onClick={addIngredientRow} className="text-orange-500 hover:text-orange-600 font-medium flex items-center justify-center gap-1 text-sm bg-orange-50 px-3 py-1.5 rounded-md transition-colors w-full sm:w-auto">
              <Plus className="w-4 h-4" /> Add Ingredient
            </button>
          </div>
          
          <div className="border border-gray-200 rounded-lg overflow-x-auto print:border-none print:overflow-visible">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200 print:bg-white print:border-black">
                  <th className="p-4 font-medium w-8 print:hidden"></th>
                  <th className="p-4 font-medium w-1/3">Ingredient</th>
                  <th className="p-4 font-medium">Usage</th>
                  <th className="p-4 font-medium">Unit</th>
                  <th className="p-4 font-medium text-right print:hidden">Calculated Cost</th>
                  <th className="p-4 font-medium w-16 print:hidden"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 print:divide-black/20">
                {recipeIngredients.map((row, index) => (
                  <tr 
                    key={row.localId} 
                    className="hover:bg-gray-50/50 transition-colors group bg-white"
                    draggable
                    onDragStart={(e) => handleDragStart(e, index)}
                    onDragEnter={(e) => handleDragEnter(e, index)}
                    onDragEnd={handleDragEnd}
                    onDragOver={(e) => e.preventDefault()}
                  >
                    <td className="p-4 cursor-grab active:cursor-grabbing text-gray-300 hover:text-gray-500 print:hidden">
                      <GripVertical className="w-5 h-5" />
                    </td>
                    <td className="p-4">
                      <select 
                        value={row.ingredient?.id || ''} 
                        onChange={(e) => {
                          const selected = availableIngredients.find(i => i.id === parseInt(e.target.value));
                          updateRow(row.localId, 'ingredient', selected);
                        }}
                        className="w-full px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-orange-500 print:hidden"
                      >
                        {availableIngredients.map(ing => (
                          <option key={ing.id} value={ing.id}>{ing.name} (Yield: {ing.yieldPercentage}%)</option>
                        ))}
                      </select>
                      <span className="hidden print:block font-medium text-gray-900 text-lg">{row.ingredient?.name || '-'}</span>
                    </td>
                    <td className="p-4">
                      <input 
                        type="number" 
                        min="0"
                        value={row.usageQuantity || ''} 
                        onChange={(e) => updateRow(row.localId, 'usageQuantity', e.target.value)}
                        className="w-24 px-2 py-1.5 border border-gray-300 rounded text-right focus:outline-none focus:border-orange-500 print:hidden" 
                        placeholder="0"
                      />
                      <span className="hidden print:block font-bold text-gray-900 text-lg">{row.usageQuantity || 0}</span>
                    </td>
                    <td className="p-4">
                      <select 
                        value={row.usageUnit} 
                        onChange={(e) => updateRow(row.localId, 'usageUnit', e.target.value)}
                        className="w-20 px-2 py-1.5 border border-gray-200 rounded focus:outline-none focus:border-orange-500 print:hidden"
                      >
                        <option value="g">g</option>
                        <option value="kg">kg</option>
                        <option value="ml">ml</option>
                        <option value="liter">liter</option>
                        <option value="piece">piece</option>
                      </select>
                      <span className="hidden print:block text-gray-700 text-lg">{row.usageUnit}</span>
                    </td>
                    <td className="p-4 text-right font-medium text-gray-900 print:hidden">
                      ฿{row.calculatedCost ? row.calculatedCost.toFixed(2) : '0.00'}
                    </td>
                    <td className="p-4 text-center print:hidden">
                      <button onClick={() => removeRow(row.localId)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </td>
                  </tr>
                ))}
                {recipeIngredients.length === 0 && (
                  <tr>
                    <td colSpan="6" className="p-8 text-center text-gray-400">Click "Add Ingredient" to start building your recipe.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="bg-orange-50 p-6 rounded-lg border border-orange-100 flex flex-col sm:flex-row gap-6 items-center justify-between print:bg-transparent print:border-none print:p-0 print:mt-8">
          <div className="flex items-center gap-4 w-full sm:w-auto">
            <div className="p-3 bg-orange-100 text-orange-600 rounded-lg print:hidden">
              <Calculator className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-orange-800 print:text-gray-900 print:text-xl">Total Recipe Cost</p>
              <p className="text-3xl font-bold text-orange-600 print:text-gray-900 print:text-4xl">฿{totalCost.toFixed(2)}</p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-6 items-center w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-orange-200 pt-4 sm:pt-0 sm:pl-6 print:hidden">
            <div>
              <p className="text-sm font-medium text-orange-800 mb-1">Selling Price (฿)</p>
              <input 
                type="number" 
                value={sellingPrice} 
                onChange={e => setSellingPrice(e.target.value)}
                placeholder="e.g. 250"
                className="w-32 px-3 py-2 border border-orange-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 text-lg font-bold"
              />
            </div>
            
            <div className="text-center sm:text-right">
              <p className="text-sm font-medium text-orange-800 mb-1">Food Cost %</p>
              {sellingPrice > 0 ? (
                <div className={`px-3 py-1.5 rounded-lg border ${marginColor} flex items-center justify-center font-bold text-lg`}>
                  {foodCostPercentage}%
                </div>
              ) : (
                <div className="text-gray-400 font-medium mt-2">Enter price to calculate</div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
