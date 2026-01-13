// 商品関連の型定義

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  categoryId: string;
  sellerId: string;
  embedding?: number[]; // 384次元
}

export interface ProductInput {
  name: string;
  description: string;
  price: number;
  categoryId: string;
}

export interface ProductSimulationRequest {
  description: string;
}
