import type { MouseEvent, ReactNode } from "react";
import { navigateTo } from "../../lib/navigation";

interface PublicLinkProps {
  children: ReactNode;
  className?: string;
  href: string;
  onClick?: (event: MouseEvent<HTMLAnchorElement>) => void;
}

function PublicLink({ children, className, href, onClick }: PublicLinkProps) {
  const handleClick = (event: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(event);

    if (
      event.defaultPrevented ||
      event.button !== 0 ||
      event.metaKey ||
      event.altKey ||
      event.ctrlKey ||
      event.shiftKey
    ) {
      return;
    }

    const targetUrl = new URL(href, window.location.origin);

    if (targetUrl.origin !== window.location.origin) {
      return;
    }

    event.preventDefault();
    navigateTo(`${targetUrl.pathname}${targetUrl.search}${targetUrl.hash}`);
  };

  return (
    <a href={href} className={className} onClick={handleClick}>
      {children}
    </a>
  );
}

export default PublicLink;
