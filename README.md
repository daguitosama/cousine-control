# Cousine Control

A little restaurant/bar/cafeterias orders management app.

## Stack
- PostgreSQL
- Remix


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
    'your-password-hash',
    'admin' -- or 'server'
);
```




## Notes
Just restarted with new db, the all ready logged in user is missing since has a different id