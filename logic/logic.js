/**
 *  @Author:    chenrongxin
 *  @Create Date:   2017-08-01
 *  @Description:   逻辑实现
 */
const meeting = require('../db/meeting')
const bmqd = require('../db/bmqd')
const user = require('../db/user')
const async = require('async')
const moment = require('moment')
moment.locale('zh-cn')
// const chunk =require("lodash/chunk")
// const nodemailer = require('nodemailer')
// const applyTwo = require('../db/applyTwo')
//邮件配置
// var config_email = {
// 	host : 'smtp.qq.com',
// 	secureConnection: true,
// 	auth : {
// 		user : '848536190@qq.com',
// 		pass : 'eerjruzzkiaxbfcg'
// 	}
// }
// var transporter = nodemailer.createTransport(config_email)
// //邮件内容
// var data = {
// 	from : '848536190@qq.com',
// 	to : '',
// 	subject : '计算机与软件学院 会议室申请结果 通知',
// 	html : ''
// }

//随机生成字符串
/*
*js生成随即字符串原来如此简单
*toString() radix argument must be between 2 and 36
*/
function random_str() {
	let str =  Math.random().toString(36).substring(5, 8)
    return str
}

//临时接口，保存学生信息
exports.saveStuInfo = function(args,callback){
	async.waterfall([
		function(cb){
			console.log('dddd')
			let search = user.findOne({})
				search.where('xiaoyuankahao').equals(args.alias)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.error(err)
						cb(err)
					}
					if(!doc){
						console.log('----- docs is existed but length is null -----')
						console.log('docs-->',doc)
						cb(null,null,args)
					}
					if(doc && doc.length != 0){
						console.log('check docs -->',doc)
						cb(null,doc,args)
					}
				})
		},
		function(doc,args,cb){
			console.log('kkkkk')
			console.log(doc)
			console.log(args)
			if(doc){
				console.log('用户已存在')
				cb(null,null)
			}else{
				let addUser = new user({
					gonghao : args.user,
					danwei : args.eduPersonOrgDN,
					xiaoyuankahao : args.alias,
					name : args.cn,
					gender : args.gender,
					containerId : args.containerId,
					RankName : args.RankName
				})
				addUser.save(function(err,doc){
					if(err){
						console.log('----- save user fail -----')
						console.error(err.message)
						cb(err)
					}else{
						console.log('----- save use success -----')
						console.log('new user-->',doc)
						cb(null,doc)
					}
				})
			}
		}
	],function(error,result){
		if(error){
					console.log('async error')
					console.log(error)
					callback(error)
				}
				if(!error && !result){
					console.log('async 用户已存在')
					callback(null,null)
				}
				if(result){
					console.log('async 保存用户成功')
					callback(null,result)
				}
	})
}
//判断用户是否存在，不存在则添加
exports.checkUserExist_1 = function(user_1,eduPersonOrgDN,alias,cn,gender,containerId,RankName,callback){
	async.waterfall([
		function(cb){
			let search = user.findOne({})
				search.where('xiaoyuankahao').equals(alias)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.error(err)
						cb(err)
					}
					if(doc && doc.length == 0){
						console.log('----- docs is existed but length is null -----')
						console.log('docs-->',doc)
						cb(null,null)
					}
					if(doc && doc.length != 0){
						console.log('check docs -->',doc)
						cb(null,doc)
					}
				})
		},
		function(arg,cb){
			if(arg){
				console.log('用户已存在')
				cb(null,null)
			}else{
				let addUser = new user({
					gonghao : user_1,
					danwei : eduPersonOrgDN,
					xiaoyuankahao : alias,
					name : cn,
					gender : gender,
					containerId : containerId,
					RankName : RankName
				})
				addUser.save(function(err,doc){
					if(err){
						console.log('----- save user fail -----')
						console.error(err.message)
						cb(err)
					}else{
						console.log('----- save use success -----')
						console.log('new user-->',doc)
						cb(null,doc)
					}
				})
			}
		}
	],function(error,result){
		if(error){
			console.log('async error')
			console.log(error)
			callback(error)
		}
		if(!error && !result){
			console.log('async 用户已存在')
			callback(null,null)
		}
		if(result){
			console.log('async 保存用户成功')
			callback(null,result)
		}
	})
}

//判断是否已报名
exports.checkIsBaoming = function(alias,callback){

}

//创建会议
exports.createMeeting = function(args,callback){
	//生成唯一码
	let temp_timeStamp = moment().format('X'),
		temp_num = temp_timeStamp.substring(7),
		temp_randomStr = random_str(),
		randomStr = temp_num + temp_randomStr,
		meeting_type = '',
		meeting_nianji = ''
	console.log('check randomStr-->',randomStr)

	//(b == 5) ? a="true" : a="false";
	if(args.meeting_type == '非年级会议') {
		meeting_type = '0'
	}else{
		meeting_type = '1'
	}

	let createMeeting = new meeting({
		meeting_type : meeting_type,
		meeting_nianji : args.meeting_nianji,
		meeting_place : args.meeting_place,
		meeting_name : args.meeting_name,
		meeting_des : args.meeting_des,
		meeting_date : args.meeting_date,
		meeting_time : args.meeting_time,
		randomStr : randomStr,
		zhouji : moment(args.meeting_date,'YYYY-MM-DD').format('dddd'),
		meeting_date_timeStamp : moment(args.meeting_date,'YYYY-MM-DD').format('X')
	})
	createMeeting.save(function(err,doc){
		if(err){
			console.log('----- create meeting err -----')
			console.error(err)
			return callback(err)
		}
		console.log('----- create meeting success -----')
		console.log('meeting_info-->',doc)
		return callback(err,doc)
	})
}

//二维码页面
exports.select_meeting = function(callback){
	//获取一周后时间戳
	let oneWeek = moment().add(1,'week').format('X'),
		nowtime = moment({hour: 0, minute: 0, seconds: 0}).format('X')
	console.log('一周后时间戳-->',oneWeek)
	console.log('当天0点时间戳-->',nowtime)

	let search = meeting.find({})
		search.where('meeting_date_timeStamp').lte(oneWeek)
		search.where('meeting_date_timeStamp').gte(nowtime)
		search.exec(function(err,docs){
			if(err){
				console.log('----- search err -----')
				console.error(err)
				return callback(err)
			}
			if(docs && docs.length == 0){
				console.log('----- docs is existed but length is null -----')
				return callback(null,null)
			}
			if(docs && docs.length != 0){
				console.log('check docs -->',docs)
				return callback(null,docs)
			}
		})
}

//临时添加用户
exports.adduser = function(callback){
	let name = 'abc',
		gonghao = '2017000196',
		danwei = '计算机与软件学院',
		xiaoyuankahao = '000001',
		addUser = new user({
			admin_pwd:'000001',
			admin:1,
			name:name,
			gonghao:gonghao,
			danwei:danwei,
			xiaoyuankahao:xiaoyuankahao
		})

	addUser.save(function(err,doc){
		if(err){
			console.log('----- save user fail -----')
			console.error(err.message)
			return callback(err)
		}else{
			console.log('----- save use success -----')
			console.log('new user-->',doc)
			return callback(null,null)
		}
	})
}


//手工签到
exports.sgqd = function(args,callback){
	console.log('post的数据是-->',args)
	async.waterfall([
		//获取参会人员信息，由学号获取
		function(cb){
			let search = user.findOne({})
				search.where('xiaoyuankahao').equals(args.people_no)
				search.exec(function(e,docs){
					if(e){
						console.log('----- search err -----')
						console.error(e)
						cb(e)
					}
					if(!docs){
						console.log('----- 还没该用户信息 -----')
						console.log('docs-->',docs)
						cb(null,docs)
					}
					if(docs && docs.length != 0){
						console.log('----- 用户存在 -----')
						console.log('check docs -->',docs)
						cb(null,docs)
					}
				})
		},
		//判断是否已经签到
		function(docs,cb){
			if(!docs){
				console.log('新建签到记录')
				cb(null,null)
			}
			else{
				let search = bmqd.findOne({})
				search.where('xiaoyuankahao').equals(docs.xiaoyuankahao)
				search.where('randomStr').equals(args.randomStr)
				//search.where('qiandao').equals('1')
				search.exec(function(e,result){
					if(e){
						console.log('----- search err -----')
						console.error(e)
						cb(e)
					}
					if(!result){
						console.log('----- 没有签到记录，新建 -----')
						console.log('result-->',result)
						cb(null,docs)
					}
					if(result && result.length != 0){
						console.log('----- 有记录，判断是否签到 -----')
						cb(null,result)
					}
				})
			}
		},
		function(docs,cb){
			console.log('参数内容-->',docs)
			if(docs && docs.qiandao == 1){
				console.log('----- 已经签到过 -----')
				cb(1,1)
			}
			else if(docs && docs.qiandao == 0){
				console.log('----- 更新qiandao字段 -----')
				//更新签到字段  PersonModel.update({_id:_id},{$set:{name:'MDragon'}},function(err){});
				bmqd.update({_id:docs._id},{$set:{qiandao:'1',update_timeStamp:moment().format('X'),update_time:moment().format('YYYY-MM-DD HH:mm:ss')}},function(err){
					if(err){
						console.log('----- err -----')
						console.log(err)
						cb(err)
					}
					else{
						cb(null,2)
					}
				})
			}
			else{
				if(!docs){
					console.log('----- 没签到记录 -----')
					let temp_date = args.meeting_date
						temp_date = temp_date.substring(0,10)
					console.log('temp_date -->',temp_date)
					let newQiandao = new bmqd({
						meeting_name:args.meeting_name,
						meeting_date:args.meeting_date,
						meeting_des:args.meeting_des,
						randomStr:args.randomStr,
						qiandao:'1',
						update_time:moment().format('YYYY-MM-DD HH:mm:ss'),
						update_timeStamp:moment().format('X'),
						name:null,
						gonghao:null,
						danwei:null,
						xiaoyuankahao:args.people_no,
						meeting_place:args.meeting_place,
						meeting_date_timeStamp:moment(temp_date,'YYYY-MM-DD').format('X'),
						meeting_nianji:args.meeting_nianji
					})
					console.log('newQiandao-->',newQiandao)
					newQiandao.save(function(e,docs){
						if(e){
							console.log('----- 手工签到出错 -----')
							console.error(e)
							cb(e)
						}
						if(docs && docs.length != 0){
							console.log('----- 手工签到成功 -----')
							console.log('docs -->',docs)
							cb(null,docs)
						}
					})
				}
				else{
					console.log('----- 没签到记录 -----')
					let newQiandao = new bmqd({
						meeting_name:args.meeting_name,
						meeting_date:args.meeting_date,
						meeting_des:args.meeting_des,
						randomStr:args.randomStr,
						qiandao:'1',
						update_time:moment().format('YYYY-MM-DD HH:mm:ss'),
						update_timeStamp:moment().format('X'),
						name:docs.name,
						gonghao:docs.gonghao,
						danwei:docs.danwei,
						xiaoyuankahao:docs.xiaoyuankahao,
						meeting_place:docs.meeting_place,
						meeting_nianji:args.meeting_nianji
					})
					console.log('newQiandao-->',newQiandao)
					newQiandao.save(function(e,docs){
						if(e){
							console.log('----- 手工签到出错 -----')
							console.error(e)
							cb(e)
						}
						if(docs && docs.length != 0){
							console.log('----- 手工签到成功 -----')
							console.log('docs -->',docs)
							cb(null,docs)
						}
					})
				}
				
			}
		}
	],function(err,result){
		if(err && result == null){
			console.log('----- async final err -----')
			console.error(err)
			return callback(err)
		}
		if(err == 1 && result == 1){
			console.log('----- async final 已签到 -----')
			return callback(1,1)
		}
		if(result && result != 1){
			console.log('----- async success -----')
			return callback(null,null)
		}
	})
	return
}

//登录
exports.checkLogin = function(args,callback){
	console.log('check args-->',args)
	async.waterfall([
		//检查用户是否存在
		function(cb){
			let search = user.findOne({})
				search.where('xiaoyuankahao').equals(args.card_no)
				search.exec(function(e,doc){
					if(e){
						console.log('----- search err -----')
						console.error(e)
						cb(e)
					}
					if(doc && doc.length ==0){
						console.log('----- 用户不存在 -----')
						cb(1,1)
					}
					if(doc && doc.length != 0){
						console.log('用户存在-->',doc)
						cb(null,doc)
					}
				})
		},
		//检查密码是否正确
		function(doc,cb){
			if(args.card_pwd == doc.admin_pwd){
				console.log('----- 密码相同 -----')
				cb(null,doc)
			}else{
				console.log('----- 密码错误 -----')
				cb(1,2)
			}
		}
	],function(err,result){
		if(err && err != 1){
			console.log('----- async err -----')
			console.log(err.message)
			return callback(err)
		}
		if(err && result ==1){
			console.log('----- async 用户不存在 -----')
			return callback(null,1)
		}
		if(err && result == 2){
			console.log('----- async 密码错误 -----')
			return callback(null,2)
		}
		if(err == null && result){
			console.log('----- async login success -----')
			return callback(null,result)
		}
	})
}

//ajax 判断用户是否存在
exports.checkUserExist = function(args,callback){
	let search = user.findOne({})
		search.where('xiaoyuankahao').equals(args.card_no)
		search.exec(function(err,doc){
			if(err){
				console.log('----- search err -----')
				console.error(err)
				return callback(err)
			}
			if(!doc){
				console.log('----- 用户不存在 -----')
				return callback(null,null)
			}
			if(doc && doc.length == 0){
				console.log('----- 用户不存在 -----')
				return callback(null,null)
			}
			if(doc && doc.length != 0){
				console.log('----- 用户存在 -----')
				console.log(doc)
				return callback(null,doc)
			}
		})
}

//获取会议信息接口
exports.getMeetingDetail = function(args,callback){
	console.log('randomStr -->',args)
	let search = meeting.findOne({})
		search.where('randomStr').equals(args)
		search.exec(function(err,doc){
			if(err){
				console.log('----- search err -----')
				console.error(err)
				return callback(err)
			}
			if(!doc){
				console.log('----- 没有该会议信息 -----')
				return callback(null,null)
			}
			if(doc){
				console.log('----- 会议存在 -----')
				console.log(doc)
				return callback(null,doc)
			}
		})
}

//签到时的逻辑
exports.getMeetingDetail_2 = function(args,callback){
	async.waterfall([
		function(cb){
			console.log('1')
			console.log(args.alias)
			let search = user.findOne({})
				search.where('xiaoyuankahao').equals(args.alias)
				search.exec(function(err,doc){
					console.log('dd')
					if(err){
						console.log('----- search err -----')
						console.error(err)
						cb(err)
					}
					if(!doc){
						console.log('----- doc is null -----')
						cb(null,null)
					}
					if(doc && doc.length != 0){
						console.log('check docs -->',doc)
						cb(null,doc)
					}
				})
		},
		function(arg,cb){
			console.log('2')
			if(arg){
				console.log('用户已存在')
				cb(null,null)
			}else{
				let addUser = new user({
					nianji : args.nianji,
					gonghao : args.user,
					danwei : args.eduPersonOrgDN,
					xiaoyuankahao : args.alias,
					name : args.cn,
					gender : args.gender,
					containerId : args.containerId,
					RankName : args.RankName
				})
				addUser.save(function(err,doc){
					if(err){
						console.log('----- save user fail -----')
						console.error(err.message)
						cb(err)
					}else{
						console.log('----- save use success -----')
						console.log('new user-->',doc)
						cb(null,null)
					}
				})
			}
		},
		function(arg,cb){
				console.log('3')
			let search = bmqd.findOne({})
				search.where('randomStr').equals(args.r)
				search.where('xiaoyuankahao').equals(args.alias)
				search.where('qiandao').equals('1')
			search.exec(function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.error(err)
					cb(err)
				}
				if(!doc){
					console.log('----- 没有签到信息 -----')
					cb(null,null)
				}
				if(doc){
					console.log('----- 存在签到信息 -----')
					console.log('签到信息-->',doc)
					cb(1,'已经签到！')
				}
			})
		},
		function(arg,cb){
				console.log('4')
			if(arg){
				console.log('----- 存在信息 -----')
				cb(1,'已经签到！')
			}else{
				let search = meeting.findOne({})
					search.where('randomStr').equals(args.r)
					search.exec(function(err,doc){
						if(err){
							console.log('----- search err -----')
							console.error(err)
							return cb(err)
						}
						if(!doc){
							console.log('----- 没有该会议信息 -----')
							return cb(null,null)
						}
						if(doc){
							console.log('----- 会议存在 -----')
							console.log(doc)
							return cb(null,doc)
						}
					})
			}
		}
	],function(error,result){
		if(error && !result){
			console.log('async err')
			console.log(error)
			callback(error)
		}
		if(error && result == '已经签到！'){
			callback(1,'已经签到！')
		}
		if(result && result != '已经签到！'){
			callback(null,result)
		}
		if(!result){
			callback(null,null)
		}
	})
}

//报名时的逻辑(get请求到达)
exports.getMeetingDetail_1 = function(args,callback){
	console.log('----- getMeetingDetail_1 -----')
	async.waterfall([
		function(cb){
			let search = user.findOne({})
				search.where('xiaoyuankahao').equals(args.alias)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.error(err)
						cb(err)
					}
					if(!doc){
						console.log('----- doc is null -----')
						cb(null,null)
					}
					if(doc && doc.length != 0){
						console.log('check docs -->',doc)
						cb(null,doc)
					}
				})
		},
		function(arg,cb){
			console.log('2')
			if(arg){
				console.log('用户已存在')
				cb(null,null)
			}else{
				let addUser = new user({
					nianji : args.nianji,
					gonghao : args.user,
					danwei : args.eduPersonOrgDN,
					xiaoyuankahao : args.alias,
					name : args.cn,
					gender : args.gender,
					containerId : args.containerId,
					RankName : args.RankName
				})
				addUser.save(function(err,doc){
					if(err){
						console.log('----- save user fail -----')
						console.error(err.message)
						cb(err)
					}else{
						console.log('----- save use success -----')
						console.log('new user-->',doc)
						cb(null,null)
					}
				})
			}
		},
		function(arg,cb){
				console.log('3')
			let search = bmqd.findOne({})
				search.where('randomStr').equals(args.r)
				search.where('xiaoyuankahao').equals(args.alias)
				search.where('baoming').equals('1')
			search.exec(function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.error(err)
					cb(err)
				}
				if(!doc){
					console.log('----- 没有报名信息 -----')
					cb(null,null)
				}
				if(doc){
					console.log('----- 存在信息 -----')
					cb(1,'已经报名！')
				}
			})
		},
		function(arg,cb){
				console.log('4')
			if(arg){
				console.log('----- 存在信息 -----')
				cb(1,'已经报名！')
			}else{
				let search = meeting.findOne({})
					search.where('randomStr').equals(args.r)
					search.exec(function(err,doc){
						if(err){
							console.log('----- search err -----')
							console.error(err)
							return cb(err)
						}
						if(!doc){
							console.log('----- 没有该会议信息 -----')
							return cb(null,null)
						}
						if(doc){
							console.log('----- 会议存在 -----')
							console.log(doc)
							// if(doc.meeting_type == '0'){
							// 	doc.meeting_type = '非年级会议'
							// 	doc.meeting_nianji = '暂无'
							// }else{
							// 	doc.meeting_type = '年级会议'
								
							// }
							return cb(null,doc)
						}
					})
			}
		}
	],function(error,result){
		if(error && !result){
			console.log('async err')
			console.log(error)
			callback(error)
		}
		if(error && result == '已经报名！'){
			callback(1,'已经报名！')
		}
		if(result && result != '已经报名！'){
			callback(null,result)
		}
		if(!result){
			callback(null,null)
		}
	})
}

//报名逻辑(post 请求到达)
exports.baoming = function(args,callback){
	console.log('logic baoming')
	console.log('logic args-->',args)
	async.waterfall([
		//获取用户信息和会议详情
		function(cb){
			let search = user.findOne({})
				search.where('xiaoyuankahao').equals(args.people_no)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.error(err)
						cb(err)
					}
					if(!doc){
						console.log('----- 用户不存在 -----')
						cb(1,'用户不存在')
					}
					if(doc && doc.length == 0){
						console.log('----- 用户不存在 -----')
						cb(1,'用户不存在')
					}
					if(doc && doc.length != 0){
						console.log('----- 用户存在 -----')
						console.log(doc)
						cb(null,doc)
					}
				})
		},
		//获取会议详情
		function(arg,cb){
			let search = meeting.findOne({})
				search.where('randomStr').equals(args.randomStr)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.error(err)
						cb(err)
					}
					if(!doc){
						console.log('----- 没有该会议信息 -----')
						cb(1,'没有会议信息')
					}
					if(doc){
						console.log('----- 会议存在 -----')
						console.log(doc)
						let info = {}
							info.user = arg
							info.meeting = doc
						cb(null,info)
					}
				})
		},
		//检查是否存在记录
		function(info,cb){
			console.log('check info -->',info)
			let search = bmqd.findOne({})
				search.where('randomStr').equals(args.randomStr)
				search.where('xiaoyuankahao').equals(args.people_no)
				search.where('baoming').equals('1')
			search.exec(function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.error(err)
					cb(err)
				}
				if(!doc){
					console.log('----- 没有报名信息 -----')
					//新插入
					let baomingxinxi = new bmqd({
						meeting_nianji:info.meeting.meeting_nianji,
						meeting_type:info.meeting.meeting_type,
						meeting_name:info.meeting.meeting_name,
						meeting_place:info.meeting.meeting_place,
						meeting_des:info.meeting.meeting_des,
						meeting_date:info.meeting.meeting_date,
						meeting_date_timeStamp:info.meeting.meeting_date_timeStamp,
						randomStr:args.randomStr,
						baoming:1,
						name:info.user.name,
						gonghao:info.user.gonghao,
						danwei:info.user.danwei,
						xiaoyuankahao:args.people_no,
						meeting_time:info.meeting.meeting_time
					})
					baomingxinxi.save(function(e,d){
						if(e){
							console.log('----- save err -----')
							console.error(e)
							cb(e)
						}else{
							console.log('新增报名信息成功')
							cb(null,d)	
						}
					})
				}
				if(doc){
					console.log('----- 存在信息 -----')
					cb(1,'已经报名！')
				}
			})
		}
	],function(err,result){
		if(err && err != 1){
			console.log('----- async err -----')
			return callback(err)
		}
		if(err == null && result){
			console.log('----- async baoming success -----')
			console.log(result)
			return callback(null,result)
		}
		if(err == 1 && result){
			console.log('----- async 已经报名 -----')
			return callback(1,'已经报名！')
		}
	})
}

//签到逻辑（post请求到达）
exports.qiandao = function(args,callback){
	async.waterfall([
		//获取用户信息和会议详情
		function(cb){
			let search = user.findOne({})
				search.where('xiaoyuankahao').equals(args.people_no)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.error(err)
						cb(err)
					}
					if(!doc){
						console.log('----- 用户不存在 -----')
						cb(1,'用户不存在')
					}
					if(doc && doc.length == 0){
						console.log('----- 用户不存在 -----')
						cb(1,'用户不存在')
					}
					if(doc && doc.length != 0){
						console.log('----- 用户存在 -----')
						console.log(doc)
						cb(null,doc)
					}
				})
		},
		//获取会议详情
		function(arg,cb){
			let search = meeting.findOne({})
				search.where('randomStr').equals(args.randomStr)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.error(err)
						cb(err)
					}
					if(!doc){
						console.log('----- 没有该会议信息 -----')
						cb(1,'没有会议信息')
					}
					if(doc){
						console.log('----- 会议存在 -----')
						console.log(doc)
						let info = {}
							info.user = arg
							info.meeting = doc
						cb(null,info)
					}
				})
		},
		//检查是否存在记录
		function(info,cb){
			console.log('check info -->',info)
			let search = bmqd.findOne({})
				search.where('randomStr').equals(args.randomStr)
				search.where('xiaoyuankahao').equals(args.people_no)
				search.where('baoming').gte('0')
				//search.where('qiandao').equals('1')
			search.exec(function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.error(err)
					cb(err)
				}
				if(!doc){
					console.log('----- 没有记录，直接插入新纪录 -----')
					//新插入
					let qiandaoxinxi = new bmqd({
						meeting_nianji:info.meeting.meeting_nianji,
						meeting_type:info.meeting.meeting_type,
						meeting_name:info.meeting.meeting_name,
						meeting_place:info.meeting.meeting_place,
						meeting_des:info.meeting.meeting_des,
						meeting_date:info.meeting.meeting_date,
						meeting_date_timeStamp:info.meeting.meeting_date_timeStamp,
						randomStr:args.randomStr,
						qiandao:1,
						name:info.user.name,
						gonghao:info.user.gonghao,
						danwei:info.user.danwei,
						xiaoyuankahao:args.people_no,
						meeting_time:info.meeting.meeting_time
					})
					qiandaoxinxi.save(function(e,d){
						if(e){
							console.log('----- save err -----')
							console.error(e)
							cb(e)
						}else{
							cb(null,d)	
						}
					})
				}
				if(doc){
					console.log('----- 存在记录，判断是否签到过 -----')
					if(doc.qiandao == 1){
						console.log('----- 已经签到过 -----')
						cb(1,'已经签到过')
					}else{
						console.log('还没签到，更新签到字段')
						//更新qiandao字段  PersonModel.update({_id:_id},{$set:{name:'MDragon'}},function(err){});
						bmqd.update({_id:doc._id},{$set:{qiandao:'1',update_timeStamp:moment().format('X'),update_time:moment().format('YYYY-MM-DD HH:mm:ss')}},function(ee,dd){
							if(ee){
								console.log('----- update err -----')
								cb(ee)
							}
							else{
								console.log('dd-->',dd)
								cb(null,doc)
							}
						})
					}
					
				}
			})
		}
	],function(err,result){
		if(err && err != 1){
			console.log('----- async err -----')
			return callback(err)
		}
		if(err == null && result){
			console.log('----- async qiandao success -----')
			console.log(result)
			return callback(null,result)
		}
		if(err == 1 && result){
			console.log('----- async 已经签到 -----')
			return callback(1,'已经签到！')
		}
	})
}

//动态签到逻辑
exports.qiandaodongtai = function(args,callback){
	async.waterfall([
		//获取用户信息和会议详情
		function(cb){
			let search = user.findOne({})
				search.where('xiaoyuankahao').equals(args.people_no)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.error(err)
						cb(err)
					}
					if(!doc){
						console.log('----- 用户不存在 -----')
						cb(1,'用户不存在')
					}
					if(doc && doc.length == 0){
						console.log('----- 用户不存在 -----')
						cb(1,'用户不存在')
					}
					if(doc && doc.length != 0){
						console.log('----- 用户存在 -----')
						console.log(doc)
						cb(null,doc)
					}
				})
		},
		//获取会议详情
		function(arg,cb){
			let search = meeting.findOne({})
				search.where('randomStr').equals(args.randomStr)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.error(err)
						cb(err)
					}
					if(!doc){
						console.log('----- 没有该会议信息 -----')
						cb(1,'没有会议信息')
					}
					if(doc){
						console.log('----- 会议存在 -----')
						console.log(doc)
						let info = {}
							info.user = arg
							info.meeting = doc
						cb(null,info)
					}
				})
		},
		//检查是否存在记录
		function(info,cb){
			console.log('check info -->',info)
			let search = bmqd.findOne({})
				search.where('randomStr').equals(args.randomStr)
				search.where('xiaoyuankahao').equals(args.people_no)
				search.where('baoming').gte('0')
				//search.where('qiandao').equals('1')
			search.exec(function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.error(err)
					cb(err)
				}
				if(!doc){
					console.log('----- 没有记录，直接插入新纪录 -----')
					//新插入
					let qiandaoxinxi = new bmqd({
						meeting_nianji:info.meeting.meeting_nianji,
						meeting_type:info.meeting.meeting_type,
						meeting_name:info.meeting.meeting_name,
						meeting_place:info.meeting.meeting_place,
						meeting_des:info.meeting.meeting_des,
						meeting_date:info.meeting.meeting_date,
						meeting_date_timeStamp:info.meeting.meeting_date_timeStamp,
						randomStr:args.randomStr,
						qiandao:1,
						name:info.user.name,
						gonghao:info.user.gonghao,
						danwei:info.user.danwei,
						xiaoyuankahao:args.people_no,
						is_dynamic : '1',
						meeting_time:info.meeting.meeting_time
					})
					qiandaoxinxi.save(function(e,d){
						if(e){
							console.log('----- save err -----')
							console.error(e)
							cb(e)
						}else{
							cb(null,d)	
						}
					})
				}
				if(doc){
					console.log('----- 存在记录，判断是否签到过 -----')
					if(doc.qiandao == 1){
						console.log('----- 已经签到过 -----')
						cb(1,'已经签到过')
					}else{
						//更新qiandao字段  PersonModel.update({_id:_id},{$set:{name:'MDragon'}},function(err){});
						bmqd.update({_id:doc._id},{$set:{qiandao:'1',update_timeStamp:moment().format('X'),update_time:moment().format('YYYY-MM-DD HH:mm:ss')}},function(ee,dd){
							if(ee){
								console.log('----- update err -----')
								cb(ee)
							}
							else{
								console.log('dd-->',dd)
								cb(null,doc)
							}
						})
					}
					
				}
			})
		}
	],function(err,result){
		if(err && err != 1){
			console.log('----- async err -----')
			return callback(err)
		}
		if(err == null && result){
			console.log('----- async qiandao success -----')
			console.log(result)
			return callback(null,result)
		}
		if(err == 1 && result){
			console.log('----- async 已经签到 -----')
			return callback(1,'已经签到！')
		}
	})
}

//会议记录查询
//get apply for approve 'room_name,meeting_name,exact_meeting_time,meeting_content,meeting_num,apply_name,apply_phone,is_approved'
exports.applyApprove = function(limit,offset,meeting_type,callback){
	if(meeting_type == '非年级会议'){
		console.log('----- 非年级会议 -----')
		async.waterfall([
			function(cb){
				let query = meeting.find({})
					query.where('meeting_type').equals('0')
					query.exec(function(err,docs){
						if(err){
							console.log('----- search err -----')
							console.log(err.message)
							cb(err,null)
						}
						if(!docs || docs.length == 0){
							console.log('----- no result now -----')
					 		cb(1,1)
						}
						if(docs && docs.length !=0){
							cb(null,docs.length)
						}
					})
			},
			function(length,cb){
				console.log('记录总数-->: ',length)
				limit = parseInt(limit)
				offset = parseInt(offset)
				let numSkip = (offset)*limit
				console.log('skip num is: ',numSkip)
				let search = meeting.find({},{'meeting_name':1,'meeting_date':1,'meeting_time':1,'meeting_des':1,'meeting_type':1,'meeting_nianji':1,'apply_time':1,'zhouji':1,'_id':1,'randomStr':1})
					search.where('meeting_type').equals('0')
					search.sort({'apply_timeStamp':-1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(err,docs){
						if(err){
							console.log('----- search err -----')
							console.log(err.message)
							cb(err,null)
						}
						if(!docs || docs.length == 0){
							console.log('----- no result now -----')
							cb(1,1)
						}
						if(docs && docs.length !=0){//格式化并将length加入
							for(let i=0;i<docs.length;i++){
								//格式化时间戳
								//docs[i].apply_time = moment(docs[i].apply_time).format('YYYY-MM-DD HH:mm:ss')
								//console.log('check applytime : ',docs[i].apply_time)
								if(typeof(docs[i].week_day) == 'undefined'){
									docs[i].week_day = ''
								}
								docs[i].meeting_date = docs[i].meeting_date + ' ' + docs[i].zhouji 
								docs[i].meeting_nianji = '暂无'
								docs[i].meeting_type = '非年级会议'
								console.log(docs[i])
							}
							 docs = {
							 	total : length,
							 	docs : docs,
							 	offset : offset
							 }
							 cb(null,docs)
						}
					})
			}],function(err,result){
				if(err && result == 1){
					console.log('----- async no records -----')
					callback(err,1)
				}
				else if(err && result == null){
					console.log('----- async err -----')
					callback(err,null)
				}
				else{//(result && result.length != 0)
					console.log('----- async final result -----')
					callback(null,result)
				}
		})
	}
	else{console.log('----- 年级会议 -----')
		async.waterfall([
			function(cb){
				let query = meeting.find({})
					query.where('meeting_type').equals('1')
					query.exec(function(err,docs){
						if(err){
							console.log('----- search err -----')
							console.log(err.message)
							cb(err,null)
						}
						if(!docs || docs.length == 0){
							console.log('----- no result now -----')
					 		cb(1,1)
						}
						if(docs && docs.length !=0){
							cb(null,docs.length)
						}
					})
			},
			function(length,cb){
				console.log('total length: ',length)
				limit = parseInt(limit)
				offset = parseInt(offset)
				let numSkip = (offset)*limit
				console.log('skip num is: ',numSkip)
				let search = meeting.find({},{'meeting_name':1,'meeting_date':1,'meeting_time':1,'meeting_des':1,'meeting_type':1,'meeting_nianji':1,'apply_time':1,'zhouji':1,'_id':1,'randomStr':1})
					search.where('meeting_type').equals('1')
					search.sort({'apply_timeStamp':-1})
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(err,docs){
						if(err){
							console.log('----- search err -----')
							console.log(err.message)
							cb(err,null)
						}
						if(!docs || docs.length == 0){
							console.log('----- no result now -----')
							cb(1,1)
						}
						if(docs && docs.length !=0){//格式化并将length加入
							for(let i=0;i<docs.length;i++){
								docs[i].meeting_date = docs[i].meeting_date + ' ' + docs[i].zhouji
								docs[i].meeting_type = '年级会议'
								console.log(docs[i])
							}

							 docs = {
							 	total : length,
							 	docs : docs,
							 	offset : offset
							 }
							 cb(null,docs)
						}
					})
			}],function(err,result){
				if(err && result == 1){
					console.log('----- async no records -----')
					callback(err,1)
				}
				else if(err && result == null){
					console.log('----- async err -----')
					callback(err,null)
				}
				else{//(result && result.length != 0)
					console.log('----- async final result -----')

					callback(null,result)
				}
		})
	}
}

//签到详情
exports.getQianDaoDetail = function(limit,offset,randomStr,callback){
	async.waterfall([
		function(cb){
			console.log('查找该会议')
			let search = meeting.findOne({})
				search.where('randomStr').equals(randomStr)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.log(err)
						cb(err)
					}
					if(!doc){
						console.log('----- 没有相应会议 -----')
						cb(1,'查询不到相应会议')
					}
					if(doc){
						console.log('该会议是 -- >',doc)
						cb(null,doc)
					}
				})
		},
		function(arg,cb){
			console.log('获取签到记录总数')
			let search = bmqd.find({})
				search.where('randomStr').equals(randomStr)
				search.where('qiandao').equals('1')
				search.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						cb(err)
					}
					if(!docs){
						console.log('没有查到结果')
						cb(1,'没有签到信息')
					}
					if(docs){
						console.log('签到总人数-->',docs.length)
						cb(null,arg,docs.length)
					}
				})
		},
		function(arg,length,cb){
				limit = parseInt(limit)
				offset = parseInt(offset)
				let numSkip = (offset)*limit
				console.log('skip num is: ',numSkip)
			let search = bmqd.find({})
				search.where('randomStr').equals(randomStr)
				search.where('qiandao').equals('1')
				search.sort({'insert_timeStamp':-1})
				search.limit(limit)
				search.skip(numSkip)
				search.exec(function(err,docs){
					if(err){
						console.log('----- 查询签到详情记录出错 -----')
						console.log(err)
						cb(err)
					}
					if(!docs){
						console.log('----- 查询不到该会议的签到记录 -----')
						cb(1,'查询不到该会议的签到记录')
					}
					if(docs){
						let meeting_nianji
						if(arg.meeting_type == '1'){
							meeting_nianji = arg.meeting_nianji
						}else{
							meeting_nianji = '暂无'
						}
						console.log('共有多少人签到 -- > ',docs.length)

						for(let i=0;i<docs.length;i++){
							docs[i].meeting_date = arg.meeting_date + ' ' + arg.zhouji + ' ' + arg.meeting_time
							docs[i].meeting_nianji = meeting_nianji
							if(docs[i].meeting_type == '1'){
								docs[i].meeting_type = '年级会议'
							}else{
								docs[i].meeting_type = '非年级会议'
							}
						}
						docs = {
								 	total : length,
								 	docs : docs,
								 	offset : offset
								 }
						cb(null,docs)
					}
				})
		}
	],function(error,result){
		if(error && error != 1){
			console.log('----- async error -----')
			callback(error)
		}
		if(error && error == 1){
			console.log('----- async error is 1 -----')
			callback(1,result)
		}
		if(!error && result){
			console.log('----- async final result -----')
			callback(null,result)
		}
	})
}

//下载excel,已签到学生
exports.downloadqiandao = function(randomStr,callback){
	async.waterfall([
		function(cb){
			console.log('查找该会议')
			let search = meeting.findOne({})
				search.where('randomStr').equals(randomStr)
				search.exec(function(err,doc){
					if(err){
						console.log('----- search err -----')
						console.log(err)
						cb(err)
					}
					if(!doc){
						console.log('----- 没有相应会议 -----')
						cb(1,'查询不到相应会议')
					}
					if(doc){
						console.log('该会议是 -- >',doc)
						cb(null,doc)
					}
				})
		},
		function(arg,cb){
			console.log('获取签到记录总数')
			let search = bmqd.find({})
				search.where('randomStr').equals(randomStr)
				search.where('qiandao').equals('1')
				search.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						cb(err)
					}
					if(!docs){
						console.log('没有查到结果')
						cb(1,'没有签到信息')
					}
					if(docs){
						console.log('签到总人数-->',docs.length)
						cb(null,arg,docs.length)
					}
				})
		},
		function(arg,length,cb){
				// limit = parseInt(limit)
				// offset = parseInt(offset)
				// let numSkip = (offset)*limit
				// console.log('skip num is: ',numSkip)
			let search = bmqd.find({})
				search.where('randomStr').equals(randomStr)
				search.where('qiandao').equals('1')
				search.sort({'insert_timeStamp':-1})
				// search.limit(limit)
				// search.skip(numSkip)
				search.exec(function(err,docs){
					if(err){
						console.log('----- 查询签到详情记录出错 -----')
						console.log(err)
						cb(err)
					}
					if(!docs){
						console.log('----- 查询不到该会议的签到记录 -----')
						cb(1,'查询不到该会议的签到记录')
					}
					if(docs){
						let meeting_nianji
						if(arg.meeting_type == '1'){
							meeting_nianji = arg.meeting_nianji
						}else{
							meeting_nianji = '暂无'
						}
						console.log('共有多少人签到 -- > ',docs.length)

						for(let i=0;i<docs.length;i++){
							//docs[i].meeting_date = arg.meeting_date + ' ' + arg.zhouji + ' ' + arg.meeting_time
							docs[i].meeting_nianji = meeting_nianji
							if(docs[i].meeting_type == '1'){
								docs[i].meeting_type = '年级会议'
							}else{
								docs[i].meeting_type = '非年级会议'
							}
						}
						// docs = {
						// 		 	total : length,
						// 		 	docs : docs,
						// 		 	offset : offset
						// 		 }
						cb(null,docs,arg)
					}
				})
		},
		function(docs,arg,cb){
			//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
            let vac = new Array();
            for (let i = 0; i < docs.length; i++) {
                let temp = new Array();
                temp[0] = i + 1
                temp[1] = docs[i].name
                temp[2] = docs[i].gonghao
                temp[3] = docs[i].xiaoyuankahao
                temp[4] = docs[i].meeting_nianji
                //temp[5] = (weiqiandao_stu[i].meeting_type) == "1" ? "年级会议":"非年级会议"
                temp[5] = docs[i].meeting_name
                temp[6] = docs[i].meeting_type
                temp[7] = docs[i].meeting_date + ' ' + arg.zhouji + ' ' + arg.meeting_time
                temp[8] = docs[i].insert_time
                vac.push(temp);
            };
			console.log('check vac -- >',vac)
			let result = {}
				result.vac = vac
				result.meeting_name = docs[0].meeting_name + '-' + docs[0].meeting_date
			//vac.meeting_name = docs[0].meeting_name
			//info.vac = vac
			cb(null,result)
		}
	],function(error,result){
		if(error && error != 1){
			console.log('----- async error -----')
			callback(error)
		}
		if(error && error == 1){
			console.log('----- async error is 1 -----')
			callback(1,result)
		}
		if(!error && result){
			console.log('----- async final result -----')
			callback(null,result)
		}
	})
}

//查询学生所有签到记录
exports.chaxunstu = function(xiaoyuankahao,callback){
	async.waterfall([
		function(cb){
			let search = user.findOne({})
				search.where('xiaoyuankahao').equals(xiaoyuankahao)
				search.exec(function(e,doc){
					if(e){
						console.log('----- search err -----')
						console.log(e)
						cb(e)
					}
					if(!doc){
						console.log('----- result is null -----')
						cb(1,'没有该生信息')
					}
					if(doc){
						console.log('check stu -- >',doc)
						cb(null,doc)
					}
				})
		},
		function(u,cb){
			let search = bmqd.find({})
				search.where('xiaoyuankahao').equals(xiaoyuankahao)
				search.where('qiandao').equals('1')
				search.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						console.log(err)
						cb(err)
					}
					if(!docs){
						console.log('----- docs is null -----')
						cb(1,'该生没有签到记录')
					}
					if(docs){
						console.log('check docs--->',docs)
						cb(null,docs)
					}
				})
		}
	],function(error,result){
		if(error && error != 1){
			console.log('async final error')
			callback(error)
		}
		if(error && error == 1){
			console.log('async final error 1')
			callback(1,result)
		}
		if(!error && result){
			console.log('async success')
			callback(null,result)
		}
	})
}
//获取用户信息
exports.getUserInfo = function(xiaoyuankahao,callback){
	let search = user.findOne({})
		search.where('xiaoyuankahao').equals(xiaoyuankahao)
		search.exec(function(error,result){
			if(error){
				console.log('----- search err -----')
				console.log(err)
				callback(err)
			}
			if(!result){
				console.log('----- result is null -----')
				callback(1,'没有该用户')
			}
			if(result){
				console.log('check user -- >',result)
				callback(null,result)
			}
		})
}
//学生签到详情列表
exports.getStuQianDaoDetail = function(limit,offset,xiaoyuankahao,callback){
	limit = parseInt(limit)
	offset = parseInt(offset)
	let numSkip = (offset)*limit
	console.log('skip num is: ',numSkip)
	async.waterfall([
		function(cb){
			let search = bmqd.find({})
				search.where('xiaoyuankahao').equals(xiaoyuankahao)
				search.where('qiandao').equals('1')
				search.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						console.log(err)
						cb(err)
					}
					if(!docs){
						console.log('----- docs is null -----')
						cb(1,'该生没有签到记录')
					}
					if(docs){
						console.log('check docs--->',docs)
						cb(null,docs.length)
					}
				})
	    },
	    function(length,cb){
	    	console.log('length-->',length)
	    	console.log('offset-->',offset)
	    	let search = bmqd.find({})
				search.where('xiaoyuankahao').equals(xiaoyuankahao)
				search.where('qiandao').equals('1')
				search.limit(limit)
				search.skip(numSkip)
				search.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						console.log(err)
						callback(err)
					}
					if(!docs){
						console.log('----- docs is null -----')
						callback(1,'该生没有签到记录')
					}
					if(docs){
						for(let i=0;i<docs.length;i++){
								(docs[i].meeting_type == '1') ? docs[i].meeting_type = '年级会议' : docs[i].meeting_type = '非年级会议'
								docs[i].meeting_date = docs[i].meeting_date + ' ' + docs[i].meeting_time
							}
						console.log('check docs--->',docs)
						docs = {
							total : length,
							offset : offset,
							docs : docs
						}
						callback(null,docs)
					}
			})
	    }
	],function(error,result){
		if(error && error != 1){
			console.log('async final error')
			callback(error)
		}
		if(error && error == 1){
			console.log('async final error 1')
			callback(1,result)
		}
		if(!error && result){
			console.log('async success')
			callback(null,result)
		}
	})
}

//未签到详情
/*1、取出会议信息；2、根据信息查询所有符合学生；3遍历学生，找出没有签到的人*/
exports.getWeiQianDaoDetail = function(limit,offset,randomStr,callback){
	console.log('----- in logic getWeiQianDaoDetail')
	let weiqiandao_stu = new Array(),
		yiqiandao_stu = new Array()
	async.waterfall([
		function(cb){
			let search = meeting.findOne({})
				search.where('randomStr').equals(randomStr)
				search.exec(function(err,doc){
					if(err){
						console.log('search err')
						cb(err)
					}
					if(!doc){
						console.log('没有该会议信息')
						cb(1,'没有该会议信息')
					}
					if(doc){
						console.log('找到该会议')
						cb(null,doc)
					}
				})
		},
		function(doc,cb){
			console.log('检查该会议-->',doc)
			if(doc.meeting_type == '1'){
				console.log('----- 年级会议 -----')
				console.log('年级是 -- >',doc.meeting_nianji)
				let search = user.find({},{'gonghao':1,'xiaoyuankahao':1,'name':1,'_id':1,'nianji':1})
					search.where('nianji').equals(doc.meeting_nianji)
					search.exec(function(err,docs){
						if(err){
							console.log('search err')
							cb(err)
						}
						if(!docs){
							console.log('没有签到信息')
							cb(1,'没有签到信息')
						}
						if(docs){
							console.log('该年级总共有 -- > ',docs.length,'人')
							let info = {}
								info.meeting_info = doc
								info.stu = docs
							cb(null,info)
						}
					})

			}else{
				console.log('----- 非年级会议 暂时不做统计 -----')
			}
		},
		function(info,cb){
			let temp_stu = info.stu
				limit = parseInt(limit)
				offset = parseInt(offset)
				let numSkip = (offset)*limit
				console.log('skip num is: ',numSkip)
			async.eachLimit(temp_stu,10,function(item,callb){
				let search = bmqd.findOne({})
					search.where('qiandao').equals('1')
					search.where('xiaoyuankahao').equals(item.xiaoyuankahao)
					search.where('randomStr').equals(info.meeting_info.randomStr)
					search.limit(limit)
					search.skip(numSkip)
					search.exec(function(e,d){
						if(e){
							console.log('eachLimit search err')
							console.log(e)
						}
						if(!d){
							console.log('没有签到记录，push进数组')
							console.log(item)
							weiqiandao_stu.push(item)
							callb()
						}
						if(d){
							console.log('有签到记录')
							yiqiandao_stu.push(item)
							callb()
						}
					})
			},function(err){
				if(err){
					console.log('async eachLimit err')
					console.log(err)
					cb(err)
				}
				else{
					console.log('async eachLimit done')
					console.log('没签到人数 -- >',weiqiandao_stu.length)
					console.log('已签到人数 -- >',yiqiandao_stu.length)
					cb(null,weiqiandao_stu,info)
				}
			})
		},
		function(weiqiandao_stu,info,cb){
			for(let i=0;i<weiqiandao_stu.length;i++){
				weiqiandao_stu[i].meeting_name = info.meeting_info.meeting_name
				weiqiandao_stu[i].meeting_date = info.meeting_info.meeting_date
				//console.log(weiqiandao_stu[i].meeting_name)
				if(info.meeting_info.meeting_type == '1'){
					//console.log('ddddddd')
					weiqiandao_stu[i].meeting_type = '年级会议'
				}
				else{
					weiqiandao_stu[i].meeting_type = '非年级会议'
				}
				weiqiandao_stu[i].insert_time = '未签到'
				//console.log(weiqiandao_stu[i])
			}
			//console.log('check weiqiandao_stu -- >',weiqiandao_stu)
			info.weiqiandao_stu = weiqiandao_stu
			info.total = weiqiandao_stu.length
			info.offset = offset
			console.log(weiqiandao_stu)
			cb(null,info)
		}
	],function(error,result){
		if(error && error != 1){
			console.log('async final error')
			console.log(error)
			callback(error)
		}
		if(error && error == 1){
			console.log('async final error')
			console.log(result)
			callback(1,result)
		}
		if(!error && result){
			console.log('async finish')
			console.log(result)
			callback(null,result)
		}
	})
}

//下载excel，未签到学生名单
exports.downloadweiqiandao = function(randomStr,callback){
	console.log('check randomStr ---> ',randomStr)
	let weiqiandao_stu = new Array(),
		yiqiandao_stu = new Array()
	async.waterfall([
		function(cb){
			let search = meeting.findOne({})
				search.where('randomStr').equals(randomStr)
				search.exec(function(err,doc){
					if(err){
						console.log('search err')
						cb(err)
					}
					if(!doc){
						console.log('没有该会议信息')
						cb(1,'没有该会议信息')
					}
					if(doc){
						console.log('找到该会议')
						cb(null,doc)
					}
				})
		},
		function(doc,cb){
			console.log('检查该会议-->',doc)
			if(doc.meeting_type == '1'){
				console.log('----- 年级会议 -----')
				console.log('年级是 -- >',doc.meeting_nianji)
				let search = user.find({},{'gonghao':1,'xiaoyuankahao':1,'name':1,'_id':1,'nianji':1})
					search.where('nianji').equals(doc.meeting_nianji)
					search.exec(function(err,docs){
						if(err){
							console.log('search err')
							cb(err)
						}
						if(!docs){
							console.log('没有签到信息')
							cb(1,'没有签到信息')
						}
						if(docs){
							console.log('该年级总共有 -- > ',docs.length,'人')
							let info = {}
								info.meeting_info = doc
								info.stu = docs
							cb(null,info)
						}
					})

			}else{
				console.log('----- 非年级会议 暂时不做统计 -----')
			}
		},
		function(info,cb){
			 let temp_stu = info.stu
			// 	limit = parseInt(limit)
			// 	offset = parseInt(offset)
			// 	let numSkip = (offset)*limit
			// 	console.log('skip num is: ',numSkip)
			async.eachLimit(temp_stu,10,function(item,callb){
				let search = bmqd.findOne({})
					search.where('qiandao').equals('1')
					search.where('xiaoyuankahao').equals(item.xiaoyuankahao)
					search.where('randomStr').equals(info.meeting_info.randomStr)
					//search.limit(limit)
					//search.skip(numSkip)
					search.exec(function(e,d){
						if(e){
							console.log('eachLimit search err')
							console.log(e)
						}
						if(!d){
							console.log('没有签到记录，push进数组')
							console.log(item)
							weiqiandao_stu.push(item)
							callb()
						}
						if(d){
							console.log('有签到记录')
							yiqiandao_stu.push(item)
							callb()
						}
					})
			},function(err){
				if(err){
					console.log('async eachLimit err')
					console.log(err)
					cb(err)
				}
				else{
					console.log('async eachLimit done')
					console.log('没签到人数 -- >',weiqiandao_stu.length)
					console.log('已签到人数 -- >',yiqiandao_stu.length)
					cb(null,weiqiandao_stu,info)
				}
			})
		},
		function(weiqiandao_stu,info,cb){
			//以下为将数据封装成array数组。因为下面的方法里头只接受数组。
            let vac = new Array();
            for (let i = 0; i < weiqiandao_stu.length; i++) {
                let temp = new Array();
                temp[0] = i + 1
                temp[1] = weiqiandao_stu[i].name
                temp[2] = weiqiandao_stu[i].gonghao
                temp[3] = weiqiandao_stu[i].xiaoyuankahao
                temp[4] = weiqiandao_stu[i].nianji
                //temp[5] = (weiqiandao_stu[i].meeting_type) == "1" ? "年级会议":"非年级会议"
                temp[5] = weiqiandao_stu[i].insert_time = '未签到'
                vac.push(temp);
            };
			console.log('check vac -- >',vac)
			// info.weiqiandao_stu = weiqiandao_stu
			// //info.total = weiqiandao_stu.length
			// //info.offset = offset
			// console.log(weiqiandao_stu)
			info.vac = vac
			cb(null,info)
		}
	],function(error,result){
		if(error && error != 1){
			console.log('async final error')
			console.log(error)
			callback(error)
		}
		if(error && error == 1){
			console.log('async final error')
			console.log(result)
			callback(1,result)
		}
		if(!error && result){
			console.log('async finish')
			//console.log(result)
			callback(null,result)
		}
	})
}

//学生签到统计
exports.studentStatic = function(xiaoyuankahao,callback){
	console.log('学生签到统计')
	let time = moment().format('YYYY-MM-DD')
		console.log('check time --> ',time)
	let timeArr = time.split('-'),
		temp_year = timeArr[0],
		year = parseInt(temp_year),
		temp_month = timeArr[1],//09
		month = parseInt(temp_month)
		console.log('check year && month --> ',year,month)

	async.waterfall([
		function(cb){
			if((9 <= month <= 12) || month == 1){
				if(month == 1){
					console.log('1月份')
					let timeStr = (year-1) + '-09-01',
						beginTImeStamp = moment(timeStr,'YYYY-MM-DD').format('X'),
						nowTImeStamp = moment().format('X') 
						console.log('check begindate',timeStr)
						console.log('check beginTImeStamp && nowTImeStamp -->',beginTImeStamp,nowTImeStamp)
						let search = meeting.find({})
						search.where('meeting_date_timeStamp').gte(beginTImeStamp)
						search.where('meeting_date_timeStamp').lte(nowTImeStamp)
						search.exec(function(err,docs){
							if(err){
								console.log('search err')
								cb(err)
							}
							if(!docs){
								console.log('no meetings')
								cb(1,'没有会议')
							}
							if(docs){
								console.log('总会议数-->',docs.length)
								let num_nianjihuiyi = 0,
									num_feinianjihuiyi = 0
								for(let i=0;i<docs.length;i++){
									if(docs[i].meeting_type == '1'){
										num_nianjihuiyi++
									}else{
										num_feinianjihuiyi++
									}
								}
								console.log('年级会议数量 && 非年级会议数量--',num_nianjihuiyi,num_feinianjihuiyi)
								let huiyi_info = {
									huiyi : docs,
									huiyizongshu : docs.length,
									nianjihuiyishu : num_nianjihuiyi,
									feinianjihuiyishu : num_feinianjihuiyi
								}
								cb(null,huiyi_info)
							}
						})
				}else{
					console.log('9-12月份')
					//开始时间戳2017-09-01到当前时间戳
					let timeStr = year + '-' + temp_month + '-' + '01',
						beginTImeStamp = moment(timeStr,'YYYY-MM-DD').format('X'),
						nowTImeStamp = moment().format('X') 
						console.log('check begindate',timeStr)
					console.log('check beginTImeStamp && nowTImeStamp -->',beginTImeStamp,nowTImeStamp)
					let search = meeting.find({})
						search.where('meeting_date_timeStamp').gte(beginTImeStamp)
						search.where('meeting_date_timeStamp').lte(nowTImeStamp)
						search.exec(function(err,docs){
							if(err){
								console.log('search err')
								cb(err)
							}
							if(!docs){
								console.log('no meetings')
								cb(1,'没有会议')
							}
							if(docs){
								console.log('总会议数-->',docs.length)
								let num_nianjihuiyi = 0,
									num_feinianjihuiyi = 0
								for(let i=0;i<docs.length;i++){
									if(docs[i].meeting_type == '1'){
										num_nianjihuiyi++
									}else{
										num_feinianjihuiyi++
									}
								}
								console.log('年级会议数量 && 非年级会议数量-->',num_nianjihuiyi,num_feinianjihuiyi)
								let huiyi_info = {
									huiyi : docs,
									huiyizongshu : docs.length,
									nianjihuiyishu : num_nianjihuiyi,
									feinianjihuiyishu : num_feinianjihuiyi
								}
								cb(null,huiyi_info)
							}
						})
				}
			}else{
				console.log('2-7月份')
				//开始时间戳2017-02-01到当前时间戳
					let timeStr = year + '-' + temp_month + '-' + '01',
						beginTImeStamp = moment(timeStr,'YYYY-MM-DD').format('X'),
						nowTImeStamp = moment().format('X') 
						console.log('check begindate',timeStr)
					console.log('check beginTImeStamp && nowTImeStamp -->',beginTImeStamp,nowTImeStamp)
					let search = meeting.find({})
						search.where('meeting_date_timeStamp').gte(beginTImeStamp)
						search.where('meeting_date_timeStamp').lte(nowTImeStamp)
						search.exec(function(err,docs){
							if(err){
								console.log('search err')
								cb(err)
							}
							if(!docs){
								console.log('no meetings')
								cb(1,'没有会议')
							}
							if(docs){
								console.log('总会议数-->',docs.length)
								let num_nianjihuiyi = 0,
									num_feinianjihuiyi = 0
								for(let i=0;i<docs.length;i++){
									if(docs[i].meeting_type == '1'){
										num_nianjihuiyi++
									}else{
										num_feinianjihuiyi++
									}
								}
								console.log('年级会议数量 && 非年级会议数量--',num_nianjihuiyi,num_feinianjihuiyi)
								let huiyi_info = {
									huiyi : docs,
									huiyizongshu : docs.length,
									nianjihuiyishu : num_nianjihuiyi,
									feinianjihuiyishu : num_feinianjihuiyi
								}
								cb(null,huiyi_info)
							}
						})
			}
		},
		function(huiyi_info,cb){
			//查询学生签到情况
			if((9 <= month <= 12) || month == 1){
				if(month == 1){
					console.log('1月份')
					let timeStr = (year-1) + '-09-01',
						beginTImeStamp = moment(timeStr,'YYYY-MM-DD').format('X'),
						nowTImeStamp = moment().format('X') 
						console.log('check begindate',timeStr)
						console.log('check beginTImeStamp && nowTImeStamp -->',beginTImeStamp,nowTImeStamp)
						let search = bmqd.find({})
						search.where('insert_timeStamp').gte(beginTImeStamp)
						search.where('insert_timeStamp').lte(nowTImeStamp)
						search.where('qiandao').equals('1')
						search.where('xiaoyuankahao').equals(xiaoyuankahao)
						search.exec(function(err,docs){
							if(err){
								console.log('search err')
								cb(err)
							}
							if(!docs){
								console.log('no meetings')
								cb(1,'没有签到记录')
							}
							if(docs){
								console.log('学生签到总会议数-->',docs.length)
								let num_nianjihuiyi = 0,
									num_feinianjihuiyi = 0
								for(let i=0;i<docs.length;i++){
									if(docs[i].meeting_type == '1'){
										num_nianjihuiyi++
									}else{
										num_feinianjihuiyi++
									}
								}
								console.log('签到 年级会议数 && 非年级会议数--',num_nianjihuiyi,num_feinianjihuiyi)
								let stuqiandao_info = {
									huiyi_info:huiyi_info,
									huiyi : docs,
									huiyizongshu : docs.length,
									nianjihuiyishu : num_nianjihuiyi,
									feinianjihuiyishu : num_feinianjihuiyi,
									xueqi : year + '至' + (year+1) + '学年第一学期'
								}
								cb(null,stuqiandao_info)
							}
						})
				}else{
					console.log('9-12月份')
					//开始时间戳2017-09-01到当前时间戳
					let timeStr = year + '-' + temp_month + '-' + '01',
						beginTImeStamp = moment(timeStr,'YYYY-MM-DD').format('X'),
						nowTImeStamp = moment().format('X') 
						console.log('check begindate',timeStr)
					console.log('check beginTImeStamp && nowTImeStamp -->',beginTImeStamp,nowTImeStamp)
					let search = bmqd.find({})
						search.where('insert_timeStamp').gte(beginTImeStamp)
						search.where('insert_timeStamp').lte(nowTImeStamp)
						search.where('qiandao').equals('1')
						search.where('xiaoyuankahao').equals(xiaoyuankahao)
						search.exec(function(err,docs){
							if(err){
								console.log('search err')
								cb(err)
							}
							if(!docs){
								console.log('no meetings')
								cb(1,'没有会议')
							}
							if(docs){
								console.log('学生签到总会议数-->',docs.length)
								let num_nianjihuiyi = 0,
									num_feinianjihuiyi = 0
								for(let i=0;i<docs.length;i++){
									if(docs[i].meeting_type == '1'){
										num_nianjihuiyi++
									}else{
										num_feinianjihuiyi++
									}
								}
								console.log('学生 年级会议数 && 非年级会议数-->',num_nianjihuiyi,num_feinianjihuiyi)
								let stuqiandao_info = {
									huiyi_info:huiyi_info,
									huiyi : docs,
									huiyizongshu : docs.length,
									nianjihuiyishu : num_nianjihuiyi,
									feinianjihuiyishu : num_feinianjihuiyi,
									xueqi : year + '至' + (year+1) + '学年第一学期'
								}
								cb(null,stuqiandao_info)
							}
						})
				}
			}else{
				console.log('2-7月份')
				//开始时间戳2017-02-01到当前时间戳
					let timeStr = year + '-' + temp_month + '-' + '01',
						beginTImeStamp = moment(timeStr,'YYYY-MM-DD').format('X'),
						nowTImeStamp = moment().format('X') 
						console.log('check begindate',timeStr)
					console.log('check beginTImeStamp && nowTImeStamp -->',beginTImeStamp,nowTImeStamp)
					let search = bmqd.find({})
						search.where('insert_timeStamp').gte(beginTImeStamp)
						search.where('insert_timeStamp').lte(nowTImeStamp)
						search.where('qiandao').equals('1')
						search.where('xiaoyuankahao').equals(xiaoyuankahao)
						search.exec(function(err,docs){
							if(err){
								console.log('search err')
								cb(err)
							}
							if(!docs){
								console.log('no meetings')
								cb(1,'没有签到记录')
							}
							if(docs){
								console.log('学生签到总会议数-->',docs.length)
								let num_nianjihuiyi = 0,
									num_feinianjihuiyi = 0
								for(let i=0;i<docs.length;i++){
									if(docs[i].meeting_type == '1'){
										num_nianjihuiyi++
									}else{
										num_feinianjihuiyi++
									}
								}
								console.log('学生签到 年级会议数 && 非年级会议数-->',num_nianjihuiyi,num_feinianjihuiyi)
								let stuqiandao_info = {
									huiyi_info:huiyi_info,
									huiyi : docs,
									huiyizongshu : docs.length,
									nianjihuiyishu : num_nianjihuiyi,
									feinianjihuiyishu : num_feinianjihuiyi,
									xueqi : year + '至' + (year+1) + '学年第二学期'
								}
								cb(null,stuqiandao_info)
							}
						})
			}
		}
	],function(error,result){
		if(error && error != 1){
			console.log('async error')
			console.log(error)
			callback(error)
		}
		else if(error && error == 1){
			console.log('async error result -->',result)
			callback(1,result)
		}
		else{
			console.log('async end')
			console.log(result)
			callback(null,result)
		}
	})
}

exports.applyApproveQuery = function(limit,offset,begin_date,end_date,meeting_type,callback){
	//如果begin_date为空，取默认值2017-01-01,end_time为空，取当前时间戳
	if(!begin_date || typeof begin_date == 'undefined'){
		begin_date = moment('2017-01-01','YYYY-MM-DD').format('X')
		console.log('begin_date is null')
		console.log('check begin_date timeStamp',begin_date)
	}else{
		console.log('begin_date is not null')
		begin_date = moment(begin_date,'YYYY-MM-DD').format('X')
		console.log('check begin_date timeStamp',begin_date)
	}
	if(!end_date || typeof end_date == 'undefined'){
		end_date = moment().format('X')
		console.log('end_date is null ')
		console.log('check end_date timeStamp',end_date)
	}else{
		end_date = moment(end_date,'YYYY-MM-DD').add(1,'days').format('X')
		console.log('end_date is not null')
		console.log('check end_date timeStamp',begin_date)
	}
	if(meeting_type == '非年级会议'){
		console.log('----- 非年级会议 -----')
		async.waterfall([
			function(cb){
				let search = meeting.find({})
					search.where('meeting_type').equals('0')
					search.where('meeting_date_timeStamp').gte(begin_date)
					search.where('meeting_date_timeStamp').lte(end_date)
					search.exec(function(err,docs){
						if(err){
							console.log('----- search err -----')
							console.log(err.message)
							cb(err,null)
						}
						if(!docs || docs.length == 0){
							console.log('----- no result now -----')
							cb(1,1)
						}
						if(docs && docs.length !=0){
							console.log('check apply records that fetch condition: ',docs)
							cb(null,docs.length)
						}
					})
			},
			function(length,cb){
				console.log('数据总数-->',length)
				limit = parseInt(limit)
				offset = parseInt(offset)
				let numSkip = (offset)*limit
				console.log('skip num is: ',numSkip)
				let secondSearch = meeting.find({},{'meeting_name':1,'meeting_date':1,'meeting_time':1,'meeting_des':1,'meeting_type':1,'meeting_nianji':1,'apply_time':1,'zhouji':1,'_id':1,'randomStr':1})
					secondSearch.where('meeting_type').equals('0')
					secondSearch.where('meeting_date_timeStamp').gte(begin_date)
					secondSearch.where('meeting_date_timeStamp').lte(end_date)
					//secondSearch.select()
					secondSearch.sort({'apply_timeStamp':-1})
					secondSearch.limit(limit)
					secondSearch.skip(numSkip)
					secondSearch.exec(function(err,docs){
						if(err){
							console.log('----- search err -----')
							console.log(err.message)
							cb(err,null)
						}
						if(!docs || docs.length == 0){
							console.log('----- no result now -----')
							cb(1,1)
						}
						if(docs && docs.length != 0){
							
							for(let i=0;i<docs.length;i++){
								docs[i].meeting_date = docs[i].meeting_date + ' ' + docs[i].zhouji
								docs[i].meeting_nianji = '暂无'
								docs[i].meeting_type = '非年级会议'
							}
							docs = {
								 	total : length,
								 	docs : docs,
								 	offset : offset
								 }
							cb(null,docs)
						}
					})
			}
		],function(err,result){
			if(err && result == 1){
				console.log('----- async no records -----')
				callback(err,1)
			}
			else if(err && result == null){
				console.log('----- async err -----')
				callback(err,null)
			}
			else{//(result && result.length != 0)
				console.log('----- async final result -----')
				callback(null,result)
			}
		})
	}else{
		console.log('----- 年级会议 -----')
		async.waterfall([
			function(cb){
				let search = meeting.find({})
					search.where('meeting_type').equals('1')
					search.where('meeting_date_timeStamp').gte(begin_date)
					search.where('meeting_date_timeStamp').lte(end_date)
					//search.where('is_approved').equals('1')
					search.exec(function(err,docs){
						if(err){
							console.log('----- search err -----')
							console.log(err.message)
							cb(err,null)
						}
						if(!docs || docs.length == 0){
							console.log('----- no result now -----')
							cb(1,1)
						}
						if(docs && docs.length !=0){
							console.log('check apply records that fetch condition: ',docs)
							cb(null,docs.length)
						}
					})
			},
			function(length,cb){
				console.log('数据总数--> ',length)
				limit = parseInt(limit)
				offset = parseInt(offset)
				let numSkip = (offset)*limit
				console.log('skip num is: ',numSkip)
				let secondSearch = meeting.find({},{'meeting_name':1,'meeting_date':1,'meeting_time':1,'meeting_des':1,'meeting_type':1,'meeting_nianji':1,'apply_time':1,'zhouji':1,'_id':1,'randomStr':1})
					secondSearch.where('meeting_type').equals('1')
					secondSearch.where('meeting_date_timeStamp').gte(begin_date)
					secondSearch.where('meeting_date_timeStamp').lte(end_date)
					//secondSearch.select()
					//secondSearch.where('is_approved').equals('1')
					secondSearch.sort({'apply_timeStamp':-1})
					secondSearch.limit(limit)
					secondSearch.skip(numSkip)
					secondSearch.exec(function(err,docs){
						if(err){
							console.log('----- search err -----')
							console.log(err.message)
							cb(err,null)
						}
						if(!docs || docs.length == 0){
							console.log('----- no result now -----')
							cb(1,1)
						}
						if(docs && docs.length != 0){
							
							for(let i=0;i<docs.length;i++){								
								docs[i].meeting_date = docs[i].meeting_date + ' ' + docs[i].zhouji
								docs[i].meeting_type = '年级会议'

							}
							docs = {
								 	total : length,
								 	docs : docs,
								 	offset : offset
								 }
							cb(null,docs)
						}
					})
			}
		],function(err,result){
			if(err && result == 1){
				console.log('----- async no records -----')
				callback(err,1)
			}
			else if(err && result == null){
				console.log('----- async err -----')
				callback(err,null)
			}
			else{//(result && result.length != 0)
				console.log('----- async final result -----')
				callback(null,result)
			}
		})
	}
}

//添加会议室
exports.add_meeting_room = function(room_name,callback){
	async.waterfall([
		function(cb){//check the if the record is existed
			meeting_room.find({'room_name':room_name},function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.error(err)
					return cb(err)
				}
				if(!doc){
					console.log('----- room_name is not existed -----')
					return cb(null)
				}
				if(doc.length == 0){
					console.log('----- room_name is not existed -----')
					return cb(null)
				}
				if(doc){
					console.log('----- room_name is existed -----')
					console.log(doc)
					return cb(1,doc)
				}
				//cb(null)
			})
		},
		function(cb){
			var room = new meeting_room({
				room_name:room_name
			})
			room.save(function(err,doc){
				if(err){
					console.log('----- add err -----')
					console.error(err)
					cb(err)
				}
				console.log('----- add success -----')
				return cb(null,doc)
			})
		}
	],function(err,result){
		if(err && result){
			console.log('----- room_name is existed -----')
			callback(1)
		}
		else if(err && !result){
			console.log('----- async err -----')
		}
		else{
			console.log('----- final result -----')
			console.log(result)
			callback(result)
		}
	})
	
}
//返回一周会议室申请记录
exports.apply_record = function(week,callback){
	async.waterfall([
		function(cb){//获取所有会议室记录
			meeting_room.find({},'room_name',function(err,docs){
				if(err){
					console.log('----- search err -----')
					cb(err)
				}
				if(!docs || docs.length == 0){
					console.log('----- docs is null -----')
					cb(1)
				}
				if(docs && docs.length != 0){
					console.log('meeting_room: ',docs)
					cb(null,docs)
				}
			})
		},
		function(docs,cb){
			var list = new Array(),
				resultList = new Array()
			async.eachLimit(docs,1,function(item,cbb){
				console.log('----- check each docs -----')
				console.log(item)
				list.push(item.room_name)
				var dateArr = new Array()
					dateArr.push(moment().add(week,'week').format('MM月DD日'))
					dateArr.push(moment().add(week,'week').add(1,'days').format('MM月DD日'))
					dateArr.push(moment().add(week,'week').add(2,'days').format('MM月DD日'))
					dateArr.push(moment().add(week,'week').add(3,'days').format('MM月DD日'))
					dateArr.push(moment().add(week,'week').add(4,'days').format('MM月DD日'))
					dateArr.push(moment().add(week,'week').add(5,'days').format('MM月DD日'))
					dateArr.push(moment().add(week,'week').add(6,'days').format('MM月DD日'))

				console.log('dateArr:',dateArr)

				async.eachLimit(dateArr,1,function(val,cbbb){
					console.log('----- check dateArr val -----')
					console.log(val)
					var timeArr = new Array()
						timeArr.push('上午')
						timeArr.push('中午')
						timeArr.push('下午')
						timeArr.push('晚上')
					console.log('timeArr:',timeArr)
					async.eachLimit(timeArr,1,function(v,cbbbb){
						console.log('----- check timeArr val -----')
						//console.log(v)
						console.log('meeting_date && meeting_time && room_name',val,v,item.room_name)
						apply.find({'meeting_date':val,'meeting_time':v,'room_name':item.room_name},function(err,doc){
							if(err){
								console.log('----- search err -----')
							}
							if(!doc || doc.length ==0){
								console.log('----- doc is null -----')
								list.push('0')
								cbbbb()
							}
							if(doc && doc.length != 0) {
								var temp = '1'
								for(let k=0;k<doc.length;k++){
									//console.log(doc)
									if(doc[k].is_approved == 1){//有批准记录
										console.log('----- has is_approved -----')
										temp = '2'
									}
								}
								list.push(temp)
								cbbbb()
							}
						})
					},function(err){
							if(err){
								console.log('----- each timeArr err -----')
							}
							//console.log('list:',list)
							console.log('----- each timeArr finish -----')
							console.log('list length',list.length)
							//分割结果
							resultList = chunk(list,29)
							cbbb()		
					})
				},function(err){
					if(err){
						console.log('----- each dateArr err -----')
					}
					//resultList.push(list)
					//console.log('resultList:',resultList)
					console.log('----- each week days finish -----')
					console.log('resultList length',resultList.length)
					cbb()
				})
			},function(err){
				if(err){
					console.log('----- each docs err -----')
				}
				console.log('----- async waterfall finish -----')
				//console.log('resultList: ',resultList)
				cb(null,resultList)
			})
		}
	],function(err,result){
		if(err && err == 1){
			console.log('----- async err and result is null -----')
			callback(null)
		}
		else if(err && err != 1){
			console.log('----- async err -----')
			console.log(err.message)
		}
		else{
			console.log('----- async end and final result is -----')
			console.log(result)
			callback(result)
		}
	})
}
//获取点击查看申请详情
exports.get_meeting_detail = function(week,room_name,meeting_date,meeting_time,callback){
	console.log('check args: ',room_name,meeting_date,meeting_time)
	apply.find({'room_name':room_name,'meeting_date':meeting_date,'meeting_time':meeting_time},function(err,docs){
		if(err){
			console.log('----- find err -----')
			callback(err)
		}
		if(!docs || docs.length == 0){
			console.log('----- docs is null -----')
			return callback()
		}
		console.log('----- check docs -----')
		console.log(docs)
		callback(null,docs)
	})
}
//获取会议室，返回前端select
exports.select_room = function(callback){
	meeting_room.find({},function(err,docs){
		if(err){
			console.log('----- search err -----')
			callback(err)
		}
		if(!docs || docs.length == 0){
			console.log('----- docs is null -----')
			callback(1,null)
		}
		console.log(docs)
		let room_arr = new Array()
		for(let i=0;i<docs.length;i++){
			room_arr.push(docs[i].room_name)
		}
		console.log('----- check room_arr -----')
		console.log(room_arr)
		callback(null,room_arr)
	})
}
//添加申请记录
exports.apply = function(room_name,meeting_name,meeting_num,meeting_content,meeting_date,meeting_time,apply_name,apply_phone,exact_meeting_time,apply_email,callback){
	async.waterfall([
		function(cb){//检查该时间段会议室是否已被批准使用
			apply.find({'room_name':room_name,'meeting_date':meeting_date,'exact_meeting_time':exact_meeting_time,'is_approved':1},function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.error(err)
					return cb(err)
				}
				if(!doc || doc.length == 0){
					console.log('----- 没有批准记录 -----')
					cb(null)
				}
				if(doc && doc.length != 0){
					console.log('----- 已有批准记录 -----')
					console.log(doc)
					cb(1,doc)
				}
			})
		},
		function(cb){//当同一个人连续点两次提交，申请的是同一条记录的时候，返回提示
			apply.find({'room_name':room_name,'meeting_date':meeting_date,'exact_meeting_time':exact_meeting_time,'apply_name':apply_name},function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.log(err.message)
					return cb(err)
				}
				if(!doc || doc.length == 0){
					console.log('----- 同一申请人没有重复申请 -----')
					cb(null)
				}
				if(doc && doc.length != 0){
					console.log('----- 同一申请人相同时间重复申请 -----')
					console.log(doc)
					cb(1,2)
				}
			})
		},
		function(cb){
			var new_apply = new apply({
				room_name : room_name,
				meeting_name : meeting_name,
				meeting_num : meeting_num,
				meeting_content : meeting_content,
				meeting_date : meeting_date,
				meeting_time : meeting_time,
				apply_name : apply_name,
				apply_phone : apply_phone,
				exact_meeting_time : exact_meeting_time,
				apply_time : moment().format('YYYY-MM-DD HH:mm:ss'),
				email :apply_email
			})
			console.log(new_apply)
			new_apply.save(function(err,doc){
				if(err){
					console.log('----- save err -----')
					console.error(err)
					return cb(err)
				}
				console.log('---- save success -----')
				console.log('new_apply: ',doc)
				cb(null,doc)
			})
		}
	],function(err,result){
		if(err && result != 2){
			console.log('----- 已有批准记录 -----')
			return callback(null,1)
		}
		if(err && result == 2){
			console.log('----- async 重复申请 -----')
			return callback(null,2)
		}
		if(err){
			console.log('----- async err -----')
			return callback(err)
		}
		callback(null,result)
	})
}
//添加申请记录(分割时间)
exports.applyTwo = function(attribute,callback){
	var room_name = attribute.room_name,
		meeting_name = attribute.meeting_name,
		meeting_num = attribute.meeting_num,
		meeting_content = attribute.meeting_content,
		apply_name = attribute.apply_name,
		apply_phone = attribute.apply_phone,
		meeting_date = attribute.meeting_date,
		meeting_time = attribute.meeting_time,
		exact_meeting_time = attribute.exact_meeting_time,
		apply_email = attribute.apply_email,
		first_hour = attribute.first_hour,
		first_minute = attribute.first_minute,
		second_hour = attribute.second_hour,
		second_minute = attribute.second_minute
	console.log('first_hour-->',first_hour,'second_hour-->',second_hour,'first_minute-->',first_minute,'second_minute-->',second_minute)
	async.waterfall([
		function(cb){//检查申请时间段会议室是否已被批准使用
			//情况1：审批结果的结束时间(second_minute)为00的时候
			let search = apply.find({})
				search.where('room_name').equals(room_name)
				search.where('meeting_date').equals(meeting_date)
				search.where('is_approved').equals('1')
				search.where('second_minute').equals('00')
				search.where('meeting_time').equals(meeting_time)
				search.where('second_hour').gt(first_hour)
				search.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						console.log(err.message)
						 cb(err)
					}
					if(!docs || docs.length == 0){
						console.log('----- 没有批准记录(情况1) -----')
						 cb(null)
					}
					if(docs && docs.length != 0){
						console.log('----- 已有批准记录(时间段冲突(情况1)) -----')
						cb(1,docs)
					}
				})
		},
		function(cb){
			//情况2，审批结果的结束时间(second_minute)为30并且新申请first_hour小于second_hour的时候
			let search = apply.find({})
				search.where('room_name').equals(room_name)
				search.where('meeting_date').equals(meeting_date)
				search.where('is_approved').equals('1')
				search.where('second_minute').equals('30')
				search.where('meeting_time').equals(meeting_time)
				search.where('second_hour').gt(first_hour)
				search.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						console.log(err.message)
						cb(err)
					}
					if(!docs || docs.length == 0){
						console.log('----- 没有批准记录(情况2) -----')
						 cb(null)
					}
					if(docs && docs.length != 0){
						console.log('----- 已有批准记录(时间段冲突(情况2--新申请开始时间冲突)) -----')
						console.log(docs)
						cb(1,docs)
					}
				})
		},
		function(cb){
			let search = apply.find({})
				search.where('room_name').equals(room_name)
				search.where('meeting_date').equals(meeting_date)
				search.where('is_approved').equals('1')
				search.where('second_minute').equals('30')
				search.where('second_hour').equals(first_hour)
				search.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						console.log(err.message)
						cb(err)
					}
					if(!docs || docs.length == 0){
						console.log('----- 没有批准记录(情况2) -----')
						 cb(null)
					}
					if(docs && docs.length !=0 && first_minute == '00'){
						console.log('----- 已有批准记录(时间段冲突(情况3--新申请开始时间冲突)) -----')
						cb(1,docs)
					}
					if(docs && docs.length !=0 && first_minute == '30'){
						console.log('----- 情况3没有冲突 -----')
						cb(null)
					}
				})
		},
		function(cb){
			apply.find({'room_name':room_name,'meeting_date':meeting_date,'exact_meeting_time':exact_meeting_time,'apply_name':apply_name},function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.log(err.message)
					return cb(err)
				}
				if(!doc || doc.length == 0){
					console.log('----- 同一申请人没有重复申请 -----')
					cb(null)
				}
				if(doc && doc.length != 0){
					console.log('----- 同一申请人相同时间重复申请 -----')
					console.log(doc)
					cb(1,2)
				}
			})
		},
		function(cb){
			let for_week_use_1 = meeting_date.substring(0,2),
				for_week_use_2 = meeting_date.substring(3,5),
				week_day_use = '2017-' + for_week_use_1 + '-' + for_week_use_2

			var new_apply_Two = new apply({
				room_name : room_name,
				meeting_name : meeting_name,
				meeting_num : meeting_num,
				meeting_content : meeting_content,
				meeting_date : meeting_date,
				meeting_time : meeting_time,
				apply_name : apply_name,
				apply_phone : apply_phone,
				exact_meeting_time : exact_meeting_time,
				apply_time : moment().format('YYYY-MM-DD HH:mm:ss'),
				email :apply_email,
				first_hour : first_hour,
				second_hour : second_hour,
				first_minute : first_minute,
				second_minute : second_minute,
				week_day : moment(week_day_use).format('dddd')
			})
			console.log(new_apply_Two)

			new_apply_Two.save(function(err,doc){
				if(err){
					console.log('----- save err -----')
					console.error(err)
					return cb(err)
				}
				console.log('---- save success -----')
				console.log('new_apply_Two-->',doc)
				cb(null,doc)
			})
		}
	],function(err,result){
		if(err && result != 2){
			console.log('----- 已有批准记录 -----')
			return callback(null,1)
		}
		if(err && result == 2){
			console.log('----- async 重复申请 -----')
			return callback(null,2)
		}
		if(err){
			console.log('----- async err -----')
			return callback(err)
		}
		callback(null,result)
	})
}
//add admin user
exports.addAdminUser = function(username,password,callback){
	admin.find({'username':username},function(err,doc){
		if(err){
			console.log('----- search err -----')
			callback(err,null)
		}
		if(!doc || doc.length == 0){
			console.log('----- username is not existed and can be add -----')
			let newUser = new admin({
				username : username,
				password : password
			})
			console.log('new adminUser: ',newUser)
			newUser.save(function(error,doc){
				if(error){
					console.log('----- save err -----')
					callback(error)
				}
				console.log('----- save success -----')
				callback(null,doc)
			})
		}
		if(doc && doc.length != 0){
			console.log('----- username is existed -----')
			callback(1,1)
		}
	})
}
//checkLogin
// exports.checkLogin = function(username,password,callback){
// 	async.waterfall([
// 		function(cb){
// 			admin.find({'username':username},function(err,doc){
// 				if(err){
// 					console.log('----- search err -----')
// 					cb(err,null)
// 				}
// 				if(!doc || doc.length == 0){
// 					console.log('----- username not existed -----')
// 					cb(1,1)
// 				}
// 				if(doc && doc.length != 0){
// 					console.log('----- check admin detail -----')
// 					console.log(doc)
// 					cb(null,doc[0])
// 				}
// 			})
// 		},
// 		function(doc,cb){
// 			if(doc.password == password){
// 				console.log('----- login confirm -----')
// 				cb(null,doc)
// 			}
// 		}
// 	],function(err,result){
// 		if(err && result == 1){
// 			console.log('----- admin not existed -----')
// 			callback(1,1)
// 		}
// 		if(err && result == null){
// 			console.log('----- async err -----')
// 			callback(err,null)
// 		}
// 		if(err == null){
// 			console.log('----- final check -----')
// 			callback(null,result)
// 		}
		
// 	})
// }
//get applyRecord for applier to check
exports.applyRecord = function(limit,offset,applier,callback){
	console.log('applier is -->',applier)
	async.waterfall([
		function(cb){
			let query = apply.find({})
				query.where('apply_name').equals(applier)
				query.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						console.log(err.message)
						cb(err,null)
					}
					if(!docs || docs.length == 0){
						console.log('----- no result now -----')
				 		cb(1,1)
					}
					if(docs && docs.length != 0){
						cb(null,docs.length)
					}
				})
		},
		function(length,cb){
			console.log('total records num -->',length)
			limit = parseInt(limit)
			offset = parseInt(offset)
			let numSkip = (offset) * limit
			console.log('skip num is -->',numSkip)
			let search = apply.find({},{'room_name':1,'meeting_name':1,'meeting_date':1,'exact_meeting_time':1,'meeting_content':1,'apply_time':1,'meeting_num':1,'apply_name':1,'apply_phone':1,'is_approved':1,'_id':1,'is_allowed':1,'week_day':1})
				search.where('apply_name').equals(applier)
				search.sort({'apply_time':-1})
				search.limit(limit)
				search.skip(numSkip)
				search.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						console.log(err.message)
						cb(err,null)
					}
					if(!docs || docs.length == 0){
						console.log('----- no result now -----')
						cb(1,1)
					}
					if(docs && docs.length !=0){//格式化并将length加入
						for(let i=0;i<docs.length;i++){
							//格式化时间戳
							//docs[i].apply_time = moment(docs[i].apply_time).format('YYYY-MM-DD HH:mm:ss')
							//console.log('check applytime : ',docs[i].apply_time)
							if(typeof(docs[i].week_day) == 'undefined'){
								docs[i].week_day = ''
							}

							docs[i].exact_meeting_time = docs[i].meeting_date + ' ' + docs[i].week_day + ' ' + docs[i].exact_meeting_time 
							console.log('docs.is_approved: ',docs[i].is_approved)
							console.log('docs.is_allowed: ',docs[i].is_allowed)
							console.log(docs[i])
							if(docs[i].is_approved == 0 && docs[i].is_allowed == 0){
								console.log('--- check here -----')
								docs[i].is_approved = '未审批'
								console.log(docs[i].is_approved)
							}
							else if(docs[i].is_approved == 1 && docs[i].is_allowed == 0){
								console.log('--- check here -----')
								docs[i].is_approved = '已批准'
								console.log(docs[i].is_approved)
							}
							else{//docs[i].is_approved == 0 && docs[i].is_allowed == 1
								console.log('----- check here hrere -----')
								docs[i].is_approved = '未批准'
							}
						}

						 docs = {
						 	total : length,
						 	docs : docs,
						 	offset : offset
						 }
						 cb(null,docs)
					}
				})
		}
	],function(err,result){
		if(err && result == 1){
				console.log('----- async no records -----')
				callback(err,1)
			}
			else if(err && result == null){
				console.log('----- async err -----')
				callback(err,null)
			}
			else{//(result && result.length != 0)
				console.log('----- async final result -----')
				callback(null,result)
			}
	})
}

exports.applyRecordQuery = function(limit,offset,begin_date,end_date,applier,callback){
	console.log('applier is-->',applier)
	//如果begin_date为空，取默认值2017-01-01,end_time为空，取当前时间戳
	if(!begin_date || typeof begin_date == 'undefined'){
		begin_date = moment('2017-01-01','YYYY-MM-DD').format('X')
		console.log('begin_date is null')
		console.log('check begin_date timeStamp',begin_date)
	}else{
		console.log('begin_date is not null')
		begin_date = moment(begin_date,'YYYY-MM-DD').format('X')
		console.log('check begin_date timeStamp',begin_date)
	}
	if(!end_date || typeof end_date == 'undefined'){
		end_date = moment().format('X')
		console.log('end_date is null ')
		console.log('check end_date timeStamp',end_date)
	}else{
		end_date = moment(end_date,'YYYY-MM-DD').add(1,'days').format('X')
		console.log('end_date is not null')
		console.log('check end_date timeStamp',begin_date)
	}
	async.waterfall([
		function(cb){
			let search = apply.find({})
				search.where('apply_name').equals(applier)
				search.where('apply_timeStamp').gte(begin_date)
				search.where('apply_timeStamp').lte(end_date)
				search.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						console.log(err.message)
						cb(err,null)
					}
					if(!docs || docs.length == 0){
						console.log('----- no result now -----')
						cb(1,1)
					}
					if(docs && docs.length !=0){
						console.log('check apply records that fetch condition-->',docs)
						cb(null,docs.length)
					}
				})
		},
		function(length,cb){
			console.log('check records length-->',length)
			limit = parseInt(limit)
			offset = parseInt(offset)
			let numSkip = (offset)*limit
			console.log('skip num is: ',numSkip)
			let secondSearch = apply.find({},{'room_name':1,'meeting_name':1,'meeting_date':1,'exact_meeting_time':1,'meeting_content':1,'apply_time':1,'meeting_num':1,'apply_name':1,'apply_phone':1,'is_approved':1,'_id':1,'is_allowed':1,'week_day':1})
				secondSearch.where('apply_name').equals(applier)
				secondSearch.where('apply_timeStamp').gte(begin_date)
				secondSearch.where('apply_timeStamp').lte(end_date)
				secondSearch.sort({'apply_time':-1})
				secondSearch.limit(limit)
				secondSearch.skip(numSkip)
				secondSearch.exec(function(err,docs){
					if(err){
						console.log('----- search err -----')
						console.log(err.message)
						cb(err,null)
					}
					if(!docs || docs.length == 0){
						console.log('----- no result now -----')
						cb(1,1)
					}
					if(docs && docs.length != 0){
						
						for(let i=0;i<docs.length;i++){
							if(typeof(docs[i].week_day) == 'undefined'){
								docs[i].week_day = ''
							}
							docs[i].exact_meeting_time = docs[i].meeting_date + ' ' + docs[i].week_day + ' ' + docs[i].exact_meeting_time
							console.log('docs.is_approved: ',docs[i].is_approved)
							if(docs[i].is_approved == 1){
								console.log('--- check here -----')
								docs[i].is_approved = '已批准'
								console.log(docs[i].is_approved)
							}
							else{
								console.log('----- check here hrere -----')
								docs[i].is_approved = '未批准'
							}
						}
						docs = {
							 	total : length,
							 	docs : docs,
							 	offset : offset
							 }
						cb(null,docs)
					}
				})
		}
	],function(err,result){
		if(err && result == 1){
			console.log('----- async no records -----')
			callback(err,1)
		}
		else if(err && result == null){
			console.log('----- async err -----')
			callback(err,null)
		}
		else{//(result && result.length != 0)
			console.log('----- async final result -----')
			callback(null,result)
		}
	})
}
//get apply for approve matching query date

//applyDetail
exports.applyDetail = function(_id,callback){
	apply.findOne({'_id':_id},function(err,doc){
		if(err){
			console.log('----- search err -----')
			console.log(e.message)
			callback(err,null)
		}
		if(!doc || doc.length == 0){
			console.log('----- no result -----')
			callback(1,1)
		}
		if(doc && doc.length != 0){
			console.log('----- check doc -----')
			console.log(doc)
			callback(null,doc)
		}
	})
}
//delete apply record
exports.deleteRecord = function(_id,check_delete,callback){
	if(check_delete == 1){
		apply.remove({'_id':_id},function(err){
			if(err){
				console.log('----- delete record err -----')
				console.log(err.message)
				callback(err,null)
			}
			console.log('----- delete record success -----')
			callback(null)
		})
	}
}
//updateApprove and send email to notice applier
exports.updateApprove = function(_id,is_approved,callback){
	//{$set:{name:'MDragon'}}
	if(is_approved == 1){
		apply.update({'_id':_id},{$set:{'is_approved':is_approved}},function(err){
			if(err){
				console.log('----- update err -----')
				console.log(err.message)
				callback(err,null)
			}
			console.log('----- update success -----')
			//find this record and send a email
			apply.findOne({'_id':_id},function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.log(err.message)
				}else{
					let sendTo = doc.email
					console.log('check email: ',sendTo)
					data.to = sendTo
					data.html = '您好，你申请的 <strong>'+doc.room_name+' </strong>已通过审批,会议时间: <strong style="color:red">' + doc.meeting_date + ' ' + doc.exact_meeting_time + '</strong>。'
					console.log('check send data: ',data)
					transporter.sendMail(data,function(err,info){
						if(err){
							console.log('----- send email err -----')
							console.log(err.message)
						}else{
							console.log('message sent: ',info.response)
							callback(null)
						}
					})
				}
			})
			//callback(null)
		})
	}else{//send email to inform applier the result is not pass
		console.log('is_approved is -->',is_approved)
		apply.update({'_id':_id},{$set:{'is_allowed':1}},function(err){
			if(err){
				console.log('----- update err -----')
				console.log(err.message)
				callback(err,null)
			}
			console.log('----- update success -----')
			apply.findOne({'_id':_id},function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.log(err.message)
				}else{
					let sendTo = doc.email
					console.log('check email-->',sendTo)
					data.to = sendTo
					if(doc.room_name == '624小教室--有电脑(68人)' || doc.room_name == '623会议室--无电脑(16-24人)'){
						data.html = '您好，你申请的 <strong>'+doc.room_name+' </strong>已被占用,会议时间: <strong style="color:red">' + doc.meeting_date + ' ' + doc.exact_meeting_time + '</strong>，特殊情况请联系管理员 曾小告(15220159520)。'
					}
					else if(doc.room_name == '1楼报告厅--无电脑(452人)'){
						data.html = '您好，你申请的 <strong>'+doc.room_name+' </strong>已被占用,会议时间: <strong style="color:red">' + doc.meeting_date + ' ' + doc.exact_meeting_time + '</strong>，特殊情况请联系管理员 冯春(13603010438)。'
					}
					else if(doc.room_name == '412会议室--无电脑(11人)'){
						data.html = '您好，你申请的 <strong>'+doc.room_name+' </strong>已被占用,会议时间: <strong style="color:red">' + doc.meeting_date + ' ' + doc.exact_meeting_time + '</strong>，特殊情况请联系管理员 余芳(13760178106)。'
					}
					else{
						data.html = '您好，你申请的 <strong>'+doc.room_name+' </strong>已被占用,会议时间: <strong style="color:red">' + doc.meeting_date + ' ' + doc.exact_meeting_time + '</strong>，特殊情况请联系管理员 李雅丽(15818677129)。'
					}
					console.log('check send data: ',data)
					transporter.sendMail(data,function(err,info){
						if(err){
							console.log('----- send email err -----')
							console.log(err.message)
						}else{
							console.log('message sent: ',info.response)
							callback(null)
						}
					})
				}
			})
		})
	}
}
//测试添加申请记录
exports.test_apply = function(room_name,meeting_name,meeting_num,meeting_content,meeting_date,meeting_time,apply_name,apply_phone,callback){
	async.waterfall([
		function(cb){//检查该时间段会议室是否已被批准使用
			apply.find({'room_name':room_name,'meeting_date':meeting_date,'meeting_time':meeting_time,'is_approved':1},function(err,doc){
				if(err){
					console.log('----- search err -----')
					console.error(err)
					return cb(err)
				}
				if(!doc || doc.length == 0){
					console.log('----- 没有申请 -----')
					cb(null)
				}
				if(doc && doc.length != 0){
					console.log('----- 已有批准记录 -----')
					console.log(doc)
					cb(1,doc)
				}
			})
		},
		function(cb){
			var new_apply = new apply({
				room_name : room_name,
				meeting_name : meeting_name,
				meeting_num : meeting_num,
				meeting_content : meeting_content,
				meeting_date : meeting_date,
				meeting_time : meeting_time,
				apply_name : apply_name,
				apply_phone : apply_phone,
				apply_timeStamp : moment().format('X')
			})
			console.log('new_apply: ',new_apply)
			new_apply.save(function(err,doc){
				if(err){
					console.log('----- save err -----')
					console.error(err)
					return cb(err)
				}
				console.log('---- save success -----')
				console.log('new_apply: ',doc)
				cb(null,doc)
			})
		}
	],function(err,result){
		if(err && result){
			console.log('----- 已有批准记录 -----')
			return callback(null,1)
		}
		if(err){
			console.log('----- async err -----')
			return callback(err)
		}
		callback(null,result)
	})
}
//删除无效审批记录
exports.deleteApprove = function(ids,callback){
	if(typeof ids != 'object'){
		console.log('typeof ids --->',typeof ids)
		console.log('----- delete only one record -----')
		console.log('id is --->',ids)
		apply.remove({'_id':ids},function(err){
			console.log('remove')
			if(err){
				console.log('----- delete record err -----')
				console.log(err.message)
				callback(err,null)
			}
			console.log('----- delete record success -----')
			callback(null)
		})
	}
	else{
		console.log('----- delete more than one record -----')
		console.log('ids are --->',ids)
		async.eachLimit(ids,1,function(item,cb){
			apply.remove({'_id':item},function(err){
				console.log('check item --->',item)
				if(err){
					console.log('----- delete record err -----')
					console.log(err.message)
					cb(err,null)
				}
				console.log('----- delete records success -----')
				cb()
			})
		},function(err){
			if(err){
				console.log('----- async each err -----')
				console.log(err.message)
				callback(err,null)
			}
			console.log('----- delete all applyApprove success -----')
			callback(null)
		})
	}
}
