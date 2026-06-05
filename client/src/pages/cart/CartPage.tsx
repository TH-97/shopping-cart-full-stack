import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContent } from './CartContent';
import { CartLayout } from './CartLayout';
import { Empty } from './Empty';
import { ErrorView } from './ErrorView';
import { IsLoding } from './IsLoding';
import { isAllChecked } from './cart.utils';

const BASE_URL =
  'https://shopping-cart-full-stack-production-7ca8.up.railway.app';

interface CartItemData {
  cartItemId: string;
  productId: string;
  productName: string;
  productPrice: number;
  imageUrl: string;
  purchaseQuantity: number;
}

export function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const toggleItem = (cartItemId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cartItemId)) {
        next.delete(cartItemId);
      } else {
        next.add(cartItemId);
      }
      return next;
    });
  };

  const toggleAll = () => {
    if (isAllChecked(cartItems, selectedIds)) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(cartItems.map((item) => item.cartItemId)));
    }
  };

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/cart/items`);
        if (!response.ok) {
          throw new Error('장바구니를 불러오지 못했습니다.');
        }
        const data: CartItemData[] = await response.json();
        setCartItems(data);

        const saved = localStorage.getItem('selectedIds');
        setSelectedIds(
          saved
            ? new Set(JSON.parse(saved))
            : new Set(data.map((item) => item.cartItemId)),
        );
      } catch (err) {
        setError(err as Error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCartItems();
  }, []);

  useEffect(() => {
    if (cartItems.length === 0) return;
    localStorage.setItem('selectedIds', JSON.stringify([...selectedIds]));
  }, [selectedIds, cartItems]);

  const changeQuantity = async (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1 || newQuantity > 99) return;

    await fetch(`${BASE_URL}/cart/items/${cartItemId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ purchaseQuantity: newQuantity }),
    });

    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId
          ? { ...item, purchaseQuantity: newQuantity }
          : item,
      ),
    );
  };

  const deleteItem = async (cartItemId: string) => {
    await fetch(`${BASE_URL}/cart/items/${cartItemId}`, {
      method: 'DELETE',
    });

    setCartItems((prev) =>
      prev.filter((item) => item.cartItemId !== cartItemId),
    );

    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.delete(cartItemId);
      return next;
    });
  };

  if (isLoading)
    return (
      <CartLayout>
        <IsLoding />
      </CartLayout>
    );

  if (error)
    return (
      <CartLayout>
        <ErrorView message={error.message} />
      </CartLayout>
    );

  if (cartItems.length === 0)
    return (
      <CartLayout>
        <Empty />
      </CartLayout>
    );

  return (
    <CartLayout>
      <CartContent
        cartItems={cartItems}
        selectedIds={selectedIds}
        isAllChecked={isAllChecked(cartItems, selectedIds)}
        onToggleAll={toggleAll}
        onToggleItem={toggleItem}
        onChangeQuantity={changeQuantity}
        onDeleteItem={deleteItem}
        onOrder={() => navigate('/order')}
      />
    </CartLayout>
  );
}
