import { defineConfig } from 'vite';
import { resolve } from 'path';
import react from '@vitejs/plugin-react';
import dts from 'vite-plugin-dts';

export default defineConfig({
  plugins: [
    react(),
    dts({ 
      include: ['src/lib'],
      outDir: 'dist/lib'
    })
  ],
  build: {
    lib: {
      entry: resolve(__dirname, 'src/lib/index.ts'),
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format === 'es' ? 'js' : 'cjs'}`
    },
    outDir: 'dist/lib',
    emptyOutDir: true,
    rollupOptions: {
      external: ['react', 'react-dom', 'reactflow', 'phasmatic'],
      output: {
        globals: {
          react: 'React',
          'react-dom': 'ReactDOM',
          reactflow: 'ReactFlow',
          phasmatic: 'Phasmatic'
        }
      }
    }
  }
});