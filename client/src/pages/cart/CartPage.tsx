import { useNavigate } from 'react-router-dom';
import { CartContent } from '../../components/CartContent';
import { CartLayout } from '../../components/CartLayout';
import { Empty } from '../../components/Empty';
import { ErrorView } from '../../components/ErrorView';
import { IsLoding } from '../../components/IsLoding';
import { isAllChecked } from '../../utils/cart.utils';
import { useCart } from '../../hooks/useCart';
import { useSelectedIds } from '../../hooks/useSelectedIds';

export function CartPage() {
  const navigate = useNavigate();
  const { state, cartItems, changeQuantity, deleteItem } = useCart();
  const { selectedIds, toggleItem, toggleAll } = useSelectedIds(cartItems);

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
