/**
 *  @Author:    chenrongxin
 *  @Create Date:   2017-08-01
 *  @Description:   新建会议
 */
var mongoose = require('./db'),
    Schema = mongoose.Schema,
    moment = require('moment')

var createSchema = new Schema({          
    meeting_name :{type : String },                                 //会议名称
    meeting_des :{type:String},                                    //会议内容
    meeting_date : {type : String },                                   //会议日期 5月10日
    meeting_date_timeStamp : {type : String},
    meeting_time :{type : String },                                    //会议时间 前期简单，只使用上午、中午、下午、晚上，对应(0、1、2、3)
    apply_time : {type : String, default : moment().format('YYYY-MM-DD HH:mm:ss') },     //申请时间 
    apply_timeStamp : {type : String,default:moment().format('X')},
    randomStr : {type:String},
    zhouji : {type : String },
    meeting_place : {type:String}
})

module.exports = mongoose.model('create',createSchema);