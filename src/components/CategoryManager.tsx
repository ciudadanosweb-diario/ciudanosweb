import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, X, Save } from 'lucide-react';
import { supabase, Category } from '../lib/supabase';

type CategoryManagerProps = {
  onClose: () => void;
  onUpdate: () => void;
};

export default function CategoryManager({ onClose, onUpdate }: CategoryManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<string | null>(null);
  const [newCategory, setNewCategory] = useState('');
  const [editName, setEditName] = useState('');

  useEffect(() => {
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('*')
        .order('name');

      if (error) throw error;
      setCategories(data || []);
    } catch (error: any) {
      console.error('Error al cargar categorías:', error);
      alert('Error al cargar categorías');
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!newCategory.trim()) {
      alert('Por favor ingresa un nombre para la categoría');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .insert([{ name: newCategory.trim() }]);

      if (error) throw error;

      setNewCategory('');
      await loadCategories();
      onUpdate();
      alert('Categoría creada exitosamente');
    } catch (error: any) {
      console.error('Error al crear categoría:', error);
      alert('Error al crear categoría: ' + error.message);
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editName.trim()) {
      alert('Por favor ingresa un nombre para la categoría');
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .update({ name: editName.trim() })
        .eq('id', id);

      if (error) throw error;

      setEditing(null);
      setEditName('');
      await loadCategories();
      onUpdate();
      alert('Categoría actualizada exitosamente');
    } catch (error: any) {
      console.error('Error al actualizar categoría:', error);
      alert('Error al actualizar categoría: ' + error.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`¿Estás seguro de que quieres eliminar la categoría "${name}"?`)) {
      return;
    }

    try {
      const { error } = await supabase
        .from('categories')
        .delete()
        .eq('id', id);

      if (error) throw error;

      await loadCategories();
      onUpdate();
      alert('Categoría eliminada exitosamente');
    } catch (error: any) {
      console.error('Error al eliminar categoría:', error);
      alert('Error al eliminar categoría: ' + error.message);
    }
  };

  const startEdit = (category: Category) => {
    setEditing(category.id);
    setEditName(category.name);
  };

  const cancelEdit = () => {
    setEditing(null);
    setEditName('');
  };

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg p-6">
          <p>Cargando categorías...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between p-6 border-b sticky top-0 bg-white">
          <h2 className="text-2xl font-bold">Gestión de Categorías</h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Crear nueva categoría */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <h3 className="font-semibold mb-3">Nueva Categoría</h3>
            <div className="flex gap-2">
              <input
                type="text"
                value={newCategory}
                onChange={(e) => setNewCategory(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="Nombre de la categoría"
                className="flex-1 px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <button
                onClick={handleCreate}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
              >
                <Plus className="w-5 h-5" />
                Crear
              </button>
            </div>
          </div>

          {/* Lista de categorías */}
          <div>
            <h3 className="font-semibold mb-3">
              Categorías existentes ({categories.length})
            </h3>
            {categories.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No hay categorías creadas</p>
                <p className="text-sm mt-2">Crea la primera categoría arriba</p>
              </div>
            ) : (
              <div className="space-y-2">
                {categories.map((category) => (
                  <div
                    key={category.id}
                    className="border rounded-lg p-3 hover:bg-gray-50"
                  >
                    {editing === category.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={editName}
                          onChange={(e) => setEditName(e.target.value)}
                          onKeyPress={(e) => e.key === 'Enter' && handleUpdate(category.id)}
                          className="flex-1 px-3 py-1 border rounded focus:ring-2 focus:ring-blue-500"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdate(category.id)}
                          className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 flex items-center gap-1"
                        >
                          <Save className="w-4 h-4" />
                          Guardar
                        </button>
                        <button
                          onClick={cancelEdit}
                          className="px-3 py-1 border rounded hover:bg-gray-100"
                        >
                          Cancelar
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <span className="font-medium">{category.name}</span>
                        <div className="flex gap-2">
                          <button
                            onClick={() => startEdit(category)}
                            className="px-3 py-1 border rounded hover:bg-gray-100 flex items-center gap-1"
                          >
                            <Edit className="w-4 h-4" />
                            Editar
                          </button>
                          <button
                            onClick={() => handleDelete(category.id, category.name)}
                            className="px-3 py-1 border border-red-200 text-red-600 rounded hover:bg-red-50 flex items-center gap-1"
                          >
                            <Trash2 className="w-4 h-4" />
                            Eliminar
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="p-6 border-t bg-gray-50">
          <button
            onClick={onClose}
            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}
