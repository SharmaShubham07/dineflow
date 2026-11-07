export type Language = 'en' | 'hi';

export interface Translations {
  welcome: string;
  table: string;
  searchPlaceholder: string;
  allCategories: string;
  all: string;
  veg: string;
  nonVeg: string;
  viewCart: string;
  checkout: string;
  orderSent: string;
  orderPlaced: string;
  preparing: string;
  ready: string;
  served: string;
  completed: string;
  requestBill: string;
  billRequested: string;
  addMoreDishes: string;
  totalBill: string;
  payWithUpi: string;
  payAtCounter: string;
  cookingNote: string;
  soldOut: string;
  add: string;
  portionSize: string;
  addons: string;
  couponCode: string;
  apply: string;
  discountApplied: string;
  invalidCoupon: string;
  reviewOrder: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    welcome: 'Welcome to',
    table: 'Table',
    searchPlaceholder: 'Search food, coffee, desserts...',
    allCategories: 'All Categories',
    all: 'All',
    veg: 'Veg',
    nonVeg: 'Non-Veg',
    viewCart: 'View Cart',
    checkout: 'Checkout',
    orderSent: 'Order Sent to Kitchen!',
    orderPlaced: 'Order Placed',
    preparing: 'Chef is Preparing Your Food',
    ready: 'Food is Hot & Ready!',
    served: 'Dishes Served · Bon Appétit',
    completed: 'Order Completed',
    requestBill: 'Request Printed Bill',
    billRequested: 'Bill Requested (Staff Notified)',
    addMoreDishes: 'Add More Dishes',
    totalBill: 'Total Bill',
    payWithUpi: 'Scan with GPay / PhonePe / Paytm',
    payAtCounter: 'Cash, UPI & Card payments accepted at the counter.',
    cookingNote: 'Cooking note / allergies (e.g. less spicy, no ice)',
    soldOut: 'SOLD OUT',
    add: 'ADD +',
    portionSize: 'Select Portion / Size',
    addons: 'Choose Add-ons & Extras',
    couponCode: 'Enter Promo Code',
    apply: 'Apply',
    discountApplied: 'Discount applied successfully!',
    invalidCoupon: 'Invalid or expired coupon code',
    reviewOrder: 'Review Your Order',
  },
  hi: {
    welcome: 'स्वागत है',
    table: 'मेज',
    searchPlaceholder: 'खाना, कॉफ़ी, मिठाइयाँ खोजें...',
    allCategories: 'सभी श्रेणियाँ',
    all: 'सभी',
    veg: 'शाकाहारी',
    nonVeg: 'मांसाहारी',
    viewCart: 'कार्ट देखें',
    checkout: 'ऑर्डर करें',
    orderSent: 'ऑर्डर रसोई में भेज दिया गया!',
    orderPlaced: 'ऑर्डर दर्ज',
    preparing: 'शेफ आपका खाना तैयार कर रहे हैं',
    ready: 'खाना गरमा-गरम तैयार है!',
    served: 'खाना परोस दिया गया है',
    completed: 'ऑर्डर संपन्न',
    requestBill: 'बिल का अनुरोध करें',
    billRequested: 'बिल का अनुरोध प्राप्त (कर्मचारी सूचित)',
    addMoreDishes: 'और व्यंजन जोड़ें',
    totalBill: 'कुल बिल',
    payWithUpi: 'GPay / PhonePe / Paytm से स्कैन करें',
    payAtCounter: 'काउंटर पर नकद, यूपीआई और कार्ड भुगतान स्वीकार्य हैं।',
    cookingNote: 'विशेष निर्देश (उदा. कम तीखा, बिना बर्फ)',
    soldOut: 'समाप्त',
    add: 'जोड़ें +',
    portionSize: 'मात्रा / आकार चुनें',
    addons: 'अतिरिक्त सामग्री चुनें',
    couponCode: 'कूपन कोड दर्ज करें',
    apply: 'लागू करें',
    discountApplied: 'छूट सफलतापूर्वक लागू हो गई!',
    invalidCoupon: 'अमान्य या समाप्त कूपन कोड',
    reviewOrder: 'अपना ऑर्डर जांचें',
  },
};

