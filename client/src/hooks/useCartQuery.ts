import { useQuery } from './useQuery';
import { fetchCartItems } from '../api/cartApi';

// cart 서버상태의 도메인 앵커: "cart = fetchCartItems"를 한 곳에 묶는다.
// 범용 useQuery를 그대로 반환하므로 호출부는 state.data로 목록을 읽는다.
export const useCartQuery = () => useQuery(['cart'], fetchCartItems);
