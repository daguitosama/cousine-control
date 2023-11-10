# Cousine Control

A little `• restaurant` `• bar` `• cafeterias` orders management app.

## Stack
- PostgreSQL
- Remix


## Installation
- clone
- install deps ```bash pnpm install```
- start a PostgreSQL DB, version 15 or newer
- apply the migrations on the `/schema` directory, on the order they appear enumerated
- start the app ```bash pnpm d```

## Seed 
Create an admin user
Generate an app like password hash:

```bash
pnpm hash your-password

# you get something like
-> hash of your-password:
$2a$10$dNd/BjjMtgMUBwt73vxI3OA6tq18XAgWgCvpjqi2P5pj57SkMJftS
```

Create on db
```sql
insert into users (
    username,
    hashed_password,
    user_role
) values (
    'your-user',
    '$2a$10$dNd/BjjMtgMUBwt73vxI3OA6tq18XAgWgCvpjqi2P5pj57SkMJftS',
    'admin' -- or 'server'
);
```


