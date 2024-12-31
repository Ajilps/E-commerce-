import {User} from '../../models/userModel.js';

const customerInfo = async (req,res)=>{
    try{
       let search = "";
       if(req.query.search){
        search = req.query.search;
       }
       let page = 1 ;
       if(req.query.page){
        page = req.query.page
       }
       const limit = 3;
       const userData = await User.find({
        role:"user",
        $or:[
            {username: {$regex: ".*"+search+".*"}},
            {email: {$regex: ".*"+search+".*"}},
        ],

       }).limit(limit*1)
       .skip((page-1)*limit)
       .exec();

       const count = await User.find({
        isAdmin: false,
        $or:[
            {username: {$regex: ".*"+search+".*"}},
            {email: {$regex: ".*"+search+".*"}},
        ],
       }).countDocuments();
       res.render('admin/customer.ejs',{data:userData,totalPages: Math.ceil(count/limit), currentPage:page})
        
    } catch (error) {
        res.redirect('/pageerror')
    }
}
const customerBlock = (async (req,res)=>{
    try {
        let id = req.query.id;
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