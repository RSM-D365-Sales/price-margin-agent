// ── Deterministic Vince mock dataset · Sales Margin Agent ───────────────
import type {
  PriceOverride,
  PricingSetupLine,
  PriceHistoryRecord,
  Recommendation,
  KpiMonitor,
} from '../models/types'

// ═══════════════════════════════════════════════════════════════════════
// 1 · Price overrides (audit trail)
// ═══════════════════════════════════════════════════════════════════════

export const PRICE_OVERRIDES: PriceOverride[] = [
  {
    id: 'OVR-001', orderNumber: 'SO-104482', orderDate: '2026-07-02',
    channel: 'Retail Store', storeOrSite: 'Vince · SoHo NYC',
    styleName: 'Cashmere Mock Neck Sweater', itemNumber: 'V7231', category: 'Knitwear',
    colorSize: 'Heather Grey / M', unitCost: 118.5, originalPrice: 345, overridePrice: 189,
    reasonCode: 'Manager Discretion', overriddenBy: 'Dana Whitfield', overriddenByEmail: 'dana.whitfield@vince.com',
  },
  {
    id: 'OVR-002', orderNumber: 'SO-104507', orderDate: '2026-07-01',
    channel: 'Ecommerce', storeOrSite: 'vince.com',
    styleName: 'Silk Slip Dress', itemNumber: 'V8104', category: 'Dresses',
    colorSize: 'Champagne / 6', unitCost: 96.0, originalPrice: 425, overridePrice: 297.5,
    reasonCode: 'Price Match', overriddenBy: 'Marcus Lee', overriddenByEmail: 'marcus.lee@vince.com',
  },
  {
    id: 'OVR-003', orderNumber: 'SO-104391', orderDate: '2026-06-28',
    channel: 'Retail Store', storeOrSite: 'Vince · Melrose LA',
    styleName: 'Boiled Cashmere Funnel Neck', itemNumber: 'V7288', category: 'Knitwear',
    colorSize: 'Camel / S', unitCost: 142.0, originalPrice: 395, overridePrice: 225,
    reasonCode: 'Floor Sample', overriddenBy: 'Priya Raman', overriddenByEmail: 'priya.raman@vince.com',
  },
  {
    id: 'OVR-004', orderNumber: 'SO-104233', orderDate: '2026-06-24',
    channel: 'Retail Store', storeOrSite: 'Vince · Madison Ave',
    styleName: 'Wool-Cashmere Belted Coat', itemNumber: 'V9087', category: 'Outerwear',
    colorSize: 'Black / M', unitCost: 246.0, originalPrice: 695, overridePrice: 417,
    reasonCode: 'Customer Loyalty', overriddenBy: 'Dana Whitfield', overriddenByEmail: 'dana.whitfield@vince.com',
  },
  {
    id: 'OVR-005', orderNumber: 'SO-104188', orderDate: '2026-06-21',
    channel: 'Ecommerce', storeOrSite: 'vince.com',
    styleName: 'Brushed Alpaca Cardigan', itemNumber: 'V7412', category: 'Knitwear',
    colorSize: 'Oat / L', unitCost: 128.0, originalPrice: 365, overridePrice: 146,
    reasonCode: 'Damaged Goods', overriddenBy: 'Jordan Silva', overriddenByEmail: 'jordan.silva@vince.com',
  },
  {
    id: 'OVR-006', orderNumber: 'SO-104102', orderDate: '2026-06-18',
    channel: 'Retail Store', storeOrSite: 'Vince · SoHo NYC',
    styleName: 'Linen Easy Pull-On Pant', itemNumber: 'V6120', category: 'Bottoms',
    colorSize: 'White / 8', unitCost: 61.5, originalPrice: 225, overridePrice: 157.5,
    reasonCode: 'Event Promotion', overriddenBy: 'Marcus Lee', overriddenByEmail: 'marcus.lee@vince.com',
  },
  {
    id: 'OVR-007', orderNumber: 'SO-103976', orderDate: '2026-06-14',
    channel: 'Retail Store', storeOrSite: 'Vince · Michigan Ave',
    styleName: 'Leather Ankle Boot', itemNumber: 'V5540', category: 'Footwear',
    colorSize: 'Cognac / 8.5', unitCost: 158.0, originalPrice: 450, overridePrice: 270,
    reasonCode: 'Price Match', overriddenBy: 'Ana Kowalski', overriddenByEmail: 'ana.kowalski@vince.com',
  },
  {
    id: 'OVR-008', orderNumber: 'SO-103881', orderDate: '2026-06-10',
    channel: 'Ecommerce', storeOrSite: 'vince.com',
    styleName: 'Ribbed Cashmere Tank', itemNumber: 'V7199', category: 'Knitwear',
    colorSize: 'Ivory / XS', unitCost: 74.0, originalPrice: 245, overridePrice: 122.5,
    reasonCode: 'Manager Discretion', overriddenBy: 'Jordan Silva', overriddenByEmail: 'jordan.silva@vince.com',
  },
  {
    id: 'OVR-009', orderNumber: 'SO-103764', orderDate: '2026-06-05',
    channel: 'Retail Store', storeOrSite: 'Vince · Melrose LA',
    styleName: 'Silk Band-Collar Blouse', itemNumber: 'V6301', category: 'Tops',
    colorSize: 'Sand / S', unitCost: 82.0, originalPrice: 295, overridePrice: 206.5,
    reasonCode: 'Customer Loyalty', overriddenBy: 'Priya Raman', overriddenByEmail: 'priya.raman@vince.com',
  },
  {
    id: 'OVR-010', orderNumber: 'SO-103712', orderDate: '2026-06-02',
    channel: 'Retail Store', storeOrSite: 'Vince · Madison Ave',
    styleName: 'Double-Face Wool Coat', itemNumber: 'V9134', category: 'Outerwear',
    colorSize: 'Camel / S', unitCost: 312.0, originalPrice: 895, overridePrice: 495,
    reasonCode: 'Floor Sample', overriddenBy: 'Dana Whitfield', overriddenByEmail: 'dana.whitfield@vince.com',
  },
  {
    id: 'OVR-011', orderNumber: 'SO-103654', orderDate: '2026-05-29',
    channel: 'Ecommerce', storeOrSite: 'vince.com',
    styleName: 'Garment-Dyed Cotton Tee', itemNumber: 'V6055', category: 'Tops',
    colorSize: 'Washed Black / M', unitCost: 28.5, originalPrice: 95, overridePrice: 52,
    reasonCode: 'Price Match', overriddenBy: 'Marcus Lee', overriddenByEmail: 'marcus.lee@vince.com',
  },
  {
    id: 'OVR-012', orderNumber: 'SO-103598', orderDate: '2026-05-26',
    channel: 'Retail Store', storeOrSite: 'Vince · SoHo NYC',
    styleName: 'Suede Slip-On Loafer', itemNumber: 'V5488', category: 'Footwear',
    colorSize: 'Taupe / 9', unitCost: 132.0, originalPrice: 395, overridePrice: 245,
    reasonCode: 'Manager Discretion', overriddenBy: 'Ana Kowalski', overriddenByEmail: 'ana.kowalski@vince.com',
  },
  {
    id: 'OVR-013', orderNumber: 'SO-103501', orderDate: '2026-05-21',
    channel: 'Retail Store', storeOrSite: 'Vince · Michigan Ave',
    styleName: 'Crepe Midi Skirt', itemNumber: 'V6188', category: 'Bottoms',
    colorSize: 'Black / 4', unitCost: 71.0, originalPrice: 265, overridePrice: 132.5,
    reasonCode: 'Damaged Goods', overriddenBy: 'Ana Kowalski', overriddenByEmail: 'ana.kowalski@vince.com',
  },
  {
    id: 'OVR-014', orderNumber: 'SO-103455', orderDate: '2026-05-18',
    channel: 'Ecommerce', storeOrSite: 'vince.com',
    styleName: 'Cashmere Mock Neck Sweater', itemNumber: 'V7231', category: 'Knitwear',
    colorSize: 'Black / L', unitCost: 118.5, originalPrice: 345, overridePrice: 258.75,
    reasonCode: 'Customer Loyalty', overriddenBy: 'Jordan Silva', overriddenByEmail: 'jordan.silva@vince.com',
  },
  {
    id: 'OVR-015', orderNumber: 'SO-103390', orderDate: '2026-05-14',
    channel: 'Retail Store', storeOrSite: 'Vince · Melrose LA',
    styleName: 'Slub Cotton Wrap Dress', itemNumber: 'V8066', category: 'Dresses',
    colorSize: 'Olive / 10', unitCost: 84.0, originalPrice: 325, overridePrice: 178.75,
    reasonCode: 'Event Promotion', overriddenBy: 'Priya Raman', overriddenByEmail: 'priya.raman@vince.com',
  },
  {
    id: 'OVR-016', orderNumber: 'SO-103311', orderDate: '2026-05-09',
    channel: 'Retail Store', storeOrSite: 'Vince · Madison Ave',
    styleName: 'Leather Moto Jacket', itemNumber: 'V9201', category: 'Outerwear',
    colorSize: 'Black / M', unitCost: 388.0, originalPrice: 1095, overridePrice: 657,
    reasonCode: 'Price Match', overriddenBy: 'Dana Whitfield', overriddenByEmail: 'dana.whitfield@vince.com',
  },
  {
    id: 'OVR-017', orderNumber: 'SO-103288', orderDate: '2026-05-06',
    channel: 'Ecommerce', storeOrSite: 'vince.com',
    styleName: 'Wide-Leg Wool Trouser', itemNumber: 'V6144', category: 'Bottoms',
    colorSize: 'Charcoal / 6', unitCost: 92.0, originalPrice: 295, overridePrice: 154,
    reasonCode: 'Manager Discretion', overriddenBy: 'Marcus Lee', overriddenByEmail: 'marcus.lee@vince.com',
  },
  {
    id: 'OVR-018', orderNumber: 'SO-103205', orderDate: '2026-05-02',
    channel: 'Retail Store', storeOrSite: 'Vince · SoHo NYC',
    styleName: 'Ribbed Cashmere Tank', itemNumber: 'V7199', category: 'Knitwear',
    colorSize: 'Rose / S', unitCost: 74.0, originalPrice: 245, overridePrice: 171.5,
    reasonCode: 'Customer Loyalty', overriddenBy: 'Jordan Silva', overriddenByEmail: 'jordan.silva@vince.com',
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 2 · Pricing setup (margin threshold test)
// ═══════════════════════════════════════════════════════════════════════

export const PRICING_SETUP: PricingSetupLine[] = [
  // ── D2C · Ecommerce ──
  {
    id: 'PRC-D2C-01', mode: 'D2C', channel: 'Ecommerce', channelDetail: 'vince.com',
    styleName: 'Cashmere Mock Neck Sweater', itemNumber: 'V7231', category: 'Knitwear',
    colorSize: 'Heather Grey / M', quantity: 1, basePrice: 345, marginComponent: 0,
    discountPct: 25,
    discount: {
      name: 'Summer Knit Event', type: 'Threshold',
      validFrom: '2026-06-15', validTo: '2026-07-31',
      tiers: [
        { label: '$0 – $299 order total', discountPct: 15 },
        { label: '$300 – $599 order total', discountPct: 25 },
        { label: '$600+ order total', discountPct: 30 },
      ],
    },
    autoCharge: 0, unitCost: 118.5, validFrom: '2026-06-15', validTo: '2026-07-31',
  },
  {
    id: 'PRC-D2C-02', mode: 'D2C', channel: 'Ecommerce', channelDetail: 'vince.com',
    styleName: 'Silk Slip Dress', itemNumber: 'V8104', category: 'Dresses',
    colorSize: 'Champagne / 6', quantity: 1, basePrice: 425, marginComponent: 0,
    discountPct: 0, autoCharge: 0, unitCost: 96.0,
    validFrom: '2026-02-01', validTo: '2026-12-31',
  },
  {
    id: 'PRC-D2C-03', mode: 'D2C', channel: 'Ecommerce', channelDetail: 'vince.com',
    styleName: 'Brushed Alpaca Cardigan', itemNumber: 'V7412', category: 'Knitwear',
    colorSize: 'Oat / L', quantity: 1, basePrice: 365, marginComponent: 0,
    discountPct: 40,
    discount: {
      name: 'End-of-Season Markdown · Wave 3', type: 'Line',
      validFrom: '2026-06-01', validTo: '2026-08-15',
    },
    autoCharge: 0, unitCost: 128.0, validFrom: '2026-06-01', validTo: '2026-08-15',
  },
  {
    id: 'PRC-D2C-04', mode: 'D2C', channel: 'Retail Store', channelDetail: 'All Vince full-price stores',
    styleName: 'Linen Easy Pull-On Pant', itemNumber: 'V6120', category: 'Bottoms',
    colorSize: 'White / 8', quantity: 1, basePrice: 225, marginComponent: 0,
    discountPct: 30,
    discount: {
      name: 'Summer Linen Promo', type: 'Quantity',
      validFrom: '2026-06-20', validTo: '2026-07-20',
      tiers: [
        { label: '1 unit', discountPct: 20 },
        { label: '2 units', discountPct: 30 },
        { label: '3+ units', discountPct: 35 },
      ],
    },
    autoCharge: 0, unitCost: 61.5, validFrom: '2026-06-20', validTo: '2026-07-20',
  },
  {
    id: 'PRC-D2C-05', mode: 'D2C', channel: 'Retail Store', channelDetail: 'All Vince full-price stores',
    styleName: 'Garment-Dyed Cotton Tee', itemNumber: 'V6055', category: 'Tops',
    colorSize: 'Washed Black / M', quantity: 1, basePrice: 95, marginComponent: 0,
    discountPct: 50,
    discount: {
      name: 'Core Tee Clearance', type: 'Line',
      validFrom: '2026-06-25', validTo: '2026-07-25',
    },
    autoCharge: 0, unitCost: 28.5, validFrom: '2026-06-25', validTo: '2026-07-25',
  },
  {
    id: 'PRC-D2C-06', mode: 'D2C', channel: 'Ecommerce', channelDetail: 'vince.com',
    styleName: 'Wool-Cashmere Belted Coat', itemNumber: 'V9087', category: 'Outerwear',
    colorSize: 'Black / M', quantity: 1, basePrice: 695, marginComponent: 0,
    discountPct: 45,
    discount: {
      name: 'Outerwear Aging Inventory Markdown', type: 'Line',
      validFrom: '2026-05-10', validTo: '2026-08-31',
    },
    autoCharge: 0, unitCost: 246.0, validFrom: '2026-05-10', validTo: '2026-08-31',
  },
  {
    id: 'PRC-D2C-07', mode: 'D2C', channel: 'Retail Store', channelDetail: 'Vince outlet stores',
    styleName: 'Crepe Midi Skirt', itemNumber: 'V6188', category: 'Bottoms',
    colorSize: 'Black / 4', quantity: 1, basePrice: 265, marginComponent: -40,
    discountPct: 35,
    discount: {
      name: 'Outlet Everyday Price', type: 'Line',
      validFrom: '2026-01-01', validTo: '2026-12-31',
    },
    autoCharge: 0, unitCost: 71.0, validFrom: '2026-01-01', validTo: '2026-12-31',
  },
  {
    id: 'PRC-D2C-08', mode: 'D2C', channel: 'Ecommerce', channelDetail: 'vince.com',
    styleName: 'Leather Ankle Boot', itemNumber: 'V5540', category: 'Footwear',
    colorSize: 'Cognac / 8.5', quantity: 1, basePrice: 450, marginComponent: 0,
    discountPct: 0, autoCharge: 12.5, unitCost: 158.0,
    validFrom: '2026-02-01', validTo: '2026-12-31',
  },
  {
    id: 'PRC-D2C-09', mode: 'D2C', channel: 'Retail Store', channelDetail: 'All Vince full-price stores',
    styleName: 'Silk Band-Collar Blouse', itemNumber: 'V6301', category: 'Tops',
    colorSize: 'Sand / S', quantity: 1, basePrice: 295, marginComponent: 0,
    discountPct: 20,
    discount: {
      name: 'Silk Capsule Promo', type: 'Line',
      validFrom: '2026-06-28', validTo: '2026-07-14',
    },
    autoCharge: 0, unitCost: 82.0, validFrom: '2026-06-28', validTo: '2026-07-14',
  },
  {
    id: 'PRC-D2C-10', mode: 'D2C', channel: 'Ecommerce', channelDetail: 'vince.com',
    styleName: 'Ribbed Cashmere Tank', itemNumber: 'V7199', category: 'Knitwear',
    colorSize: 'Ivory / XS', quantity: 1, basePrice: 245, marginComponent: 0,
    discountPct: 0, autoCharge: 0, unitCost: 74.0,
    validFrom: '2026-02-01', validTo: '2026-12-31',
  },

  // ── B2B · Wholesale ──
  {
    id: 'PRC-B2B-01', mode: 'B2B', channel: 'Wholesale', channelDetail: 'Nordstrom',
    customerAccount: 'C-100210', customerGroup: 'Premium Dept',
    styleName: 'Cashmere Mock Neck Sweater', itemNumber: 'V7231', category: 'Knitwear',
    colorSize: 'Heather Grey / M', quantity: 24, basePrice: 172.5, marginComponent: 0,
    discountPct: 8,
    discount: {
      name: 'Nordstrom FW26 Volume Program', type: 'Quantity',
      validFrom: '2026-01-01', validTo: '2026-12-31',
      tiers: [
        { label: '1 – 23 units', discountPct: 0 },
        { label: '24 – 99 units', discountPct: 8 },
        { label: '100+ units', discountPct: 12 },
      ],
    },
    autoCharge: 0, unitCost: 118.5, validFrom: '2026-01-01', validTo: '2026-12-31',
  },
  {
    id: 'PRC-B2B-02', mode: 'B2B', channel: 'Wholesale', channelDetail: 'Saks Fifth Avenue',
    customerAccount: 'C-100305', customerGroup: 'Premium Dept',
    styleName: 'Silk Slip Dress', itemNumber: 'V8104', category: 'Dresses',
    colorSize: 'Champagne / 6', quantity: 12, basePrice: 212.5, marginComponent: 0,
    discountPct: 0, autoCharge: 0, unitCost: 96.0,
    validFrom: '2026-01-01', validTo: '2026-12-31',
  },
  {
    id: 'PRC-B2B-03', mode: 'B2B', channel: 'Wholesale', channelDetail: 'Macy\u2019s',
    customerAccount: 'C-100118', customerGroup: 'Dept Store',
    styleName: 'Brushed Alpaca Cardigan', itemNumber: 'V7412', category: 'Knitwear',
    colorSize: 'Oat / L', quantity: 48, basePrice: 182.5, marginComponent: -18,
    discountPct: 15,
    discount: {
      name: 'Macy\u2019s Spring Close-Out', type: 'Threshold',
      validFrom: '2026-05-01', validTo: '2026-08-31',
      tiers: [
        { label: '$0 – $9,999 PO value', discountPct: 10 },
        { label: '$10,000 – $24,999 PO value', discountPct: 15 },
        { label: '$25,000+ PO value', discountPct: 20 },
      ],
    },
    autoCharge: 0, unitCost: 128.0, validFrom: '2026-05-01', validTo: '2026-08-31',
  },
  {
    id: 'PRC-B2B-04', mode: 'B2B', channel: 'Wholesale', channelDetail: 'Bloomingdale\u2019s',
    customerAccount: 'C-100422', customerGroup: 'Premium Dept',
    styleName: 'Wool-Cashmere Belted Coat', itemNumber: 'V9087', category: 'Outerwear',
    colorSize: 'Black / M', quantity: 18, basePrice: 347.5, marginComponent: 0,
    discountPct: 20,
    discount: {
      name: 'Bloomingdale\u2019s Aged Outerwear Deal', type: 'Line',
      validFrom: '2026-06-01', validTo: '2026-09-30',
    },
    autoCharge: 0, unitCost: 246.0, validFrom: '2026-06-01', validTo: '2026-09-30',
  },
  {
    id: 'PRC-B2B-05', mode: 'B2B', channel: 'Wholesale', channelDetail: 'Premium Dept price group',
    customerGroup: 'Premium Dept',
    styleName: 'Leather Ankle Boot', itemNumber: 'V5540', category: 'Footwear',
    colorSize: 'Cognac / 8.5', quantity: 36, basePrice: 225, marginComponent: 0,
    discountPct: 5,
    discount: {
      name: 'Footwear Program Discount', type: 'Quantity',
      validFrom: '2026-01-01', validTo: '2026-12-31',
      tiers: [
        { label: '1 – 35 units', discountPct: 0 },
        { label: '36 – 99 units', discountPct: 5 },
        { label: '100+ units', discountPct: 9 },
      ],
    },
    autoCharge: 4.5, unitCost: 158.0, validFrom: '2026-01-01', validTo: '2026-12-31',
  },
  {
    id: 'PRC-B2B-06', mode: 'B2B', channel: 'Wholesale', channelDetail: 'Dept Store price group',
    customerGroup: 'Dept Store',
    styleName: 'Garment-Dyed Cotton Tee', itemNumber: 'V6055', category: 'Tops',
    colorSize: 'Washed Black / M', quantity: 120, basePrice: 47.5, marginComponent: -6,
    discountPct: 12,
    discount: {
      name: 'Core Basics Volume Tier', type: 'Quantity',
      validFrom: '2026-01-01', validTo: '2026-12-31',
      tiers: [
        { label: '1 – 59 units', discountPct: 0 },
        { label: '60 – 119 units', discountPct: 8 },
        { label: '120+ units', discountPct: 12 },
      ],
    },
    autoCharge: 0, unitCost: 28.5, validFrom: '2026-01-01', validTo: '2026-12-31',
  },
  {
    id: 'PRC-B2B-07', mode: 'B2B', channel: 'Wholesale', channelDetail: 'Neiman Marcus',
    customerAccount: 'C-100501', customerGroup: 'Luxury Specialty',
    styleName: 'Double-Face Wool Coat', itemNumber: 'V9134', category: 'Outerwear',
    colorSize: 'Camel / S', quantity: 10, basePrice: 447.5, marginComponent: 22,
    discountPct: 0, autoCharge: 0, unitCost: 312.0,
    validFrom: '2026-01-01', validTo: '2026-12-31',
  },
  {
    id: 'PRC-B2B-08', mode: 'B2B', channel: 'Wholesale', channelDetail: 'Off-price partner · Rue Gilt',
    customerAccount: 'C-100688', customerGroup: 'Off-Price',
    styleName: 'Crepe Midi Skirt', itemNumber: 'V6188', category: 'Bottoms',
    colorSize: 'Black / 4', quantity: 200, basePrice: 106, marginComponent: -22,
    discountPct: 18,
    discount: {
      name: 'Off-Price Season Flush', type: 'Threshold',
      validFrom: '2026-06-01', validTo: '2026-07-31',
      tiers: [
        { label: '$0 – $14,999 PO value', discountPct: 12 },
        { label: '$15,000+ PO value', discountPct: 18 },
      ],
    },
    autoCharge: 0, unitCost: 71.0, validFrom: '2026-06-01', validTo: '2026-07-31',
  },
  {
    id: 'PRC-B2B-09', mode: 'B2B', channel: 'Wholesale', channelDetail: 'Nordstrom',
    customerAccount: 'C-100210', customerGroup: 'Premium Dept',
    styleName: 'Silk Band-Collar Blouse', itemNumber: 'V6301', category: 'Tops',
    colorSize: 'Sand / S', quantity: 30, basePrice: 147.5, marginComponent: 0,
    discountPct: 0, autoCharge: 0, unitCost: 82.0,
    validFrom: '2026-01-01', validTo: '2026-12-31',
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 3 · Price history audit
// ═══════════════════════════════════════════════════════════════════════

export const PRICE_HISTORY: PriceHistoryRecord[] = [
  {
    productKey: 'V7231|Heather Grey / M', styleName: 'Cashmere Mock Neck Sweater',
    itemNumber: 'V7231', category: 'Knitwear', colorSize: 'Heather Grey / M',
    customerAccount: 'D2C', customerName: 'Direct (vince.com / retail)',
    entries: [
      { id: 'PH-1-5', price: 345, activeFrom: '2026-02-01', activeTo: null, changedBy: 'K. Alvarez', changeType: 'Manual update', note: 'Spring 26 list price refresh' },
      { id: 'PH-1-4', price: 325, activeFrom: '2025-08-15', activeTo: '2026-01-31', changedBy: 'K. Alvarez', changeType: 'Trade agreement', note: 'FW25 seasonal price' },
      { id: 'PH-1-3', price: 276.25, activeFrom: '2025-06-01', activeTo: '2025-08-14', changedBy: 'Pricing Agent', changeType: 'Markdown', note: 'SS25 wave 1 markdown · 15%' },
      { id: 'PH-1-2', price: 325, activeFrom: '2025-02-01', activeTo: '2025-05-31', changedBy: 'K. Alvarez', changeType: 'Trade agreement', note: 'SS25 list' },
      { id: 'PH-1-1', price: 315, activeFrom: '2024-08-01', activeTo: '2025-01-31', changedBy: 'System', changeType: 'Initial', note: 'Style introduction' },
    ],
  },
  {
    productKey: 'V7231|Heather Grey / M|C-100210', styleName: 'Cashmere Mock Neck Sweater',
    itemNumber: 'V7231', category: 'Knitwear', colorSize: 'Heather Grey / M',
    customerAccount: 'C-100210', customerName: 'Nordstrom',
    entries: [
      { id: 'PH-2-4', price: 172.5, activeFrom: '2026-01-01', activeTo: null, changedBy: 'R. Chen', changeType: 'Contract renewal', note: 'CY26 wholesale agreement' },
      { id: 'PH-2-3', price: 168, activeFrom: '2025-07-01', activeTo: '2025-12-31', changedBy: 'R. Chen', changeType: 'Trade agreement', note: 'Mid-year adjustment' },
      { id: 'PH-2-2', price: 162.5, activeFrom: '2025-01-01', activeTo: '2025-06-30', changedBy: 'R. Chen', changeType: 'Contract renewal', note: 'CY25 wholesale agreement' },
      { id: 'PH-2-1', price: 157.5, activeFrom: '2024-08-01', activeTo: '2024-12-31', changedBy: 'System', changeType: 'Initial', note: 'Style introduction · wholesale' },
    ],
  },
  {
    productKey: 'V9087|Black / M', styleName: 'Wool-Cashmere Belted Coat',
    itemNumber: 'V9087', category: 'Outerwear', colorSize: 'Black / M',
    customerAccount: 'D2C', customerName: 'Direct (vince.com / retail)',
    entries: [
      { id: 'PH-3-4', price: 382.25, activeFrom: '2026-05-10', activeTo: null, changedBy: 'Pricing Agent', changeType: 'Markdown', note: 'Aging inventory · 45% markdown (19 wks supply)' },
      { id: 'PH-3-3', price: 556, activeFrom: '2026-02-15', activeTo: '2026-05-09', changedBy: 'Pricing Agent', changeType: 'Markdown', note: 'Wave 1 · 20%' },
      { id: 'PH-3-2', price: 695, activeFrom: '2025-08-15', activeTo: '2026-02-14', changedBy: 'K. Alvarez', changeType: 'Trade agreement', note: 'FW25 list price' },
      { id: 'PH-3-1', price: 675, activeFrom: '2025-02-01', activeTo: '2025-08-14', changedBy: 'System', changeType: 'Initial', note: 'Style introduction' },
    ],
  },
  {
    productKey: 'V8104|Champagne / 6|C-100305', styleName: 'Silk Slip Dress',
    itemNumber: 'V8104', category: 'Dresses', colorSize: 'Champagne / 6',
    customerAccount: 'C-100305', customerName: 'Saks Fifth Avenue',
    entries: [
      { id: 'PH-4-3', price: 212.5, activeFrom: '2026-01-01', activeTo: null, changedBy: 'R. Chen', changeType: 'Contract renewal', note: 'CY26 wholesale agreement' },
      { id: 'PH-4-2', price: 205, activeFrom: '2025-03-01', activeTo: '2025-12-31', changedBy: 'R. Chen', changeType: 'Trade agreement', note: 'Style intro · wholesale' },
      { id: 'PH-4-1', price: 197.5, activeFrom: '2025-01-15', activeTo: '2025-02-28', changedBy: 'System', changeType: 'Initial', note: 'Pre-book price' },
    ],
  },
  {
    productKey: 'V7412|Oat / L', styleName: 'Brushed Alpaca Cardigan',
    itemNumber: 'V7412', category: 'Knitwear', colorSize: 'Oat / L',
    customerAccount: 'D2C', customerName: 'Direct (vince.com / retail)',
    entries: [
      { id: 'PH-5-4', price: 219, activeFrom: '2026-06-01', activeTo: null, changedBy: 'Pricing Agent', changeType: 'Markdown', note: 'Wave 3 · 40%' },
      { id: 'PH-5-3', price: 273.75, activeFrom: '2026-04-15', activeTo: '2026-05-31', changedBy: 'Pricing Agent', changeType: 'Markdown', note: 'Wave 2 · 25%' },
      { id: 'PH-5-2', price: 310.25, activeFrom: '2026-03-01', activeTo: '2026-04-14', changedBy: 'Pricing Agent', changeType: 'Markdown', note: 'Wave 1 · 15%' },
      { id: 'PH-5-1', price: 365, activeFrom: '2025-08-15', activeTo: '2026-02-28', changedBy: 'System', changeType: 'Initial', note: 'FW25 introduction' },
    ],
  },
]

// ═══════════════════════════════════════════════════════════════════════
// 4 · AI recommendations
// ═══════════════════════════════════════════════════════════════════════

export const RECOMMENDATIONS: Recommendation[] = [
  // ── D2C ──
  {
    id: 'REC-D2C-1', audience: 'D2C', kind: 'Increase price',
    title: 'Raise Cashmere Mock Neck to $365',
    detail:
      'Increase the price of the Cashmere Mock Neck (V7231) from $345 to $365. Demand remains strong, inventory is limited, and similar products continue selling at full price.',
    impact: '+$185K estimated margin improvement', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-D2C-2', audience: 'D2C', kind: 'Delay markdown',
    title: 'Delay Silk Slip Dress markdown by 2 weeks',
    detail:
      'Instead of marking down immediately: delay the markdown by 2 weeks. Current sell-through is 68%, above the 62% target for this point in the season.',
    impact: 'Protects ~$48K of full-price revenue', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-D2C-3', audience: 'D2C', kind: 'Markdown timing',
    title: 'Cadenced markdown plan · Brushed Alpaca Cardigan',
    detail: 'Recommended markdown timing for remaining FW inventory:',
    bullets: ['Week 1 · 15%', 'Week 3 · 25%', 'Week 5 · 40%'],
    impact: 'Est. +6 pts sell-through vs. flat 40%', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-D2C-4', audience: 'D2C', kind: 'Optimize promotion',
    title: 'Narrow the July promotion to outerwear',
    detail: 'Replace the sitewide offer with a targeted promotion:',
    bullets: ['Offer 20% off outerwear only', 'Exclude cashmere', 'Exclude new arrivals'],
    impact: 'Est. +3.2 pts promo ROI', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-D2C-5', audience: 'D2C', kind: 'Inventory-driven',
    title: 'Style V9087 has 19 weeks of supply',
    detail: 'The Wool-Cashmere Belted Coat is aging. Options, in order of margin impact:',
    bullets: ['Reduce price by 15%', 'Move inventory to outlet', 'Bundle with accessories'],
    impact: 'Frees ~$96K of working capital', confidence: 'High', status: 'Open',
  },

  // ── Wholesale ──
  {
    id: 'REC-B2B-1', audience: 'Wholesale', kind: 'Customer-specific pricing',
    title: 'Nordstrom · raise wholesale price 2% at renewal',
    detail:
      'Nordstrom consistently purchases high-margin collections with low returns. Increase the wholesale price by 2% at contract renewal.',
    impact: '+$420K expected annual margin gain', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-B2B-2', audience: 'Wholesale', kind: 'Margin protection',
    title: 'Reject 20% discount request · offer freight instead',
    detail:
      'Before approving the pending discount: requested discount is 20%, resulting margin would be 18% — below the company minimum of 30%.',
    bullets: ['Recommendation: Reject the discount', 'Counter-offer: free freight instead'],
    impact: 'Protects 12 pts of margin', confidence: 'High', status: 'Open',
  },
  {
    id: 'REC-B2B-3', audience: 'Wholesale', kind: 'Product mix',
    title: 'Shift the reorder mix away from denim',
    detail: 'Instead of ordering 100 denim:',
    bullets: ['Recommend 60 knitwear + 40 dresses'],
    impact: '+4.5 pts expected margin improvement', confidence: 'Medium', status: 'Open',
  },
  {
    id: 'REC-B2B-4', audience: 'Wholesale', kind: 'Contract terms',
    title: 'Contract levers to protect list price',
    detail: 'For upcoming renewals, prefer structural incentives over price cuts:',
    bullets: [
      'Volume rebate instead of upfront discount',
      'Seasonal incentives',
      'Early payment discount',
      'Freight incentives',
      'Marketing funds instead of price reductions',
    ],
    confidence: 'Medium', status: 'Open',
  },
]

export const D2C_KPIS: KpiMonitor[] = [
  { label: 'Gross Margin %', value: '68.4%', trend: 'up' },
  { label: 'Full-price sell-through', value: '61%', trend: 'up' },
  { label: 'Markdown %', value: '22%', trend: 'down' },
  { label: 'Promotion ROI', value: '3.1x', trend: 'flat' },
  { label: 'Inventory aging', value: '9.4 wks', trend: 'down' },
  { label: 'GMROI', value: '2.8', trend: 'up' },
  { label: 'Sell-through', value: '57%', trend: 'up' },
  { label: 'Return rate', value: '11.2%', trend: 'flat' },
  { label: 'Margin at risk', value: '$412K', trend: 'down' },
]

export const WHOLESALE_KPIS: KpiMonitor[] = [
  { label: 'Margin by customer', value: '34.7% avg', trend: 'up' },
  { label: 'Margin by sales rep', value: '33.1% avg', trend: 'flat' },
  { label: 'Margin by region', value: 'NE 36.2% top', trend: 'up' },
  { label: 'Average discount', value: '9.8%', trend: 'down' },
  { label: 'Chargebacks', value: '$86K', trend: 'down' },
  { label: 'Freight deductions', value: '$34K', trend: 'flat' },
  { label: 'Returns', value: '6.1%', trend: 'flat' },
  { label: 'Contribution margin', value: '28.9%', trend: 'up' },
  { label: 'Profit per account', value: '$318K avg', trend: 'up' },
  { label: 'Average order value', value: '$24,600', trend: 'up' },
]

// category list for filters
export const CATEGORIES = [
  'Knitwear',
  'Outerwear',
  'Dresses',
  'Tops',
  'Bottoms',
  'Footwear',
  'Accessories',
] as const
