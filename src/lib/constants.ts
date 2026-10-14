export const STORE_IDENTITY = {
  name: 'Oleh Oleh Khas Jepara Jeha',
  shortName: 'Jeha Jepara',
  address: 'Jl. KH. Moliki, Pengkol VII, Pengkol, Kec. Jepara, Kabupaten Jepara, Jawa Tengah 59415',
  openingTime: '07.00 WIB',
  statusLabel: 'Buka pukul 07.00 WIB',
  timeZone: 'Asia/Jakarta',
  googleMapsUrl: 'https://maps.google.com/maps?vet=10CAAQoqAOahcKEwjwuu6nv7eXAxUAAAAAHQAAAAAQDw..i&sca_esv=074237d04407bddc&udm&fvr=1&pvq=Cg0vZy8xMWRmanBzcXZ4Ig8KCW9sZWggb2xlaBACGAM&lqi=ChBvbGVoIG9sZWggamVwYXJhSNy28Yq2rICACFocEAAQARgAGAEYAiIQb2xlaCBvbGVoIGplcGFyYZIBDnNvdXZlbmlyX3N0b3JlmgEkQ2hkRFNVaE5NRzluUzBWUVZGRjBTVWR0WjE5SVlucDNSUkFC-gEECAAQOg&cs=1&um=1&ie=UTF-8&fb=1&gl=id&sa=X&ftid=0x2e711f0503bd41f7:0xd9c0860d5a0a28cc',
  tagline: 'Pusat Aneka Camilan, Makanan Khas & Kerajinan Asli Kota Ukir Jepara',
  defaultLowStockThreshold: 5,
  orderReservationTimeoutMinutes: 60, // 1 jam batas bayar
};

export const ORDER_STATUS = {
  PENDING_PAYMENT: 'PENDING_PAYMENT',
  WAITING_VERIFICATION: 'WAITING_VERIFICATION',
  PAID: 'PAID',
  PROCESSING: 'PROCESSING',
  READY_FOR_PICKUP: 'READY_FOR_PICKUP',
  SHIPPED: 'SHIPPED',
  COMPLETED: 'COMPLETED',
  CANCELLED: 'CANCELLED',
} as const;

export const PAYMENT_STATUS = {
  UNPAID: 'UNPAID',
  PENDING_VERIFICATION: 'PENDING_VERIFICATION',
  SUCCESS: 'SUCCESS',
  REJECTED: 'REJECTED',
  EXPIRED: 'EXPIRED',
} as const;
