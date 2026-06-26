import { useQuery } from './useQuery';
import { queryKey } from '../queries/queryKey';
import { fetchCoupons } from '../api/couponApi';

// 선택 항목이 바뀌면 키가 바뀌어 자동 재조회된다.
export const couponsQueryKey = (selectedCartItemIds: string[]) =>
  queryKey('coupons', selectedCartItemIds);

// 보유 쿠폰 목록(+적용여부/할인액) 도메인 앵커.
export const useCoupons = (selectedCartItemIds: string[]) =>
  useQuery(couponsQueryKey(selectedCartItemIds), () =>
    fetchCoupons(selectedCartItemIds),
  );
