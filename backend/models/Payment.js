const mongoose = require('mongoose');

/**
 * Payment Model
 * Đại diện cho thông tin thanh toán của đơn hàng trong hệ thống
 */
const paymentSchema = mongoose.Schema(
  {
    order: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Order',
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    paymentMethod: {
      type: String,
      required: true,
      enum: ['credit_card', 'debit_card', 'paypal', 'bank_transfer', 'cod', 'e_wallet'],
    },
    amount: {
      type: Number,
      required: true,
    },
    currency: {
      type: String,
      required: true,
      default: 'VND',
    },
    status: {
      type: String,
      required: true,
      enum: ['pending', 'completed', 'failed', 'refunded', 'cancelled'],
      default: 'pending',
    },
    transactionId: {
      type: String,
      required: false,
    },
    paymentDetails: {
      cardLastFour: { type: String },
      cardBrand: { type: String },
      bankName: { type: String },
      accountNumber: { type: String },
      paypalEmail: { type: String },
      walletType: { type: String },
    },
    billingAddress: {
      fullName: { type: String },
      addressLine1: { type: String },
      addressLine2: { type: String },
      city: { type: String },
      state: { type: String },
      postalCode: { type: String },
      country: { type: String },
      phoneNumber: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

// Phương thức kiểm tra xem thanh toán đã hoàn thành chưa
paymentSchema.methods.isCompleted = function() {
  return this.status === 'completed';
};

// Phương thức kiểm tra xem thanh toán có thể hoàn tiền không
paymentSchema.methods.canRefund = function() {
  return this.status === 'completed' && 
         ['credit_card', 'debit_card', 'paypal', 'e_wallet'].includes(this.paymentMethod);
};

// Phương thức định dạng số tiền thanh toán
paymentSchema.methods.formattedAmount = function() {
  return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: this.currency }).format(this.amount);
};

const Payment = mongoose.model('Payment', paymentSchema);

module.exports = Payment;