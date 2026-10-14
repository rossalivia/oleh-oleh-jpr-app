export type UserRole = 'customer' | 'cashier' | 'admin';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: UserRole;
  phoneNumber?: string;
  createdAt?: any;
  updatedAt?: any;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
  displayOrder: number;
  isActive: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price: number;
  costPrice?: number;
  stock: number;
  lowStockThreshold: number;
  unit: string;
  mainImage: string;
  galleryImages: string[];
  isActive: boolean;
  isPublished: boolean;
  createdAt?: any;
  updatedAt?: any;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export interface OrderItemSnapshot {
  productId: string;
  productName: string;
  sku: string;
  price: number;
  quantity: number;
  subtotal: number;
  unit: string;
  imageThumbnail?: string;
}

export type OrderStatus =
  | 'PENDING_PAYMENT'
  | 'WAITING_VERIFICATION'
  | 'PAID'
  | 'PROCESSING'
  | 'READY_FOR_PICKUP'
  | 'SHIPPED'
  | 'COMPLETED'
  | 'CANCELLED';

export type PaymentStatus =
  | 'UNPAID'
  | 'PENDING_VERIFICATION'
  | 'SUCCESS'
  | 'REJECTED'
  | 'EXPIRED';

export type FulfillmentMethod = 'PICKUP' | 'SHIPPING';

export interface Order {
  id: string;
  customerId: string;
  customerName: string;
  customerEmail: string;
  customerPhone: string;
  items: OrderItemSnapshot[];
  subtotal: number;
  shippingFee: number;
  totalAmount: number;
  orderStatus: OrderStatus;
  paymentStatus: PaymentStatus;
  channel: 'MARKETPLACE';
  fulfillmentMethod: FulfillmentMethod;
  paymentMethod?: 'BANK_TRANSFER' | 'QRIS' | 'CASH';
  bankDestination?: string;
  paymentProofUrl?: string;
  shippingAddress?: {
    recipientName: string;
    phoneNumber: string;
    addressLine: string;
    city: string;
    postalCode?: string;
    courierName?: string;
    trackingNumber?: string;
  };
  cancellationReason?: string;
  cancelledBy?: 'CUSTOMER' | 'ADMIN';
  cancelledAt?: any;
  paymentRejectionReason?: string;
  notes?: string;
  expiresAt?: any; // Batas bayar 1 jam
  createdAt: any;
  updatedAt: any;
}

export interface AppNotification {
  id: string;
  recipientRole?: 'all' | 'admin' | 'customer';
  recipientUserId?: string;
  title: string;
  message: string;
  type: 'order' | 'payment' | 'inventory' | 'system' | 'success' | 'error';
  link?: string;
  read: boolean;
  createdAt: string;
}

export interface PaymentProof {
  id: string;
  orderId: string;
  paymentMethod: 'BANK_TRANSFER' | 'QRIS';
  amount: number;
  proofImageUrl: string;
  senderBank?: string;
  senderAccountName?: string;
  uploadedAt: any;
  verifiedBy?: string;
  verifiedAt?: any;
  rejectionReason?: string;
  status: 'PENDING_VERIFICATION' | 'VERIFIED' | 'REJECTED';
}

export interface Transaction {
  id: string;
  channel: 'POS' | 'MARKETPLACE';
  orderId?: string;
  cashierId?: string;
  cashierName?: string;
  items: OrderItemSnapshot[];
  totalAmount: number;
  paymentMethod: 'CASH' | 'QRIS' | 'TRANSFER' | 'BANK_TRANSFER';
  fulfillmentMethod?: FulfillmentMethod;
  bankDestination?: string;
  transferReference?: string;
  cashReceived?: number;
  cashChange?: number;
  transactionTime: any;
  status: 'COMPLETED' | 'VOIDED';
  voidReason?: string;
  voidedBy?: string;
  notes?: string;
}

export interface InventoryMovement {
  id: string;
  productId: string;
  productName: string;
  sku: string;
  type:
    | 'POS_SALE'
    | 'ONLINE_ORDER_RESERVED'
    | 'ONLINE_ORDER_CONFIRMED'
    | 'ORDER_CANCELLED'
    | 'RESTOCK'
    | 'MANUAL_ADJUSTMENT'
    | 'VOID_TRANSACTION';
  quantityDelta: number;
  previousStock: number;
  resultingStock: number;
  referenceId: string;
  reason: string;
  performedBy: string;
  timestamp: any;
}

export interface StoreSettings {
  storeName: string;
  tagline?: string;
  logoUrl?: string;
  address: string;
  googleMapsUrl: string;
  openingTime: string;
  closingTime?: string;
  operationalDays?: string;
  phoneNumber?: string;
  whatsappNumber?: string;
  bankAccounts: Array<{
    bankName: string;
    accountNumber: string;
    accountHolder: string;
  }>;
  qrisImageUrl?: string;
  defaultLowStockThreshold: number;
  cancellationPolicyNotice: string;
  updatedAt?: any;
  updatedBy?: string;
}
