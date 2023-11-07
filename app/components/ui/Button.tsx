import clsx from "clsx";
import { HTMLProps } from "react";

interface ButtonProps extends HTMLProps<HTMLButtonElement> {
    variant?: "primary" | "secondary";
}

/**
 * Component
 */
export const Button = ({ variant = "primary", children, ...props }: ButtonProps) => {
    const variant_classes = {
        primary: "",
        secondary: "",
    };
    const base_classes = "block leading-none text-sm p-2";
    return (
        <button
            {...props}
            className={clsx(
                base_classes,
                variant_classes[variant],
                "bg-[#3E3E3E] hover:bg-[#252424] ring-[#252424]/10 text-white rounded-lg"
            )}
        >
            {children}
        </button>
    );
};
