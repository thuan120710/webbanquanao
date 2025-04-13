const Coupon = require('../models/Coupon');
const asyncHandler = require('express-async-handler');

/**
 * @desc    Tạo mã giảm giá mới
 * @route   POST /api/coupons
 * @access  Private/Admin
 */
const createCoupon = asyncHandler(async (req, res) => {
  try {
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { 
      code, 
      description, 
      discountType, 
      discountValue, 
      minimumPurchase, 
      maximumDiscount, 
      startDate, 
      endDate, 
      isActive, 
      usageLimit 
    } = req.body;

    // Kiểm tra và log các trường bắt buộc
    console.log('Required fields:', {
      code,
      discountValue,
      endDate
    });

    if (!code) {
      res.status(400);
      throw new Error('Mã giảm giá là bắt buộc');
    }

    if (discountValue === undefined || discountValue === null) {
      res.status(400);
      throw new Error('Giá trị giảm giá là bắt buộc');
    }

    if (!endDate) {
      res.status(400);
      throw new Error('Ngày kết thúc là bắt buộc');
    }

    // Kiểm tra xem mã giảm giá đã tồn tại chưa
    const couponExists = await Coupon.findOne({ code });

    if (couponExists) {
      res.status(400);
      throw new Error('Mã giảm giá đã tồn tại');
    }

    // Tạo dữ liệu coupon
    const couponData = {
      code,
      description: description || "",
      discountType: discountType || "percentage",
      discountValue: parseFloat(discountValue) || 0,
      minimumPurchase: parseFloat(minimumPurchase) || 0,
      maximumDiscount: maximumDiscount ? parseFloat(maximumDiscount) : undefined,
      startDate: startDate || new Date(),
      endDate: endDate ? new Date(endDate) : undefined,
      isActive: isActive !== undefined ? isActive : true,
      usageLimit: usageLimit ? parseInt(usageLimit) : undefined,
    };

    console.log('Creating coupon with data:', JSON.stringify(couponData, null, 2));

    const coupon = await Coupon.create(couponData);

    if (coupon) {
      res.status(201).json(coupon);
    } else {
      res.status(400);
      throw new Error('Dữ liệu mã giảm giá không hợp lệ');
    }
  } catch (error) {
    console.error('Create coupon error:', error);
    res.status(400);
    throw error;
  }
});

/**
 * @desc    Lấy tất cả mã giảm giá
 * @route   GET /api/coupons
 * @access  Private/Admin
 */
const getCoupons = asyncHandler(async (req, res) => {
  const coupons = await Coupon.find({});
  res.json(coupons);
});

/**
 * @desc    Lấy thông tin chi tiết của mã giảm giá
 * @route   GET /api/coupons/:id
 * @access  Private/Admin
 */
const getCouponById = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    res.json(coupon);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy mã giảm giá');
  }
});

/**
 * @desc    Cập nhật mã giảm giá
 * @route   PUT /api/coupons/:id
 * @access  Private/Admin
 */
const updateCoupon = asyncHandler(async (req, res) => {
  const { 
    code, 
    description, 
    discountType, 
    discountValue, 
    minimumPurchase, 
    maximumDiscount, 
    startDate, 
    endDate, 
    isActive, 
    usageLimit 
  } = req.body;

  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    // Kiểm tra xem mã mới đã tồn tại chưa (nếu mã thay đổi)
    if (code && code !== coupon.code) {
      const couponExists = await Coupon.findOne({ code });
      if (couponExists) {
        res.status(400);
        throw new Error('Mã giảm giá đã tồn tại');
      }
    }

    coupon.code = code || coupon.code;
    coupon.description = description !== undefined ? description : coupon.description;
    coupon.discountType = discountType || coupon.discountType;
    coupon.discountValue = discountValue !== undefined ? discountValue : coupon.discountValue;
    coupon.minimumPurchase = minimumPurchase !== undefined ? minimumPurchase : coupon.minimumPurchase;
    coupon.maximumDiscount = maximumDiscount !== undefined ? maximumDiscount : coupon.maximumDiscount;
    coupon.startDate = startDate || coupon.startDate;
    coupon.endDate = endDate || coupon.endDate;
    coupon.isActive = isActive !== undefined ? isActive : coupon.isActive;
    coupon.usageLimit = usageLimit !== undefined ? usageLimit : coupon.usageLimit;

    const updatedCoupon = await coupon.save();
    res.json(updatedCoupon);
  } else {
    res.status(404);
    throw new Error('Không tìm thấy mã giảm giá');
  }
});

/**
 * @desc    Xóa mã giảm giá
 * @route   DELETE /api/coupons/:id
 * @access  Private/Admin
 */
const deleteCoupon = asyncHandler(async (req, res) => {
  const coupon = await Coupon.findById(req.params.id);

  if (coupon) {
    await coupon.deleteOne();
    res.json({ message: 'Mã giảm giá đã được xóa' });
  } else {
    res.status(404);
    throw new Error('Không tìm thấy mã giảm giá');
  }
});

/**
 * @desc    Validate mã giảm giá
 * @route   POST /api/coupons/validate
 * @access  Private
 */
const validateCoupon = asyncHandler(async (req, res) => {
  const { code, cartTotal } = req.body;

  if (!code) {
    res.status(400);
    throw new Error('Vui lòng nhập mã giảm giá');
  }

  const coupon = await Coupon.findOne({ code: code.toUpperCase() });

  if (!coupon) {
    res.status(404);
    throw new Error('Mã giảm giá không tồn tại');
  }

  // Kiểm tra mã giảm giá còn hiệu lực không
  if (!coupon.isValid()) {
    res.status(400);
    throw new Error('Mã giảm giá đã hết hạn hoặc không còn hiệu lực');
  }

  // Kiểm tra giá trị đơn hàng tối thiểu
  if (cartTotal < coupon.minimumPurchase) {
    res.status(400);
    throw new Error(`Giá trị đơn hàng tối thiểu phải từ ${coupon.minimumPurchase.toLocaleString('vi-VN')}đ`);
  }

  // Kiểm tra giới hạn sử dụng
  if (coupon.usageLimit && coupon.usageCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Mã giảm giá đã hết lượt sử dụng');
  }

  // Kiểm tra người dùng có được phép sử dụng không
  if (coupon.userRestriction && coupon.allowedUsers.length > 0) {
    if (!coupon.allowedUsers.includes(req.user._id)) {
      res.status(403);
      throw new Error('Bạn không được phép sử dụng mã giảm giá này');
    }
  }

  res.json({
    code: coupon.code,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    maximumDiscount: coupon.maximumDiscount
  });
});

/**
 * @desc    Áp dụng mã giảm giá vào đơn hàng
 * @route   POST /api/coupons/apply
 * @access  Private
 */
const applyCoupon = asyncHandler(async (req, res) => {
  const { code, orderId } = req.body;
  const userId = req.user._id;

  const coupon = await Coupon.findOne({ code, isActive: true });
  if (!coupon) {
    res.status(404);
    throw new Error('Mã giảm giá không tồn tại hoặc không hoạt động');
  }

  // Kiểm tra ngày hợp lệ
  const now = new Date();
  if (now < coupon.startDate || now > coupon.endDate) {
    res.status(400);
    throw new Error('Mã giảm giá không trong thời gian sử dụng');
  }

  // Kiểm tra số lần sử dụng tối đa
  if (coupon.usageLimit !== null && coupon.usageLimit !== undefined && coupon.usageCount >= coupon.usageLimit) {
    res.status(400);
    throw new Error('Mã giảm giá đã đạt giới hạn sử dụng');
  }

  // Tăng số lần sử dụng
  coupon.usageCount += 1;
  await coupon.save();

  res.json({
    success: true,
    message: 'Áp dụng mã giảm giá thành công',
    coupon
  });
});

/**
 * @desc    Lấy danh sách mã giảm giá khả dụng cho người dùng
 * @route   GET /api/coupons/available
 * @access  Private
 */
const getAvailableCoupons = asyncHandler(async (req, res) => {
  const now = new Date();
  
  const coupons = await Coupon.find({
    isActive: true,
    startDate: { $lte: now },
    endDate: { $gte: now },
    $or: [
      { usageLimit: { $exists: false } },
      { usageLimit: null },
      {
        $expr: {
          $lt: ["$usageCount", "$usageLimit"]
        }
      }
    ]
  }).select('code description discountType discountValue minimumPurchase maximumDiscount usageLimit usageCount endDate');

  // Format lại dữ liệu trước khi trả về
  const formattedCoupons = coupons.map(coupon => ({
    code: coupon.code,
    description: coupon.description,
    discountType: coupon.discountType,
    discountValue: coupon.discountValue,
    minimumPurchase: coupon.minimumPurchase,
    maximumDiscount: coupon.maximumDiscount,
    usageLimit: coupon.usageLimit,
    usageCount: coupon.usageCount || 0,
    endDate: coupon.endDate,
    remainingUses: coupon.usageLimit ? coupon.usageLimit - (coupon.usageCount || 0) : null
  }));

  res.json(formattedCoupons);
});

module.exports = {
  createCoupon,
  getCoupons,
  getCouponById,
  updateCoupon,
  deleteCoupon,
  validateCoupon,
  applyCoupon,
  getAvailableCoupons
};