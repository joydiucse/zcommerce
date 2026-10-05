import Link from "next/link";

/** Uses next/link for internal URLs and a plain anchor (new tab) for external ones. */
export function SmartLink({
  href,
  children,
  className,
  onClick,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
} & Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, "href">) {
  const url = href || "/";
  if (/^(https?:)?\/\//i.test(url) || url.startsWith("mailto:") || url.startsWith("tel:")) {
    const external = /^(https?:)?\/\//i.test(url);
    return (
      <a
        href={url}
        className={className}
        onClick={onClick}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        {...rest}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={url} className={className} onClick={onClick} {...rest}>
      {children}
    </Link>
  );
}
