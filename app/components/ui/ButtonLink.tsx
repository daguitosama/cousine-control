import { NavLink } from "@remix-run/react";
import clsx from "clsx";

interface ButtonLinkProps {
    /**
     * Property description
     */
    to: string;
    variant?: "primary" | "secondary";
    children: React.ReactNode;
}

/**
 * Component
 */
export const ButtonLink = ({ to, variant = "primary", children, ...props }: ButtonLinkProps) => {
    const variant_classes = {
        primary: "bg-[#3E3E3E] hover:bg-[#252424] ring-[#252424]/10 text-white ",
        secondary: " hover:bg-slate-200  text-black  ",
    };
    const base_classes = "block leading-none text-sm p-2";
    return (
        <NavLink
            to={to}
            className={clsx(base_classes, variant_classes[variant], "rounded-lg")}
        >
            {children}
        </NavLink>
    );
};

export const ButtonLinkControl = ({
    to,
    variant = "primary",
    children,
    ...props
}: ButtonLinkProps) => {
    const variant_classes = {
        primary: "",
        secondary: "",
    };
    const base_classes = "block leading-none text-sm p-2";
    return (
        <NavLink
            to={to}
            className={clsx(
                base_classes,
                variant_classes[variant],
                "bg-slate-100 hover:bg-slate-200 focus:ring-black text-black rounded-lg"
            )}
            {...props}
        >
            {children}
        </NavLink>
    );
};
