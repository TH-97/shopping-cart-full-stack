import type { SupabaseClient } from '@supabase/supabase-js';
import { Product } from './product.model.js';

export interface ProductRepository {
  save(product: Product): Promise<Product>;
  findAll(): Promise<Product[]>;
  findById(productId: string): Promise<Product | undefined>;
  deleteById(productId: string): Promise<boolean>;
}

// 테스트·로컬용 인메모리 구현. 인터페이스는 비동기이므로 Promise를 반환한다.
export const createInMemoryProductRepository = (
  store: Map<string, Product>,
): ProductRepository => ({
  async save(product) {
    store.set(product.productId, product);
    return product;
  },

  async findAll() {
    return Array.from(store.values());
  },

  async findById(productId) {
    return store.get(productId);
  },

  async deleteById(productId) {
    return store.delete(productId);
  },
});

// 인메모리가 기본 팩토리(테스트·로컬). 프로덕션은 container가 Supabase 구현을 고른다.
export const createProductRepository = createInMemoryProductRepository;

const TABLE = 'product';

const toProduct = (row: {
  product_id: string;
  product_name: string;
  product_price: number;
  remaining_quantity: number;
  image_url: string | null;
}): Product =>
  new Product({
    productId: row.product_id,
    productName: row.product_name,
    productPrice: row.product_price,
    remainingQuantity: row.remaining_quantity,
    imageUrl: row.image_url ?? undefined,
  });

export const createSupabaseProductRepository = (
  client: SupabaseClient,
): ProductRepository => ({
  async save(product) {
    const { error } = await client.from(TABLE).upsert({
      product_id: product.productId,
      product_name: product.productName,
      product_price: product.productPrice,
      remaining_quantity: product.remainingQuantity,
      image_url: product.imageUrl ?? null,
    });
    if (error) throw new Error(error.message);
    return product;
  },

  async findAll() {
    const { data, error } = await client.from(TABLE).select('*');
    if (error) throw new Error(error.message);
    return (data ?? []).map(toProduct);
  },

  async findById(productId) {
    const { data, error } = await client
      .from(TABLE)
      .select('*')
      .eq('product_id', productId)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return data ? toProduct(data) : undefined;
  },

  async deleteById(productId) {
    const { data, error } = await client
      .from(TABLE)
      .delete()
      .eq('product_id', productId)
      .select('product_id');
    if (error) throw new Error(error.message);
    return (data ?? []).length > 0;
  },
});
