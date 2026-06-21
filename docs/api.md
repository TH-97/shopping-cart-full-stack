# step3 API 명세서

## 공통 규칙

- 요청/응답 body는 JSON 형식으로 전달한다.
- JSON 필드 이름은 영문 camelCase를 사용하고, 의미는 각 표에서 한글로 설명한다.
- `userId`는 body로 보내지 않고 인증 정보(헤더/세션)로 서버가 식별한다.
- 에러 응답은 아래 공통 형식으로 반환한다.

```json
{
  "code": "에러 코드",
  "message": "에러 메시지"
}
```

## 1. 주문 확인 페이지 진입 시 (주문 요약 계산)

```http
POST /orders/summary
```

### Request

```json
{
  "userId": 1,
  "selectedCartItemIds": ["10", "12"],
  "selectedCouponIds": ["1", "3"],
  "isRemoteArea": false
}
```

| 이름                  | 필수 여부 | 설명                                               |
| --------------------- | --------- | -------------------------------------------------- |
| `selectedCartItemIds` | 필수      | 선택된 장바구니 상품 id 배열 (1개 이상)            |
| `selectedCouponIds`   | 필수      | 적용할 쿠폰 id 배열 (최대 2개, 없으면 쿠폰 미적용) |
| `isRemoteArea`        | 필수      | 제주도·도서 산간 지역 체크 여부 (기본값 `false`)   |

### Response

`200 OK`

```json
{
  "orderAmount": 10000,
  "couponDiscountAmount": 5000,
  "shippingFee": 3000,
  "totalPaymentAmount": 8000
}
```

| 이름                   | 설명                                  |
| ---------------------- | ------------------------------------- |
| `orderAmount`          | 주문 금액 (쿠폰 적용 전)              |
| `couponDiscountAmount` | 쿠폰 할인 금액 (상품 할인 + 배송 할인) |
| `shippingFee`          | 배송비 (무료배송 쿠폰 적용 후 최종)   |
| `totalPaymentAmount`   | 총 결제 금액                          |

### 쿠폰 적용·계산 규칙

쿠폰은 식별 코드(`code`)로 동작이 결정되고, `discountType`(`FIXED`/`PERCENTAGE`)은 순차 계산의 적용 순서를 정한다.

| code           | discountType | 동작                                                          | 적용 조건                                   |
| -------------- | ------------ | ------------------------------------------------------------- | ------------------------------------------- |
| `FIXED5000`    | `FIXED`      | 5,000원 정액 할인                                             | 주문금액 ≥ 100,000원                        |
| `BOGO`         | `FIXED`      | 선택 항목 중 최고가 단가 × 1개 무료                           | 단일 항목 수량이 3개 이상                   |
| `FREESHIPPING` | `FIXED`      | 배송비 전액(도서산간 추가분 포함) 할인                        | 주문금액 ≥ 50,000원                         |
| `MIRACLESALE`  | `PERCENTAGE` | 그 시점 주문금액의 30% 할인                                   | 사용 가능 시간 04:00 ~ 07:00 (KST)          |

금액은 **상품금액 트랙**과 **배송비 트랙**으로 나눠 계산한다.

- **상품금액 트랙**: `FREESHIPPING`을 제외한 선택 쿠폰을 `discountType` 기준으로 정렬해(`FIXED` 먼저, `PERCENTAGE` 나중) 주문금액에 순차 적용한다. 각 단계 금액은 `max(금액 - 할인액, 0)`이며, `PERCENTAGE`는 그 시점 금액 기준으로 계산한다. 상품 할인 = `주문금액 - 최종 금액`.
- **배송비 트랙**: 선택 쿠폰에 `FREESHIPPING`이 있으면 기준 배송비 전액을 할인하고 최종 배송비는 0이 된다. 없으면 배송 할인 0.
- 집계: `couponDiscountAmount = 상품 할인 + 배송 할인`, `shippingFee(응답) = 기준 배송비 - 배송 할인`, `totalPaymentAmount = 주문금액 - couponDiscountAmount + 기준 배송비`.
- **무료배송 기준**: 쿠폰 적용 **전** 주문금액이 100,000원 이상이면 기준 배송비 0, 그 외 기본 3,000원(도서산간이면 +3,000원). `FREESHIPPING` 쿠폰은 그 위에서 배송비를 0으로 만든다.

> 검산 예) 주문금액 100,000원, 쿠폰 `[FIXED5000, MIRACLESALE]`, 도서산간 아님 →
> 기준 배송비 0(10만 이상). 상품 트랙: 100,000 − 5,000 = 95,000 → 95,000 × 30% = 28,500 차감 → 66,500.
> 상품 할인 33,500, 배송 할인 0 → `couponDiscountAmount` 33,500, `totalPaymentAmount` 66,500.

### Error

`400 Bad Request` 또는 `404 Not Found`

```json
{
  "code": "CART_ITEM_NOT_FOUND",
  "message": "존재하지 않는 장바구니 상품입니다."
}
```

| 상태 코드         | 에러 코드               | 설명                                                        |
| ----------------- | ----------------------- | ----------------------------------------------------------- |
| `400 Bad Request` | `INVALID_CART_ITEM_IDS` | `selectedCartItemIds`가 없거나 빈 배열인 경우               |
| `404 Not Found`   | `CART_ITEM_NOT_FOUND`   | 해당 `cartItemId`의 장바구니 상품이 존재하지 않는 경우      |
| `404 Not Found`   | `COUPON_NOT_FOUND`      | 해당 `couponId`의 쿠폰이 존재하지 않는 경우                 |
| `400 Bad Request` | `EXCEEDS_COUPON_LIMIT`  | 적용하려는 쿠폰이 최대 적용 개수(2장)를 초과한 경우         |
| `400 Bad Request` | `COUPON_NOT_APPLICABLE` | 만료·사용 완료·적용 조건 미달 등 적용할 수 없는 쿠폰인 경우 |

## 2. 쿠폰 적용하기 클릭 시 (쿠폰 목록 조회)

```http
GET /coupons?selectedCartItemIds=10,12
```

> GET 요청은 body를 가질 수 없으므로, 선택된 장바구니 상품 id는 query string으로 전달한다.

### Request

| 이름                  | 위치  | 필수 여부 | 설명                                     |
| --------------------- | ----- | --------- | ---------------------------------------- |
| `selectedCartItemIds` | query | 필수      | 선택된 장바구니 상품 id 배열 (쉼표 구분) |

### Response

`200 OK`

보유한 쿠폰이 없으면 `coupons`는 빈 배열을 응답한다.

```json
{
  "orderAmount": 100000,
  "coupons": [
    {
      "couponId": "coupon-fixed5000",
      "couponName": "5,000원 할인 쿠폰",
      "discountType": "FIXED",
      "isApplicable": true,
      "discountAmount": 5000,
      "expiresAt": "2026-11-30T14:59:59.000Z",
      "minOrderAmount": 100000,
      "usableFrom": null,
      "usableTo": null
    },
    {
      "couponId": "coupon-miraclesale",
      "couponName": "30% 할인 쿠폰",
      "discountType": "PERCENTAGE",
      "isApplicable": false,
      "discountAmount": 0,
      "expiresAt": "2026-07-31T14:59:59.000Z",
      "minOrderAmount": null,
      "usableFrom": "04:00",
      "usableTo": "07:00"
    }
  ]
}
```

| 이름             | 설명                                            |
| ---------------- | ----------------------------------------------- |
| `orderAmount`    | 선택된 상품 기준 전체 주문 금액                 |
| `couponId`       | 쿠폰 식별 id                                    |
| `couponName`     | 쿠폰 이름                                       |
| `discountType`   | 할인 타입 (`FIXED`=정액 / `PERCENTAGE`=정율)                     |
| `isApplicable`   | 활성화(적용 가능) 여부                          |
| `discountAmount` | 현재 주문 기준 할인 금액 (적용 불가 시 `0`)     |
| `expiresAt`      | 만료 일시 (ISO 8601, 모달 표시용)               |
| `minOrderAmount` | 최소 주문 금액 (없으면 `null`)                  |
| `usableFrom`     | 사용 가능 시작 시각 `HH:MM` KST (없으면 `null`) |
| `usableTo`       | 사용 가능 종료 시각 `HH:MM` KST (없으면 `null`) |

### Error

| 상태 코드         | 에러 코드               | 설명                                                     |
| ----------------- | ----------------------- | -------------------------------------------------------- |
| `400 Bad Request` | `INVALID_CART_ITEM_IDS` | `selectedCartItemIds`가 없거나 형식이 유효하지 않은 경우 |
| `404 Not Found`   | `CART_ITEM_NOT_FOUND`   | 해당 `cartItemId`의 장바구니 상품이 존재하지 않는 경우   |

## 3. 사용 쿠폰 유효기간 검증

```http
POST /coupons/validate
```

### Request

```json
{
  "selectedCouponIds": ["1", "3"]
}
```

| 이름                | 필수 여부 | 설명                           |
| ------------------- | --------- | ------------------------------ |
| `selectedCouponIds` | 필수      | 검증할 쿠폰 id 배열 (최대 2개) |

### Response

`204 No Content`

모든 쿠폰이 유효하면 응답 본문 없이 성공을 반환한다.

### Error

`400 Bad Request` 또는 `404 Not Found`

```json
{
  "code": "COUPON_EXPIRED",
  "message": "유효기간이 지난 쿠폰입니다."
}
```

| 상태 코드         | 에러 코드              | 설명                                                |
| ----------------- | ---------------------- | --------------------------------------------------- |
| `404 Not Found`   | `COUPON_NOT_FOUND`     | 해당 `couponId`의 쿠폰이 존재하지 않는 경우         |
| `400 Bad Request` | `COUPON_EXPIRED`       | 쿠폰의 유효기간이 지난 경우                         |
| `400 Bad Request` | `COUPON_ALREADY_USED`  | 이미 사용한 쿠폰인 경우                             |
| `400 Bad Request` | `EXCEEDS_COUPON_LIMIT` | 검증하려는 쿠폰이 최대 적용 개수(2장)를 초과한 경우 |
