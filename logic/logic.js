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
						meeting_time:info.meeting.meeting_time,
						insert_time:moment().format('YYYY-MM-DD hh:mm:ss')
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
		function(doc,cb){//年级所有人
			console.log('检查该会议-->',doc)
			if(doc.meeting_type == '1'){
				console.log('----- 年级会议 -----')
				console.log('年级是 -- >',doc.meeting_nianji)
				let search = user.find({},{'gonghao':1,'xiaoyuankahao':1,'name':1,'_id':1,'nianji':1})
					search.where('nianji').equals(doc.meeting_nianji)
					// search.limit(limit)
					// search.skip(numSkip)
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
								info.zong_length = docs.length
							cb(null,info,doc)
						}
					})

			}else{
				console.log('----- 非年级会议 暂时不做统计 -----')
			}
		},
		/*function(info,doc,cb){
			console.log('检查该会议-->',doc)
			if(doc.meeting_type == '1'){
				limit = parseInt(limit)
				offset = parseInt(offset)
				let numSkip = (offset)*limit
				console.log('limit -->',limit)
				console.log('skip num is: ',numSkip)

				console.log('----- 年级会议 -----')
				console.log('年级是 -- >',doc.meeting_nianji)
				let search = user.find({},{'gonghao':1,'xiaoyuankahao':1,'name':1,'_id':1,'nianji':1})
					search.where('nianji').equals(doc.meeting_nianji)
					search.limit(limit)
					search.skip(numSkip)
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
							console.log('符合条件有 -- > ',docs.length,'人')
							//let info = {}
								//info.meeting_info = doc
								info.stu = docs
								//info.zong_length = docs.length
							cb(null,info,doc)
						}
					})

			}else{
				console.log('----- 非年级会议 暂时不做统计 -----')
			}
		},*/
		function(info,doc,cb){//总未签到人数
			let temp_stu = info.stu;
			async.eachLimit(temp_stu,10,function(item,callb){
				let search = bmqd.findOne({})
					search.where('qiandao').equals('1')
					search.where('xiaoyuankahao').equals(item.xiaoyuankahao)
					search.where('randomStr').equals(info.meeting_info.randomStr)
					search.exec(function(e,d){
						if(e){
							console.log('eachLimit search err')
							console.log(e)
							callb(e)
						}
						if(!d){
							console.log('没有签到记录，push进数组')
							//console.log(item)
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
			limit = parseInt(limit)
			offset = parseInt(offset)
			let numSkip = (offset)*limit
			console.log('limit -->',limit)
			console.log('skip num is: ',numSkip)
			let temp_weiqiandao_stu = new Array()
			
			for(let k=0;k<limit;k++){
				//let m=limit*(k+1)
				if(weiqiandao_stu[numSkip+k])
					temp_weiqiandao_stu.push(weiqiandao_stu[numSkip+k])  
			}
			console.log('temp_weiqiandao_stu',temp_weiqiandao_stu)
			console.log('weiqiandao_stu',weiqiandao_stu)
			//console.log('check weiqiandao_stu -- >',weiqiandao_stu)
			info.weiqiandao_stu = temp_weiqiandao_stu
			info.total = weiqiandao_stu.length
			info.offset = offset
			//console.log(weiqiandao_stu)
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
					let timeStr = year + '-' + '09' + '-' + '01',
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
					let timeStr = year + '-' + '09' + '-' + '01',
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

