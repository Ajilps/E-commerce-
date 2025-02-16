import { Wallet } from "../../models/walletModel.js";

// display wallet  (get)
const displayWallet = async (req, res) => {
  let page = parseInt(req.query.page) || 1; // Get page number from query, default to 1
  let limit = 10; // Number of transactions per page

  try {
    let wallet = await Wallet.findOne({ user: req.user._id });

    if (!wallet) {
      wallet = await new Wallet({ user: req.user._id }).save();
    }

    // Get total number of transactions
    const totalTransactions = wallet.transactions.length;
    const totalPages = Math.ceil(totalTransactions / limit);

    // Paginate transactions using slice
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedTransactions = wallet.transactions.slice(
      startIndex,
      endIndex
    );

    return res.status(200).render("user/wallet/userWallet.ejs", {
      success: true,
      user: req.user,
      wallet: { ...wallet.toObject(), transactions: paginatedTransactions },
      currentPage: page,
      totalPages,
    });
  } catch (error) {
    console.error(`User wallet retrieval failed - ${error.message}`);
    return res.status(500).render("error.ejs", { error });
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
