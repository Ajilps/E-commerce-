import { Order} from '../../models/orderModel.js';
import {Wishlist} from '../../models/wishlistModel.js'
import {Product} from '../../models/productModel.js';
import {Cart} from '../../models/cartModel.js';



// display displayCheckout (get)
const displayCheckout = async (req,res) => {
    try {
        const userId = req.user._id;
        const cart = await Cart.findOne({ user: userId }).populate('products.productId');
       
        return res.status(200).render('user/cart/checkout.ejs',{ success: true, user: req.user, cart});
    } catch (error) {
        console.error(`user checkout display failed - ${error.message}`);
    }
}

// placeOrder (post)
const placeOrder = async (req,res) => {
    try {
        const userId = req.user._id;
        let products = [];
        const cart = await Cart.findOne({ user: userId }).populate('products.productId');
        let totalPrice = 0;
        cart.products.forEach((product) => {
            
                
                products.push({
                    productId: product.productId._id,
                    quantity: product.quantity,
                    price: product.productId.sellingPrice
            })
        });
        console.log(products);//testing

        cart.products.forEach((product) => {
            totalPrice += Math.ceil(( product.productId.sellingPrice *  product.quantity));
            totalPrice += Math.ceil(totalPrice * 0.18);
        });
        // console.log(req.body);//testing
        const order = new Order({
            userId,
            products,
            totalPrice
        });
        await order.save();
        await Cart.findOneAndDelete({ user: userId });
        return res.status(200).json({ success: true, user: req.user, order});
    } catch (error) {
        console.error(`user order placement failed - ${error.message}`);
    }
}



// render the order details page
const displayOrders = async (req, res) => {
    const orderId = req.params.orderId;

    try {
        
        const orders = await Order.find({ userId: req.user._id }).populate('products.productId');
console.log(orders);
        res.render('user/orders/order.ejs', { orders ,user: req.user});
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
};

// display order details 
const displayOrdersDetails = async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const order = await Order.findById(orderId).populate('products.productId');
        if (!order) {
            return res.status(404).send('Order not found');
        }
        res.render('user/orders/orderDetails.ejs', { order , user: req.user});
    }   
    catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}


// render the order edit page
const editOrder = async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const order = await Order.findById(orderId).populate('products.product').populate('user');
        
        if (!order) {
            return res.status(404).send('Order not found');
        }
        res.render('admin/orders/editOrder.ejs', { order });
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}

// update the order status

const updateOrderStatus = async (req, res) => {
    const orderId = req.params.orderId;
    const { status } = req.body;

    try {
        const order = await Order.findByIdAndUpdate(orderId, { status }, { new: true });

        if (!order) {
            return res.status(404).send('Order not found');
        }

        res.status(200).send(order);
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}

// render the order delete page
const deleteOrder = async (req, res) => {
    const orderId = req.params.orderId;

    try {
        const order = await Order.findById(orderId).populate('products.product').populate('user');
        
        if (!order) {
            return res.status(404).send('Order not found');
        }
        res.render('admin/orders/deleteOrder.ejs', { order });
        
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}

// delete the order

const deleteOrderConfirmed = async (req, res) => {
    const orderId = req.params.orderId;

    try {
        await Order.findByIdAndDelete(orderId);

        res.status(200).send('Order deleted successfully');
    } catch (error) {
        console.error(error);
        res.status(500).send('Server Error');
    }
}

export {displayCheckout, displayOrders, editOrder, updateOrderStatus, deleteOrder, deleteOrderConfirmed, placeOrder,displayOrdersDetails };

