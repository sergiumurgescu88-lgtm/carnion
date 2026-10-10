export interface Product {
  id: string;
  sourceId: number;
  name: string;
  category: string;
  categorySlug: string;
  unit: string; // 'kg' | 'buc'
  price: number;
  vatIncluded: boolean;
  soldByWeight: boolean;
  ownerReview?: string | null;
  imageMode?: 'generate' | 'placeholder';
  imagePrompt?: string | null;
  image?: string;
}

export interface Category {
  name: string;
  slug: string;
  count: number;
}

export interface ProductsData {
  business: string;
  currency: string;
  categories: Category[];
  products: Product[];
  imageStyleNote?: string;
}

export interface CartItem {
  product: Product;
  quantity: number; // kg sau buc
}

export interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  comment: string;
  verified?: boolean;
  location?: string;
  productId?: string;
}
