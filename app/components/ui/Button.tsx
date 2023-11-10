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
        primary: "bg-[#3E3E3E] hover:bg-[#252424] ring-[#252424]/10 text-white ",
        secondary: "bg-[#ebefef] hover:bg-[#d3d9d9] ring-[#black]/10 text-black",
    };
    const base_classes = "block leading-none text-sm p-2 rounded-lg";
    return (
        // @ts-ignore
        <button
            {...props}
            className={clsx(base_classes, variant_classes[variant])}
        >
            {children}
        </button>
    );
};
