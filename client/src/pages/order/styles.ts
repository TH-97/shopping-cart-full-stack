import styled from '@emotion/styled';

export const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  min-height: 100vh;
`;

export const Header = styled.header`
  display: flex;
  align-items: center;
  height: 64px;
  padding: 0 24px;
  background-color: black;
`;

export const BackButton = styled.button`
  background: none;
  border: none;
  color: white;
  font-size: 22px;
  cursor: pointer;
`;

export const Content = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 24px;
  text-align: center;
`;

export const Title = styled.h1`
  margin: 0;
  font-size: 22px;
  font-weight: bold;
`;

export const Description = styled.p`
  margin: 0;
  font-size: 13px;
  color: #888;
  line-height: 1.6;
`;

export const TotalLabel = styled.p`
  margin: 16px 0 0;
  font-size: 14px;
`;

export const TotalAmount = styled.p`
  margin: 0;
  font-size: 24px;
  font-weight: bold;
`;

export const PayButton = styled.button`
  width: 100%;
  padding: 20px;
  background-color: #333;
  color: white;
  font-size: 16px;
  border: none;
  cursor: pointer;

  &:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }
`;

export const CouponButton = styled.button`
  width: 100%;
  padding: 14px;
  background-color: white;
  color: #333;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  cursor: pointer;
`;

export const EmptyNotice = styled.p`
  margin: 0;
  font-size: 14px;
  color: #888;
`;

export const ItemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
  width: 100%;
`;

export const Item = styled.li`
  display: flex;
  gap: 12px;
  align-items: center;
  text-align: left;
`;

export const ItemImage = styled.img`
  width: 64px;
  height: 64px;
  object-fit: cover;
  border-radius: 4px;
`;

export const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const ItemName = styled.span`
  font-size: 14px;
  font-weight: bold;
`;

export const ItemMeta = styled.span`
  font-size: 13px;
  color: #888;
`;

export const SummaryBox = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  width: 100%;
  padding: 16px 0;
  border-top: 1px solid #eee;
`;

export const SummaryRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
`;

export const SummaryValue = styled.span`
  font-weight: 500;
`;

export const SummaryTotalValue = styled.span`
  font-size: 16px;
  font-weight: bold;
`;

export const CouponNotice = styled.p`
  margin: 0 0 16px;
  font-size: 13px;
  color: #666;
  text-align: left;
`;

export const CouponList = styled.ul`
  list-style: none;
  margin: 0 0 16px;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 12px;
`;

export const CouponItemRow = styled.li<{ disabled: boolean }>`
  display: flex;
  gap: 12px;
  padding: 16px;
  border: 1px solid #eee;
  border-radius: 8px;
  text-align: left;
  color: ${({ disabled }) => (disabled ? '#bbb' : 'inherit')};
`;

export const CouponInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 4px;
`;

export const CouponName = styled.span`
  font-size: 15px;
  font-weight: bold;
`;

export const CouponMeta = styled.span`
  font-size: 12px;
  color: inherit;
  opacity: 0.8;
`;

export const CouponUseButton = styled.button`
  width: 100%;
  padding: 16px;
  background-color: #333;
  color: white;
  font-size: 15px;
  border: none;
  border-radius: 4px;
  cursor: pointer;

  &:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }
`;

export const RemoteAreaLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  font-size: 14px;
  cursor: pointer;
`;

export const RemoteAreaNotice = styled.p`
  margin: 4px 0 0;
  width: 100%;
  font-size: 12px;
  color: #888;
  text-align: left;
`;

export const PayError = styled.p`
  margin: 0;
  padding: 12px 24px;
  font-size: 13px;
  color: #d33;
  text-align: center;
`;

export const CompleteTotalLabel = styled.p`
  margin: 24px 0 0;
  font-size: 15px;
  font-weight: bold;
`;

export const CompleteTotalAmount = styled.p`
  margin: 0;
  font-size: 28px;
  font-weight: bold;
`;
