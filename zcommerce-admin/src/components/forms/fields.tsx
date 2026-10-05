import type { ReactNode } from "react";
import type { Control, FieldPath, FieldValues } from "react-hook-form";
import { FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { MoneyInput } from "@/components/common/money-input";
import { RichTextEditor } from "@/components/common/rich-text-editor";
import { ImageUpload } from "@/components/common/image-upload";
import { CharCounter } from "@/components/common/seo-preview";
import { cn } from "@/lib/utils";

interface BaseProps<T extends FieldValues> {
  control: Control<T>;
  name: FieldPath<T>;
  label?: ReactNode;
  description?: ReactNode;
  className?: string;
}

export function TextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  placeholder,
  type = "text",
  maxLength,
  counter,
  disabled,
  autoComplete,
  onValueChange,
}: BaseProps<T> & {
  placeholder?: string;
  type?: string;
  maxLength?: number;
  counter?: number;
  disabled?: boolean;
  autoComplete?: string;
  onValueChange?: (v: string) => void;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {(label || counter) && (
            <div className="flex items-center justify-between">
              {label && <FormLabel>{label}</FormLabel>}
              {counter && <CharCounter value={String(field.value ?? "")} max={counter} />}
            </div>
          )}
          <FormControl>
            <Input
              type={type}
              placeholder={placeholder}
              maxLength={maxLength}
              disabled={disabled}
              autoComplete={autoComplete}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={(field.value as string | number | null | undefined) ?? ""}
              onChange={(e) => {
                field.onChange(e.target.value);
                onValueChange?.(e.target.value);
              }}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function TextareaField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  placeholder,
  rows = 3,
  counter,
}: BaseProps<T> & { placeholder?: string; rows?: number; counter?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {(label || counter) && (
            <div className="flex items-center justify-between">
              {label && <FormLabel>{label}</FormLabel>}
              {counter && <CharCounter value={String(field.value ?? "")} max={counter} />}
            </div>
          )}
          <FormControl>
            <Textarea
              rows={rows}
              placeholder={placeholder}
              name={field.name}
              ref={field.ref}
              onBlur={field.onBlur}
              value={(field.value as string | null | undefined) ?? ""}
              onChange={(e) => field.onChange(e.target.value)}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function NumberField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  placeholder,
  nullable = false,
  step = "1",
  min,
  max,
  suffix,
}: BaseProps<T> & {
  placeholder?: string;
  nullable?: boolean;
  step?: string;
  min?: number;
  max?: number;
  suffix?: string;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <div className="relative">
            <FormControl>
              <Input
                type="number"
                step={step}
                min={min}
                max={max}
                placeholder={placeholder}
                className={cn(suffix && "pr-10")}
                name={field.name}
                ref={field.ref}
                onBlur={field.onBlur}
                value={field.value === null || field.value === undefined ? "" : String(field.value)}
                onChange={(e) => {
                  const v = e.target.value;
                  field.onChange(v === "" ? (nullable ? null : 0) : Number(v));
                }}
              />
            </FormControl>
            {suffix && (
              <span className="text-muted-foreground pointer-events-none absolute inset-y-0 right-3 flex items-center text-sm">
                {suffix}
              </span>
            )}
          </div>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function MoneyField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  nullable = false,
  placeholder,
  symbol,
}: BaseProps<T> & { nullable?: boolean; placeholder?: string; symbol?: string }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <FormControl>
            <MoneyInput
              value={field.value as number | null}
              onChange={field.onChange}
              onBlur={field.onBlur}
              allowNull={nullable}
              placeholder={placeholder ?? "0.00"}
              symbol={symbol}
            />
          </FormControl>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function SwitchField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  bordered = true,
}: BaseProps<T> & { bordered?: boolean }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem
          className={cn(
            "flex flex-row items-center justify-between gap-4",
            bordered && "rounded-lg border p-3 shadow-xs",
            className,
          )}
        >
          <div className="space-y-1">
            {label && <FormLabel className="cursor-pointer">{label}</FormLabel>}
            {description && <FormDescription>{description}</FormDescription>}
          </div>
          <FormControl>
            <Switch checked={!!field.value} onCheckedChange={field.onChange} />
          </FormControl>
        </FormItem>
      )}
    />
  );
}

export interface SelectOption {
  value: string;
  label: string;
}

const NONE = "__none__";

export function SelectField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  options,
  placeholder = "Select…",
  noneLabel,
  disabled,
}: BaseProps<T> & {
  options: SelectOption[];
  placeholder?: string;
  /** If provided, adds an option that sets the value to null. */
  noneLabel?: string;
  disabled?: boolean;
}) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <Select
            disabled={disabled}
            value={field.value === null || field.value === undefined || field.value === "" ? (noneLabel ? NONE : "") : String(field.value)}
            onValueChange={(v) => field.onChange(v === NONE ? null : v)}
          >
            <FormControl>
              <SelectTrigger className="w-full">
                <SelectValue placeholder={placeholder} />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              {noneLabel && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
              {options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function RichTextField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  minHeight,
}: BaseProps<T> & { minHeight?: number }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <RichTextEditor value={field.value as string | null} onChange={field.onChange} minHeight={minHeight} />
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}

export function ImageField<T extends FieldValues>({
  control,
  name,
  label,
  description,
  className,
  aspect,
  contain,
}: BaseProps<T> & { aspect?: string; contain?: boolean }) {
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem className={className}>
          {label && <FormLabel>{label}</FormLabel>}
          <ImageUpload value={field.value as string | null} onChange={field.onChange} aspect={aspect} contain={contain} />
          {description && <FormDescription>{description}</FormDescription>}
          <FormMessage />
        </FormItem>
      )}
    />
  );
}
