import { cn } from "@/lib/utils";

const fieldBase =
  "w-full rounded-btn border border-line bg-bg px-3 py-2 text-[13px] text-fg placeholder:text-fg-muted focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent disabled:opacity-50";

type InputProps = {
  label?: string;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>;

export function Input({ label, error, className, id, ...rest }: InputProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[12px] font-medium text-fg">
          {label}
        </label>
      )}
      <input id={id} className={cn(fieldBase, error && "border-danger", className)} {...rest} />
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

type SelectProps = {
  label?: string;
  error?: string;
} & React.SelectHTMLAttributes<HTMLSelectElement>;

export function Select({ label, error, className, id, children, ...rest }: SelectProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[12px] font-medium text-fg">
          {label}
        </label>
      )}
      <select id={id} className={cn(fieldBase, error && "border-danger", className)} {...rest}>
        {children}
      </select>
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}

type TextareaProps = {
  label?: string;
  error?: string;
} & React.TextareaHTMLAttributes<HTMLTextAreaElement>;

export function Textarea({ label, error, className, id, ...rest }: TextareaProps) {
  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={id} className="block text-[12px] font-medium text-fg">
          {label}
        </label>
      )}
      <textarea
        id={id}
        className={cn(fieldBase, "min-h-24", error && "border-danger", className)}
        {...rest}
      />
      {error && <p className="text-[11px] text-danger">{error}</p>}
    </div>
  );
}
