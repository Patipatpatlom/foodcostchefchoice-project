import React, { useState, useEffect } from 'react';
import { BookOpen, Search, Trash2, Eye, Pencil, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import RequireRole from '../components/RequireRole';

export default function RecipesList() {
  const navigate = useNavigate();
  const [recipes, setRecipes] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });
  const [viewRecipe, setViewRecipe] = useState(null);

  useEffect(() => {
    fetchRecipes();
  }, []);

  const fetchRecipes = async () => {
    try {
      const response = await api.get('/recipes');
      setRecipes(response.data);
    } catch (error) {
      console.error("Error fetching recipes:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this recipe?")) {
      try {
        await api.delete(`/recipes/${id}`);
        fetchRecipes();
      } catch (error) {
        console.error("Error deleting recipe:", error);
        alert("Failed to delete recipe.");
      }
    }
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortedAndFilteredRecipes = () => {
    let filtered = recipes.filter(r => 
      r.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (r.category && r.category.toLowerCase().includes(searchQuery.toLowerCase()))
    );

    return filtered.sort((a, b) => {
      let aVal = a[sortConfig.key];
      let bVal = b[sortConfig.key];
      
      if (sortConfig.key === 'createdAt') {
        aVal = new Date(aVal).getTime();
        bVal = new Date(bVal).getTime();
      }

      if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
      return 0;
    });
  };

  const displayedRecipes = getSortedAndFilteredRecipes();

  const getMarginBadge = (percentage) => {
    if (!percentage || percentage === 0) return <span className="text-gray-400">-</span>;
    if (percentage <= 30) return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-green-100 text-green-800">{percentage}%</span>;
    if (percentage <= 35) return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-yellow-100 text-yellow-800">{percentage}%</span>;
    return <span className="inline-flex items-center px-2 py-1 rounded text-xs font-bold bg-red-100 text-red-800">{percentage}%</span>;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Recipe Book</h2>
          <p className="text-gray-500">View and manage your saved recipes.</p>
        </div>
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search recipes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all w-64"
          />
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                <th className="p-4 font-medium cursor-pointer hover:bg-gray-100" onClick={() => handleSort('name')}>Recipe Name</th>
                <th className="p-4 font-medium cursor-pointer hover:bg-gray-100" onClick={() => handleSort('createdAt')}>Date Created</th>
                <th className="p-4 font-medium cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('sellingPrice')}>Selling Price</th>
                <th className="p-4 font-medium cursor-pointer hover:bg-gray-100 text-right" onClick={() => handleSort('totalCost')}>Total Cost</th>
                <th className="p-4 font-medium cursor-pointer hover:bg-gray-100 text-center" onClick={() => handleSort('foodCostPercentage')}>Food Cost %</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : displayedRecipes.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No recipes found. Go build one!</td></tr>
              ) : (
                displayedRecipes.map(recipe => (
                  <tr key={recipe.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                          <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
                            <BookOpen className="w-4 h-4" />
                          </div>
                          {recipe.name}
                        </div>
                        {recipe.category && (
                          <span className="ml-11 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600 w-fit">
                            {recipe.category}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-gray-500">
                      {new Date(recipe.createdAt).toLocaleDateString('en-GB')}
                    </td>
                    <td className="p-4 text-right text-gray-900 font-medium">
                      {recipe.sellingPrice > 0 ? `฿${recipe.sellingPrice.toFixed(2)}` : '-'}
                    </td>
                    <td className="p-4 text-right text-gray-900 font-medium">
                      ฿{recipe.totalCost ? recipe.totalCost.toFixed(2) : '0.00'}
                    </td>
                    <td className="p-4 text-center">
                      {getMarginBadge(recipe.foodCostPercentage)}
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => setViewRecipe(recipe)} 
                          className="text-gray-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                          title="View"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => navigate(`/recipe-builder?id=${recipe.id}`)} 
                          className="text-gray-400 hover:text-orange-600 p-1.5 rounded-md hover:bg-orange-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <RequireRole allowed={['EXECUTIVE_CHEF', 'SOUS_CHEF']}>
                          <button 
                            onClick={() => handleDelete(recipe.id)} 
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-md hover:bg-red-50 transition-colors"
                            title="Delete"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </RequireRole>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {viewRecipe && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl shadow-xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-start mb-6">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-2xl font-bold text-gray-900">{viewRecipe.name}</h3>
                  {viewRecipe.category && (
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      {viewRecipe.category}
                    </span>
                  )}
                </div>
                {viewRecipe.description && <p className="text-gray-500 mt-1">{viewRecipe.description}</p>}
              </div>
              <button onClick={() => setViewRecipe(null)} className="text-gray-400 hover:text-gray-600 p-1">
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto mb-6">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                    <th className="p-3 font-medium">Ingredient</th>
                    <th className="p-3 font-medium text-right">Usage</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {viewRecipe.ingredients?.map((ing, i) => (
                    <tr key={i}>
                      <td className="p-3 font-medium text-gray-900">{ing.ingredient?.name || 'Unknown'}</td>
                      <td className="p-3 text-right text-gray-600">{ing.usageQuantity} {ing.usageUnit}</td>
                    </tr>
                  ))}
                  {!viewRecipe.ingredients?.length && (
                    <tr><td colSpan="2" className="p-4 text-center text-gray-500">No ingredients listed.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            
            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 grid grid-cols-3 gap-4">
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Total Cost</p>
                <p className="text-xl font-bold text-gray-900">฿{viewRecipe.totalCost ? viewRecipe.totalCost.toFixed(2) : '0.00'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Selling Price</p>
                <p className="text-xl font-bold text-gray-900">{viewRecipe.sellingPrice > 0 ? `฿${viewRecipe.sellingPrice.toFixed(2)}` : '-'}</p>
              </div>
              <div>
                <p className="text-xs font-medium text-gray-500 uppercase tracking-wider mb-1">Food Cost %</p>
                <p className="text-xl">{getMarginBadge(viewRecipe.foodCostPercentage)}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
