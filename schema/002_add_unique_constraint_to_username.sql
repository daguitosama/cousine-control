begin;
alter table users add constraint unique_username UNIQUE (username)
end;