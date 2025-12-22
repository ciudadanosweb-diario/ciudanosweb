import React from 'react';
import { Share2, Facebook, Twitter, Linkedin, MessageCircle, Link as LinkIcon, X, Eye } from 'lucide-react';

type SocialShareProps = {
  url: string; // URL para compartir (sin hash, para bots)
  displayUrl?: string; // URL para mostrar/copiar (con hash, para humanos)
  title: string;
  description?: string;
  imageUrl?: string;
};

export default function SocialShare({ url, displayUrl, title, description, imageUrl }: SocialShareProps) {
  const [showMenu, setShowMenu] = React.useState(false);
  const [showPreview, setShowPreview] = React.useState(false);
  const [copied, setCopied] = React.useState(false);
  const [supportsNativeShare, setSupportsNativeShare] = React.useState(false);

  // Verificar soporte de Web Share API al montar
  React.useEffect(() => {
    setSupportsNativeShare(
      typeof navigator !== 'undefined' && 
      'share' in navigator &&
      typeof navigator.share === 'function'
    );
  }, []);

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const encodedDescription = encodeURIComponent(description || '');

  const shareLinks = {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    // Incluir texto (título + descripción) en Twitter y mensaje en WhatsApp
    twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}%20${encodedDescription}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
    whatsapp: `https://wa.me/?text=${encodedTitle}%20${encodedDescription}%20${encodedUrl}`,
  };

  const handleNativeShare = async () => {
    if (!navigator.share) {
      alert('Compartir nativo no disponible en este navegador');
      return;
    }

    try {
      // Compartir URL, título y descripción
      // Las apps de destino (WhatsApp, Facebook, etc.) obtendrán la imagen 
      // automáticamente de los meta tags Open Graph de la página
      const shareData: ShareData = {
        title,
        text: description || title,
        url,
      };

      await navigator.share(shareData);
      setShowMenu(false);
    } catch (err: any) {
      // No mostrar error si el usuario canceló
      if (err.name !== 'AbortError') {
        console.error('Error en compartir nativo:', err);
        alert('No se pudo compartir. Por favor, intenta con otra opción.');
      }
    }
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    const width = 600;
    const height = 400;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    window.open(
      shareLinks[platform],
      'share',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    setShowMenu(false);
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(displayUrl || url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error al copiar enlace:', error);
      alert('No se pudo copiar el enlace');
    }
  };

  return (
    <div className="relative flex items-center gap-2">
      {/* Share Button - Usa nativo directamente si está disponible */}
      {supportsNativeShare ? (
        <button
          onClick={handleNativeShare}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors shadow-sm hover:shadow-md"
          title="Compartir usando el navegador"
        >
          <Share2 size={20} />
          <span className="font-medium">Compartir</span>
        </button>
      ) : (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
        >
          <Share2 size={20} />
          <span className="font-medium">Compartir</span>
        </button>
      )}

      {/* Botón secundario de opciones (visible solo si hay share nativo) */}
      {supportsNativeShare && (
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="px-3 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors border border-gray-300"
          title="Más opciones de compartir"
        >
          <span className="font-medium text-sm">Más opciones</span>
        </button>
      )}

      {/* Share Menu */}
      {showMenu && (
        <>
          {/* Overlay */}
          <div
            className="fixed inset-0 z-40"
            onClick={() => setShowMenu(false)}
          />

          {/* Menu */}
          <div className="absolute right-0 mt-2 w-64 bg-white rounded-lg shadow-xl border border-gray-200 z-50 overflow-hidden">
            <div className="p-3 border-b bg-gray-50">
              <p className="font-semibold text-gray-800 text-sm">Compartir en redes sociales</p>
            </div>

            <div className="p-2 space-y-1">
              {/* Vista Previa */}
              <button
                onClick={() => {
                  setShowPreview(true);
                  setShowMenu(false);
                }}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-full group-hover:bg-gray-700 transition-colors">
                  <Eye size={18} className="text-white" />
                </div>
                <span className="text-gray-700 font-medium">Vista Previa</span>
              </button>

              {/* Compartir Nativo */}
              <button
                onClick={handleNativeShare}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-indigo-600 rounded-full group-hover:bg-indigo-700 transition-colors">
                  <Share2 size={18} className="text-white" />
                </div>
                <span className="text-gray-700 font-medium">Compartir...</span>
              </button>

              {/* Facebook */}
              <button
                onClick={() => handleShare('facebook')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-blue-600 rounded-full group-hover:bg-blue-700 transition-colors">
                  <Facebook size={18} className="text-white" />
                </div>
                <span className="text-gray-700 font-medium">Facebook</span>
              </button>

              {/* Twitter */}
              <button
                onClick={() => handleShare('twitter')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sky-50 transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-sky-500 rounded-full group-hover:bg-sky-600 transition-colors">
                  <Twitter size={18} className="text-white" />
                </div>
                <span className="text-gray-700 font-medium">Twitter</span>
              </button>

              {/* LinkedIn */}
              <button
                onClick={() => handleShare('linkedin')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-blue-50 transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-blue-700 rounded-full group-hover:bg-blue-800 transition-colors">
                  <Linkedin size={18} className="text-white" />
                </div>
                <span className="text-gray-700 font-medium">LinkedIn</span>
              </button>

              {/* WhatsApp */}
              <button
                onClick={() => handleShare('whatsapp')}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-green-50 transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-green-500 rounded-full group-hover:bg-green-600 transition-colors">
                  <MessageCircle size={18} className="text-white" />
                </div>
                <span className="text-gray-700 font-medium">WhatsApp</span>
              </button>

              {/* Copy Link */}
              <button
                onClick={copyLink}
                className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors group"
              >
                <div className="w-8 h-8 flex items-center justify-center bg-gray-600 rounded-full group-hover:bg-gray-700 transition-colors">
                  <LinkIcon size={18} className="text-white" />
                </div>
                <span className="text-gray-700 font-medium">
                  {copied ? '¡Copiado!' : 'Copiar enlace'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}

      {/* Preview Modal */}
      {showPreview && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-[100] p-4" style={{ zIndex: 9999 }}>
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl">
            {/* Header */}
            <div className="sticky top-0 flex items-center justify-between p-4 border-b bg-gray-50 z-10">
              <h3 className="font-bold text-lg text-gray-800">Vista Previa al Compartir</h3>
              <button
                onClick={() => setShowPreview(false)}
                className="text-gray-500 hover:text-gray-700 hover:bg-gray-200 p-2 rounded-full transition-colors"
                type="button"
              >
                <X size={24} />
              </button>
            </div>

            {/* Preview Content */}
            <div className="p-6 space-y-6">
              {/* Facebook/LinkedIn Style */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">Facebook / LinkedIn</p>
                <div className="border border-gray-300 rounded-lg overflow-hidden hover:bg-gray-50 transition-colors cursor-pointer">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-4">
                    <p className="text-xs text-gray-500 uppercase mb-1">
                      {new URL(displayUrl || url).hostname}
                    </p>
                    <h4 className="font-bold text-lg text-gray-900 mb-1 line-clamp-2">
                      {title}
                    </h4>
                    {description && (
                      <p className="text-sm text-gray-600 line-clamp-2">
                        {description}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Twitter Style */}
              <div>
                <p className="text-sm font-semibold text-gray-600 mb-3">Twitter / X</p>
                <div className="border border-gray-300 rounded-2xl overflow-hidden hover:bg-gray-50 transition-colors cursor-pointer">
                  {imageUrl && (
                    <img
                      src={imageUrl}
                      alt={title}
                      className="w-full h-64 object-cover"
                    />
                  )}
                  <div className="p-3 border-t border-gray-200">
                    <p className="text-xs text-gray-500 mb-1">
                      {new URL(url).hostname}
                    </p>
                    <h4 className="font-semibold text-sm text-gray-900 line-clamp-2">
                      {title}
                    </h4>
                  </div>
                </div>
              </div>

              {/* WhatsApp Note */}
              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <p className="text-sm text-green-800">
                  <strong>WhatsApp y otras apps:</strong> Al compartir el enlace, las aplicaciones obtendrán automáticamente la imagen y descripción del artículo.
                </p>
              </div>

              {/* Info */}
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-xs text-blue-800">
                  <strong>Nota:</strong> La vista previa se genera automáticamente al compartir el enlace. Algunas plataformas pueden tardar unos segundos en actualizar la información.
                </p>
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => setShowPreview(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
