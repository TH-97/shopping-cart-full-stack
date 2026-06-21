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
  // best-combo로 적용가능 쿠폰 2개(5,000+3,000)가 자동 선택되어 쿠폰 할인 8,000원.
  // 주문 금액 120,000 / 쿠폰 할인 8,000 / 배송비 0 / 총액 112,000.
  expect(await screen.findByText('120,000원')).toBeInTheDocument();
  expect(screen.getByText('8,000원')).toBeInTheDocument();
  expect(screen.getByText('0원')).toBeInTheDocument();
  expect(screen.getByText('112,000원')).toBeInTheDocument();
});

test('도서산간 토글 시 요약이 재호출되어 배송비/총액이 바뀐다', async () => {
  // 상품A만 선택(70,000원, 10만원 미만)되도록 저장값을 둔다.
  localStorage.setItem('selectedIds', JSON.stringify(['1']));

  renderPage();
  await screen.findByText('상품이름A');

  // best-combo 쿠폰 할인 8,000원 자동 적용.
  // remote=false: 70,000 - 8,000 + 배송비 3,000 = 65,000
  expect(await screen.findByText('3,000원')).toBeInTheDocument();
  expect(screen.getByText('65,000원')).toBeInTheDocument();

  await userEvent.click(
    screen.getByRole('checkbox', { name: '제주도 및 도서 산간 지역' }),
  );

  // remote=true: 70,000 - 8,000 + 배송비 6,000 = 68,000
  expect(await screen.findByText('6,000원')).toBeInTheDocument();
  expect(screen.getByText('68,000원')).toBeInTheDocument();
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

test('쿠폰 적용 버튼을 누르면 쿠폰 선택 모달이 열린다', async () => {
  renderPage();
  await screen.findByText('상품이름A');

  await userEvent.click(screen.getByRole('button', { name: '쿠폰 적용' }));

  expect(
    await screen.findByRole('dialog', { name: '쿠폰을 선택해 주세요' }),
  ).toBeInTheDocument();
  // 적용 가능/불가 쿠폰이 모두 목록에 나온다.
  expect(screen.getByText('5,000원 할인 쿠폰')).toBeInTheDocument();
  expect(screen.getByText('미라클모닝 50% 쿠폰')).toBeInTheDocument();
});

test('쿠폰 선택을 해제하면 요약이 재호출되어 할인/총액이 바뀐다', async () => {
  // 상품A만 선택(70,000원). best-combo로 쿠폰 8,000원 자동 적용 → 총액 65,000.
  localStorage.setItem('selectedIds', JSON.stringify(['1']));

  renderPage();
  await screen.findByText('상품이름A');

  expect(await screen.findByText('8,000원')).toBeInTheDocument();
  expect(screen.getByText('65,000원')).toBeInTheDocument();

  // 모달에서 5,000원 쿠폰을 해제하면 할인 3,000원으로 줄고 총액이 오른다.
  await userEvent.click(screen.getByRole('button', { name: '쿠폰 적용' }));
  await screen.findByRole('dialog', { name: '쿠폰을 선택해 주세요' });
  await userEvent.click(
    screen.getByRole('checkbox', { name: '5,000원 할인 쿠폰' }),
  );

  // 70,000 - 3,000(쿠폰) + 3,000(배송) = 70,000. 주문 금액·총 결제 금액 모두 70,000원.
  expect((await screen.findAllByText('70,000원')).length).toBe(2);
  // 쿠폰 할인 3,000원과 배송비 3,000원이 모두 표시된다.
  expect(screen.getAllByText('3,000원').length).toBe(2);
});
