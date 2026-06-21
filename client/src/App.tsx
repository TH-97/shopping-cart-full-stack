import { Navigate, Route, Routes } from 'react-router-dom';
import './App.css';
import { CartPage } from './pages/cart/CartPage';
import { OrderConfirmPage } from './pages/order/OrderConfirmPage';
import { OrderCompletePage } from './pages/order/OrderCompletePage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/cart" replace />} />
      <Route path="/cart" element={<CartPage />} />
      <Route path="/order" element={<OrderConfirmPage />} />
      <Route path="/order/complete" element={<OrderCompletePage />} />
    </Routes>
  );
}

export default App;
