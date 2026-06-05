import { EmptyMessage } from './styles';

interface ErrorViewProps {
  message: string;
}

export function ErrorView({ message }: ErrorViewProps) {
  return <EmptyMessage>{message}</EmptyMessage>;
}
