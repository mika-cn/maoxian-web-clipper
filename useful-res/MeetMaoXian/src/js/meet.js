//==UserScript==
//@name         example
//@namespace    example@mx-wc.oyd
//@version      0.1
//@description  your description
//@author       you
//@require      mx-wc-tool-v0.0.2.js
//@include     *
//@grant        none
//==/UserScript==

$(function(){
	var host = window.location.host;
	
    rules = (`
        C||blog.csdn.net||/||.blog-content-box
        C||news.cnblogs.com||/||#news_main
        C||*.iteye.com||/||.blog_main
    `).split("\n")
	
	var querys = ["article",".article",".article-detail",".article-box",".article-main",".main_left",".main","#main","#posts",".post","#topics"];
	querys.forEach(function(val,idx){
		var query = document.querySelectorAll(val);
		if(query.length === 1 ){
			rules.push(`C||*||/||`+val);
		}
	});
	switch(host){
		case "juejin.im":rules.splice(0,0,`C||*||/||.main-area`);break;
		case "my.oschina.net":rules.splice(0,0,`C||*||/||.float-menu-content`);break;
		case "www.cnblogs.com":
			rules.splice(0,0,`C||*||/||#mainContent`);
			rules.splice(0,0,`C||*||/||#post_detail`);
			rules.splice(0,0,`C||*||/||#topics`);
			break;
	}
    const confirmCmd = MxWc.newConfirmCmd();
    confirmCmd.init(rules);
});