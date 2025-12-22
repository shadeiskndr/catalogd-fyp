import type { ChangeEvent } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type LoginFieldProps = {
  id: string;
  name: string;
  label: string;
  type: string;
  placeholder: string;
  value: string;
  icon: React.ReactNode;
  disabled: boolean;
  onChange: (event: ChangeEvent<HTMLInputElement>) => void;
  trailing?: React.ReactNode;
};

export function LoginField({
  id,
  name,
  label,
  type,
  placeholder,
  value,
  icon,
  disabled,
  onChange,
  trailing,
}: LoginFieldProps) {
  return (
    <div>
      <Label htmlFor={id}>{label}</Label>
      <div className="relative mt-2.5">
        <Input
          id={id}
          name={name}
          className={trailing === undefined ? "peer ps-9" : "peer ps-9 pe-9"}
          placeholder={placeholder}
          type={type}
          value={value}
          onChange={onChange}
          disabled={disabled}
        />
        <div className="pointer-events-none absolute inset-y-0 start-0 flex items-center justify-center ps-3 text-muted-foreground/80 peer-disabled:opacity-50">
          {icon}
        </div>
        {trailing}
      </div>
    </div>
  );
}
