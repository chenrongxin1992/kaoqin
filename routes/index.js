var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
	return res.redirect('/front/overview')
  //res.render('index', { title: 'Express' });
});

module.exports = router;
