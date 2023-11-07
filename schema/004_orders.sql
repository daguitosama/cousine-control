create table orders (
	id uuid default gen_random_uuid () primary key,
	name text not null, -- later renamed as order_name
	closed boolean
);


create table orders_products (
	order_id uuid references orders(id),
	product_id uuid references products(id),
	quantity int,
	primary key (order_id, product_id)
)


