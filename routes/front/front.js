/**
 *  @Author:    chenrongxin
 *  @Create Date:   2017-07-31
 *  @Description:   前台所有路由
 */
var express = require('express')
var router = express.Router()
var logic = require('../../logic/logic')
const moment = require('moment')
moment.locale('zh-cn')
//var logger = require('../../log/logConfig').logger
//var logic = require('../../logic/logic')

const request = require('request')
const Url = require('url')
const parseString = require('xml2js').parseString;
const async = require('async')
//https://authserver.szu.edu.cn/authserver/login?service=
let MyServer = "http://116.13.96.53:81",
	//CASserver = "https://auth.szu.edu.cn/cas.aspx/",
	CASserver = 'https://authserver.szu.edu.cn/authserver/',
	ReturnURL = "http://116.13.96.53:81";

//用户登录
router.get('/login',function(req,res){
	return res.render('front/login')
}).post('/login',function(req,res){
	console.log('----- in login router -----')
	logic.checkLogin(req.body,function(error,result){
		if((error && error !=1) || (error && error != 2)){
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(error == null && result == 1){
			return res.json({'errCode':-1,'errMsg':'用户不存在'})
		}
		if(error == null && result == 2){
			console.log('ddd')
			return res.json({'errCode':-1,'errMsg':'密码错误'})
		}
		if(error == null && result){
			console.log(result)
			req.session.user = result
			return res.json({'errCode':0,'Msg':'登录成功'})
		}
	})
})

//用户退出
router.get('/logout',function(req,res){
	console.log('----- in router logout -----')
	req.session.user = null;
    req.session.error = null;
    return res.redirect("/front/login");
})

//概览页面
router.get('/overview',function(req,res){
	if(!req.session.user){
		console.log('----- user not login -----')
		return res.redirect('/front/login')
	}
	return res.render('front/overview',{name:req.session.user.name})
})

//创建会议界面
router.get('/create',function(req,res){
	if(!req.session.user){
		console.log('----- user not login -----')
		return res.redirect('/front/login')
	}
	return res.render('front/create',{name:req.session.user.name})
}).post('/create',function(req,res){
	console.log('----- create router -----')
	logic.createMeeting(req.body,function(error,result){
		if(error){
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(result && result.length != 0){
			return res.json({'errCode':0,'result':result})
		}
	})
})

//二维码页面
router.get('/qrcode',function(req,res){
	if(!req.session.user){
		console.log('----- user not login -----')
		return res.redirect('/front/login')
	}
	//获取近一周的会议，供选择
	logic.select_meeting(function(error,result){
		if(error){
			//error 
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(result == null || result.length == 0){
			//no meeting 
			return res.json({'errCode':-1,'errMsg':'result is null'})
		}
		//have meetings 
		return res.render('front/qrcode',{'result':result,'name':req.session.user.name})
	})
})

//临时添加用户接口
router.get('/adduser',function(req,res){
	logic.adduser(function(error,result){
		if(error){
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(result == null || result.length == 0){
			return res.json({'errCode':0,'Msg':'save success'})
		}
	})
})

//手工签到页面
router.get('/sgqd',function(req,res){
	if(!req.session.user){
		console.log('----- user not login -----')
		return res.redirect('/front/login')
	}
	//获取近一周的会议，供选择
	logic.select_meeting(function(error,result){
		if(error){
			//error 
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(result == null || result.length == 0){
			//no meeting 
			return res.json({'errCode':-1,'errMsg':'result is null'})
		}
		//have meetings 
		return res.render('front/sgqd',{'result':result,'name':req.session.user.name})
	})
}).post('/sgqd',function(req,res){
	console.log('----- 手工签到router -----')
	logic.sgqd(req.body,function(error,result){
		if(error && result == null){
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(error == 1 && result ==1){
			return res.json({'errCode':-1,'errMsg':'该卡号已签到过，不能重复签到！'})
		}
		if(result == null || result.length == 0){
			return res.json({'errCode':0,'Msg':'签到成功'})
		}
	})
})

//检查用户是否存在
router.post('/checkUserExist',function(req,res){
	console.log('----- in router checkUserExist -----')
	logic.checkUserExist(req.body,function(error,result){
		if(error){
			console.log('----- router error -----')
			return 
		}
		if(result == null){
			return res.json({'valid':false})
		}
		if(result){
			return res.json({'valid':true})
		}
	})
})

//match
function pipei(str,arg){
	let zhengze = '<cas:' + arg + '>(.*)<\/cas:' + arg + '>' 
	//console.log('check zhengze -->',zhengze)
	let res = str.match(zhengze)
	if(res){
		//console.log('res -->',res[1])
		return res[1]
	}else{
		return null
	}
	
}

//临时注销接口
router.get('/zhuxiao',function(req,res){
	console.log('----- logout -----')
	let ReturnURL = 'http://' + req.headers.host + req.originalUrl +'_'
	let url = 'https://auth.szu.edu.cn/cas.aspx/' + 'logout?ReturnUrl=' + ReturnURL
	console.log('check redirecturl -->',url)
	return res.redirect(url)
})
router.get('/zhuxiao_',function(req,res){
	return res.json({'errCode':0,'errMsg':'已注销！'})
})

//报名接口http://116.13.96.53:81/front/baoming/?r=766k5a&b=1
//http://qiandao.szu.edu.cn:81/front/baoming/?r=766k5a&b=1
router.get('/baoming',function(req,res){
		if(!req.query.ticket){//没有用户信息，进行验证
			console.log('here --> 1')
			let ReturnURL = 'http://' + req.headers.host + req.originalUrl //http://116.13.96.53:81/front/baoming/
			console.log('ReturnURL url-->',ReturnURL)
			console.log('----- 没有ticket -----')
			console.log('没有 session')
			let url = CASserver + 'login?service=' + ReturnURL
			console.log('check redirecturl -->',url)
			console.log('跳转获取ticket')
			return res.redirect(url)
			if(req.session.student){
				console.log('有session ----- 1')
				console.log('session-->',req.session.student)
				logic.getMeetingDetail_1(req.session.student,function(error,result){
					if(error && !result){
						console.log('----- baoming router error -----')
						return res.json({'errCode':-1,'errMsg':'数据库出错！'})
					}
					if(result == null){
						console.log('----- baoming router result null -----')
						return res.json({'errCode':-1,'errMsg':'没有该会议信息！'})
					}
					if(result && result == '已经报名！'){
						console.log('----- baoming router you session -----')
						console.log('重定向')
						return res.redirect('../yibaoming')
					}
					if(result && result != '已经报名！'){
						console.log('----- baoming router you session -----')
						return res.render('front/baoming',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
					}
				})
			}
		}
		else{
			if(req.session.student){
				console.log('有session ------ 2')
				console.log('session-->',req.session.student)
				logic.getMeetingDetail_1(req.session.student,function(error,result){
					if(error && !result){
						console.log('----- baoming router error -----')
						return res.json({'errCode':-1,'errMsg':'数据库出错！'})
					}
					if(result == null){
						console.log('----- baoming router result null -----')
						return res.json({'errCode':-1,'errMsg':'没有该会议信息！'})
					}
					if(result && result == '已经报名！'){
						console.log('----- baoming router you session -----')
						console.log('重定向')
						return res.redirect('../yibaoming')
					}
					if(result && result != '已经报名！'){
						console.log('----- baoming router you session -----')
						return res.render('front/baoming',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
					}
				})
			}
			else{
				console.log('here --> 2')
				let ReturnURL = 'http://' + req.headers.host + req.originalUrl //http://116.13.96.53:81/front/baoming/
				console.log('ReturnURL url-->',ReturnURL)
				console.log('you ticket')
				let ticket = req.query.ticket
				console.log('check ticket-->',ticket)
				let url = CASserver + 'serviceValidate?ticket=' + ticket + '&service=' + ReturnURL
				console.log('check url -->',url)
				request(url, function (error, response, body) {
				    if (!error && response.statusCode == 200) {
				    	console.log('body -- >',body)
				       let user = pipei(body,'user'),//工号
						   eduPersonOrgDN = pipei(body,'eduPersonOrgDN'),//学院
						   alias = pipei(body,'alias'),//校园卡号
						   cn = pipei(body,'cn'),//姓名
						   gender = pipei(body,'gender'),//性别
						   containerId = pipei(body,'containerId')//个人信息（包括uid，）
						if(containerId){
							RankName = containerId.substring(18,21)//卡类别 jzg-->教职工
						}else{
							RankName = null
						}
						console.log('check final result -->',user,eduPersonOrgDN,alias,cn,gender,containerId,RankName)
						let arg = {}
						   	arg.user = user
						   	arg.eduPersonOrgDN = eduPersonOrgDN
						   	arg.alias = alias
						   	arg.cn = cn
						   	arg.gender = gender
						   	arg.containerId = containerId
						   	arg.RankName = RankName
						   	arg.r = req.query.r
						   console.log('check arg-->',arg)
						   req.session.student = arg

						   console.log('session 已设置，跳转回去-->',ReturnURL)
						   return res.redirect(ReturnURL)
				     }else{
				     	console.log(error)
				     }
			    })
			}
		}
}).post('/baoming',function(req,res){
	console.log('post baoming')
	logic.baoming(req.body,function(error,result){
		if(error && error != 1){
			console.log('----- post baoming router err -----')
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(error == 1 && result){
			console.log('----- post baoming router 已经报名 -----')
			return res.json({'errCode':-1,'errMsg':'已经报名过'})
		}
		if(error == null && result){
			console.log('----- post baoming router success -----')
			return res.json({'errCode':0,'errMsg':'报名成功'})
		}
	})
})

//签到接口
//http://116.13.96.53:81/front/qiandao/?r=793p54&q=1&d=0
router.get('/qiandao',function(req,res){
	console.log('----- qiandao router & 静态二维码 -----')
	if(!req.query.ticket){//没有用户信息，进行验证
		console.log('here --> 1')
		console.log('----- 没有ticket -----')	
		let ReturnURL = 'http://' + req.headers.host + req.originalUrl //http://116.13.96.53:81/front/baoming/
		console.log('ReturnURL url-->',ReturnURL)
		if(!req.session.student){
			console.log('没有session信息')
			let url = CASserver + 'login?service=' + ReturnURL
			console.log('check redirecturl -->',url)
			return res.redirect(url)
		}
		else{
			console.log('有session ----- 1')
			console.log('session-->',req.session.student)
			logic.getMeetingDetail_2(req.session.student,function(error,result){
				if(error && !result){
					console.log('----- baoming router error -----')
					return res.json({'errCode':-1,'errMsg':'数据库出错！'})
				}
				if(result == null){
					console.log('----- qiandao router result null -----')
					return res.json({'errCode':-1,'errMsg':'没有该会议信息！'})
				}
				if(result && result == '已经签到！'){							
					console.log('----- qiandao router -----')
					console.log('重定向')
					return res.redirect('../yiqiandao')
				}
				if(result && result != '已经签到！'){
					console.log('----- qiandao router -----')
					return res.render('front/qiandao',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
				}
			})
		}
	}
	else{
		if(req.session.student){
			console.log('有session ------ 2')
			console.log('session-->',req.session.student)
			logic.getMeetingDetail_2(req.session.student,function(error,result){
				if(error && !result){
					console.log('----- baoming router error -----')
					return res.json({'errCode':-1,'errMsg':'数据库出错！'})
				}
				if(result == null){
					console.log('----- qiandao router result null -----')
					return res.json({'errCode':-1,'errMsg':'没有该会议信息！'})
				}
				if(result && result == '已经签到！'){
					console.log('----- qiandao router -----')
					console.log('重定向')
					return res.redirect('../yiqiandao')
				}
				if(result && result != '已经签到！'){
					console.log('----- qiandao router -----')
					return res.render('front/qiandao',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
				}
			})
		}
		else{
			console.log('here -- > 2')
			let ticket = req.query.ticket
			console.log('check ticket-->',ticket)
			let ReturnURL = 'http://' + req.headers.host + req.originalUrl //http://116.13.96.53:81/front/baoming/
			console.log('ReturnURL url-->',ReturnURL)
			let url = CASserver + 'serviceValidate?ticket=' + ticket + '&service=' + ReturnURL
			console.log('check url -->',url)
			request(url, function (error, response, body) {
			    if (!error && response.statusCode == 200) {
			    	console.log('body -- >',body)
			       //console.log(body)
			       let user = pipei(body,'user'),//工号
					   eduPersonOrgDN = pipei(body,'eduPersonOrgDN'),//学院
					   alias = pipei(body,'alias'),//校园卡号
					   cn = pipei(body,'cn'),//姓名
					   gender = pipei(body,'gender'),//性别
					   containerId = pipei(body,'containerId')//个人信息（包括uid，）
					   if(containerId){
					   	RankName = containerId.substring(18,21)//卡类别 jzg-->教职工
					   }
					   else{
					   	RankName = null
					   }
					   console.log('check final result -->',user,eduPersonOrgDN,alias,cn,gender,containerId,RankName)
					   let arg = {}
					   	   arg.user = user
					   	   arg.eduPersonOrgDN = eduPersonOrgDN
					   	   arg.alias = alias
					   	   arg.cn = cn
					   	   arg.gender = gender
					   	   arg.containerId = containerId
					   	   arg.RankName = RankName
					   	   arg.r = req.query.r
					   console.log('check arg-->',arg)
					   req.session.student = arg
					   return res.redirect(ReturnURL)
				}
			    else{
			     	console.log(error)
				}
		    })
		}
	}
}).post('/qiandao',function(req,res){
	logic.qiandao(req.body,function(error,result){
		if(error && error != 1){
			console.log('----- jiingtai qiandao router err -----')
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(error == 1 && result){
			console.log('----- jiingtai qiandao router 已经签到 -----')
			return res.json({'errCode':-1,'errMsg':'已经签到过'})
		}
		if(error == null && result){
			console.log('----- jiingtai qiandao router success -----')
			return res.json({'errCode':0,'errMsg':'签到成功'})
		}
	})
})

//动态签到
//签到接口
//http://116.13.96.53:81/front/qiandao/?r=793p54&q=1&d=0
router.get('/qiandaodongtai',function(req,res){
		console.log('----- qiandao router & 动态二维码 -----')
		let nowTimeStamp = moment().format('X')
		console.log('check nowTimeStamp-->',nowTimeStamp)
		console.log('check t-->',req.query.t)
		if(nowTimeStamp - req.query.t > 180){
			console.log('----- 二维码过期 -----')
			return res.render('front/guoqi')
		}else{
			if(!req.query.ticket){//没有用户信息，进行验证
				console.log('here --> 1')
				console.log('----- 没有ticket -----')	
				if(!req.session.student){
					let ReturnURL = 'http://' + req.headers.host + req.originalUrl //http://116.13.96.53:81/front/baoming/
					console.log('ReturnURL url-->',ReturnURL)
					console.log('----- 没有session信息 -----')
					let url = CASserver + 'login?service=' + ReturnURL
					console.log('check redirecturl -->',url)
					console.log('去请求ticket')
					return res.redirect(url)
				}
				else{
					console.log('有session ----- 1')
					console.log('session-->',req.session.student)
					logic.getMeetingDetail_2(req.session.student,function(error,result){
							if(error && !result){
								console.log('----- 动态 baoming router error -----')
								return res.json({'errCode':-1,'errMsg':'数据库出错！'})
							}
							if(result == null){
								console.log('----- 动态 qiandao router result null -----')
								return res.json({'errCode':-1,'errMsg':'没有该会议信息！'})
							}
							if(result && result == '已经签到！'){
								//这里到时再增加一个判断，获取用户信息后直接查询是否已经报名，如果是，直接跳转到已报名页面并列出会议详情
								console.log('----- 动态 qiandao router -----')
								console.log('重定向')
								return res.redirect('../yiqiandao')
								//return res.render('front/baoming',{'xiaoyuankahao':alias,'name':cn,'result':result})
							}
							if(result && result != '已经签到！'){
								console.log('----- 动态 qiandao router -----')
								return res.render('front/qiandao',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
							}
						})
			}
		}
		else{
			if(req.session.student){
				console.log('有session ------ 2')
				console.log('session-->',req.session.student)
				 logic.getMeetingDetail_2(req.session.student,function(error,result){
							if(error && !result){
								console.log('----- baoming router error -----')
								return res.json({'errCode':-1,'errMsg':'数据库出错！'})
							}
							if(result == null){
								console.log('----- qiandao router result null -----')
								return res.json({'errCode':-1,'errMsg':'没有该会议信息！'})
							}
							if(result && result == '已经签到！'){
								//这里到时再增加一个判断，获取用户信息后直接查询是否已经报名，如果是，直接跳转到已报名页面并列出会议详情
								console.log('----- qiandao router -----')
								console.log('重定向')
								return res.redirect('../yiqiandao')
								//return res.render('front/baoming',{'xiaoyuankahao':alias,'name':cn,'result':result})
							}
							if(result && result != '已经签到！'){
								console.log('----- qiandao router -----')
								return res.render('front/qiandao',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
							}
						})
			}
			else{
				console.log('here -- > 2')
				let ticket = req.query.ticket
				console.log('check ticket-->',ticket)
				let url = CASserver + 'serviceValidate?ticket=' + ticket + '&service=' + ReturnURL
				console.log('check url -->',url)
				request(url, function (error, response, body) {
				    if (!error && response.statusCode == 200) {
				       console.log(typeof body)
				       //console.log(body)
				       console.log('body -- >',body)
				       let user = pipei(body,'user'),//工号
						   eduPersonOrgDN = pipei(body,'eduPersonOrgDN'),//学院
						   alias = pipei(body,'alias'),//校园卡号
						   cn = pipei(body,'cn'),//姓名
						   gender = pipei(body,'gender'),//性别
						   containerId = pipei(body,'containerId')//个人信息（包括uid，）
						   if(containerId){
						   	  RankName = containerId.substring(18,21)//卡类别 jzg-->教职工
						   }
						   else{
						   	  RankName = null
						   }
						   console.log('check final result -->',user,eduPersonOrgDN,alias,cn,gender,containerId,RankName)
						   let arg = {}
						   	   arg.user = user
						   	   arg.eduPersonOrgDN = eduPersonOrgDN
						   	   arg.alias = alias
						   	   arg.cn = cn
						   	   arg.gender = gender
						   	   arg.containerId = containerId
						   	   arg.RankName = RankName
						   	   arg.r = req.query.r
						   console.log('check arg-->',arg)
						   req.session.student = arg
						return res.redirect(ReturnURL)
					}
			     	else{
			     		console.log(error)
			     	}
		    })
		}
	}
}
}).post('/qiandao',function(req,res){
	logic.qiandao(req.body,function(error,result){
		if(error && error != 1){
			console.log('----- dongtai qiandao router err -----')
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(error == 1 && result){
			console.log('----- dongtai qiandao router 已经签到 -----')
			return res.json({'errCode':-1,'errMsg':'已经签到过'})
		}
		if(error == null && result){
			console.log('----- dongtai qiandao router success -----')
			return res.json({'errCode':0,'errMsg':'签到成功'})
		}
	})
})

//已报名页面
router.get('/yibaoming',function(req,res){
	//获取会议信息
	console.log(req.session.student)
	let student = req.session.student
	logic.getMeetingDetail(req.session.student.r,function(error,result){
		if(error){
			console.log('yibaoming router error')
			console.log(error)
			return res.json({'errCode':-1,'errMsg':'查询出错'})
		}
		if(!result){
			console.log('yibaoming router result is null')
			return res.json({'errCode':-1,'errMsg':'没有该会议信息！'})
		}
		if(result){
			return res.render('front/yibaoming',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
		}
	})
})

//报名成功页面
router.get('/baomingchenggong',function(req,res){
	//获取会议信息
	console.log('router baomingchenggong')
	console.log(req.session.student)
	let student = req.session.student
	logic.getMeetingDetail(req.session.student.r,function(error,result){
		if(error){
			console.log('yiqiandao router error')
			console.log(error)
			return res.json({'errCode':-1,'errMsg':'查询出错'})
		}
		if(!result){
			console.log('yiqiandao router result is null')
			return res.json({'errCode':-1,'errMsg':'没有该会议信息！'})
		}
		if(result){
			return res.render('front/baomingchenggong',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
		}
	})
})

//已签到页面
router.get('/yiqiandao',function(req,res){
	//获取会议信息
	console.log(req.session.student)
	let student = req.session.student
	logic.getMeetingDetail(req.session.student.r,function(error,result){
		if(error){
			console.log('yiqiandao router error')
			console.log(error)
			return res.json({'errCode':-1,'errMsg':'查询出错'})
		}
		if(!result){
			console.log('yiqiandao router result is null')
			return res.json({'errCode':-1,'errMsg':'没有该会议信息！'})
		}
		if(result){
			return res.render('front/yiqiandao',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
		}
	})
	//res.render('front/yiqiandao')
})

//签到成功页面
router.get('/qiandaochenggong',function(req,res){
	//获取会议信息
	console.log(req.session.student)
	let student = req.session.student
	logic.getMeetingDetail(req.session.student.r,function(error,result){
		if(error){
			console.log('yiqiandao router error')
			console.log(error)
			return res.json({'errCode':-1,'errMsg':'查询出错'})
		}
		if(!result){
			console.log('yiqiandao router result is null')
			return res.json({'errCode':-1,'errMsg':'没有该会议信息！'})
		}
		if(result){
			return res.render('front/qiandaochenggong',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
		}
	})
	//res.render('front/qiandaochenggong')
})

//get method : for render a page 
//post method : for ajax add meeting room 
router.get('/add_meeting_room',function(req,res){
	return res.render('manage/add_meeting_room')
}).post('/add_meeting_room',function(req,res){
	console.log('----- add_meeting_room -----')

	var room_name = req.body.room_name
	if(!room_name){
		return res.json({'errMsg':'会议室编号或名称不能为空！'})
	}
	logic.add_meeting_room(room_name,function(result){
		if(result){
			return res.json({'data':result})
		}
	})
})
//提交申请
router.post('/apply',function(req,res){
	console.log('----- apply -----')
	var room_name = req.body.room_name,
		meeting_name = req.body.meeting_name,
		meeting_num = req.body.meeting_num,
		meeting_content = req.body.meeting_content,
		apply_name = req.body.apply_name,
		apply_phone = req.body.apply_phone,
		meeting_date = req.body.meeting_date,
		meeting_time = req.body.meeting_time,
		exact_meeting_time = req.body.exact_meeting_time,
		apply_email = req.body.apply_email
	logic.apply(room_name,meeting_name,meeting_num,meeting_content,meeting_date,meeting_time,apply_name,apply_phone,exact_meeting_time,apply_email,function(err,result){
		if(err){
			return res.json({'errCode':-1,'errMsg':err.message})
		}
		if(result == 1){
			return res.json({'errCode':-1,'errMsg':'该时间段已被占用，不能申请!'})
		}
		if(result == 2){
			return res.json({'errCode':-1,'errMsg':'抱歉，同一申请人同一时间段不能提交相同申请!'})
		}
		console.log('----- reply in router -----')
		console.log(result)
		return res.json({'errCode':0,'data':result})
	})
})
//提交申请(切割时间)
router.post('/applyTwo',function(req,res){
	console.log('----- apply -----')
	logic.applyTwo(req.body,function(err,result){
		if(err){
			return res.json({'errCode':-1,'errMsg':err.message})
		}
		if(result == 1){
			return res.json({'errCode':-1,'errMsg':'会议开始时间已被占用，请检查!'})
		}
		if(result == 2){
			return res.json({'errCode':-1,'errMsg':'抱歉，同一申请人同一时间段不能提交相同申请!'})
		}
		console.log('----- reply in router -----')
		console.log(result)
		return res.json({'errCode':0,'data':result})
	})
})

//get method : for render a login page 
//post method : for ajax to check login 
// router.get('/login',function(req,res){
// 	res.render('manage/login')
// }).post('/login',function(req,res){
// 	console.log('----- check login -----')
// 	let username = req.body.username,
// 		password = req.body.password
// 	logic.checkLogin(username,password,function(error,result){
// 		console.log('error is ',error)
// 		console.log('result is ',result)
// 		if(error && result == 1){
// 			console.log('---- 用户不存在 -----')
// 			return res.json({'errCode':-1,'errMsg':'用户不存在'})
// 		}
// 		if(error && result == null){
// 			console.log('----- 出错 -----')
// 			return res.json({'errCode':-1,'errMsg':error.message})
// 		}
// 		if(error == null ){
// 			console.log('----- 登录成功 -----')
// 			console.log(result)
// 			req.session.user = result
// 			console.log('----- check session content -----')
// 			console.log(req.session.user)
// 			return res.json({'errCode':0,'errMsg':'success'})
// 		}
// 	})
// })
//render a approve page for admin
router.get('/approve',function(req,res){
	console.log('----- in approve router -----')
	console.log('check session ',req.session.user)
	if(!req.session.user){
		console.log('----- user not login -----')
		return res.redirect('/manage/login')
	}
	return res.render('manage/approve',{username:req.session.user.username})
})
//reder a apply record
router.get('/record',function(req,res){
	console.log('----- in record router -----')
	return res.render('reserve/record')
})
//render a apply record by apply_name
router.get('/recordByName',function(req,res){
	console.log('----- in recordByName router -----')
	return res.render('reserve/recordByName')
})
//render a logout page
router.get('/logout',function(req,res){
	console.log('----- in router logout -----')
	req.session.user = null;
    req.session.error = null;
    res.redirect("/manage/login");
})
//post method : ajax for add admin user 
//get method : render a page to add admin user 
router.post('/addAdminUser',function(req,res){
	let username = req.body.username,
		password = req.body.password
	if(!username || typeof username == 'undefined'){
		return res.json({'errCode':-1,'errMsg':'username can not be null'})
	}
	if(!password || typeof password == 'undefined'){
		return res.json({'errCode':-1,'errMsg':'password can not be null'})
	}
	logic.addAdminUser(username,password,function(error,result){
		if(error && result != 1){
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(error && result == 1){
			return res.json({'errCode':-1,'errMsg':'该用户已存在'})
		}
		return res.json({'errCode':0,'errMsg':'添加用户成功'})
	})
}).get('/addAdminUser',function(req,res){
	let username = req.body.username,
		password = req.body.password
		username = 'liyali'
		password = 'liyali'
	if(!username || typeof username == 'undefined'){
		return res.json({'errCode':-1,'errMsg':'username can not be null'})
	}
	if(!password || typeof password == 'undefined'){
		return res.json({'errCode':-1,'errMsg':'password can not be null'})
	}
	logic.addAdminUser(username,password,function(error,result){
		if(error && result == null){
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(error && result == 1){
			return res.json({'errCode':-1,'errMsg':'该用户已存在'})
		}
		if(result && result.length != 0)
			return res.json({'errCode':0,'errMsg':'添加用户成功'})
	})
})
//render a page for applier to check applyRecord
router.get('/applyRecord',function(req,res){
	//获取分页参数
	let limit = req.query.limit
		offset = req.query.offset
	if(!limit || limit == null || typeof limit == 'undefined'){//页面记录数
		limit = 10
	}
	if(!offset || offset == null || typeof offset == 'undefined'){//当前页数
		offset = 0
	}
	offset = parseInt(offset/limit)
	console.log('----- in router applyRecord -----')
	console.log('check limit && offset: ',limit,offset)

	let begin_date = req.query.begin_date,
		end_date = req.query.end_date

	let applier = req.query.applier
	//如果日期都为空，则默认全部取出
	if(!begin_date && !end_date){
		console.log('begin_date && end_date are null,default')
		logic.applyRecord(limit,offset,applier,function(error,result){
			if(error && result == null){//查询出错
				return res.json({'errCode':-1,'errMsg':error.message})
			}
			else if(error && result == 1){
				return res.json({total:0,rows:[],offset:0})
			}
			else{//(error == null && result)
				let total = result.length,
					rows = result
				console.log('total is ',result.total)
				//console.log('rows is ',result.docs)
				console.log('offset is ',result.offset)
				return res.json({total:result.total,rows:result.docs,offset:result.offset})
			}
		})
	}
	else{
		console.log('begin_date && end_date is not null and applier is not null')
		console.log('check date-->',begin_date,end_date)
		logic.applyRecordQuery(limit,offset,begin_date,end_date,applier,function(error,result){
			if(error && result == null){
				return res.json({'errCode':-1,'errMsg':error.message})
			}
			else if(error && result == 1){
				console.log('----- here -----')
				return res.json({total:0,rows:[],offset:0})
			}
			else{
				let total = result.length
					rows  = result
				console.log('total is ',result.total)
				//console.log('rows is ',result.docs)
				console.log('offset is ',result.offset)
				return res.json({total:result.total,rows:result.docs,offset:result.offset})
			}
		})
	}
})
//render a page for admin user to check apply
router.get('/applyApprove',function(req,res){
	//获取分页参数
	let limit = req.query.limit, 	//这个相当于条数
		offset = req.query.offset 	//这个相当于pages
	if(!limit || limit == null || typeof limit == 'undefined'){//页面记录数
		limit = 10
	}
	if(!offset || offset == null || typeof offset == 'undefined'){//当前页数
		offset = 0
	}
	offset = parseInt(offset/limit)
	console.log('----- in router applyApprove -----')
	console.log('check limit && offset: ',limit,offset)

	let begin_date = req.query.begin_date,
		end_date = req.query.end_date

	let applier = req.query.applier
	console.log('applier-->',applier)
	//如果日期都为空，则默认全部取出
	if(!begin_date && !end_date){
		console.log('begin_date && end_date are null,default ')
		logic.applyApprove(limit,offset,req.session.user.username,applier,function(error,result){
			if(error && result == null){//查询出错
				return res.json({'errCode':-1,'errMsg':error.message})
			}
			else if(error && result == 1){
				return res.json({total:0,rows:[],offset:0})
			}
			else{//(error == null && result)
				let total = result.length,
					rows = result
				console.log('total is ',result.total)
				//console.log('rows is ',result.docs)
				console.log('offset is ',result.offset)
				return res.json({total:result.total,rows:result.docs,offset:result.offset})
			}
		})
	}
	else{//日期不为空情况
		console.log('check begin_date && end_date: ',begin_date,end_date)
		logic.applyApproveQuery(limit,offset,begin_date,end_date,req.session.user.username,applier,function(error,result){
			if(error && result == null){
				return res.json({'errCode':-1,'errMsg':error.message})
			}
			else if(error && result == 1){
				console.log('----- here -----')
				return res.json({total:0,rows:[],offset:0})
			}
			else{
				let total = result.length
					rows  = result
				console.log('total is ',result.total)
				//console.log('rows is ',result.docs)
				console.log('offset is ',result.offset)
				return res.json({total:result.total,rows:result.docs,offset:result.offset})
			}
		})
	}
})
//backup method applyApprove
// router.get('/applyApprove',function(req,res){
// 	//获取分页参数
// 	let limit = req.query.limit, 	//这个相当于条数
// 		offset = req.query.offset 	//这个相当于pages
// 	if(!limit || limit == null || typeof limit == 'undefined'){//页面记录数
// 		limit = 10
// 	}
// 	if(!offset || offset == null || typeof offset == 'undefined'){//当前页数
// 		offset = 0
// 	}
// 	offset = parseInt(offset/limit)
// 	console.log('----- in router applyApprove -----')
// 	console.log('check limit && offset: ',limit,offset)

// 	let begin_date = req.query.begin_date,
// 		end_date = req.query.end_date
// 	//如果日期都为空，则默认全部取出
// 	if(!begin_date && !end_date){
// 		console.log('begin_date && end_date are null,default ')
// 		logic.applyApprove(limit,offset,function(error,result){
// 			if(error && result == null){//查询出错
// 				return res.json({'errCode':-1,'errMsg':error.message})
// 			}
// 			else if(error && result == 1){
// 				return res.json({total:0,rows:[],offset:0})
// 			}
// 			else{//(error == null && result)
// 				let total = result.length,
// 					rows = result
// 				console.log('total is ',result.total)
// 				//console.log('rows is ',result.docs)
// 				console.log('offset is ',result.offset)
// 				return res.json({total:result.total,rows:result.docs,offset:result.offset})
// 			}
// 		})
// 	}
// 	else{//日期不为空情况
// 		console.log('check begin_date && end_date: ',begin_date,end_date)
// 		logic.applyApproveQuery(limit,offset,begin_date,end_date,function(error,result){
// 			if(error && result == null){
// 				return res.json({'errCode':-1,'errMsg':error.message})
// 			}
// 			else if(error && result == 1){
// 				console.log('----- here -----')
// 				return res.json({total:0,rows:[],offset:0})
// 			}
// 			else{
// 				let total = result.length
// 					rows  = result
// 				console.log('total is ',result.total)
// 				//console.log('rows is ',result.docs)
// 				console.log('offset is ',result.offset)
// 				return res.json({total:result.total,rows:result.docs,offset:result.offset})
// 			}
// 		})

// 	}
// })
//ajax to get apply detail and put on bootstrap modal
router.post('/applyDetail',function(req,res){
	let _id = req.body._id
	console.log('----- in applyDetail router -----')
	console.log('_id: ',_id)
	logic.applyDetail(_id,function(error,result){
		if(error && result == null){
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(error && result == 1){
			return res.json({'errCode':-1,'errMsg':'没有该记录'})
		}
		if(result && result != 1){
			return res.json({'errCode':0,'errMsg':'success','result':result})
		}
	})
})
//ajax for update apply status
router.post('/updateApprove',function(req,res){
	let _id = req.body._id,
		is_approved = req.body.is_approved
	logic.updateApprove(_id,is_approved,function(error,result){
		if(error){
			console.log('----- router error -----')
			console.log(error.message)
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		return res.json({'errCode':0,'errMsg':'success'})
	})
})
//ajax for delete apply record
router.post('/deleteRecord',function(req,res){
	let _id = req.body._id	
		check_delete = req.body.check_delete
	console.log('----- in deleteRecord router -----')
	logic.deleteRecord(_id,check_delete,function(error,result){
		if(error){
			console.log('----- deleteRecord error -----')
			console.log(error.message)
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		return res.json({'errCode':0,'errMsg':'success'})
	})
})
//just for apply test postman 
router.post('/test_apply',function(req,res){
	console.log('----- apply test -----')
	var room_name = req.body.room_name,
		meeting_name = req.body.meeting_name,
		meeting_num = req.body.meeting_num,
		meeting_content = req.body.meeting_content,
		apply_name = req.body.apply_name,
		apply_phone = req.body.apply_phone,
		meeting_date = req.body.meeting_date,
		meeting_time = req.body.meeting_time
	logic.test_apply(room_name,meeting_name,meeting_num,meeting_content,meeting_date,meeting_time,apply_name,apply_phone,function(err,result){
		if(err){
			return res.json({'err':err.message})
		}
		if(result == 1){
			return res.json({'Msg':'已有批准记录，不能申请'})
		}
		return res.json(result)
	})
})
//for delete approve
router.post('/deleteApprove',function(req,res){
	console.log('----- delete approve router -----')
	var ids = req.body._id
	console.log(req.body)
	logic.deleteApprove(req.body,function(error,result){
		if(error){
			return res.json({'errCode':-1,'errMsg':error.message})
		}else{
			return res.json({'errCode':0,'errMsg':'success'})
		}
	})
})
module.exports = router