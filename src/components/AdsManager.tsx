import { useState, useEffect } from 'react';
import { X, Plus, Edit, Trash2, Save, ArrowUp, ArrowDown, Eye, EyeOff } from 'lucide-react';
import { supabase, Ad } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

type AdForm = {
  title: string;
  description: string;
  image_url: string;
  link_url: string;
  is_active: boolean;
  start_date: string;
  end_date: string;
};

const getImageUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http')) {
    return url;
  }
  return url;
};

export default function AdsManager() {
  const { user } = useAuth();
  const [ads, setAds] = useState<Ad[]>([]);
  const [editingAd, setEditingAd] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState<AdForm>({
    title: '',
    description: '',
    image_url: '',
    link_url: '',
    is_active: true,
    start_date: '',
    end_date: '',
  });

  useEffect(() => {
    loadAds();
  }, []);

  const loadAds = async () => {
    try {
      const { data, error } = await supabase
        .from('ads')
        .select('*')
        .order('position', { ascending: true });
      
      if (error) {
        console.error('Error al cargar publicidades:', error);
        return;
      }
      
      if (data) setAds(data);
    } catch (error) {
      console.error('Error en loadAds:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.title.trim() || !formData.image_url) {
      alert('Por favor completa todos los campos requeridos');
      return;
    }

    if (!formData.image_url.startsWith('http')) {
      alert('Por favor introduce una URL válida de imagen (debe comenzar con http:// o https://)');
      return;
    }

    const nextPosition = editingAd ? ads.find(a => a.id === editingAd)?.position || 0 : Math.max(...ads.map(a => a.position), -1) + 1;

    const adData = {
      title: formData.title,
      description: formData.description || null,
      image_url: formData.image_url,
      link_url: formData.link_url || null,
      is_active: formData.is_active,
      start_date: formData.start_date || null,
      end_date: formData.end_date || null,
      position: nextPosition,
      created_by: user?.id,
    };

    try {
      if (editingAd) {
        const { error } = await supabase.from('ads').update(adData).eq('id', editingAd);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('ads').insert([adData]);
        if (error) throw error;
      }
      resetForm();
      loadAds();
    } catch (error) {
      console.error('Error al guardar publicidad:', error);
      alert('Error al guardar la publicidad');
    }
  };

  const handleEdit = (ad: Ad) => {
    setEditingAd(ad.id);
    setFormData({
      title: ad.title,
      description: ad.description || '',
      image_url: ad.image_url,
      link_url: ad.link_url || '',
      is_active: ad.is_active,
      start_date: ad.start_date ? ad.start_date.split('T')[0] : '',
      end_date: ad.end_date ? ad.end_date.split('T')[0] : '',
    });
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('¿Estás seguro de eliminar esta publicidad?')) {
      try {
        const { error } = await supabase.from('ads').delete().eq('id', id);
        if (error) throw error;
        loadAds();
      } catch (error) {
        console.error('Error al eliminar publicidad:', error);
        alert('Error al eliminar la publicidad');
      }
    }
  };

  const handleToggleActive = async (id: string, currentActive: boolean) => {
    try {
      const { error } = await supabase.from('ads').update({ is_active: !currentActive }).eq('id', id);
      if (error) throw error;
      loadAds();
    } catch (error) {
      console.error('Error al cambiar estado:', error);
      alert('Error al cambiar el estado de la publicidad');
    }
  };

  const moveAd = async (id: string, direction: 'up' | 'down') => {
    const currentAd = ads.find(a => a.id === id);
    if (!currentAd) return;

    const currentIndex = ads.findIndex(a => a.id === id);
    let swapIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;

    if (swapIndex < 0 || swapIndex >= ads.length) return;

    const adToSwap = ads[swapIndex];

    try {
      await Promise.all([
        supabase.from('ads').update({ position: adToSwap.position }).eq('id', currentAd.id),
        supabase.from('ads').update({ position: currentAd.position }).eq('id', adToSwap.id),
      ]);
      loadAds();
    } catch (error) {
      console.error('Error al mover publicidad:', error);
    }
  };

  const resetForm = () => {
    setEditingAd(null);
    setShowForm(false);
    setFormData({
      title: '',
      description: '',
      image_url: '',
      link_url: '',
      is_active: true,
      start_date: '',
      end_date: '',
    });
  };

  if (showForm) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-bold">
            {editingAd ? 'Editar Publicidad' : 'Nueva Publicidad'}
          </h3>
          <button
            onClick={resetForm}
            className="text-gray-600 hover:text-gray-900"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Título *</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">URL de Imagen *</label>
            <div className="bg-blue-50 p-3 rounded-lg mb-3 border border-blue-200">
              <p className="text-sm text-blue-900">
                <strong>💡 Nota:</strong> Usa URLs externas de servicios como:
              </p>
              <ul className="text-sm text-blue-900 list-disc list-inside mt-1">
                <li><a href="https://imgur.com" target="_blank" rel="noopener noreferrer" className="underline">Imgur.com</a></li>
                <li><a href="https://imgbb.com" target="_blank" rel="noopener noreferrer" className="underline">ImgBB.com</a></li>
                <li><a href="https://cloudinary.com" target="_blank" rel="noopener noreferrer" className="underline">Cloudinary.com</a></li>
              </ul>
            </div>
            <input
              type="url"
              value={formData.image_url}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="https://ejemplo.com/imagen.jpg"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">URL de Enlace</label>
            <input
              type="url"
              value={formData.link_url}
              onChange={(e) => setFormData({ ...formData, link_url: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              placeholder="https://ejemplo.com"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Inicio</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Fin</label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-teal-500"
              />
            </div>
          </div>

          <label className="flex items-center space-x-2">
            <input
              type="checkbox"
              checked={formData.is_active}
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="w-4 h-4 text-teal-600"
            />
            <span className="text-sm font-medium text-gray-700">Activar publicidad</span>
          </label>

          {formData.image_url && (
            <div className="mt-3">
              <p className="text-xs text-gray-600 mb-2">Vista previa:</p>
              <div className="w-full h-40 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden border-2 border-dashed border-gray-300">
                <img
                  src={getImageUrl(formData.image_url)}
                  alt="Preview"
                  className="w-full h-full object-cover rounded-lg"
                  onError={(e) => {
                    console.error('Error en vista previa:', formData.image_url);
                    e.currentTarget.style.display = 'none';
                    if (e.currentTarget.parentElement) {
                      e.currentTarget.parentElement.innerHTML = '<div class="text-center text-red-500 w-full"><p>Error al cargar imagen</p><p class="text-xs">' + formData.image_url.substring(0, 60) + '</p></div>';
                    }
                  }}
                  onLoad={() => {
                    console.log('Imagen cargada exitosamente:', formData.image_url);
                  }}
                />
              </div>
            </div>
          )}

          <div className="flex space-x-3 pt-4">
            <button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2"
            >
              <Save className="w-5 h-5" />
              <span>Guardar</span>
            </button>
            <button
              type="button"
              onClick={resetForm}
              className="bg-gray-500 hover:bg-gray-600 text-white px-6 py-3 rounded-lg font-semibold"
            >
              Cancelar
            </button>
          </div>
        </form>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold">Gestionar Publicidades</h3>
        <button
          onClick={() => setShowForm(true)}
          className="bg-green-500 hover:bg-green-600 text-white px-6 py-3 rounded-lg font-semibold flex items-center space-x-2"
        >
          <Plus className="w-5 h-5" />
          <span>Nueva Publicidad</span>
        </button>
      </div>

      {ads.length === 0 ? (
        <div className="text-center py-12 bg-gray-50 rounded-lg">
          <p className="text-gray-600">No hay publicidades. Crea una nueva.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {ads.map((ad, index) => (
            <div
              key={ad.id}
              className="bg-gray-50 p-4 rounded-lg flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-4 flex-1">
                {ad.image_url ? (
                  <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <img
                      src={getImageUrl(ad.image_url)}
                      alt={ad.title}
                      className="w-20 h-20 object-cover rounded"
                      onLoad={() => {
                        console.log('Imagen cargada exitosamente:', ad.image_url);
                      }}
                      onError={(e) => {
                        console.error('Error cargando imagen:', ad.image_url);
                        e.currentTarget.style.display = 'none';
                        if (e.currentTarget.parentElement) {
                          e.currentTarget.parentElement.innerHTML = '<div class="text-xs text-gray-500 text-center p-2">Error imagen</div>';
                        }
                      }}
                    />
                  </div>
                ) : (
                  <div className="w-20 h-20 bg-gray-200 rounded flex items-center justify-center flex-shrink-0">
                    <span className="text-xs text-gray-500">Sin imagen</span>
                  </div>
                )}
                <div className="flex-1">
                  <h4 className="font-semibold text-gray-900">{ad.title}</h4>
                  {ad.description && (
                    <p className="text-sm text-gray-600 line-clamp-1">{ad.description}</p>
                  )}
                  <div className="flex items-center space-x-3 mt-2 text-xs text-gray-500">
                    <span>Posición: {ad.position + 1}</span>
                    {ad.is_active ? (
                      <span className="text-green-600 font-semibold">Activa</span>
                    ) : (
                      <span className="text-red-600 font-semibold">Inactiva</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={() => moveAd(ad.id, 'up')}
                  disabled={index === 0}
                  className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 p-2 rounded transition-colors"
                  title="Mover arriba"
                >
                  <ArrowUp className="w-4 h-4" />
                </button>
                <button
                  onClick={() => moveAd(ad.id, 'down')}
                  disabled={index === ads.length - 1}
                  className="bg-gray-300 hover:bg-gray-400 disabled:bg-gray-200 text-gray-700 p-2 rounded transition-colors"
                  title="Mover abajo"
                >
                  <ArrowDown className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleToggleActive(ad.id, ad.is_active)}
                  className={`${
                    ad.is_active
                      ? 'bg-green-500 hover:bg-green-600'
                      : 'bg-gray-400 hover:bg-gray-500'
                  } text-white p-2 rounded transition-colors`}
                  title={ad.is_active ? 'Desactivar' : 'Activar'}
                >
                  {ad.is_active ? (
                    <Eye className="w-4 h-4" />
                  ) : (
                    <EyeOff className="w-4 h-4" />
                  )}
                </button>
                <button
                  onClick={() => handleEdit(ad)}
                  className="bg-blue-500 hover:bg-blue-600 text-white p-2 rounded transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(ad.id)}
                  className="bg-red-500 hover:bg-red-600 text-white p-2 rounded transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
