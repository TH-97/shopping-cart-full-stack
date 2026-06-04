import { Route, Routes } from 'react-router-dom';
import './App.css';
import { CartPage } from './pages/cart/CartPage';
import { OrderConfirmPage } from './pages/order/OrderConfirmPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<CartPage />} />
      <Route path="/order" element={<OrderConfirmPage />} />
    </Routes>
  );
}

export default App;
