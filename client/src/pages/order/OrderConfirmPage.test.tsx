import { render, screen, waitForElementToBeRemoved } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter } from 'react-router-dom';
import { server } from '../../mocks/server';
import { OrderConfirmPage } from './OrderConfirmPage';
import { API_BASE_URL as BASE_URL } from '../../api/config';

const renderPage = () =>
  render(
    <MemoryRouter>
      <OrderConfirmPage />
    </MemoryRouter>,
  );

test('선택한 상품 목록(상품명/수량)을 보여준다', async () => {
  renderPage();

  expect(await screen.findByText('상품이름A')).toBeInTheDocument();
  expect(screen.getByText('상품이름B')).toBeInTheDocument();
  expect(screen.getAllByText('2개').length).toBe(2);
});

test('금액을 서버 주문 요약 값으로 표시한다', async () => {
  renderPage();
  await screen.findByText('상품이름A');

  // 35,000x2 + 25,000x2 = 120,000 (>= 100,000 → 무료배송)
  // 주문 금액/총 결제 금액 둘 다 120,000원(toLocaleString 표기)
  expect((await screen.findAllByText('120,000원')).length).toBe(2);
  // 배송비 0원: 쿠폰 할인 0원과 함께 0원이 2개 표시된다
  expect(screen.getAllByText('0원').length).toBe(2);
});

test('도서산간 토글 시 요약이 재호출되어 배송비/총액이 바뀐다', async () => {
  // 상품A만 선택(70,000원, 10만원 미만)되도록 저장값을 둔다.
  localStorage.setItem('selectedIds', JSON.stringify(['1']));

  renderPage();
  await screen.findByText('상품이름A');

  // remote=false: 배송비 3,000 / 총액 73,000
  expect(await screen.findByText('3,000원')).toBeInTheDocument();
  expect(screen.getByText('73,000원')).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('checkbox', { name: '제주도 및 도서 산간 지역' }),
  );

  // remote=true: 배송비 6,000 / 총액 76,000
  expect(await screen.findByText('6,000원')).toBeInTheDocument();
  expect(screen.getByText('76,000원')).toBeInTheDocument();
});

test('요약 로딩 중 로딩 표시 후 사라진다', async () => {
  server.use(
    http.post(`${BASE_URL}/orders/summary`, async () => {
      await delay(50);
      return HttpResponse.json({
        orderAmount: 120000,
        couponDiscountAmount: 0,
        shippingFee: 0,
        totalPaymentAmount: 120000,
      });
    }),
  );

  renderPage();
  await screen.findByText('상품이름A');

  expect(screen.getByRole('status')).toBeInTheDocument();
  await waitForElementToBeRemoved(() => screen.queryByRole('status'));
});

test('요약 요청이 실패하면 에러 메시지를 보여준다', async () => {
  server.use(
    http.post(
      `${BASE_URL}/orders/summary`,
      () => new HttpResponse(null, { status: 500 }),
    ),
  );

  renderPage();
  await screen.findByText('상품이름A');

  expect(
    await screen.findByText('주문 정보를 불러오지 못했습니다.'),
  ).toBeInTheDocument();
});

test('선택된 상품이 없으면 안내를 보여주고 결제 버튼이 비활성화된다', async () => {
  localStorage.setItem('selectedIds', JSON.stringify([]));

  renderPage();

  expect(await screen.findByText('선택된 상품이 없습니다.')).toBeInTheDocument();
  expect(screen.getByRole('button', { name: '결제하기' })).toBeDisabled();
});

test('결제하기 버튼이 존재한다', async () => {
  renderPage();
  await screen.findByText('상품이름A');

  expect(
    await screen.findByRole('button', { name: '결제하기' }),
  ).toBeInTheDocument();
});
