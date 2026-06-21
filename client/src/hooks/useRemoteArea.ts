import { useEffect, useState } from 'react';
import { loadRemoteArea, saveRemoteArea } from '../storage/remoteAreaStorage';

// 제주/도서산간 체크 상태(클라이언트 상태). mount 시 localStorage에서 복원하고
// 바뀔 때마다 저장한다. 주문 요약(useOrderSummary)의 isRemoteArea 입력으로 쓰인다.
export function useRemoteArea() {
  const [isRemoteArea, setIsRemoteArea] = useState(loadRemoteArea);

  useEffect(() => {
    saveRemoteArea(isRemoteArea);
  }, [isRemoteArea]);

  const toggle = () => setIsRemoteArea((prev) => !prev);

  return { isRemoteArea, toggle };
}
