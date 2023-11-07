import clsx from "clsx";
import { Order } from "./orders.server";
const format_amount = new Intl.NumberFormat("es-ES", { maximumSignificantDigits: 2 }).format;

export function OrdersTable({ orders }: { orders: Order[] }) {
    return (
        <div className='rounded-lg  border border-slate-200'>
            <div className='bg-[#F5F5F5] rounded-t-lg font-bold grid grid-cols-3 py-2 leading-none text-sm'>
                <div className='px-8'>Order </div>
                <div className='px-8'>Total</div>
            </div>
            {orders.map((o, idx) => {
                return (
                    <OrderRow
                        order={o}
                        key={o.id}
                        className={idx == orders.length - 1 ? "" : "border-b border-b-slate-200"}
                    />
                );
            })}
        </div>
    );
}

function OrderRow({ order, className }: { order: Order; className?: string }) {
    return (
        <div className={clsx("grid grid-cols-3", className)}>
            <div className='px-8 py-3'>{order.name}</div>
            <div className='px-8 py-3'>$ {order.total}</div>
            {/* <div className='px-8 py-3'>{order.name}</div> */}
        </div>
    );
}
