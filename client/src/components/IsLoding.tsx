import { Spinner, SpinnerWrapper } from './styles';

export function IsLoding() {
  return (
    <SpinnerWrapper role="status" aria-label="불러오는 중">
      <Spinner />
    </SpinnerWrapper>
  );
}
