import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { OrderCompletePage } from './OrderCompletePage';
import type { OrderCompleteState } from '../../types/order';

const completeState: OrderCompleteState = {
  typesCount: 2,
  totalCount: 4,
  totalPaymentAmount: 112000,
};

const renderWithState = (state: OrderCompleteState | null) =>
  render(
    <MemoryRouter
      initialEntries={[{ pathname: '/order/complete', state: state ?? undefined }]}
    >
      <Routes>
        <Route path="/order/complete" element={<OrderCompletePage />} />
        <Route path="/cart" element={<div>장바구니 화면</div>} />
      </Routes>
    </MemoryRouter>,
  );

test('state가 있으면 종류/개수/총 결제 금액을 표시한다', () => {
  renderWithState(completeState);

  expect(screen.getByText('결제 확인')).toBeInTheDocument();
  expect(
    screen.getByText(/총 2종류의 상품 4개를 주문했습니다/),
  ).toBeInTheDocument();
  expect(screen.getByText('총 결제 금액')).toBeInTheDocument();
  expect(screen.getByText('112,000원')).toBeInTheDocument();
});

test('"장바구니로 돌아가기"를 누르면 /cart로 이동한다', async () => {
  renderWithState(completeState);

  await userEvent.click(
    screen.getByRole('button', { name: '장바구니로 돌아가기' }),
  );

  expect(screen.getByText('장바구니 화면')).toBeInTheDocument();
});

test('state 없이 진입하면 /cart로 리다이렉트한다', () => {
  renderWithState(null);

  expect(screen.getByText('장바구니 화면')).toBeInTheDocument();
  expect(screen.queryByText('결제 확인')).not.toBeInTheDocument();
});
