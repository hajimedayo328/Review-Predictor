// 顧客関連の型定義

export interface CustomerProfile {
  id: string;
  name: string;
  segmentId: string;
  segmentName: string;
  profileVector: number[]; // 5次元
  preferenceVector: number[]; // 384次元
}

export interface ProfileVector {
  priceSensitivity: number;
  qualityFocus: number;
  designFocus: number;
  brandLoyalty: number;
  reviewStrictness: number;
}

export type SegmentType = 'PRICE_SENSITIVE' | 'QUALITY_FOCUSED' | 'DESIGN_LOVERS' | 'BRAND_LOYAL';
