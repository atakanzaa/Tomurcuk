import Link from "next/link";
import type { AnchorHTMLAttributes, ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "@/lib/cx";
import styles from "./Button.module.css";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";
export type ButtonSize = "m" | "s";

interface ButtonOwnProps {
  variant?: ButtonVariant;
  /** "s" (36px) yalnızca masaüstü panel satırları ve altbilgi gibi ikincil yerlerde. */
  size?: ButtonSize;
  /** Mobil form sonunda tam genişlik. */
  block?: boolean;
  children: ReactNode;
}

type ButtonAsButton = ButtonOwnProps &
  Omit<ButtonHTMLAttributes<HTMLButtonElement>, keyof ButtonOwnProps> & { href?: undefined };

type ButtonAsLink = ButtonOwnProps &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, keyof ButtonOwnProps | "href"> & {
    href: string;
    /** Bağlantı için devre dışı hal; tıklanamaz ve odaklanmaz. */
    disabled?: boolean;
  };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

function buttonClasses({ variant = "primary", size = "m", block = false }: ButtonOwnProps, className?: string) {
  return cx(
    "tm-btn",
    `tm-btn--${variant}`,
    size === "s" && "tm-btn--s",
    block && "tm-btn--block",
    // 36px'lik görünüm korunur, dokunma alanı 44px'e tamamlanır.
    (size === "s" || variant === "quiet") && styles.hitArea,
    className,
  );
}

/**
 * Bir işi başlatan buton. `href` verilirse bağlantı olarak çizilir: uygulama içi
 * adresler next/link ile, tel:, https: gibi dış adresler düz <a> ile.
 */
export function Button(props: ButtonProps) {
  if (props.href !== undefined) return <ButtonLink {...props} />;
  const { variant, size, block, className, children, type = "button", ...rest } = props;
  return (
    <button {...rest} type={type} className={buttonClasses({ variant, size, block, children }, className)}>
      {children}
    </button>
  );
}

function ButtonLink({ variant, size, block, className, children, href, disabled, ...rest }: ButtonAsLink) {
  const classes = buttonClasses({ variant, size, block, children }, className);
  if (disabled) {
    return (
      <a {...rest} className={classes} role="link" aria-disabled="true">
        {children}
      </a>
    );
  }
  if (href.startsWith("/")) {
    return (
      <Link {...rest} href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <a {...rest} href={href} className={classes}>
      {children}
    </a>
  );
}
