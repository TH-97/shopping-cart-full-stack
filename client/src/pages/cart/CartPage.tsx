import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartContent } from './CartContent';
import { CartLayout } from './CartLayout';
import { Empty } from './Empty';
import { ErrorView } from './ErrorView';
import { IsLoding } from './IsLoding';
import { isAllChecked, isValidQuantity } from './cart.utils';
import { useSelectedIds } from './useSelectedIds';
import type { CartItemData } from '../../types/cart';

const BASE_URL =
  'https://shopping-cart-full-stack-production-7ca8.up.railway.app';

type State =
  | { status: 'loading' }
  | { status: 'error'; error: Error }
  | { status: 'ready' };

export function CartPage() {
  const navigate = useNavigate();
  const [state, setState] = useState<State>({ status: 'loading' });
  const [cartItems, setCartItems] = useState<CartItemData[]>([]);
  const { selectedIds, toggleItem, toggleAll } = useSelectedIds(cartItems);

  useEffect(() => {
    const fetchCartItems = async () => {
      try {
        const response = await fetch(`${BASE_URL}/cart/items`);
        if (!response.ok) {
          throw new Error('장바구니를 불러오지 못했습니다.');
        }
        const data: CartItemData[] = await response.json();
        setCartItems(data);
        setState({ status: 'ready' });
      } catch (err) {
        setState({ status: 'error', error: err as Error });
      }
    };
    fetchCartItems();
  }, []);

  const changeQuantity = async (cartItemId: string, newQuantity: number) => {
    if (!isValidQuantity(newQuantity)) return;

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
  };

  if (state.status === 'loading')
    return (
      <CartLayout>
        <IsLoding />
      </CartLayout>
    );

  if (state.status === 'error')
    return (
      <CartLayout>
        <ErrorView message={state.error.message} />
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
