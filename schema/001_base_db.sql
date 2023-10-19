-- base db setup script
begin;
CREATE TYPE user_role AS ENUM ('admin', 'server');

create table users (
    id uuid default gen_random_uuid () primary key,
    username text,
    hashed_password text,
    user_role user_role
);
end;