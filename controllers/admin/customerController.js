import {User} from '../../models/userModel.js';

const customerInfo = async (req,res)=>{
    try{
       let search = req?.query?.search || "";

       let page =req?.query?.page || 1 ;
       
       const limit = 3;
       const userData = await User.find({
        role:"user",
        $or:[
            {username: {$regex: ".*"+search+".*"}},
            {email: {$regex: ".*"+search+".*"}},
        ],

       }).limit(limit*1)
       .skip((page-1)*limit)
       

       const count = await User.find({
        role:"user",
        $or:[
            {username: {$regex: ".*"+search+".*"}},
            {email: {$regex: ".*"+search+".*"}},
        ],
       }).countDocuments();
// rendering the page 
       res.render('admin/customer/customer.ejs',{
        data:userData,
        totalPages: Math.ceil(count/limit), 
        currentPage:page})
        
    } catch (error) {
        res.redirect('/pageerror')
    }
}
const customerBlock = (async (req,res)=>{
    try {
        let id = req.query?.id;
        if(!id) return res.status(400).json({success:false,message:'Invalid request or Invalid Id '});
        
        await User.updateOne({_id:id},{$set:{isBlocked:true}});

        res.redirect('/admin/customer')
    } catch (error) {
        console.log(error)
        res.redirect('/pageerror')        
    }
});



const customerUnBlock = (async (req,res)=>{
    try {
        let id = req.query.id;
        await User.updateOne({_id:id},{$set:{isBlocked:false}});
        res.redirect('/admin/customer')
    } catch (error) {
        console.log(error)
        res.redirect('/pageerror')        
    }
})

export  {customerInfo , customerBlock, customerUnBlock }