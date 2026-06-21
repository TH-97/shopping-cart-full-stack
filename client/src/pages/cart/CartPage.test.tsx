import {
  render,
  screen,
  within,
  waitForElementToBeRemoved,
} from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { delay, http, HttpResponse } from 'msw';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { server } from '../../mocks/server';
import { OrderConfirmPage } from '../order/OrderConfirmPage';
import { CartPage } from './CartPage';

import { API_BASE_URL as BASE_URL } from '../../api/config';

const renderCartPage = () =>
  render(
    <MemoryRouter>
      <CartPage />
    </MemoryRouter>,
  );

// 상품 1개만 내려주는 핸들러로 덮어쓰는 헬퍼 (수량 가드 테스트용)
const mockSingleItem = (purchaseQuantity: number) => {
  server.use(
    http.get(`${BASE_URL}/cart/items`, () =>
      HttpResponse.json([
        {
          cartItemId: '1',
          productId: '1',
          productName: '상품이름A',
          productPrice: 35000,
          imageUrl: 'https://placehold.co/80x80',
          purchaseQuantity,
        },
      ]),
    ),
  );
};

test('장바구니 상품을 불러와 목록에 보여준다', async () => {
  renderCartPage();

  expect(await screen.findByText('상품이름A')).toBeInTheDocument();
  expect(screen.getByText('상품이름B')).toBeInTheDocument();
});

test('진입 시 모든 상품이 선택되어 있다', async () => {
  renderCartPage();
  await screen.findByText('상품이름A');

  const checkboxes = screen.getAllByRole('checkbox');
  checkboxes.forEach((checkbox) => expect(checkbox).toBeChecked());
});

test('진입 시 선택된 상품 기준 주문 금액을 표시한다', async () => {
  renderCartPage();
  await screen.findByText('상품이름A');

  // 35,000 x 2 + 25,000 x 2 = 120,000
  expect(screen.getAllByText('120000원').length).toBeGreaterThan(0);
});

test('전체 선택을 해제하면 주문 금액이 0원이 된다', async () => {
  renderCartPage();
  await screen.findByText('상품이름A');

  await userEvent.click(screen.getByRole('checkbox', { name: '전체 선택' }));

  expect(screen.getAllByText('0원').length).toBeGreaterThan(0);
});

test('상품이 없으면 빈 장바구니 화면을 보여준다', async () => {
  server.use(http.get(`${BASE_URL}/cart/items`, () => HttpResponse.json([])));

  renderCartPage();

  expect(
    await screen.findByText('장바구니에 담은 상품이 없습니다.'),
  ).toBeInTheDocument();
});

test('선택 금액이 10만원 미만이면 배송비 3,000원이 부과된다', async () => {
  renderCartPage();
  await screen.findByText('상품이름A');

  // 상품B 선택 해제 → 상품A만(70,000원) → 10만원 미만
  const items = screen.getAllByRole('listitem');
  await userEvent.click(within(items[1]).getByRole('checkbox'));

  expect(await screen.findByText('70000원')).toBeInTheDocument(); // 주문 금액
  expect(screen.getByText('3000원')).toBeInTheDocument(); // 배송비
  expect(screen.getByText('73000원')).toBeInTheDocument(); // 총 결제 금액
});

test('상품을 하나라도 선택 해제하면 전체 선택도 해제된다', async () => {
  renderCartPage();
  await screen.findByText('상품이름A');

  const items = screen.getAllByRole('listitem');
  await userEvent.click(within(items[0]).getByRole('checkbox'));

  expect(screen.getByRole('checkbox', { name: '전체 선택' })).not.toBeChecked();
});

test('상품을 삭제하면 목록에서 사라지고 종류 개수가 줄어든다', async () => {
  renderCartPage();
  await screen.findByText('상품이름A');

  const items = screen.getAllByRole('listitem');
  await userEvent.click(within(items[0]).getByRole('button', { name: '삭제' }));

  expect(
    await screen.findByText('현재 1종류의 상품이 담겨있습니다.'),
  ).toBeInTheDocument();
  expect(screen.queryByText('상품이름A')).not.toBeInTheDocument();
  expect(screen.getByText('상품이름B')).toBeInTheDocument();
});

test('마지막 상품까지 삭제하면 빈 장바구니 화면이 된다', async () => {
  renderCartPage();
  await screen.findByText('상품이름A');

  let items = screen.getAllByRole('listitem');
  await userEvent.click(within(items[0]).getByRole('button', { name: '삭제' }));
  await screen.findByText('현재 1종류의 상품이 담겨있습니다.');

  items = screen.getAllByRole('listitem');
  await userEvent.click(within(items[0]).getByRole('button', { name: '삭제' }));

  expect(
    await screen.findByText('장바구니에 담은 상품이 없습니다.'),
  ).toBeInTheDocument();
});

test('수량을 증가시키면 수량과 주문 금액이 함께 늘어난다', async () => {
  renderCartPage();
  await screen.findByText('상품이름A');

  const items = screen.getAllByRole('listitem');
  await userEvent.click(within(items[0]).getByRole('button', { name: '수량 증가' }));

  // 상품A 3개 + 상품B 2개 = 35,000 x 3 + 25,000 x 2 = 155,000 (주문금액·총액)
  expect((await screen.findAllByText('155000원')).length).toBeGreaterThan(0);
});

test('불러오기에 실패하면 에러 메시지를 보여준다', async () => {
  server.use(
    http.get(
      `${BASE_URL}/cart/items`,
      () => new HttpResponse(null, { status: 500 }),
    ),
  );

  renderCartPage();

  expect(
    await screen.findByText('장바구니를 불러오지 못했습니다.'),
  ).toBeInTheDocument();
});

test('선택 상태가 재마운트(새로고침) 후에도 유지된다', async () => {
  const { unmount } = renderCartPage();
  await screen.findByText('상품이름A');

  // 상품B 선택 해제
  const items = screen.getAllByRole('listitem');
  await userEvent.click(within(items[1]).getByRole('checkbox'));

  unmount();

  renderCartPage();
  await screen.findByText('상품이름A');

  const reloadedItems = screen.getAllByRole('listitem');
  expect(within(reloadedItems[0]).getByRole('checkbox')).toBeChecked();
  expect(within(reloadedItems[1]).getByRole('checkbox')).not.toBeChecked();
});

test('주문 확인 버튼을 누르면 주문 확인 페이지로 이동한다', async () => {
  render(
    <MemoryRouter initialEntries={['/']}>
      <Routes>
        <Route path="/" element={<CartPage />} />
        <Route path="/order" element={<OrderConfirmPage />} />
      </Routes>
    </MemoryRouter>,
  );
  await screen.findByText('상품이름A');

  await userEvent.click(screen.getByRole('button', { name: '주문 확인' }));

  expect(
    await screen.findByRole('button', { name: '결제하기' }),
  ).toBeInTheDocument();
});

test('데이터를 불러오는 동안 로딩 스피너를 보여준다', async () => {
  server.use(
    http.get(`${BASE_URL}/cart/items`, async () => {
      await delay(50);
      return HttpResponse.json([]);
    }),
  );

  renderCartPage();

  // 응답 전: 로딩 표시
  expect(screen.getByRole('status')).toBeInTheDocument();
  // 응답 후: 로딩 사라짐
  await waitForElementToBeRemoved(() => screen.queryByRole('status'));
});

test('수량은 99를 초과해서 증가하지 않는다', async () => {
  mockSingleItem(99);
  renderCartPage();
  await screen.findByText('상품이름A');

  const item = screen.getByRole('listitem');
  await userEvent.click(within(item).getByRole('button', { name: '수량 증가' }));

  expect(within(item).getByText('99')).toBeInTheDocument();
  expect(within(item).queryByText('100')).not.toBeInTheDocument();
});

test('수량은 1 미만으로 감소하지 않는다', async () => {
  mockSingleItem(1);
  renderCartPage();
  await screen.findByText('상품이름A');

  const item = screen.getByRole('listitem');
  await userEvent.click(within(item).getByRole('button', { name: '수량 감소' }));

  expect(within(item).getByText('1')).toBeInTheDocument();
  expect(within(item).queryByText('0')).not.toBeInTheDocument();
});
