import { routeHandler } from '../../middlewares/routeHandler.js';
import {
  parseAddCartItemDto,
  parseCartItemIdDto,
  parseChangeCartItemQuantityDto,
  toCartItemResponse,
} from './cartItem.dto.js';
import type { CartItemService } from './cartItem.service.js';

// 요청을 받아 dto 파싱 → service 호출 → 응답 직렬화까지 담당한다.
// 라우터(cartItem.routes.ts)는 경로와 이 핸들러의 연결만 맡는다.
export const createCartItemController = (cartItemService: CartItemService) => ({
  list: routeHandler(async (_req, res) => {
    const cartItems = await cartItemService.getCartItems();
    res
      .status(200)
      .json(
        cartItems.map(({ cartItem, product }) =>
          toCartItemResponse(cartItem, product),
        ),
      );
  }),

  add: routeHandler(async (req, res) => {
    const command = parseAddCartItemDto(req.body);

    const cartItem = await cartItemService.addCartItem(command);

    const responseBody = { cartItemId: cartItem.cartItemId };

    if (cartItem.isNew) {
      res.status(201).json(responseBody);
      return;
    }

    res.status(200).json(responseBody);
  }),

  remove: routeHandler(async (req, res) => {
    const command = parseCartItemIdDto(req.params);
    await cartItemService.deleteCartItem(command.cartItemId);
    res.status(204).send();
  }),

  changeQuantity: routeHandler(async (req, res) => {
    const command = parseChangeCartItemQuantityDto(req.params, req.body);

    await cartItemService.changeQuantity(command);
    res.status(204).send();
  }),
});
