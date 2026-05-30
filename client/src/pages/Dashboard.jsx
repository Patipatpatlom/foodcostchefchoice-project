import React, { useState, useEffect } from 'react';
import { Utensils, Beaker, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ ingredients: 0, recipes: 0 });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [ingredientsRes, recipesRes] = await Promise.all([
          api.get('/ingredients'),
          api.get('/recipes')
        ]);
        
        setStats({
          ingredients: ingredientsRes.data.length,
          recipes: recipesRes.data.length
        });
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
      <p className="text-gray-500">Welcome back to KitchenManager. Here is your overview.</p>
      
      {isLoading ? (
        <div className="text-gray-500">Loading your stats...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div 
            onClick={() => navigate('/recipes')} 
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-orange-50/30"
          >
            <div className="p-4 bg-orange-100 text-orange-600 rounded-lg">
              <Utensils className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Active Recipes</p>
              <p className="text-3xl font-bold text-gray-900">{stats.recipes}</p>
            </div>
          </div>
          
          <div 
            onClick={() => navigate('/master-list')}
            className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-blue-50/30"
          >
            <div className="p-4 bg-blue-100 text-blue-600 rounded-lg">
              <Beaker className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">Total Ingredients</p>
              <p className="text-3xl font-bold text-gray-900">{stats.ingredients}</p>
            </div>
          </div>

          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center gap-4 cursor-default">
            <div className="p-4 bg-green-100 text-green-600 rounded-lg">
              <TrendingUp className="w-8 h-8" />
            </div>
            <div>
              <p className="text-sm font-medium text-gray-500">System Status</p>
              <p className="text-lg font-bold text-green-600 mt-1">Online & Synced</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
