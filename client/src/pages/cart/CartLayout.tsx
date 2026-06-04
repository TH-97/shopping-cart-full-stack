import type { ReactNode } from 'react';
import { Header, PageHeader, Title, Wrapper } from './styles';

interface CartLayoutProps {
  children: ReactNode;
}

export function CartLayout({ children }: CartLayoutProps) {
  return (
    <Wrapper>
      <Header>SHOP</Header>
      <PageHeader>
        <Title>장바구니</Title>
      </PageHeader>
      {children}
    </Wrapper>
  );
}
