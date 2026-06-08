import React, { useState, useEffect } from 'react';
import { Plus, X, Pencil, Trash2, Search } from 'lucide-react';
import api from '../utils/api';
import RequireRole from '../components/RequireRole';

export default function MasterList() {
  const [ingredients, setIngredients] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  
  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Fresh Produce',
    purchasePrice: '',
    purchaseUnit: 'kg',
    yieldPercentage: '100'
  });

  useEffect(() => {
    fetchIngredients();
  }, []);

  const fetchIngredients = async () => {
    try {
      const response = await api.get('/ingredients');
      setIngredients(response.data);
    } catch (error) {
      console.error("Error fetching ingredients:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenModal = (ingredient = null) => {
    if (ingredient) {
      setEditingId(ingredient.id);
      setFormData({
        name: ingredient.name,
        category: ingredient.category || 'Fresh Produce',
        purchasePrice: ingredient.purchasePrice,
        purchaseUnit: ingredient.purchaseUnit,
        yieldPercentage: ingredient.yieldPercentage
      });
    } else {
      setEditingId(null);
      setFormData({ name: '', category: 'Fresh Produce', purchasePrice: '', purchaseUnit: 'kg', yieldPercentage: '100' });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        category: formData.category,
        purchasePrice: parseFloat(formData.purchasePrice),
        purchaseUnit: formData.purchaseUnit,
        yieldPercentage: parseFloat(formData.yieldPercentage)
      };

      if (editingId) {
        await api.put(`/ingredients/${editingId}`, payload);
      } else {
        await api.post('/ingredients', payload);
      }
      
      setIsModalOpen(false);
      fetchIngredients(); // Refresh list
    } catch (error) {
      console.error("Error saving ingredient:", error);
      alert("Failed to save ingredient.");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this ingredient? It will also be removed from any recipes using it.")) {
      try {
        await api.delete(`/ingredients/${id}`);
        fetchIngredients();
      } catch (error) {
        if (error.response?.data?.error) {
          alert(error.response.data.error);
        } else {
          console.error("Error deleting ingredient:", error);
          alert("Failed to delete ingredient.");
        }
      }
    }
  };

  const filteredIngredients = ingredients.filter(ing => {
    const matchesSearch = ing.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || ing.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold text-gray-900">Master List</h2>
          <p className="text-gray-500">Manage your raw ingredients and yields.</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto">
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <Search className="h-5 w-5 text-gray-400" />
              </div>
              <input
                type="text"
                placeholder="Search ingredients..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all w-full"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-500 transition-all bg-white text-gray-700 w-full sm:w-auto min-w-[160px]"
            >
              <option value="All">All Categories</option>
              {['Fresh Produce', 'Proteins', 'Seafood', 'Dry Goods', 'Condiment', 'Dairy', 'Pastry', 'Beverages'].map(cat => (
                <option key={cat} value={cat}>{cat}</option>
              ))}
            </select>
          </div>
          <button 
            onClick={() => handleOpenModal()}
            className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center justify-center gap-2 font-medium transition-colors shadow-sm w-full sm:w-auto"
          >
            <Plus className="w-5 h-5" />
            Add Ingredient
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold">{editingId ? 'Edit Ingredient' : 'New Ingredient'}</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600">
                <X className="w-6 h-6" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="e.g. Salmon" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                  <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none">
                    <option value="Fresh Produce">Fresh Produce</option>
                    <option value="Proteins">Proteins</option>
                    <option value="Seafood">Seafood</option>
                    <option value="Dry Goods">Dry Goods</option>
                    <option value="Condiment">Condiment</option>
                    <option value="Dairy">Dairy</option>
                    <option value="Pastry">Pastry</option>
                    <option value="Beverages">Beverages</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Price (฿)</label>
                  <input required type="number" step="0.01" value={formData.purchasePrice} onChange={e => setFormData({...formData, purchasePrice: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" placeholder="0.00" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                  <select value={formData.purchaseUnit} onChange={e => setFormData({...formData, purchaseUnit: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none">
                    <option value="kg">kg</option>
                    <option value="g">g</option>
                    <option value="liter">liter</option>
                    <option value="ml">ml</option>
                    <option value="piece">piece</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Yield % (Usable amount)</label>
                <input required type="number" min="1" max="100" value={formData.yieldPercentage} onChange={e => setFormData({...formData, yieldPercentage: e.target.value})} className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <button type="submit" className="w-full bg-gray-900 text-white py-2 rounded-lg hover:bg-gray-800 font-medium transition-colors">
                {editingId ? 'Update Ingredient' : 'Save Ingredient'}
              </button>
            </form>
          </div>
        </div>
      )}

      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-50 text-gray-500 text-sm border-b border-gray-200">
                <th className="p-4 font-medium">Name</th>
                <th className="p-4 font-medium">Category</th>
                <th className="p-4 font-medium">Purchase Price</th>
                <th className="p-4 font-medium">Unit</th>
                <th className="p-4 font-medium">Yield %</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {isLoading ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">Loading...</td></tr>
              ) : ingredients.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No ingredients found. Add one to get started!</td></tr>
              ) : filteredIngredients.length === 0 ? (
                <tr><td colSpan="6" className="p-8 text-center text-gray-500">No ingredients match your filters.</td></tr>
              ) : (
                filteredIngredients.map(ing => (
                  <tr key={ing.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="p-4 font-medium text-gray-900">{ing.name}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        {ing.category || 'Other'}
                      </span>
                    </td>
                    <td className="p-4">฿{ing.purchasePrice.toFixed(2)}</td>
                    <td className="p-4 text-gray-500">{ing.purchaseUnit}</td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {ing.yieldPercentage}%
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex justify-end gap-2">
                        <button 
                          onClick={() => handleOpenModal(ing)} 
                          className="text-gray-400 hover:text-blue-600 p-1.5 rounded-md hover:bg-blue-50 transition-colors"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <RequireRole allowed={['EXECUTIVE_CHEF', 'SOUS_CHEF']}>
                          <button 
                            onClick={() => handleDelete(ing.id)} 
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
    </div>
  );
}
