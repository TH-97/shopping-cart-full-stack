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
  code           text    not null,
  name           text    not null,
  discount_type  text    not null,
  discount_value integer not null,
  expires_at     timestamptz not null
);

-- step3 주문 요약·쿠폰: 쿠폰 식별 코드·적용 조건용 컬럼 확장.
-- code: 할인액·적용 조건 분기 기준(FIXED5000/BOGO/FREESHIPPING/MIRACLESALE).
-- discount_type 영문 enum(FIXED/PERCENTAGE) 기준 — 순차 계산 정렬용(정액 먼저, 정율 나중).
-- min_order_amount: 최소 주문 금액(없으면 NULL).
-- usable_from/usable_to: 'HH:MM' 사용 가능 시간대(없으면 NULL).
-- buy_quantity/free_quantity: BOGO 증정 조건/수량(buy_quantity=3 → 3개 있을 때 1개 무료).
alter table coupon add column if not exists code text;
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

-- step3 데모 시드: 데모 유저와 보유 쿠폰 4종(FIXED5000/BOGO/FREESHIPPING/MIRACLESALE).
-- 만료일은 KST(+09:00) 기준으로 명시한다. 재실행 시 충돌하지 않도록 do nothing.
insert into "user" (user_id)
values ('demo-user')
on conflict (user_id) do nothing;

-- 전역 단일 장바구니용 데모 cart (cart_item.cart_id NOT NULL 충족).
insert into cart (cart_id, user_id)
values ('demo-cart', 'demo-user')
on conflict (cart_id) do nothing;

insert into coupon (
  coupon_id, code, name, discount_type, discount_value, expires_at,
  min_order_amount, usable_from, usable_to, buy_quantity, free_quantity
) values
  ('coupon-fixed5000',     'FIXED5000',    '5,000원 할인 쿠폰',        'FIXED',      5000, '2026-11-30T23:59:59+09:00', 100000, null,    null,    null, null),
  ('coupon-bogo',          'BOGO',         '2개 구매 시 1개 무료 쿠폰', 'FIXED',         0, '2026-06-30T23:59:59+09:00', null,   null,    null,       3,    1),
  ('coupon-freeshipping',  'FREESHIPPING', '무료배송 쿠폰',            'FIXED',         0, '2026-08-31T23:59:59+09:00', 50000,  null,    null,    null, null),
  ('coupon-miraclesale',   'MIRACLESALE',  '30% 할인 쿠폰',            'PERCENTAGE',   30, '2026-07-31T23:59:59+09:00', null,   '04:00', '07:00', null, null)
on conflict (coupon_id) do nothing;

-- code는 not null이므로 기존 row가 있던 DB를 위해 채워준다(신규 시드는 위에서 이미 채움).
update coupon set code = 'FIXED5000'    where coupon_id = 'coupon-fixed5000'    and code is null;
update coupon set code = 'BOGO'         where coupon_id = 'coupon-bogo'         and code is null;
update coupon set code = 'FREESHIPPING' where coupon_id = 'coupon-freeshipping' and code is null;
update coupon set code = 'MIRACLESALE'  where coupon_id = 'coupon-miraclesale'  and code is null;

-- 모든 row의 code가 채워진 뒤 NOT NULL로 승격(의도대로 제약 강제).
alter table coupon alter column code set not null;

insert into user_coupon (user_coupon_id, is_used, coupon_id, user_id) values
  ('user-coupon-fixed5000',    false, 'coupon-fixed5000',    'demo-user'),
  ('user-coupon-bogo',         false, 'coupon-bogo',         'demo-user'),
  ('user-coupon-freeshipping', false, 'coupon-freeshipping', 'demo-user'),
  ('user-coupon-miraclesale',  false, 'coupon-miraclesale',  'demo-user')
on conflict (user_coupon_id) do nothing;
