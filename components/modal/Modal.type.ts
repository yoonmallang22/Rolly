export type ModalContent =
  | TextModalContent
  | RadioInputModalContent
  | TextInputModalContent;

type TextModalContent = {
  title: string;
  body?: string;
  input?: never;
};

type RadioInputModalContent = {
  title: string;
  body?: string;
  input: "radio";
  radioOptions: string[];
};

type TextInputModalContent = {
  title: string;
  body?: string;
  input: "text";
  maxLength?: number;
};

export type ModalProps = {
  contents: ModalContent[];
  onConfirm: (inputFormData?: InputFormData) => void;
  onCancel: () => void;
  isOpen: boolean;
  confirmText?: string;
  cancelText?: string;
};

export type InputFormData = Record<string, undefined | string>;
