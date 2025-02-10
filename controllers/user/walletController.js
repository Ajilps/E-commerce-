import { Wallet } from "../../models/walletModel.js";

// display wallet  (get)
const displayWallet = async (req, res) => {
  try {
    let wallet = await Wallet.findOne({ user: req.user._id });
    if (!wallet) {
      wallet = await new Wallet({ user: req.user._id }).save();
    }

    console.log(wallet);

    return res.status(200).render("user/wallet/userWallet.ejs", {
      success: true,
      user: req.user,
      wallet,
    });
  } catch (error) {
    console.error(`user wallet retrieval failed - ${error.message}`);
  }
};

// get wallet balance
const getWalletBalance = async (req, res) => {
  try {
    const wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      return res
        .status(402)
        .json({ success: false, message: "No wallet found !!" });
    }

    return res.status(200).json({ success: true, balance: wallet.balance });
  } catch (error) {}
};

export { displayWallet, getWalletBalance };
