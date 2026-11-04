import React from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import './styles.css';
import Menu from './pages/Menu.jsx';
import Pedidos from './pages/Pedidos.jsx';
import Cocina from './pages/Cocina.jsx';
import Pagos from './pages/Pagos.jsx';
import Carta from './pages/Carta.jsx';

createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    <Routes>
      {/* Público: el QR de cada mesa apunta a /?mesa=4 */}
      <Route path="/" element={<Menu />} />
      {/* Carta para imprimir (documento aparte del menú virtual) */}
      <Route path="/carta" element={<Carta />} />
      {/* POS interno */}
      <Route path="/pos" element={<Navigate to="/pos/pedidos" replace />} />
      <Route path="/pos/pedidos" element={<Pedidos />} />
      <Route path="/pos/cocina" element={<Cocina />} />
      <Route path="/pos/pagos" element={<Pagos />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
