import { TbPhone } from "react-icons/tb";
import type { Address } from "@/types";

export function AddressBlock({ address, empty = "No address" }: { address: Partial<Address> | null | undefined; empty?: string }) {
  if (!address || Object.values(address).every((v) => !v)) {
    return <p className="text-muted-foreground text-sm">{empty}</p>;
  }
  const cityLine = [address.city, address.state, address.postal_code].filter(Boolean).join(", ");
  return (
    <address className="space-y-0.5 text-sm not-italic">
      {address.name && <div className="font-medium">{address.name}</div>}
      {address.line1 && <div>{address.line1}</div>}
      {address.line2 && <div>{address.line2}</div>}
      {cityLine && <div>{cityLine}</div>}
      {address.country && <div>{address.country}</div>}
      {address.phone && (
        <div className="text-muted-foreground flex items-center gap-1.5 pt-1">
          <TbPhone className="size-3.5" /> {address.phone}
        </div>
      )}
    </address>
  );
}
