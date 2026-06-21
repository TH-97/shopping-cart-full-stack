import { keyframes } from '@emotion/react';
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
  color: white;
  font-weight: bold;
`;

export const PageHeader = styled.header`
  padding: 24px;
`;

export const Title = styled.h1`
  margin: 0 0 8px;
  font-size: 26px;
  font-weight: bold;
`;

export const Description = styled.p`
  margin: 0;
  padding: 0 24px;
  font-size: 12px;
  color: #888;
`;

export const SelectAllLabel = styled.label`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 24px 16px;
  cursor: pointer;
`;

export const SelectAllText = styled.span`
  font-size: 14px;
`;

export const CartItemList = styled.ul`
  list-style: none;
  margin: 0;
  padding: 0;
`;

export const CartItem = styled.li`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid #e5e5e5;
`;

export const ItemTopRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

export const DeleteButton = styled.button`
  padding: 4px 12px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 12px;
  cursor: pointer;
`;

export const ItemBody = styled.div`
  display: flex;
  gap: 16px;
`;

export const ItemImage = styled.img`
  width: 80px;
  height: 80px;
  border-radius: 8px;
  object-fit: cover;
  background-color: #f4f4f4;
`;

export const ItemInfo = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

export const ItemName = styled.span`
  font-size: 14px;
  color: #888;
`;

export const ItemPrice = styled.span`
  font-size: 20px;
  font-weight: bold;
`;

export const QuantityControl = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: auto;
`;

export const QuantityButton = styled.button`
  width: 28px;
  height: 28px;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  font-size: 16px;
  cursor: pointer;
`;

export const Quantity = styled.span`
  min-width: 20px;
  text-align: center;
  font-size: 14px;
`;

export const Notice = styled.p`
  margin: 0;
  padding: 16px 24px;
  font-size: 12px;
  color: #888;
`;

export const PriceSummary = styled.div`
  display: flex;
  flex-direction: column;
  gap: 12px;
  padding: 0 24px 24px;
`;

export const PriceRow = styled.div`
  display: flex;
  justify-content: space-between;
  font-size: 14px;
`;

export const PriceValue = styled.span`
  font-weight: bold;
`;

export const TotalValue = styled.span`
  font-size: 18px;
  font-weight: bold;
`;

export const CheckBox = styled.input`
  appearance: none;
  -webkit-appearance: none;
  width: 24px;
  height: 24px;
  border-radius: 6px;
  background-color: #ededed;
  cursor: pointer;
  position: relative;

  /* 가운데 체크(V) 모양 — 회전된 border로 그림 */
  &::after {
    content: '';
    position: absolute;
    top: 45%;
    left: 50%;
    width: 6px;
    height: 11px;
    border: solid #c4c4c4;
    border-width: 0 2px 2px 0;
    transform: translate(-50%, -50%) rotate(45deg);
  }

  /* 선택됐을 때 */
  &:checked {
    background-color: #000;
  }
  &:checked::after {
    border-color: #fff;
  }
`;

export const PrimaryButton = styled.button`
  width: 100%;
  margin-top: auto;
  padding: 20px;
  background-color: black;
  color: white;
  font-size: 16px;
  border: none;
  cursor: pointer;

  &:disabled {
    background-color: #aaa;
    cursor: not-allowed;
  }
`;

export const ErrorNotice = styled.p`
  margin: 0;
  padding: 0 24px 16px;
  font-size: 13px;
  color: #e02020;
`;

export const EmptyMessage = styled.p`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #888;
`;

export const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 1000;
`;

export const ModalContainer = styled.div`
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow-y: auto;
  padding: 24px;
  background-color: white;
  border-radius: 8px 8px 0 0;
  outline: none;
`;

export const ModalHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
`;

export const ModalTitle = styled.h2`
  margin: 0;
  font-size: 18px;
  font-weight: bold;
`;

export const ModalCloseButton = styled.button`
  background: none;
  border: none;
  font-size: 20px;
  line-height: 1;
  cursor: pointer;
`;

const spin = keyframes`
  to {
    transform: rotate(360deg);
  }
`;

export const SpinnerWrapper = styled.div`
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
`;

export const Spinner = styled.div`
  width: 40px;
  height: 40px;
  border: 4px solid #eee;
  border-top-color: #000;
  border-radius: 50%;
  animation: ${spin} 0.8s linear infinite;
`;
