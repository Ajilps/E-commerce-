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

export { displayWallet };
