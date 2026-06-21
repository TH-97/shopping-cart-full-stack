import { RemoteAreaLabel, RemoteAreaNotice } from '../styles';

interface RemoteAreaCheckboxProps {
  checked: boolean;
  onChange: () => void;
}

// 제주/도서산간 여부 토글. 바뀌면 useOrderSummary 입력이 변해 요약이 재계산된다.
export function RemoteAreaCheckbox({
  checked,
  onChange,
}: RemoteAreaCheckboxProps) {
  return (
    <>
      <RemoteAreaLabel>
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          aria-label="제주도 및 도서 산간 지역"
        />
        제주도 및 도서 산간 지역
      </RemoteAreaLabel>
      <RemoteAreaNotice>
        ⓘ 총 주문 금액이 100,000원 이상일 경우 무료 배송됩니다.
      </RemoteAreaNotice>
    </>
  );
}
