/**
 * @file src/main.tsx
 * @description Ponto de entrada principal da aplicação React BrickJobs, responsável por montar o componente raiz e importar os estilos globais Tailwind.
 */

import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';

createRoot(document.getElementById('root')!).render(<App />);
