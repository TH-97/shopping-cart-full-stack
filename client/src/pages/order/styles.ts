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
  background-color: #aaa;
  color: white;
  font-size: 16px;
  border: none;
  cursor: pointer;
`;
