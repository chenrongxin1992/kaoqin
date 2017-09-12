/**
 *  @Author:    chenrongxin
 *  @Create Date:   2017-08-04
 *  @Description:   学生或者教工信息
 */
var mongoose = require('./db'),
    Schema = mongoose.Schema,
    moment = require('moment')

var userSchema = new Schema({  
    admin:{type:String,default:0},//管理员，只给系统使用者     
    admin_pwd:{type:String,default:null}   ,
    name :{type : String },                                 //会议名称
    gonghao :{type:String},                                    //会议内容
    danwei : {type : String },                                   //会议日期 5月10日
    xiaoyuankahao : {type : String,default:null},
    insert_time : {type : String, default : moment().format('YYYY-MM-DD HH:mm:ss') },     //插入时间 
    insert_timeStamp : {type : String,default:moment().format('X')},
    update_time : {type : String, default : moment().format('YYYY-MM-DD HH:mm:ss') },     //更新时间 
    update_timeStamp : {type : String,default:moment().format('X')},
    gender : {type:String},
    containerId : {type : String},
    RankName : {type :String},//卡类别
    nianji : {type:String,default:null}
})

module.exports = mongoose.model('user',userSchema);