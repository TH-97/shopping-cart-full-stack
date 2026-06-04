import { CartItem } from './modules/cart/cartItem.model.js';
import { Product } from './modules/products/product.model.js';

export const productsDB = new Map<string, Product>();

export const cartItemsDB = new Map<string, CartItem>();

// 개발용 시드 데이터 — 서버 시작 시 항상 채워진다.
const seedProducts = [
  new Product({
    productId: '1',
    productName: '상품이름A',
    productPrice: 35000,
    remainingQuantity: 10,
    imageUrl: 'https://placehold.co/80x80?text=A',
  }),
  new Product({
    productId: '2',
    productName: '상품이름B',
    productPrice: 25000,
    remainingQuantity: 10,
    imageUrl: 'https://placehold.co/80x80?text=B',
  }),
];

const seedCartItems = [
  new CartItem({ cartItemId: '1', productId: '1', purchaseQuantity: 2 }),
  new CartItem({ cartItemId: '2', productId: '2', purchaseQuantity: 2 }),
];

seedProducts.forEach((product) => productsDB.set(product.productId, product));
seedCartItems.forEach((cartItem) =>
  cartItemsDB.set(cartItem.cartItemId, cartItem),
);
