import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Vendor chunks
          if (id.includes('node_modules')) {
            // React ecosystem
            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'react-vendor';
            }
            // Supabase
            if (id.includes('@supabase')) {
              return 'supabase';
            }
            // Editor (React Quill and Quill) - removido
            // Markdown Editor
            if (id.includes('@uiw/react-md-editor') || id.includes('@uiw/react-markdown')) {
              return 'md-editor';
            }
            // Image compression
            if (id.includes('browser-image-compression')) {
              return 'image-compression';
            }
            // Icons
            if (id.includes('lucide-react')) {
              return 'icons';
            }
            // Other large libraries
            return 'vendor';
          }
          // Application chunks
          if (id.includes('src/components/AdminPanel')) {
            return 'admin-panel';
          }
          if (id.includes('src/components/ArticleEditor')) {
            return 'article-editor';
          }
          if (id.includes('src/components/ImageGallery')) {
            return 'image-gallery';
          }
          if (id.includes('src/pages/ArticleEditPage')) {
            return 'article-edit-page';
          }
        },
      },
    },
    // Aumentar límite de advertencia a 1.5MB
    chunkSizeWarningLimit: 1500,
  },
});
