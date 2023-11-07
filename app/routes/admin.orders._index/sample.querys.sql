-- get orders_with_products
SELECT O.ID AS ORDER_ID,
	O.ORDER_NAME,
	O.CLOSED AS ORDER_CLOSED,
	P.ID AS PRODUCT_ID,
	P.NAME AS PRODUCT_NAME,
	P.PRICE AS PRODUCT_PRICE,
	P.QUANTITY
FROM ORDERS O
JOIN ORDERS_PRODUCTS OP ON O.ID = OP.ORDER_ID
JOIN PRODUCTS P ON OP.PRODUCT_ID = P.ID


-- create order
insert into orders_products (
	order_id,
	product_id,
	quantity
) values (
	'bd12244a-2047-4fc5-98de-52b703765e45',
	'31aa6e53-9840-44ee-80f7-aa47cecf43ba',
	2
);