# API 명세서

## 1. 공통 규칙

### 1-1. Base URL

```
http://localhost:3000
```

### 1-2. 요청 형식

- 요청 body는 JSON 형식으로 전달한다.
- 요청 body가 필요한 API는 `Content-Type: application/json`을 사용한다.

### 1-3. 응답 형식

- 응답 body는 JSON 형식으로 전달한다.
- 삭제 성공 응답은 body를 반환하지 않는다.
- 에러 응답은 공통 에러 응답 형식으로 반환한다.

### 1-4. 주요 식별자

| 이름         | 설명                              |
| ------------ | --------------------------------- |
| `productId`  | 상품 식별 id                      |
| `cartItemId` | 장바구니에 담긴 상품 항목 식별 id |

### 1-5. 상태 코드

| 상태 코드                   | 설명                 |
| --------------------------- | -------------------- |
| `200 OK`                    | 조회, 수정 성공      |
| `201 Created`               | 생성 성공            |
| `204 No Content`            | 삭제 성공            |
| `400 Bad Request`           | 잘못된 요청          |
| `404 Not Found`             | 존재하지 않는 리소스 |
| `500 Internal Server Error` | 서버 내부 오류       |

### 1-6. 에러 응답

```json
{
  "code": "에러 코드",
  "message": "에러 메시지"
}
```

- `INVALID_*`: 요청 값이 없거나 형식, 범위가 유효하지 않은 경우 사용한다.
- `*_NOT_FOUND`: 요청 값의 형식은 유효하지만, 해당 리소스가 존재하지 않는 경우 사용한다.
- `EXCEEDS_*`: 요청 값의 형식은 유효하지만, 비즈니스 규칙을 위반한 경우 사용한다.

## 2. 상품 API

### 2-1. 상품 목록 조회

```http
GET /products
```

#### Request

없음

#### Response

`200 OK`

상품이 없으면 빈 배열을 응답한다.

```json
[
  {
    "productId": "1",
    "productName": "testName",
    "productPrice": 1300,
    "remainingQuantity": 25,
    "imageUrl": "src/assets/test.png"
  }
]
```

#### Error

없음

---

### 2-2. 상품 추가

```http
POST /products
```

#### Request

```json
{
  "productName": "testName",
  "productPrice": 1300,
  "remainingQuantity": 25,
  "imageUrl": "src/assets/test.png"
}
```

| 이름                | 필수 여부 | 설명                                  |
| ------------------- | --------- | ------------------------------------- |
| `productName`       | 필수      | 공백이 아니며, 최대 100자인 상품 이름 |
| `productPrice`      | 필수      | 0보다 큰 숫자                         |
| `remainingQuantity` | 필수      | 1개 이상, 99개 이하의 정수            |
| `imageUrl`          | 선택      | 이미지 경로                           |

#### Response

`201 Created`

```json
{ "productId": "1" }
```

#### Error

Request 필드 안에 `imageUrl`을 제외한 필수 필드가 정의되지 않았거나, 필드 값이 유효하지 않을 때 `400 Bad Request`를 응답한다.

```json
{
  "code": "INVALID_PRODUCT_NAME",
  "message": "유효하지 않은 상품 이름입니다."
}
```

| 에러 코드                    | 설명                                                                |
| ---------------------------- | ------------------------------------------------------------------- |
| `INVALID_PRODUCT_NAME`       | `productName`이 정의되지 않았거나, 상품 이름이 유효하지 않은 경우   |
| `INVALID_PRODUCT_PRICE`      | `productPrice`가 정의되지 않았거나, 0보다 큰 숫자가 아닌 경우       |
| `INVALID_REMAINING_QUANTITY` | `remainingQuantity`가 정의되지 않았거나, 1 이상 99 이하가 아닌 경우 |
| `INVALID_IMAGE_URL`          | `imageUrl`이 정의되어 있지만, 이미지 경로가 유효하지 않은 경우      |

---

### 2-3. 상품 삭제

```http
DELETE /products/:productId
```

#### Request

없음

#### Response

`204 No Content`. 응답 본문 없음.

삭제한 상품이 장바구니에 담겨 있으면 해당 장바구니 상품도 함께 제거한다.

#### Error

`404 Not Found`

```json
{
  "code": "PRODUCT_NOT_FOUND",
  "message": "존재하지 않는 상품입니다."
}
```

| 상태 코드       | 에러 코드           | 설명                                             |
| --------------- | ------------------- | ------------------------------------------------ |
| `404 Not Found` | `PRODUCT_NOT_FOUND` | `productId`에 해당하는 상품이 존재하지 않는 경우 |

## 3. 장바구니 API

### 3-1. 장바구니 상품 목록 조회

```http
GET /cart/items
```

#### Request

없음

#### Response

`200 OK`

장바구니에 담긴 상품이 없으면 빈 배열을 응답한다.

```json
[
  {
    "cartItemId": "10",
    "productId": "3",
    "productName": "콜라",
    "productPrice": 1300,
    "imageUrl": "src/assets/coke.png",
    "purchaseQuantity": 2
  }
]
```

#### Error

없음

---

### 3-2. 장바구니에 상품 추가

```http
POST /cart/items
```

#### Request

```json
{
  "productId": "3",
  "purchaseQuantity": 1
}
```

| 이름               | 필수 여부 | 설명                       |
| ------------------ | --------- | -------------------------- |
| `productId`        | 필수      | 장바구니에 담을 상품 id    |
| `purchaseQuantity` | 필수      | 1개 이상, 99개 이하의 정수 |

#### Response

새로운 장바구니 상품이 생성되면 `201 Created`를 응답한다.
이미 담긴 상품의 수량이 증가하면 `200 OK`를 응답한다.

```json
{ "cartItemId": "10" }
```

#### Error

`400 Bad Request` 또는 `404 Not Found`

```json
{
  "code": "INVALID_PRODUCT_ID",
  "message": "유효하지 않은 상품 id입니다."
}
```

| 상태 코드         | 에러 코드                    | 설명                                                               |
| ----------------- | ---------------------------- | ------------------------------------------------------------------ |
| `400 Bad Request` | `INVALID_PRODUCT_ID`         | `productId`가 정의되지 않았거나, 형식이 유효하지 않은 경우         |
| `404 Not Found`   | `PRODUCT_NOT_FOUND`          | `productId`에 해당하는 상품이 존재하지 않는 경우                   |
| `400 Bad Request` | `INVALID_PURCHASE_QUANTITY`  | `purchaseQuantity`가 정의되지 않았거나, 1 이상 99 이하가 아닌 경우 |
| `400 Bad Request` | `EXCEEDS_REMAINING_QUANTITY` | 장바구니에 담으려는 수량이 상품의 남은 수량보다 많은 경우          |

---

### 3-3. 장바구니 상품 수량 변경

```http
PATCH /cart/items/:cartItemId
```

#### Request

```json
{
  "purchaseQuantity": 3
}
```

| 이름               | 필수 여부 | 설명                       |
| ------------------ | --------- | -------------------------- |
| `purchaseQuantity` | 필수      | 1개 이상, 99개 이하의 정수 |

#### Response

`204 No Content`

응답 본문은 비워 둔다. 변경할 `purchaseQuantity`는 클라이언트가 요청에 담아 보낸 값이므로, 별도로 다시 반환하지 않는다.

#### Error

`400 Bad Request` 또는 `404 Not Found`

```json
{
  "code": "CART_ITEM_NOT_FOUND",
  "message": "존재하지 않는 장바구니 상품입니다."
}
```

| 상태 코드         | 에러 코드                    | 설명                                                               |
| ----------------- | ---------------------------- | ------------------------------------------------------------------ |
| `400 Bad Request` | `INVALID_CART_ITEM_ID`       | `cartItemId` 형식이 유효하지 않은 경우                             |
| `404 Not Found`   | `CART_ITEM_NOT_FOUND`        | `cartItemId`에 해당하는 장바구니 상품이 존재하지 않는 경우         |
| `400 Bad Request` | `INVALID_PURCHASE_QUANTITY`  | `purchaseQuantity`가 정의되지 않았거나, 1 이상 99 이하가 아닌 경우 |
| `400 Bad Request` | `EXCEEDS_REMAINING_QUANTITY` | 변경하려는 수량이 상품의 남은 수량보다 많은 경우                   |

---

### 3-4. 장바구니 상품 제거

```http
DELETE /cart/items/:cartItemId
```

#### Request

없음

#### Response

`204 No Content`. 응답 본문 없음.

#### Error

`404 Not Found`

```json
{
  "code": "CART_ITEM_NOT_FOUND",
  "message": "존재하지 않는 장바구니 상품입니다."
}
```

| 상태 코드       | 에러 코드             | 설명                                                       |
| --------------- | --------------------- | ---------------------------------------------------------- |
| `404 Not Found` | `CART_ITEM_NOT_FOUND` | `cartItemId`에 해당하는 장바구니 상품이 존재하지 않는 경우 |

## 4. 엔드포인트

| 기능                    | Method   | Endpoint                  | 설명                                                          |
| ----------------------- | -------- | ------------------------- | ------------------------------------------------------------- |
| 상품 목록 조회          | `GET`    | `/products`               | 저장된 모든 상품을 조회한다.                                  |
| 상품 추가               | `POST`   | `/products`               | 새로운 상품을 추가한다.                                       |
| 상품 삭제               | `DELETE` | `/products/:productId`    | 상품을 삭제하고, 해당 상품이 장바구니에 있으면 함께 제거한다. |
| 장바구니 상품 목록 조회 | `GET`    | `/cart/items`             | 장바구니에 담긴 상품 목록을 조회한다.                         |
| 장바구니에 상품 추가    | `POST`   | `/cart/items`             | 장바구니에 상품을 추가한다.                                   |
| 장바구니 상품 수량 변경 | `PATCH`  | `/cart/items/:cartItemId` | 특정 장바구니 상품의 수량을 변경한다.                         |
| 장바구니 상품 제거      | `DELETE` | `/cart/items/:cartItemId` | 특정 장바구니 상품을 제거한다.                                |

## 5. 설계 결정 이유

### 5-1. 상품 id와 장바구니 상품 id를 분리한 이유

`productId`는 상품 자체를 식별하고, `cartItemId`는 장바구니에 담긴 상품 항목을 식별한다.

같은 상품이라도 장바구니에서는 수량, 선택 상태, 옵션 등 장바구니 전용 정보를 가질 수 있으므로 상품 id와 장바구니 상품 id를 분리한다. 이를 통해 상품 수정/삭제와 장바구니 항목 수정/삭제의 책임을 명확히 구분할 수 있다.

### 5-2. `cart`는 단수, `items`는 복수로 표현한 이유

현재 서비스에서는 하나의 장바구니를 가진다고 가정한다. 따라서 장바구니 자체는 `cart` 단수로 표현한다.

반면 장바구니 안에는 여러 상품 항목이 담길 수 있으므로 항목 컬렉션은 `items` 복수로 표현한다.

```http
GET /cart/items
POST /cart/items
PATCH /cart/items/:cartItemId
DELETE /cart/items/:cartItemId
```

### 5-3. Path parameter와 Request body를 분리한 이유

리소스를 식별하는 값은 path parameter로 전달하고, 생성하거나 변경할 데이터는 request body로 전달한다.

예를 들어 장바구니 상품 수량 변경 API에서 `cartItemId`는 이미 경로에 포함되어 있으므로 request body에 다시 포함하지 않는다.

```http
PATCH /cart/items/:cartItemId
```

```json
{
  "purchaseQuantity": 3
}
```

이렇게 분리하면 path의 id와 body의 id가 서로 다른 경우 어느 값을 신뢰해야 하는지 애매해지는 문제를 막을 수 있다.

### 5-4. 장바구니 추가 요청에서 상품 정보를 직접 받지 않는 이유

장바구니에 상품을 추가할 때는 `productId`와 `purchaseQuantity`만 요청 body로 전달한다.

```json
{
  "productId": "3",
  "purchaseQuantity": 1
}
```

상품 이름, 가격, 이미지 경로는 서버가 `productId`를 기준으로 조회한다. 클라이언트가 상품 가격이나 이름을 직접 보내면 서버에 저장된 상품 정보와 불일치할 수 있으므로, 장바구니 추가 요청에서는 상품 식별자와 수량만 받는다.

### 5-5. 상품 목록이 비어 있을 때 `200 OK`를 반환하는 이유

`GET /products`는 특정 상품 하나가 아니라 상품 목록 컬렉션을 조회하는 API다. 상품이 하나도 없더라도 상품 목록이라는 리소스는 존재하므로 `404 Not Found`가 아니라 `200 OK`와 빈 배열을 반환한다.

```json
[]
```

### 5-6. DELETE 요청에서 request body를 사용하지 않는 이유

삭제 대상은 경로의 id로 식별한다.

```http
DELETE /products/:productId
DELETE /cart/items/:cartItemId
```

따라서 request body에 `productId`나 `cartItemId`를 다시 전달하지 않는다. 삭제 성공 시에는 `204 No Content`를 반환하고 응답 본문은 비워 둔다.
