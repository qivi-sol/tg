import type { PropsWithChildren } from "react";
import { useI18n } from "../../hooks/useI18n";
import { PrimaryButton } from "./PrimaryButton";

interface ModalProps {
  title: string;
  description: string;
  open: boolean;
  onClose: () => void;
  actionLabel?: string;
}

export const Modal = ({
  actionLabel,
  children,
  description,
  onClose,
  open,
  title
}: PropsWithChildren<ModalProps>) => {
  const { copy } = useI18n();

  if (!open) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end bg-[#04070dcc] p-4 backdrop-blur-sm">
      <div className="glass-card animate-rise-in mx-auto w-full max-w-[460px] rounded-[28px] p-5">
        <div className="mb-2 text-lg font-semibold text-white">{title}</div>
        <p className="mb-4 whitespace-pre-line text-sm leading-6 text-soft">{description}</p>
        {children}
        <PrimaryButton className="mt-5" onClick={onClose}>
          {actionLabel ?? copy.common.close}
        </PrimaryButton>
      </div>
    </div>
  );
};
