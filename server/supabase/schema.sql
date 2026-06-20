-- Supabase(PostgreSQL) 스키마. docs/db.png ER 다이어그램 기준.
-- Supabase 대시보드 SQL editor에 그대로 실행하면 된다.
-- 문자열 식별자/이름/URL은 Postgres 관례대로 text, 금액·수량은 integer,
-- 만료일은 timestamptz, 사용여부는 boolean으로 둔다.

create table if not exists product (
  product_id         text primary key,
  product_name       text    not null,
  product_price      integer not null,
  remaining_quantity integer not null,
  image_url          text
);

create table if not exists "user" (
  user_id text primary key
);

create table if not exists cart (
  cart_id text primary key,
  user_id text not null references "user"(user_id) on delete cascade
);

create table if not exists cart_item (
  cart_item_id      text primary key,
  cart_id           text    not null references cart(cart_id) on delete cascade,
  product_id        text    not null references product(product_id) on delete cascade,
  purchase_quantity integer not null
);

create table if not exists coupon (
  coupon_id      text primary key,
  name           text    not null,
  discount_type  text    not null,
  discount_value integer not null,
  expires_at     timestamptz not null
);

create table if not exists user_coupon (
  user_coupon_id text primary key,
  is_used        boolean not null default false,
  coupon_id      text    not null references coupon(coupon_id) on delete cascade,
  user_id        text    not null references "user"(user_id) on delete cascade
);

-- 조회 패턴(상품별 장바구니 정리, user별 쿠폰 조회)을 위한 인덱스
create index if not exists idx_cart_item_product_id on cart_item(product_id);
create index if not exists idx_cart_item_cart_id    on cart_item(cart_id);
create index if not exists idx_user_coupon_user_id  on user_coupon(user_id);
