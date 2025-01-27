


import {Coupon} from '../../models/couponModel.js';

const displayCoupons = async (req, res) => {
  try {
    const coupons = await Coupon.find({});
    
    return res.status(200).render('admin/coupon/coupons.ejs', { success: true, user: req.user, coupons });
  } catch (error) {
    console.error(`coupon retrieval failed - ${error.message}`);
      }
};

//display add coupon page
    const displayAddCouponForm =  async (req, res) => {
        try {
            const couponId = req?.params?.couponId;
            if(couponId){
                let coupon = await Coupon.findById(couponId);
                let startDate = new Date(coupon.startDate);
                let expiryDate = new Date(coupon.expiryDate);

                    // Format the date to YYYY-MM-DD
                  const start = startDate.toISOString().split('T')[0];
                    const expiry = expiryDate.toISOString().split('T')[0];
                    console.log(coupon);


                return res.status(200).render('admin/coupon/addCoupon.ejs', { success: true, user: req.user, coupon, start, expiry,  cNew:true});
                
            } else  {

            
            return res.status(200).render('admin/coupon/addCoupon.ejs', { success: true, user: req.user , cNew:null, coupon: null});
            }
        } catch (error) {
            
        }

    };

const createCoupon = async (req, res) => {
    try {
        const { couponCode, start, expiry,discountAmount} = req.body ;
            
        const coupon = new Coupon({
            code: couponCode,
            startDate: start,
            expiryDate: expiry,
            discountValue: discountAmount,
            discountType:'percentage',
        });
        await coupon.save();
        return res.status(201).json({ success: true, message: 'coupon created successfully' });
    } catch (error) {
        console.error(`coupon creation failed - ${error.message}`);
        return res.status(400).json({ success: false,  message: error.message });
    }
    };
    
    const editCoupon = async (req, res) => {
        try {
            const { couponCode, start, expiry, discountAmount } = req.body;
            const couponId = req.params.couponId;
    
            // Validate input data
            if (!couponCode || !start || !expiry || discountAmount === undefined) {
                return res.status(400).json({ success: false, message: 'Missing required fields' });
            }
    
            // Parse dates if they are strings
            const startDate = new Date(start);
            const expiryDate = new Date(expiry);
    
            // Validate dates
            if (isNaN(startDate.getTime()) || isNaN(expiryDate.getTime())) {
                return res.status(400).json({ success: false, message: 'Invalid date format' });
            }
    
            // Prepare update data
            const data = {
                code: couponCode,
                startDate: startDate,
                expiryDate: expiryDate,
                discountValue: discountAmount,
                // Do not hardcode discountType; retrieve it from the existing coupon or pass it in the request
            };
            console.log(data)

            const couponnew = await Coupon.findById(couponId);
            console.log(couponnew);
    
            // Update the coupon
            const updatedCoupon = await Coupon.findByIdAndUpdate(couponId,{
                  startDate: startDate,
                expiryDate: expiryDate,
                discountValue: discountAmount,
                code: couponCode,
            },
                 { new: true });
    
                 console.log(updatedCoupon);
            if (!updatedCoupon) {
                return res.status(404).json({ success: false, message: 'Coupon not found' });
            }
    
            return res.status(200).json({ success: true, message: 'Coupon updated successfully', data: updatedCoupon });
        } catch (error) {
            console.error(`Coupon update failed - ${error.message}`);
            return res.status(500).json({ success: false, message: error.message });
        }
    };

const deleteCoupon = async (req, res) => {
    try {
        await Coupon.findByIdAndDelete(req.params.couponId);
        return res.status(200).render('admin/coupon/coupons.ejs', { success: true, user: req.user });
    } catch (error) {
        console.error(`coupon deletion failed - ${error.message}`);
    }
}

export { displayCoupons, 
    createCoupon, 
    editCoupon, 
    deleteCoupon,
    displayAddCouponForm 
};