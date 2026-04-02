import { AnchorHTMLAttributes, ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';

interface SmartLinkProps extends Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href'> {
  href: string;
  children: ReactNode;
}

const isExternalHref = (href: string) =>
  /^(https?:|mailto:|tel:)/i.test(href);

const isHashHref = (href: string) => href.startsWith('#') || href.startsWith('/#');

const SmartLink = ({ href, children, ...props }: SmartLinkProps) => {
  const location = useLocation();

  if (!href) {
    return (
      <span {...props}>
        {children}
      </span>
    );
  }

  if (isExternalHref(href) || isHashHref(href)) {
    const normalizedHref =
      isHashHref(href) && location.pathname === '/' && href.startsWith('/#')
        ? href.slice(1)
        : href;

    return (
      <a href={normalizedHref} {...props}>
        {children}
      </a>
    );
  }

  return (
    <Link to={href} className={props.className}>
      {children}
    </Link>
  );
};

export default SmartLink;
