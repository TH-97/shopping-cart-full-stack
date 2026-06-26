import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { CouponModal } from './CouponModal';
import type { CouponListResponse, CouponData } from '../../../types/coupon';
import type { QueryState } from '../../../hooks/useQuery';

const applicable = (overrides: Partial<CouponData> = {}): CouponData => ({
  couponId: 'A',
  couponName: '5,000원 할인 쿠폰',
  discountType: 'FIXED',
  isApplicable: true,
  expiresAt: '2026-11-30T23:59:59',
  minOrderAmount: null,
  usableFrom: null,
  usableTo: null,
  ...overrides,
});

const ready = (coupons: CouponData[]): QueryState<CouponListResponse> => ({
  status: 'ready',
  data: { orderAmount: 100000, coupons, recommendedCouponIds: [] },
});

const renderModal = (
  props: Partial<Parameters<typeof CouponModal>[0]> = {},
) => {
  const onToggle = jest.fn();
  const onClose = jest.fn();
  render(
    <CouponModal
      couponsState={ready([applicable()])}
      selectedCouponIds={[]}
      onToggle={onToggle}
      couponDiscountAmount={0}
      onClose={onClose}
      {...props}
    />,
  );
  return { onToggle, onClose };
};

test('적용 불가 쿠폰은 체크박스가 비활성화된다', () => {
  renderModal({
    couponsState: ready([
      applicable({ couponId: 'X', couponName: '불가쿠폰', isApplicable: false }),
    ]),
  });

  expect(screen.getByRole('checkbox', { name: '불가쿠폰' })).toBeDisabled();
});

test('2개 선택되면 나머지 미선택 쿠폰은 비활성화된다', () => {
  renderModal({
    couponsState: ready([
      applicable({ couponId: 'A', couponName: '쿠폰A' }),
      applicable({ couponId: 'B', couponName: '쿠폰B' }),
      applicable({ couponId: 'C', couponName: '쿠폰C' }),
    ]),
    selectedCouponIds: ['A', 'B'],
  });

  expect(screen.getByRole('checkbox', { name: '쿠폰A' })).toBeEnabled();
  expect(screen.getByRole('checkbox', { name: '쿠폰B' })).toBeEnabled();
  expect(screen.getByRole('checkbox', { name: '쿠폰C' })).toBeDisabled();
});

test('체크박스를 누르면 onToggle이 해당 couponId로 호출된다', async () => {
  const { onToggle } = renderModal();

  await userEvent.click(screen.getByRole('checkbox', { name: '5,000원 할인 쿠폰' }));

  expect(onToggle).toHaveBeenCalledWith('A');
});

test('하단 버튼은 주어진 couponDiscountAmount를 그대로 표시한다', () => {
  renderModal({ couponDiscountAmount: 8000 });

  expect(
    screen.getByRole('button', { name: '총 8,000원 할인 쿠폰 사용하기' }),
  ).toBeInTheDocument();
});

test('하단 버튼/배경/ESC로 닫을 수 있다', async () => {
  const { onClose } = renderModal();

  await userEvent.click(
    screen.getByRole('button', { name: /할인 쿠폰 사용하기/ }),
  );
  expect(onClose).toHaveBeenCalledTimes(1);

  await userEvent.keyboard('{Escape}');
  expect(onClose).toHaveBeenCalledTimes(2);
});

test('닫기(X) 버튼으로도 닫힌다', async () => {
  const { onClose } = renderModal();

  await userEvent.click(screen.getByRole('button', { name: '닫기' }));

  expect(onClose).toHaveBeenCalled();
});
