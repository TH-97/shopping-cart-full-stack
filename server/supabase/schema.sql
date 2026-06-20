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

-- step3 주문 요약·쿠폰: 쿠폰 적용 조건용 컬럼 확장.
-- discount_type 영문 enum(FIXED/PERCENT/FREE_SHIPPING/BUY_X_GET_1) 기준.
-- min_order_amount: 최소 주문 금액(없으면 NULL).
-- usable_from/usable_to: 'HH:MM' 사용 가능 시간대(없으면 NULL).
-- buy_quantity/free_quantity: BUY_X_GET_1 증정 조건/수량.
alter table coupon add column if not exists min_order_amount integer;
alter table coupon add column if not exists usable_from text;
alter table coupon add column if not exists usable_to   text;
alter table coupon add column if not exists buy_quantity  integer;
alter table coupon add column if not exists free_quantity integer;

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

-- step3 데모 시드: 데모 유저와 보유 쿠폰 4종(정액/정률/무료배송/증정).
-- 만료일은 충분히 먼 미래로 둔다. 재실행 시 충돌하지 않도록 do nothing.
insert into "user" (user_id)
values ('demo-user')
on conflict (user_id) do nothing;

insert into coupon (
  coupon_id, name, discount_type, discount_value, expires_at,
  min_order_amount, usable_from, usable_to, buy_quantity, free_quantity
) values
  ('coupon-fixed',         '5,000원 할인 쿠폰',        'FIXED',         5000, '2099-12-31T23:59:59Z', 0,    null, null, null, null),
  ('coupon-percent',       '10% 할인 쿠폰',            'PERCENT',         10, '2099-12-31T23:59:59Z', 0,    null, null, null, null),
  ('coupon-free-shipping', '무료배송 쿠폰',            'FREE_SHIPPING',    0, '2099-12-31T23:59:59Z', 0,    null, null, null, null),
  ('coupon-buy-x-get-1',   '2개 구매 시 1개 무료 쿠폰', 'BUY_X_GET_1',      0, '2099-12-31T23:59:59Z', null, null, null,    2,    1)
on conflict (coupon_id) do nothing;

insert into user_coupon (user_coupon_id, is_used, coupon_id, user_id) values
  ('user-coupon-fixed',         false, 'coupon-fixed',         'demo-user'),
  ('user-coupon-percent',       false, 'coupon-percent',       'demo-user'),
  ('user-coupon-free-shipping', false, 'coupon-free-shipping', 'demo-user'),
  ('user-coupon-buy-x-get-1',   false, 'coupon-buy-x-get-1',   'demo-user')
on conflict (user_coupon_id) do nothing;
