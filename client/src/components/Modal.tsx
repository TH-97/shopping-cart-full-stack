import { useEffect, useRef, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import {
  ModalCloseButton,
  ModalContainer,
  ModalHeader,
  ModalOverlay,
  ModalTitle,
} from './styles';

interface ModalProps {
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
}

// 범용 모달. open/close 마운트 제어는 호출부가 소유한다({isOpen && <Modal/>}).
// 포털로 body에 렌더하고, ESC/배경 클릭으로 닫으며 포커스를 관리한다.
export function Modal({ title, titleId, onClose, children }: ModalProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 모달이 닫힐 때 복원할 직전 포커스를 저장한다.
    const previouslyFocused = document.activeElement as HTMLElement | null;
    containerRef.current?.focus();

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return createPortal(
    <ModalOverlay onClick={onClose}>
      <ModalContainer
        ref={containerRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        onClick={(event) => event.stopPropagation()}
      >
        <ModalHeader>
          <ModalTitle id={titleId}>{title}</ModalTitle>
          <ModalCloseButton type="button" aria-label="닫기" onClick={onClose}>
            ✕
          </ModalCloseButton>
        </ModalHeader>
        {children}
      </ModalContainer>
    </ModalOverlay>,
    document.body,
  );
}
