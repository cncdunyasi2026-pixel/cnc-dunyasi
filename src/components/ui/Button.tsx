import type { ButtonHTMLAttributes } from "react";

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement>;

export default function Button({ className = "", ...props }: ButtonProps) {
  return (
    <button
      className={`rounded bg-black px-3 py-2 text-sm font-medium text-white ${className}`.trim()}
      {...props}
    />
  );
}
