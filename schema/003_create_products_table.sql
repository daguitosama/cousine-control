create table products (
	id uuid default gen_random_uuid () primary key,
	name text not null,
	price numeric not null,
	quantity int not null
)
