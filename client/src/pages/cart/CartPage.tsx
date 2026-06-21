import { useNavigate } from 'react-router-dom';
import { CartContent } from '../../components/CartContent';
import { CartLayout } from '../../components/CartLayout';
import { Empty } from '../../components/Empty';
import { ErrorView } from '../../components/ErrorView';
import { IsLoding } from '../../components/IsLoding';
import { isAllChecked } from '../../utils/cart.utils';
import { useCartQuery } from '../../hooks/useCartQuery';
import { useCartMutations } from '../../hooks/useCartMutations';
import { useSelectedIds } from '../../hooks/useSelectedIds';
import type { CartItemData } from '../../types/cart';

export function CartPage() {
  const state = useCartQuery();

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

  return <LoadedCart cartItems={state.data} />;
}

function LoadedCart({ cartItems }: { cartItems: CartItemData[] }) {
  const navigate = useNavigate();
  const { changeQuantity, deleteItem, error } = useCartMutations();
  const { selectedIds, toggleItem, toggleAll } = useSelectedIds(cartItems);

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
        error={error}
      />
    </CartLayout>
  );
}
