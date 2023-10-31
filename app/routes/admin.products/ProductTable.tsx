import clsx from "clsx";
import { Product } from "~/types/product";

interface ProductTableProps {
    /**
     * Products
     */
    products: Product[];
}

/**
 * Component
 */
export const ProductTable = ({ products, ...props }: ProductTableProps) => {
    return (
        <div
            className='rounded-lg  border border-slate-200
        '
        >
            {/* table header */}
            <div className='bg-[#F5F5F5] rounded-t-lg font-bold grid grid-cols-3 py-2 leading-none text-sm'>
                <div className='px-8'>Product</div>
                <div className='px-8'>Price</div>
                <div className='px-8'>Quantity</div>
            </div>
            {/* table body */}
            {products.map((p, idx) => (
                <ProductListing
                    product={p}
                    key={p.id}
                    className={idx == products.length - 1 ? "" : "border-b border-b-slate-200"}
                />
            ))}
        </div>
    );
};

function ProductListing({
    product,
    className,
    ...props
}: {
    product: Product;
    className?: string;
}) {
    return (
        <div
            {...props}
            className={clsx("grid grid-cols-3", className)}
        >
            <div className='px-8 py-2'>{product.name}</div>
            <div className='px-8 py-2'>{product.price}</div>
            <div className='px-8 py-2'>{product.quantity}</div>
        </div>
    );
}
