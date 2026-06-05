import { EmptyMessage, PrimaryButton } from './styles';

export function Empty() {
  return (
    <>
      <EmptyMessage>장바구니에 담은 상품이 없습니다.</EmptyMessage>
      <PrimaryButton disabled>주문 확인</PrimaryButton>
    </>
  );
}
