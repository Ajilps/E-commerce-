import {Order} from '../../models/orderModel.js';
import {User} from '../../models/userModel.js';
import {Product} from '../../models/productModel.js';



const displayOrders = async (req, res) => {
    try {
        const orders = await Order.find({}).populate('products').populate('userId', '-password');
        console.log(orders);
        return res.status(200).render('admin/orders/orders.ejs', { success: true, user: req.user ,orders });
    } catch (error) {
        console.error(`user orders retrieval failed - ${error.message}`);
    }
};

// display order details (get)

const displayOrderDetails = async (req, res) => {
    try {
        // const order = await Order.findById(req.params.orderId).populate('products');
        return res.status(200).render('admin/orders/order_details.ejs', { success: true, user: req.user });
    } catch (error) {
        console.error(`order details retrieval failed - ${error.message}`);
    }
};

// update order status (post)

const updateOrderStatus = async (req, res) => {
    try {
        // const order = await Order.findByIdAndUpdate(req.params.orderId, { status: req.body.status }, { new: true });
        return res.status(200).render('admin/orders/order_details.ejs', { success: true, user: req.user });
    } catch (error) {
        console.error(`order status update failed - ${error.message}`);
    }
};

// display order status update form (get)

const displayUpdateOrderStatusForm = async (req, res) => {
    try {
        // const order = await Order.findById(req.params.orderId);
        return res.status(200).render('admin/orders/update_status.ejs', { success: true, user: req.user });
    } catch (error) {
        console.error(`order status update form retrieval failed - ${error.message}`);
    }
};

// export functions 

export {displayOrders ,displayOrderDetails, updateOrderStatus, displayUpdateOrderStatusForm };


