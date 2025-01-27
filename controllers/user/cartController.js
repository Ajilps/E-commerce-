import { Cart } from '../../models/cartModel.js';



//display cart
const displayCart = async (req,res) =>{
  try {
     
    const userId = req.user._id;
    const cart = await Cart.findOne({ user: userId }).populate('products.productId');
// console.log( cart.products[1]) // testing
    
    return res.status(200).render('user/cart/cart.ejs',{ success: true, user: req.user, cart: cart });
  } catch (error) {
      console.error(`user cart retrieval failed - ${error.message}`);
  }
}

// render the cart page

// const cartPage = async (req, res) => {
//   try {
//     const userId = req.session.userId;
//     const cart = await Cart.findOne({ userId }).populate('products.productId');
//     res.status(200).render('user/cart.ejs', { cart });
//   } catch (error) {
//     console.error(error);
//     res.status(500).send('Server Error');
//   }
// };

// add item to the cart
const addToCart = async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  try {
    // Find the cart for the user
    let cart = await Cart.findOne({ user: userId });
    if (!cart) {
      // Create a new cart if it doesn't exist
      cart = new Cart({
       user: userId,
        products: [{ productId, quantity }]
      });
    } else {
      // Check if the product already exists in the cart
      const existingProduct = cart.products.find(
        (product) => product.productId.toString() == productId
      );
      if (existingProduct) {
        // If product exists, update its quantity
        if(existingProduct.quantity + Number(quantity) > 5){
          return res.status(400).json({ success: false, message: 'Quantity exceeds maximum limit' });
        }
        existingProduct.quantity +=Number(quantity);
      } else {
        // If product doesn't exist, add it to the cart
        cart.products.push({ productId, quantity });
      }
    }

    // Save the cart
    await cart.save();

    res.status(200).json({ success: true, message: 'Item added to cart', cart });
  } catch (error) {
    console.error('Error adding item to cart:', error);
    res.status(500).json({ success: false, message: 'Failed to add item to cart' });
  }
};

// remove item from the cart
const removeFromCart = async (req, res) => {
  const userId = req.user._id;
  const  productId  = req.params.productId;

  try {
    let cart = await Cart.findOne({ user : userId });
    console.log(cart)// testing
    if (!cart) {
      return res.status(400).send('Cart not found');
    }
    cart.products = cart.products.filter((p) => p._id.toString() !== productId);
    await cart.save();
    res.status(200).send('Item removed from cart');
    } catch (error) {
        console.error(error);
    res.status(500).send('Server Error');
    }
}

// update item quantity in the cart
const updateCart = async (req, res) => {
  const userId = req.user._id;
  const { productId, quantity } = req.body;

  console.log(req.body)// testing
  try {
    let cart = await Cart.findOne({ user : userId  });
    if (!cart) {
      return res.status(400).send('Cart not found');
    }
    let productInCart = cart.products.find((p) => p._id.toString() === productId);
    if (productInCart) {
      if (quantity > 5) {
        return res.status(400).json({ success: false, message: 'Quantity exceeds maximum limit' });
      }
      productInCart.quantity = quantity;
    }
    else {
      return res.status(400).json({ success: false, message: 'Product not found in cart' });
    }
    await cart.save();

    return res.status(200).json({ success: true, message: 'Cart updated'});
    } catch (error) {
        console.error(error);
    res.status(500).send('Server Error');
    }
}

export {displayCart, addToCart, removeFromCart, updateCart };
