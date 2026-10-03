export const Textarea = ({
  value,
  onChange,
  onSubmit,
  placeholder = "Type your message...",
  disabled = false,
  stopPropagation = true,
}: {
  value: string;
  placeholder?: string;
  disabled?: boolean;
  stopPropagation?: boolean;
  onChange?: (value: string) => void;
  onSubmit?: (value: string) => void;
}) => {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (stopPropagation) {
      e.stopPropagation();
    }

    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSubmit?.(e.currentTarget.value);
    }
  };

  const handleOnChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const nextValue = e.target.value;
    onChange?.(nextValue);
  };

  return (
    <textarea
      className="w-full p-2 border rounded resize-none focus:outline-none focus:ring focus:border-blue-300"
      value={value}
      onChange={handleOnChange}
      onKeyDown={handleKeyDown}
      placeholder={placeholder}
      disabled={disabled}
    />
  );
};
