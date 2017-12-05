/**
 *  @Author:    chenrongxin
 *  @Create Date:   2017-08-04
 *  @Description:   报名&签到表
 */
var mongoose = require('./db'),
    Schema = mongoose.Schema,
    moment = require('moment')

var bmqdSchema = new Schema({          
    meeting_name :{type : String },                                 //会议名称
    meeting_des :{type:String},                                    //会议内容
    meeting_date : {type : String },                                   //会议日期 5月10日
    meeting_date_timeStamp : {type : String,default:null},
    insert_time : {type : String, default : null},     //插入时间 
    insert_timeStamp : {type : String,default:moment().format('X')},
    update_time : {type : String, default :null },     //更新时间 
    update_timeStamp : {type : String,default:moment().format('X')},
    randomStr : {type:String},
    baoming : {type:String,default:'0'},
    qiandao : {type:String,default:'0'},
    name:{type:String},
    gonghao:{type:String},
    danwei:{type:String},
    xiaoyuankahao:{type:String},
    meeting_place:{type:String},
    meeting_type:{type:String,default:'0'},
    meeting_nianji:{type:String},
    is_dynamic:{type:String,default:'0'},
    meeting_time:{type:String,default:null}
})

module.exports = mongoose.model('bmqd',bmqdSchema);