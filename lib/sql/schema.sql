-- Core posts table (stores base metadata)
create table if not exists posts (
  id text primary key,
  title text not null,
  type text not null,
  content text not null,
  created_at datetime default current_timestamp
);

-- Images per post (ordered by position)
create table if not exists post_images (
  id integer primary key autoincrement,
  post_id text not null references posts(id) on delete cascade,
  url text not null,
  position integer not null default 0
);

-- Comments per post
create table if not exists comments (
  id integer primary key autoincrement,
  post_id text not null references posts(id) on delete cascade,
  name text not null,
  text text not null,
  created_at datetime default current_timestamp
);
