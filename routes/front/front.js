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
const nodeExcel = require('excel-export')
const urlencode = require('urlencode')
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
			return res.render('front/meiyouhuiyi')
			//return res.json({'errCode':-1,'errMsg':'result is null'})
		}
		//have meetings 
		console.log('result -- >',result)
		return res.render('front/qrcode',{'result':result,'name':req.session.user.name})
	})
})

//数据查询页面
router.get('/chaxun',function(req,res){
	if(!req.session.user){
		console.log('----- user not login -----')
		return res.redirect('/front/login')
	}
	return res.render('front/chaxun')
})

//按学生校园卡号查询
router.get('/chaxunstu',function(req,res){
	if(!req.session.user){
		console.log('----- user not login -----')
		return res.redirect('/front/login')
	}
	return res.render('front/chaxunstu')
}).post('/chaxunstu',function(req,res){
	console.log('----- post chaxunstu -----')
	let xiaoyuankahao = req.body.people_no
	logic.chaxunstu(xiaoyuankahao,function(error,result){
		if(error && error != 1){
			console.log('----- post chaxunstu error -----')
			console.log(error)
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(error && error == 1){
			console.log('----- post chaxunstu error 1 -----')
			return res.json({'errCode':-1,'errMsg':result})
		}
		if(!error && result){
			console.log('----- post chaxunstu router result -----')
			return res.json({'errCode':0,'errMsg':result})
		}
	})
})

//将记录返回前台
router.get('/chaxunstutable',function(req,res){
	console.log('----- in router chaxunstutable -----')
	if(!req.session.user){
		return res.redirect('/front/login')
	}else{
		req.session.xiaoyuankahao = req.query.xiaoyuankahao
		console.log('xiaoyuankahao --- >',req.session.xiaoyuankahao)
		logic.getUserInfo(req.query.xiaoyuankahao,function(error,result){
			if(error && error != 1){
				console.log('----- chaxunstutable router error -----')
				console.log(error)
				return res.json({'errCode':-1,'errMsg':error.message})
			}
			if(error && error == 1){
				console.log('----- chaxunstutable router error 1 -----')
				return res.json({'errCode':-1,'errMsg':result})
			}
			if(!error && result){
				return res.render('front/chaxunstutable',{'userInfo':result})
			}
		})
	}
}).get('/chaxunstutable_api',function(req,res){
	console.log('in router chaxunstutable_api')
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
	console.log('check limit && offset: ',limit,offset)

	// let randomStr = req.session.randomStr
	let xiaoyuankahao = req.session.xiaoyuankahao
	console.log('check xiaoyuankahao -->',xiaoyuankahao)
	if(!xiaoyuankahao){
		return res.redirect('front/overview')
	}else{
			logic.getStuQianDaoDetail(limit,offset,xiaoyuankahao,function(error,result){
				if(error && error != 1){//查询出错
					return res.json({'errCode':-1,'errMsg':error.message})
				}
				else if(error && error == 1){
					//return res.json({total:0,rows:[],offset:0})
					return res.json({'errCode':-1,'errMsg':result})
				}
				else{//(error == null && result)
					let total = result.total,
						rows = result
					console.log('total is ',result.total)
					console.log('offset is ',result.offset)
					return res.json({total:result.total,rows:result.docs,offset:result.offset})
				}
	})
	//res.render('front/qiandaoDetail')
	}
})

//数据查询列表页面
router.get('/chaxunlist',function(req,res){
	if(!req.session.user){
		console.log('----- user not login -----')
		return res.redirect('/front/login')
	}
	return res.render('front/chaxunlist')
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
			return res.render('front/meiyouhuiyi')
			//return res.json({'errCode':-1,'errMsg':'result is null'})
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

//正则匹配
function pipei(str,arg){
	let zhengze = '<cas:' + arg + '>(.*)<\/cas:' + arg + '>' 
	let res = str.match(zhengze)
	if(res){
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

//数据查询
router.get('/meetingRecord',function(req,res){
	console.log('in router meetingRecord')
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
	console.log('check limit && offset: ',limit,offset)
	let begin_date = req.query.begin_date,
		end_date = req.query.end_date

	let meeting_type = req.query.meeting_type
	console.log('begin_date && end_date && meeting_type-->',begin_date,end_date,meeting_type)
	//如果日期都为空，则默认全部取出
	if(!begin_date && !end_date){
		console.log('begin_date && end_date are null,default ')
		logic.applyApprove(limit,offset,meeting_type,function(error,result){
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
		logic.applyApproveQuery(limit,offset,begin_date,end_date,meeting_type,function(error,result){
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

//签到详情页
//for render a page
router.get('/qiandaoDetail',function(req,res){
	console.log('----- in router qiandaoDetail -----')
	if(!req.session.user){
		return res.redirect('/front/login')
	}else{
		req.session.randomStr = req.query.randomStr
		return res.render('front/qiandaoDetail',{'randomStr':req.query.randomStr})
	}
})

//签到详情页接口
router.get('/qiandaoDetail_API',function(req,res){
	console.log('in router qiandaoDetail_API')
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
	console.log('check limit && offset: ',limit,offset)

	let randomStr = req.session.randomStr
	console.log('check randomStr -->',randomStr)
	if(!randomStr){
		return res.redirect('front/overview')
	}else{
			logic.getQianDaoDetail(limit,offset,randomStr,function(error,result){
				if(error && error != 1){//查询出错
					return res.json({'errCode':-1,'errMsg':error.message})
				}
				else if(error && error == 1){
					//return res.json({total:0,rows:[],offset:0})
					return res.json({'errCode':-1,'errMsg':result})
				}
				else{//(error == null && result)
					let total = result.total,
						rows = result
					console.log('total is ',result.total)
					console.log('offset is ',result.offset)
					return res.json({total:result.total,rows:result.docs,offset:result.offset})
				}
	})
	}
})

//未签到名单
//for render a page
router.get('/weiqiandao',function(req,res){
	console.log('----- in router weiqiandao -----')
	if(!req.session.user){
		return res.redirect('/front/login')
	}else{
		req.session.randomStr = req.query.r
		logic.getMeetingDetail(req.query.r,function(error,result){
			if(error){
				console.log(error)
			}
			else{
				return res.render('front/weiqiandao',{'randomStr':req.query.r,'meeting_info':result})
			}
		})
	}
})

//下载已签到名单
router.get('/downloadqiandao',function(req,res){
	console.log('----- in router downloadqiandao -----')
	logic.downloadqiandao(req.query.r,function(error,result){
		if(error){
			console.log('downloadqiandao router error')
			console.log(error)
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(!error && result){
			//处理excel
			var conf = {};
            conf.stylesXmlFile = "styles.xml";
            //设置表头
            conf.cols = [{
                    caption: '序号',
                    type: 'number',
                    width: 10.6
                }, 
	            {
	                caption: '姓名',
	                type: 'string',
	                width: 28
	            }, 
	            {
                    caption: '学号',
                    type: 'string',
                    width: 10
                }, 
                {
                    caption: '校园卡号',
                    type: 'string',
                    width:35
                },
                {
                    caption: '年级',
                    type: 'string',
                    width: 28
                },
                {
                    caption: '会议名称',
                    type: 'string',
                    width: 28
                },
                {
                    caption: '会议类型',
                    type: 'string',
                    width: 28
                },
                {
                    caption: '会议时间',
                    type: 'string',
                    width: 28
                },
                {
                    caption: '签到时间',
                    type: 'string',
                    width: 28
                }
			];
			conf.rows = result.vac;//conf.rows只接受数组
            let excelResult = nodeExcel.execute(conf),
            	excelName = result.meeting_name + '-签到名单'
            	console.log(excelName)
            	console.log(urlencode(excelName))
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + urlencode(excelName) + ".xlsx")
            res.end(excelResult, 'binary');
		}
	})
})

//下载未签到名单
router.get('/downloadweiqiandao',function(req,res){
	console.log('----- in router downloadweiqiandao -----')
	logic.downloadweiqiandao(req.query.r,function(error,result){
		if(error){
			console.log('----- downloadweiqiandao error -----')
			console.log(error)
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		if(!error && result){
			//处理excel
			var conf = {};
            conf.stylesXmlFile = "styles.xml";
            //设置表头
            conf.cols = [{
                    caption: '序号',
                    type: 'number',
                    width: 10.6
                }, 
	            {
	                caption: '姓名',
	                type: 'string',
	                width: 28
	            }, 
	            {
                    caption: '学号',
                    type: 'string',
                    width: 10
                }, 
                {
                    caption: '校园卡号',
                    type: 'string',
                    width:35
                },
                {
                    caption: '年级',
                    type: 'string',
                    width: 28
                },
                {
                    caption: '是否签到',
                    type: 'string',
                    width: 28
                }
			];
			conf.rows = result.vac;//conf.rows只接受数组
            let excelResult = nodeExcel.execute(conf),
            	excelName = result.meeting_info.meeting_name + '-' + result.meeting_info.meeting_date + '-' + '未签到名单'
            	console.log(excelName)
            	console.log(urlencode(excelName))
            res.setHeader('Content-Type', 'application/vnd.openxmlformats');
            res.setHeader("Content-Disposition", "attachment; filename=" + urlencode(excelName) + ".xlsx")
            res.end(excelResult, 'binary');
		}
	})
})

//未签到名单接口
//for get message
router.get('/weiqiandao_API',function(req,res){
	console.log('in router weiqiandao_API')
	//获取分页参数
	let limit = req.query.limit, 	//这个相当于条数
		offset = req.query.offset 	//这个相当于pages
	if(!limit || limit == null || typeof limit == 'undefined'){//页面记录数
		limit = 20
	}
	if(!offset || offset == null || typeof offset == 'undefined'){//当前页数
		offset = 0
	}
	offset = parseInt(offset/limit)
	console.log('check limit && offset: ',limit,offset)

	let randomStr = req.session.randomStr
	console.log('check randomStr -->',randomStr)
	if(!randomStr){
		return res.redirect('front/overview')
	}else{

			logic.getWeiQianDaoDetail(limit,offset,randomStr,function(error,result){
				if(error && error != 1){//查询出错
					return res.json({'errCode':-1,'errMsg':error.message})
				}
				else if(error && error == 1){
					return res.json({'errCode':-1,'errMsg':result})
				}
				else{//(error == null && result)
					let total = result.total,
						rows = result.weiqiandao_stu
					console.log('total is ',result.total)
					console.log('offset is ',result.offset)
					return res.json({total:result.total,rows:result.weiqiandao_stu,offset:result.offset})
				}
	})
	}
})

//学生签到统计
router.get('/studentStatic',function(req,res){
	if(!req.session.user)
		return res.redirect('/front/login')
	let xiaoyuankahao = req.query.xiaoyuankahao
	console.log('学生校园卡号-->',xiaoyuankahao)
	logic.studentStatic(xiaoyuankahao,function(error,result){
		if(error && error != 1 ){
			return res.json({'errCode':-1,'errMsg':error.message})
		}
		else if(error && error == 1){
			return res.json({'errCode':-1,'errMsg':result})
		}
		else{
			return res.render('front/studentStatic',{'data':result})
		}
	})
})

//获取信息(临时使用)
router.get('/stuinfo',function(req,res){
	let ReturnURL = 'http://' + req.headers.host + req.originalUrl
	if(!req.query.ticket){//没有用户信息，进行验证
			console.log('here --> 1')
			//let ReturnURL = 'http://' + req.headers.host + req.originalUrl //http://116.13.96.53:81/front/baoming/
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
				return res.render('front/stuinfo',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn})
			}
		}
		else{
			if(req.session.student){
				console.log('有session ------ 2')
				console.log('session-->',req.session.student)
				return res.render('front/stuinfo',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn})
			}
			else{
				console.log('here --> 2')
				//let ReturnURL = 'http://' + req.headers.host + req.originalUrl //http://116.13.96.53:81/front/baoming/
				console.log('ReturnURL url-->',ReturnURL)
				console.log('you ticket, meiyou session')
				let ticket = req.query.ticket
				console.log('check ticket-->',ticket)
				let url = CASserver + 'serviceValidate?ticket=' + ticket + '&service=' + 'http://qiandao.szu.edu.cn:81/front/stuinfo'
				console.log('check url -->',url)
				request(url, function (error, response, body) {
				    if (!error && response.statusCode == 200) {
				    	console.log('body -- >',body)
				       let user = pipei(body,'user'),//工号
						   eduPersonOrgDN = pipei(body,'eduPersonOrgDN'),//学院
						   alias = pipei(body,'alias'),//校园卡号
						   cn = pipei(body,'cn'),//姓名
						   gender = pipei(body,'gender'),//性别
						   containerId = pipei(body,'containerId'),//个人信息（包括uid，）
						   nianji = null
						if(containerId){
							RankName = containerId.substring(18,21)//卡类别 jzg-->教职工
						}else{
							RankName = null
						}
						if(user){
						   	nianji = user.substring(0,4)
						}else{
						   	nianji = null
						}
						console.log('check final result -->',user,eduPersonOrgDN,alias,cn,gender,containerId,RankName)
						let arg = {}
							arg.nianji = nianji
						   	arg.user = user
						   	arg.eduPersonOrgDN = eduPersonOrgDN
						   	arg.alias = alias
						   	arg.cn = cn
						   	arg.gender = gender
						   	arg.containerId = containerId
						   	arg.RankName = RankName
						   console.log('check arg-->',arg)
						   req.session.student = arg
						   if(arg.user == null){
						   	console.log('arg is null')
						   	return res.json({'errCode':-1,'errMsg':'请重新访问！'})
						   }
						   logic.saveStuInfo(arg,function(error,result){
						   	if(error){
						   		console.log(error)
						   	}else{
						   		return res.redirect(ReturnURL)
						   	}
						   })
				     }else{
				     	console.log(error)
				     }
			    })
			}
		}
})

//报名接口http://116.13.96.53:81/front/baoming/?r=766k5a
//http://qiandao.szu.edu.cn:81/front/baoming/?r=766k5a
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
				console.log('you ticket, meiyou session')
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
						   containerId = pipei(body,'containerId'),//个人信息（包括uid，）
						   nianji = null
						if(containerId){
							RankName = containerId.substring(18,21)//卡类别 jzg-->教职工
						}else{
							RankName = null
						}
						if(user){
						   	nianji = user.substring(0,4)
						}else{
						   	nianji = null
						}
						console.log('check final result -->',user,eduPersonOrgDN,alias,cn,gender,containerId,RankName)
						let arg = {}
							arg.nianji = nianji
						   	arg.user = user
						   	arg.eduPersonOrgDN = eduPersonOrgDN
						   	arg.alias = alias
						   	arg.cn = cn
						   	arg.gender = gender
						   	arg.containerId = containerId
						   	arg.RankName = RankName
						   	arg.r = req.query.r
						   console.log('check arg-->',arg)
						   // if(arg.user == null){
						   // 	console.log('ticket 有问题,重新回去获取ticket，清空session')
						   // 	req.session.student = null
						   // 	let temp_url = ReturnURL.substring(0,52)
						   // 	console.log('check temp_url-->',temp_url)
						   // 	return res.redirect(temp_url)
						   // }else{
						   // 	req.session.student = arg
						   // 	return res.redirect(ReturnURL)
						   // }
						   if(arg.r == 'select'){
						   	console.log('r 的值又是-->',arg.r)
						   	return res.json({'errCode':-1,'errMsg':'r=select,请重新扫码！'})
						   }
						   console.log('check arg-->',arg)
						   if(arg.user == null){
						   	console.log('ticket is unvalid,重新回去获取ticket，清空session')
						   	//req.session.student = null
						   	delete req.session.student
						   	console.log('check req.session.student-->',req.session.student)
						   	return res.json({'errCode':-1,'errMsg':'ticket is unvalid,请重新扫码！'})
						   }else{
						   	req.session.student = arg
						   	return res.redirect(ReturnURL)
						  }
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
					   containerId = pipei(body,'containerId'),//个人信息（包括uid，）
					   RankName = '',
					   nianji = ''
					   if(containerId){
					   	RankName = containerId.substring(18,21)//卡类别 jzg-->教职工
					   }
					   else{
					   	RankName = null
					   }
					   if(user){
					   	nianji = user.substring(0,4)
					   }else{
					   	nianji = null
					   }
					   console.log('check final result -->',user,eduPersonOrgDN,alias,cn,gender,containerId,RankName)
					   let arg = {}
					   	   arg.nianji = nianji
					   	   arg.user = user
					   	   arg.eduPersonOrgDN = eduPersonOrgDN
					   	   arg.alias = alias
					   	   arg.cn = cn
					   	   arg.gender = gender
					   	   arg.containerId = containerId
					   	   arg.RankName = RankName
					   	   arg.r = req.query.r
					   if(arg.r == 'select'){
					   	console.log('r 的值又是-->',arg.r)
					   	return res.json({'errCode':-1,'errMsg':'r=select,请重新扫码！'})
					   }
					   console.log('check arg-->',arg)
					   if(arg.user == null){
					   	console.log('ticket is unvalid,重新回去获取ticket，清空session')
					   	//req.session.student = null
					   	delete req.session.student
					   	console.log('check req.session.student-->',req.session.student)
					   	return res.json({'errCode':-1,'errMsg':'ticket is unvalid,请重新扫码！'})
					   }else{
					   	req.session.student = arg
					   	return res.redirect(ReturnURL)
					  }
				}
			    else{
			     	console.log(error)
				}
		    })
		}
	}
}).post('/qiandao',function(req,res){
	if(!req.body.people_no){
		return
	}else{
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
	}
})

//时间差
router.post('/gettime',function(req,res){
	console.log('----- in router gettime -----')
	let timeStamp = req.body.timeStamp
	console.log('客户端时间戳-->',timeStamp)
	let serverTimeStamp = moment().format('X')
	console.log('服务器时间戳 -- >',serverTimeStamp)
	let shijiancha = serverTimeStamp - timeStamp
	console.log('客户端与服务器时间差 -- >',shijiancha)
	return res.json({'shijiancha':shijiancha})
})

//动态签到
//http://116.13.96.53:81/front/qiandao/?r=793p54&q=1&d=0
router.get('/qiandaodongtai',function(req,res){
		console.log('----- qiandao router & 动态二维码 -----')
		let nowTimeStamp = moment().format('X')
		console.log('check nowTimeStamp-->',nowTimeStamp)
		console.log('传递时间戳 --> ',req.query.t)
		console.log('请求到达服务器时间 - 二维码时间戳 --> ',nowTimeStamp-req.query.t)
		if(nowTimeStamp - req.query.t > 18){
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
								return res.render('front/qiandaodongtai',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
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
								return res.render('front/qiandaodongtai',{'xiaoyuankahao':req.session.student.alias,'name':req.session.student.cn,'result':result})
							}
						})
			}
			else{
				console.log('here -- > 2')
				let ticket = req.query.ticket
				console.log('check ticket-->',ticket)
				let ReturnURL = 'http://' + req.headers.host + req.originalUrl 
				console.log('check here 2 ReturnURL --> ',ReturnURL)
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
						   containerId = pipei(body,'containerId'),//个人信息（包括uid，）
						   RankName = '',
						   nianji = ''
						   if(containerId){
						   	  RankName = containerId.substring(18,21)//卡类别 jzg-->教职工
						   }
						   else{
						   	  RankName = null
						   }
						   if(user){
						   	nianji = user.substring(0,4)
						   }else{
						   	nianji = null
						   }
						   console.log('check final result -->',user,eduPersonOrgDN,alias,cn,gender,containerId,RankName)
						   let arg = {}
						       arg.nianji = nianji
						   	   arg.user = user
						   	   arg.eduPersonOrgDN = eduPersonOrgDN
						   	   arg.alias = alias
						   	   arg.cn = cn
						   	   arg.gender = gender
						   	   arg.containerId = containerId
						   	   arg.RankName = RankName
						   	   arg.r = req.query.r
						   console.log('check arg-->',arg)
						   // if(arg.user == null){
						   // 	console.log('ticket is unvalid,重新回去获取ticket，清空session')
						   // 	req.session.student = null
						   // 	let temp_url = ReturnURL.substring(0,59)
						   // 		temp_url = temp_url + '&t=' + moment().format('X')
						   // 	console.log('check temp_url-->',temp_url)
						   // 	return res.redirect(temp_url)
						   // }else{
						   // 	req.session.student = arg
						   // 	return res.redirect(ReturnURL)
						   // }
						   // req.session.student = arg
						   // return res.redirect(ReturnURL)
						   if(arg.r == 'select'){
						   	console.log('r 的值又是-->',arg.r)
						   	return res.json({'errCode':-1,'errMsg':'r=select,请重新扫码！'})
						   }
						   console.log('check arg-->',arg)
						   if(arg.user == null){
						   	console.log('ticket is unvalid,重新回去获取ticket，清空session')
						   	//req.session.student = null
						   	delete req.session.student
						   	console.log('check req.session.student-->',req.session.student)
						   	return res.json({'errCode':-1,'errMsg':'ticket is unvalid,请重新扫码！'})
						   }else{
						   	req.session.student = arg
						   	return res.redirect(ReturnURL)
						  }
					}
			     	else{
			     		console.log(error)
			     	}
		    })
		}
	}
}
}).post('/qiandaodongtai',function(req,res){
	if(!req.body.people_no){
		return 
	}else{
		logic.qiandaodongtai(req.body,function(error,result){
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
	}
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
	console.log('session -- >',req.session.student)
	let student = req.session.student
	logic.getMeetingDetail(req.session.student.r,function(error,result){
		if(error){
			console.log('baomingchenggong router error')
			console.log(error)
			return res.json({'errCode':-1,'errMsg':'查询出错'})
		}
		if(!result){
			console.log('baomingchenggong router result is null')
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
	console.log('yiqiandao --> session --> ',req.session.student)
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
	console.log('qiandaochenggong --> session --> ',req.session.student)
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

module.exports = router