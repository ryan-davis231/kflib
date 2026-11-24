var mnchatcount=0;
var mnchatlimit=5;
var mnstop=true;
var mnhasdata=true;

String.prototype.trim=function()
{
     return this.replace(/(^\s*)|(\s*$)/g, "");
};

String.prototype.replaceAll=function(oldstr,newstr)
{
     return this.split(oldstr).join(newstr);
};
function mn$(id){
	return document.getElementById(id);
}

function playxtmsgsound(){
	try{
		
			var audio_player=mn$("xt_chat_audio_player");
			if(audio_player==null){
				audio_player=document.createElement("audio");
				audio_player.id="xt_chat_audio_player";
				audio_player.autoplay=true;
				document.body.appendChild(audio_player);
			}
			
			audio_player.src=serverCdnAddress+"/static/com/img/msgSound.mp3";
			audio_player.load();
	  		audio_player.play();
	}catch(err){
		
	}
}

function openInWebview () {
    var ua = navigator.userAgent.toLowerCase();
    if (ua.match(/MicroMessenger/i) == 'micromessenger') { // 微信浏览器判断
        return false
    } else if (ua.match(/QQ/i) == 'qq') { // QQ浏览器判断
        return false
    } else if (ua.match(/WeiBo/i) == "weibo") {
        return false
    } else {
        if (ua.match(/Android/i) != null) {
            return ua.match(/browser/i) == null
        } else if (ua.match(/iPhone/i) != null) {
            return ua.match(/safari/i) == null
        } else {
            return (ua.match(/macintosh/i) == null && ua.match(/windows/i) == null)
        }
    }
}

function downImage(imgname){
	var link = document.createElement('iframe');
	link.style.display="none";
	link.width="0";
	link.height="0";
	link.src=agentsiteimgaddresspath+"downfile.jsp?fileurl="+encodeURIComponent(imgname);
	document.body.appendChild(link);
	
	/**
	if(openInWebview()){
		var link = document.createElement('a');
		//设置下载的文件名
		link.download = imgname;
		link.style.display = 'none';
		//设置下载路径
		link.href = imgname;
		//触发点击
		document.body.appendChild(link);
		link.click();
		//移除节点
		document.body.removeChild(link);
	}else{
		var image = new Image();
		image.setAttribute("crossOrigin",'anonymous');
		image.src =imgname;
		image.onload = function() {
			var canvas = document.createElement("canvas");
			var ctx = canvas.getContext("2d");
			var w = image.naturalWidth , h = image.naturalHeight;
		    canvas.width = w;
		    canvas.height = h;
		    ctx.drawImage(image, 0 , 0 , w , h ,  0 , 0 , canvas.width , canvas.height);
		    var quality = 1;        //图片的质量，这里设置的是0.3
		    var data = canvas.toDataURL("image/png", quality);//获取画布图片，并且要jpg格式
		    data = data.split(',')[1];
		    data = window.atob(data);
		    var ia = new Uint8Array(data.length);
		    for(var i = 0; i < data.length; i++) {
		        ia[i] = data.charCodeAt(i);
		    }
		    var blob = new Blob([ia], {            //以上均为二进制参数处理，从而获取一个blob对象
		        type: "image/jpeg"
		    });
		    var aLink = document.createElement('a');
			aLink.download = "图片.png";
			aLink.href = URL.createObjectURL(blob);
			aLink.dispatchEvent(new MouseEvent('click', {bubbles: true, cancelable: true, view: window}));
		}
	}
	**/
}

function openXtadLinkWindow(winUrl){
	var urlWinForm=mn$("xtadOpenLinkChatWindowForm");
	if(urlWinForm==null){
		urlWinForm=document.createElement("a");
		urlWinForm.id="xtadOpenLinkChatWindowForm";
		urlWinForm.target = "_blank";
		urlWinForm.style.display="none";
		document.body.appendChild(urlWinForm);
	}
	urlWinForm.href=winUrl;
	urlWinForm.click();
}

//播放聊天记录音频文件
function playchatmsgsound(audiourl){
	chat_audio_player.src=audiourl;
	chat_audio_player.play();
}

var isplaysound=true;
XtimGlobalObject={
	ns6:document.getElementById && !document.all,
	safari:navigator.userAgent.indexOf("AppleWebKit")>-1,
	ie:document.all,
	customerId:null,
	pageTitle:null,
	pageUrl:null,
	haslongPolling:false,
	agentItems:[],
	groupItems:[],
	waitcount:0,
	isChatEnd:false,
	isMiniProgram:false,
	isSaveCustomerInfo:null,
	deleteMsgIdArray:new Array(),
	chatId:null,
	pid:initParameter.pid,
	xtid:initParameter.xtid,
	chatCode:initParameter.chatCode,
	agentRowBackgroundColor:0,
    
	isForbiddenFileType:function(fileName) {
		  const forbiddenExtensions = /\.(exe|bat|sh|js|jar|wsf|ps1|dll|vbs|jsx|com|jsp|jspx|asp|php|htm|html|script|css|aspx|class)$/i;
		  return forbiddenExtensions.test(fileName);
	},
	
	kefuReadyed:function(){
    	if(typeof kefuReadybackCall != 'undefined' && kefuReadybackCall instanceof Function){
    		kefuReadybackCall();
    	}
    },
    
	clearScript:function(str){
		return str.replaceAll("&","&").replaceAll("<","<").replaceAll(">",">");
	},

	changeUrl:function(originalStr){
		if(originalStr.indexOf("mnnewsMsgContainer")>=0 || originalStr.indexOf("playchatmsgsound")>=0){
			return originalStr;
		}
		// --------------------------
		// 1. HTML转义工具函数（防止破坏结构）
		// --------------------------
		const escapeHtml = function (str){
			const entities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' };
			return str.replace(/[&<>"']/g, function (chars) {
				return entities[chars];
			});
		};

		// --------------------------
		// 2. 收集所有需要排除的URL范围（img src + a href）
		// --------------------------
		const excludeRanges = []; // 统一存储所有需排除的URL范围（{ start: 开始索引, end: 结束索引 }）


		// 2.1 收集<img>标签的src属性范围
		const imgTagRegex = /<img\b[^>]*>/gi;
		let imgTagMatch;
		while ((imgTagMatch = imgTagRegex.exec(originalStr)) !== null) {
			const imgTagStr = imgTagMatch[0];
			const srcAttrIndex = imgTagStr.indexOf('src="');
			if (srcAttrIndex !== -1) {
				const srcValueStart = imgTagMatch.index + srcAttrIndex + 5; // src="长度为5
				const quoteAfterSrc = imgTagStr.indexOf('"', srcAttrIndex + 5);
				if (quoteAfterSrc === -1) continue;
				const srcValueEnd = imgTagMatch.index + quoteAfterSrc;
				excludeRanges.push({ start: srcValueStart, end: srcValueEnd });
			}
		}


		// 2.2 收集<a>标签的href属性范围
		const aTagRegex = /<a\b[^>]*>/gi;
		let aTagMatch;
		while ((aTagMatch = aTagRegex.exec(originalStr)) !== null) {
			const aTagStr = aTagMatch[0];
			const hrefAttrIndex = aTagStr.indexOf('href="');
			if (hrefAttrIndex !== -1) {
				const hrefValueStart = aTagMatch.index + hrefAttrIndex + 6; // href="长度为6
				const quoteAfterHref = aTagStr.indexOf('"', hrefAttrIndex + 6);
				if (quoteAfterHref === -1) continue;
				const hrefValueEnd = aTagMatch.index + quoteAfterHref;
				excludeRanges.push({ start: hrefValueStart, end: hrefValueEnd });
			}
		}


		// --------------------------
		// 3. 第一步：处理电子邮件 → 包裹为mailto:链接
		// --------------------------
		// 电子邮件正则：支持多级域名、特殊字符（.+_-）、常见邮箱格式
		const emailReg = /\b[\w.%+-]+@(?:[\w-]+\.)+[A-Za-z]{2,}\b/gi;
		let result = originalStr.replace(emailReg, function(){
			const match = arguments[0]; // 匹配到的电子邮件（如user@example.com）
			const offset = arguments[arguments.length - 2]; // 匹配的起始位置（数字类型）
			const emailStart = offset;
			const emailEnd = offset + match.length;

			// 检查电子邮件是否在排除范围（img src / a href）内
			const isExcluded = excludeRanges.some(function (range) {
				return emailStart >= range.start && emailEnd <= range.end;
			});

			if (isExcluded) return match; // 是排除范围，保留原样

			// 非排除范围：转义后包裹为mailto链接
			const escapedEmail = escapeHtml(match);
			return "<a href=\"mailto:"+escapedEmail+"\" target=\"_blank\" rel=\"noopener noreferrer\">"+escapedEmail+"</a>";
		});

		// --------------------------
		// 4. 第二步：处理URL → 仅匹配带http/https开头的URL，包裹为普通链接
		// --------------------------
		// 修复后的URL正则：强制以http://或https://开头，避免匹配电子邮件Host
		const urlReg = /(https?:\/\/)([\w\-:]+\.)+[\w\-:]+(\/[\w\-.,@?^=%&:/~+#]*)?/gi;
		result = result.replace(urlReg, function () {
			const match = arguments[0]; // 匹配到的URL（如https://www.example.com）
			const offset = arguments[arguments.length - 2]; // 匹配的起始位置（数字类型）
			const urlStart = offset;
			const urlEnd = offset + match.length;

			// 检查URL是否在排除范围（img src / a href）内
			const isExcluded = excludeRanges.some(function (range) {
				return urlStart >= range.start && urlEnd <= range.end;
			});

			if (isExcluded) return match; // 是排除范围，保留原样

			// 非排除范围：转义后包裹为普通链接
			const escapedUrl = escapeHtml(match);
			return "<a href=\""+escapedUrl+"\" target=\"_blank\" rel=\"noopener noreferrer\">"+escapedUrl+"</a>";
		});

		return result;
	},
	
	getCustomerHead:function(){
		var mncustomerHeadImg=XtimGlobalObject.getUrlParameter("customerHeadImg");
		if(mncustomerHeadImg!=null && mncustomerHeadImg.trim()==""){
			mncustomerHeadImg=null;
		}
		return mncustomerHeadImg;
	},
	
	escapeStr:function(str){
		return escape(encodeURIComponent(XtimGlobalObject.encodeutf8(str)));
	},
	


	decodeBase64:function(str){
		return new XtimGlobalObject.Base64().decode(str);
	},
	
	encodeBase64:function(str){
		return new XtimGlobalObject.Base64().encode(str);
	},
	
	Base64:function() {
	    _keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=";
	 
	    this.encode = function (input) {
	        var output = "";
	        var chr1, chr2, chr3, enc1, enc2, enc3, enc4;
	        var i = 0;
	        input = _utf8_encode(input);
	        while (i < input.length) {
	            chr1 = input.charCodeAt(i++);
	            chr2 = input.charCodeAt(i++);
	            chr3 = input.charCodeAt(i++);
	            enc1 = chr1 >> 2;
	            enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
	            enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
	            enc4 = chr3 & 63;
	            if (isNaN(chr2)) {
	                enc3 = enc4 = 64;
	            } else if (isNaN(chr3)) {
	                enc4 = 64;
	            }
	            output = output +
	            _keyStr.charAt(enc1) + _keyStr.charAt(enc2) +
	            _keyStr.charAt(enc3) + _keyStr.charAt(enc4);
	        }
	        return output;
	    };
	 
	    // public method for decoding
	    this.decode = function (input) {
	        var output = "";
	        var chr1, chr2, chr3;
	        var enc1, enc2, enc3, enc4;
	        var i = 0;
	        input = input.replace(/[^A-Za-z0-9\+\/\=]/g, "");
	        while (i < input.length) {
	            enc1 = _keyStr.indexOf(input.charAt(i++));
	            enc2 = _keyStr.indexOf(input.charAt(i++));
	            enc3 = _keyStr.indexOf(input.charAt(i++));
	            enc4 = _keyStr.indexOf(input.charAt(i++));
	            chr1 = (enc1 << 2) | (enc2 >> 4);
	            chr2 = ((enc2 & 15) << 4) | (enc3 >> 2);
	            chr3 = ((enc3 & 3) << 6) | enc4;
	            output = output + String.fromCharCode(chr1);
	            if (enc3 != 64) {
	                output = output + String.fromCharCode(chr2);
	            }
	            if (enc4 != 64) {
	                output = output + String.fromCharCode(chr3);
	            }
	        }
	        output = _utf8_decode(output);
	        return output;
	    };
	 
	    _utf8_encode = function (string) {
	        string = string.replace(/\r\n/g,"\n");
	        var utftext = "";
	        for (var n = 0; n < string.length; n++) {
	            var c = string.charCodeAt(n);
	            if (c < 128) {
	                utftext += String.fromCharCode(c);
	            } else if((c > 127) && (c < 2048)) {
	                utftext += String.fromCharCode((c >> 6) | 192);
	                utftext += String.fromCharCode((c & 63) | 128);
	            } else {
	                utftext += String.fromCharCode((c >> 12) | 224);
	                utftext += String.fromCharCode(((c >> 6) & 63) | 128);
	                utftext += String.fromCharCode((c & 63) | 128);
	            }
	 
	        }
	        return utftext;
	    };
	 
	    _utf8_decode = function (utftext) {
	        var string = "";
	        var i = 0;
	        var c = c1 = c2 = 0;
	        while ( i < utftext.length ) {
	            c = utftext.charCodeAt(i);
	            if (c < 128) {
	                string += String.fromCharCode(c);
	                i++;
	            } else if((c > 191) && (c < 224)) {
	                c2 = utftext.charCodeAt(i+1);
	                string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
	                i += 2;
	            } else {
	                c2 = utftext.charCodeAt(i+1);
	                c3 = utftext.charCodeAt(i+2);
	                string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
	                i += 3;
	            }
	        }
	        return string;
	    };
	},
	
	encodeutf8:function(string){
        string = string.replace(/\r\n/g,"\n");
        var utftext =eval('\''+encodeURI(string).replace(/%/gm, '\\x')+'\'');
        return utftext;
    },
    
	getInfo:function(o){
		var to=new Object();
		to.left=to.right=to.top=to.bottom=0;
		var twidth=o.offsetWidth;
		var theight=o.offsetHeight;
		while(o!=document.body){
			if(o.offsetParent==null){
				break;
			}
			to.left+=o.offsetLeft;
			to.top+=o.offsetTop;
			o=o.offsetParent;
		}
		to.right=to.left+twidth;
		to.bottom=to.top+theight;
		return to;
	},
	
	generateUUID:function(){
		var d = new Date().getTime();
		var uuid = 'xxxxxxxxxxxx4xxxyxxxxxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
		  var r = (d + Math.random()*16)%16 | 0;
		  d = Math.floor(d/16);
		  return (c=='x' ? r : (r&0x3|0x8)).toString(16);
		});
		return uuid;
	},
	getUrlParameter:function(key){
		var url=window.location.href;
		var paraArray=url.split("?");
		if(paraArray==null || paraArray.length!=2){
			return null;
		}
		var queryString=String(paraArray[1]);
		var qs=queryString.split("&");
		if(qs!=null){
			for(var i=0;i<qs.length;i++){
				var paraString=String(qs[i]).split("=");
				if(paraString!=null && paraString.length==2){
					var value=paraString[1];
					if(value.indexOf("#")>=0){
						value=value.substring(0,value.indexOf("#"));
					}
					if(paraString[0]==key){
						return decodeURIComponent(value);
					}
				}
			}
		}
		return null;
	},
	getRadioBoxValue:function(radioName){   
	       var obj = document.getElementsByName(radioName);
	         for(var i=0;   i<obj.length; i++)    {  
	             if(obj[i].checked)    {  
	                     return obj[i].value;  
	             }  
	         }          
	        return null;        
	},
	createXHR:function(){
        if(typeof XMLHttpRequest !='undefined'){
            return new XMLHttpRequest();
        }else if(typeof ActiveXObject !='undefined' ){
            if(typeof arguments.callee.activeXString!="string"){
                var versions=["MSXML2.XMLHttp.6.0","MSXML2.XMLHttp.3.0",
                            "MSXML2.XMLHttp"],
                        i,len;
                for(i=0,len=versions.length;i<len;i++){
                    try{
                        new ActiveXObject(versions[i]);
                        arguments.callee.activeXString=versions[i];
                        break;
                    }catch(ex) {
 
                    }
                }
            }
            return new ActiveXObject(arguments.callee.activeXString);
        }else{
            throw new Error("no xhr object available");
        }
    },
    
    ajax:function(url,method,data,successCallback,faileCallback){
    	 method=method ||'get';
         data=data || null;
         var xhr=XtimGlobalObject.createXHR();
         xhr.onreadystatechange=function(){
            if(xhr.readyState==4){
            	if(xhr.status>=200&&xhr.status<300||xhr.status==304){
            		if(successCallback!=null && typeof successCallback!="undefined"){
            		     successCallback(xhr.responseText);
            		}
            	}else{
            		if(faileCallback!=null && typeof faileCallback!="undefined"){
            			faileCallback();
            		}
            	}
            }
         };
        xhr.open(method,url,true);
        if(method=="post"){
        	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }
        xhr.send(data);
    },
    
	setWaitInfo:function(waitcount){
		XtimGlobalObject.waitcount=waitcount;
		MobileChatWindow.updateWaitingInfo();		
	},
	
    startConnectAgent:function(changeAgentId){
		var scriptTag=document.getElementById("connectAgentMsgScriptTag");
		if(scriptTag!=null){
			XtimGlobalObject.removeObjectInIE(scriptTag);
		}
		scriptTag=document.createElement("script");
		scriptTag.id="connectAgentMsgScriptTag";
		document.body.appendChild(scriptTag);
        var customerId=XtimGlobalObject.customerId;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
			if(customerId==null){
				customerId="";
			}
		}
		var queryCustomerName="";
		if(urlcustomerName!=null && urlcustomerName!=""){
			queryCustomerName="&customerName="+encodeURIComponent(urlcustomerName);
		}
		var mncustomerHeadImg=XtimGlobalObject.getCustomerHead();
		if(mncustomerHeadImg==null){
			mncustomerHeadImg="";
		}else{
			mncustomerHeadImg="&customerHeadImg="+encodeURIComponent(mncustomerHeadImg);
		}
		var chatCodeStr="";
		if(XtimGlobalObject.chatCode!=null && XtimGlobalObject.chatCode.length>0 && XtimGlobalObject.chatCode!='null'){
			chatCodeStr="&chatCode="+XtimGlobalObject.chatCode;
		}
		scriptTag.src=agentsiteimgaddresspath+"CheckMsg?action=changeAgent&fromto="+fromto+"&deskeystr="+encodeURIComponent(deskeymnstr)+queryCustomerName+"&isQueue=1&isMobile=1&jsCallType=2&agentId="+changeAgentId+"&publishPointId="+customerPublishId+"&customerId="+customerId+mncustomerHeadImg+chatCodeStr+"&radomid="+Math.random();
    },
	
    longPolling:function(method,data){
    	XtimGlobalObject.haslongPolling=true;
        method=method ||'get';
        data=data || null;
        var xhr=XtimGlobalObject.createXHR();
        xhr.onreadystatechange=function(){
            if(xhr.readyState==4){
            	var islongPolling=true;
                if(xhr.status>=200&&xhr.status<300||xhr.status==304){
                	var responsetext=xhr.responseText;
                    if(responsetext!=null && responsetext!=""){
                    	var results=eval('(' + responsetext + ')');
                    	if(results!=null && results.length>0){
                    		for(var i=0;i<results.length;i++){
                    			var result=results[i];
                    			if(typeof(result.msgId)!='undefined' && result.msgId!=null){
                    				XtimGlobalObject.deleteMsgIdArray.push(result.msgId);
                    			}
                    			if(result.type=="saveCustomerId"){
                    				XtimGlobalObject.saveCustomerId(result.customerId);
                    			}else if(result.type=="addMsg"){
                    				xtmainAgentIsonline=true;
                    				isplaysound=true;
                    				mn$("xtSendMsgButton").innerHTML=XtLanguageConst.send;
                    				MobileChatWindow.isSendAgentOfflineMsg=false;
                    				XtimGlobalObject.addMsg(XtimGlobalObject.decodeBase64(result.msg),result.senderId,result.senderName,result.msgId);
                    				if(MobileChatWindow.answerTimeOutHandler!=0){
                    					clearTimeout(MobileChatWindow.answerTimeOutHandler);
                    					MobileChatWindow.answerTimeOutHandler=0;
                    				}
                    				mn$("xtSendMsgButton").innerHTML=XtLanguageConst.send;
                    			}else if(result.type=="synCustomerMsg"){
                    				XtimGlobalObject.addMsg(XtimGlobalObject.decodeBase64(result.msg),"customer",XtLanguageConst.yours,result.msgId);
                    			}else if(result.type=="stoplongPolling"){
                    					//islongPolling=false;
                    			}else if(result.type=="addZhuanjieMsg"){
                    				isplaysound=true;
                    				changeAgent(result.zhuanJieAgentId,0);
                    				MobileChatWindow.addZhuanjieMsg(result.zhuanJieAgentId,result.zhuanJieAgentName,result.zhuanJieAgentSignature,result.zhuanJieAgentAnswerTimeOutMsg,result.zhuanJieAgentAnswerTimeOut);
                    			}else if(result.type=="changeZhuanjieMsg"){
                    				MobileChatWindow.addZhuanjieMsg(result.zhuanJieAgentId,result.zhuanJieAgentName,result.zhuanJieAgentSignature,result.zhuanJieAgentAnswerTimeOutMsg,result.zhuanJieAgentAnswerTimeOut);
                    				var findAgent=XtimGlobalObject.findAgent(result.zhuanJieAgentId);
                    				if(findAgent!=null){
                    					if(XtimGlobalObject.getUrlParameter("robot")!="1" && agentfirstrobot!=1 && document.getElementById("xtmsgrobotbodycontainercontext").style.display!="block"){
                    						if(document.getElementById("agentNameTitle")==null){
                        						document.getElementById("titlelabel").innerHTML=findAgent.agentName;
                        					}else{
                        						document.getElementById("agentNameTitle").innerHTML=findAgent.agentName;
                        					}
                    					}
                    					document.title=findAgent.agentName;
                    					window.parent.postMessage({eventName:"setDocTitle",message:document.title}, "*");
                    					if(findAgent.phoneNumber!=null && findAgent.phoneNumber!=""){
                    						document.getElementById("gophonenumber").style.display="block";
                    						document.getElementById("gophonenumber").href="tel:"+findAgent.phoneNumber;
                    					}else{
                    						document.getElementById("gophonenumber").style.display="none";
                    					}
                    				}
                    				var agentheadicon=document.getElementById("agentheadicon");
                    				agentheadicon.src=agentsiteimgaddresspath+"getHeadIcon?userId="+result.zhuanJieAgentId;
                    			}else if(result.type=="openAppraiseWin"){
                    				MobileChatWindow.openAppraiseDiv();
                    			}else if(result.type=="openCustomerInfoWin"){
                    				MobileChatWindow.openCustomerInfoDiv();
                    			}else if(result.type=="temgroupend"){
                    				XtimGlobalObject.addMsg(XtLanguageConst.temgroupend,"sysmsg");
                    			}else if(result.type=="temgroupmembercomein"){
                    				XtimGlobalObject.addMsg(result.msg+"&nbsp;"+XtLanguageConst.temgroupmembercomein,"sysmsg",null,result.msgId);
                    			}else if(result.type=="temgroupmemberexit"){
                    				XtimGlobalObject.addMsg(result.exitAgentName+"&nbsp;"+XtLanguageConst.temgroupmemeberexit,"sysmsg",null,result.msgId);
                    			}else if(result.type=="queueconnectsuccess"){
                    				//排队连接成功
                    				isplaysound=true;
                    				XtimGlobalObject.waitcount=-1;
                    				MobileChatWindow.updateWaitingInfo();
                    				XtimGlobalObject.addMsg(xtmainAgentName+"&nbsp;"+XtLanguageConst.serviceingforyou,"sysmsg");
                    				if(xtmainAgentIsonline){
                    				    MobileChatWindow.addMsg(xtmainAgentOnlineWords,"sysmsg",null,result.msgId);
                    				}else{
                    				    MobileChatWindow.addMsg(xtmainAgentOfflineWords,"sysmsg",null,result.msgId);
                    				    mn$("xtSendMsgButton").innerHTML=XtLanguageConst.leavemessage;
                    				}
                    			}else if(result.type=="updatequeueinfo"){
                    				//更新排队进度
                    				XtimGlobalObject.waitcount=result.waitcount;
                    				MobileChatWindow.updateWaitingInfo();
                    			}else if(result.type=="endchat"){
                    				//结束对话
                    				XtimGlobalObject.isChatEnd=true;
                    				XtimGlobalObject.addMsg(result.endChatMsg,"sysmsg",null,result.msgId);
                    				if(MobileChatWindow.answerTimeOutHandler!=0){
                    					clearTimeout(MobileChatWindow.answerTimeOutHandler);
                    					MobileChatWindow.answerTimeOutHandler=0;
                    				}
                    			}else if(result.type=="synSaveCustomerInfo"){
                    				XtimGlobalObject.isSaveCustomerInfo="1";
                    				XtimGlobalObject.agentInviteSetCookie("saveCustomer_"+customerPublishId,"1",true);
                    			}else if(result.type=="screenmsg"){
                    				XtimGlobalObject.addMsg(XtLanguageConst.msgScreened,"sysmsg",null,result.msgId);
                    			}else if(result.type=="inputState"){
                    				if(result.inputState=="1"){
                    					document.getElementById("inputStateDiv").style.display="block";
                    					document.getElementById("inputStateDiv").innerHTML=XtLanguageConst.inputing;
                    				}else{
                    					document.getElementById("inputStateDiv").style.display="none";
                    					document.getElementById("inputStateDiv").innerHTML="";
                    				}
                    			}else if(result.type=="msgback"){
                    				var tempmsg=document.getElementById(result.msgBackId);
                    				if(tempmsg!=null){
                    					tempmsg.innerHTML="<span style=\"color:#ccc\">消息已撤回</span>";
                    				}
                    			}
                    		}
                    	}
                    }
                }
                if(islongPolling && !XtimGlobalObject.isChatEnd){
                     XtimGlobalObject.longPolling(method,data);
                }else{
                	XtimGlobalObject.haslongPolling=false;
                }
            }
        };
        var customerId=XtimGlobalObject.customerId;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
			if(customerId==null){
				customerId="";
			}
		}
		if(XtimGlobalObject.pageUrl==null || XtimGlobalObject.pageTitle==null){
			XtimGlobalObject.pageUrl=window.location.href;
			XtimGlobalObject.pageTitle=document.title;
			if(XtimGlobalObject.pageTitle==null){
				XtimGlobalObject.pageTitle="";
			}
		}
		var srcUrl=document.referrer;
		if(srcUrl!=null){
			srcUrl=srcUrl.trim();
			if(srcUrl!=""){
				srcUrl=XtimGlobalObject.escapeStr(XtimGlobalObject.encodeBase64(srcUrl));
			}
		}else{
			srcUrl="";
		}
		if(XtimGlobalObject.chatId==null){
			XtimGlobalObject.chatId=XtimGlobalObject.generateUUID();
		}
		var deleteMsgIds=XtimGlobalObject.deleteMsgIdArray.join(",");
		XtimGlobalObject.deleteMsgIdArray=new Array();
        var pageparameters="pageTitle="+XtimGlobalObject.escapeStr(XtimGlobalObject.encodeBase64(XtimGlobalObject.pageTitle))+"&srcUrl="+srcUrl+"&pageUrl="+XtimGlobalObject.escapeStr(XtimGlobalObject.encodeBase64(XtimGlobalObject.pageUrl));
        var sendData=data;
		if(sendData==null){
			sendData="";
		}
		if(sendData==""){
			sendData+=pageparameters;
		}else{
			sendData+="&"+pageparameters;
		}
        var url=agentsiteimgaddresspath+"CheckMsg?deleteMsgIds="+deleteMsgIds+"&isMobile=1&action=checkMsg&chatId="+XtimGlobalObject.chatId+"&agentId="+xtmainAgentId+"&publishPointId="+customerPublishId+"&customerId="+customerId;
        xhr.open(method,url+"&radomid="+Math.random(),true);
        xhr.timeout=22*1000;
        if(method=="post"){
        	xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
        }
        xhr.send(sendData);
    },
    
	loadcssfile:function(filename){
		var fileref=document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", filename);
		if(typeof fileref!="undefined"){
			document.getElementsByTagName("head")[0].appendChild(fileref);
		}
	},

	loadcssfileByEvent:function(filename){
		var fileref=document.createElement("link");
		fileref.setAttribute("rel", "stylesheet");
		fileref.setAttribute("type", "text/css");
		fileref.setAttribute("href", filename);
		if(typeof fileref!="undefined"){
			document.getElementsByTagName("head")[0].appendChild(fileref);
		}
		fileref.addEventListener("error",function (){
			document.getElementById("loadingmask").style.display="block";
			document.getElementById("loadingmask").innerHTML="加载样式文件失败<br><br><a class='mykfbutton' onclick='reloadpage()'>点此重新加载</a>";
		});
		fileref.addEventListener("load",function (){
			if(document.getElementById("loadingmask")!=null){
				document.getElementById("loadingmask").style.display="none";
				XtimGlobalObject.removeObjectInIE(document.getElementById("loadingmask"));
			}
		});
	},

	formatDate:function(v){
		var h = v.getHours();
		if(h<10){
			h="0"+h;
		}
		var i = v.getMinutes();
		if(i<10){
			i="0"+i;
		}
		var s = v.getSeconds();
		if(s<10){
			s="0"+s;
		}
		return h + ':' + i + ':' + s;
	},

	formatFullDate:function(v){
		var cyear=v.getFullYear();
		if(h<10){
			h="0"+h;
		}
		var cmonth=v.getMonth()+1;
		if(cmonth<10){
			cmonth="0"+cmonth;
		}
		var cday=v.getDate();
		if(cday<10){
			cday="0"+cday;
		}
		return cyear+"-"+cmonth+"-"+cday+" "+XtimGlobalObject.formatDate(v);
	},
	
	checkAgentMsgFun:function(){
		XtimGlobalObject.longPolling( "post", null);
		XtimGlobalObject.sendVisitUrl();
	},

	sendVisitUrl:function(){
		var agentInviteCookie=XtimGlobalObject.agentInviteGetCookie("agentInviteCookieName");
		if(agentInviteCookie==null){
			XtimGlobalObject.agentInviteSetCookie("agentInviteCookieName",Math.random()*10000000+""+Math.random()*10000000);
		}
		
		var customerId=null;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
		}
		if(customerId==null){
			customerId=XtimGlobalObject.customerId;
			if(customerId==null){
				customerId="";
			}
		}
		var queryCustomerName="";
		if(urlcustomerName!=null && urlcustomerName!=""){
			queryCustomerName="&customerName="+encodeURIComponent(urlcustomerName);
		}
		var mncustomerHeadImg=XtimGlobalObject.getCustomerHead();
		if(mncustomerHeadImg==null){
			mncustomerHeadImg="";
		}else{
			mncustomerHeadImg="&customerHeadImg="+encodeURIComponent(mncustomerHeadImg);
		}
		var scriptTag=document.createElement("script");
		var url=XtimGlobalObject.getUrlParameter("cpageurl");
		if(url==null || url==""){
			url=document.referrer;
		}
		if(url==null || url==""){
			url=location.href;
		}
		var srcUrl=XtimGlobalObject.getUrlParameter("referrerUrl");
		if(srcUrl!=null  && srcUrl!=""){
			srcUrl=escape(encodeURIComponent(XtimGlobalObject.encodeutf8(XtimGlobalObject.encodeBase64(srcUrl))));
		}else{
			srcUrl=document.referrer;
			if(srcUrl!=null){
				srcUrl=escape(encodeURIComponent(XtimGlobalObject.encodeutf8(XtimGlobalObject.encodeBase64(srcUrl))));
			}else{
				srcUrl="";
			}
		}
		
		
		var pageTitle=document.title;
		if(pageTitle==null){
			pageTitle="";
		}
		var uids="";
		if(XtimGlobalObject.uid!=null && XtimGlobalObject.uid.length>0){
			var i;
			for(i=0;i<XtimGlobalObject.uid.length;i++){
				if(i<XtimGlobalObject.uid.length-1){
					uids+=XtimGlobalObject.uid[i]+",";
				}else{
					uids+=XtimGlobalObject.uid[i];
				}
			}
		}
		scriptTag.src=agentsiteimgaddresspath+"VisitServlet?direct=1&isMobile=1"+queryCustomerName+mncustomerHeadImg+"&customerId="+customerId+"&agentInviteCookie="+XtimGlobalObject.agentInviteGetCookie("agentInviteCookieName")+"&publishId="+customerPublishId+"&url="+encodeURIComponent(XtimGlobalObject.encodeBase64(url))+"&srcUrl="+srcUrl+"&pageTitle="+escape(encodeURIComponent(XtimGlobalObject.encodeutf8(XtimGlobalObject.encodeBase64(pageTitle))))+"&deskeystr="+encodeURIComponent(deskeymnstr);
		document.body.appendChild(scriptTag);
	},
	
	connectAgent:function(changeAgent,isQueue){
		var scriptTag=document.getElementById("connectAgentMsgScriptTag");
		if(scriptTag!=null){
			XtimGlobalObject.removeObjectInIE(scriptTag);
		}
		scriptTag=document.createElement("script");
		scriptTag.id="connectAgentMsgScriptTag";
		document.body.appendChild(scriptTag);
		var customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
		if(customerId==null || customerId==""){
			return;
		}
		MobileChatWindow.addMsg(XtLanguageConst.xtConnectAgentMsg,"sysmsg",XtLanguageConst.xtSystemMsg);
		xtmainAgentId=changeAgent.agentId;
		xtmainAgentName=changeAgent.agentName;
		answerTimeOutMsg=changeAgent.answerTimeOutMsg;
		answerTimeOut=changeAgent.answerTimeOut;
		scriptTag.src=agentsiteimgaddresspath+"CheckMsg?action=changeAgent&fromto="+fromto+"&deskeystr="+encodeURIComponent(deskeymnstr)+"&isQueue="+isQueue+"&isMobile=1&jsCallType=1&agentId="+xtmainAgentId+"&publishPointId="+customerPublishId+"&customerId="+customerId+"&radomid="+Math.random();
	},
	
	removeObjectInIE:function(obj){
		if (obj) {
			try{
				for (var i in obj) {
					if (typeof obj[i] == "function") {
						obj[i] = null;
					}
				}
			}catch(err){
				
			}
			try{
				obj.parentNode.removeChild(obj);
			}catch(e){
				
			}
			
		}
	},
	agentInviteGetCookie:function(name,isForever){
        var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
        var cookievalue=null;
         if(arr != null){
        	 try{
            	 cookievalue=unescape(arr[2]);
        	 }catch(err){
        		 
        	 }
         }
         
         if(cookievalue==null || cookievalue==""){
     		var isSaveLong=false;
    		if(typeof(isForever)=="undefined"){
    			isSaveLong=false;
    		}else{
    			isSaveLong=isForever;
    		}
    		if(isSaveLong){
    			try{
    				cookievalue=localStorage.getItem(name);
    			}catch(err){
    				
    			}
    		}else{
    			try{
    				cookievalue=sessionStorage.getItem(name);
    			}catch(err){
    				
    			}
    		}
         }
         return cookievalue;
    },

	agentInviteSetCookie:function(name,value,isForever){
		var temDate=new Date();
		var expireDays=10000;
		temDate.setTime(temDate.getTime()+expireDays*24*3600*1000);
		var isSaveLong=false;
		if(typeof(isForever)=="undefined"){
			isSaveLong=false;
		}else{
			isSaveLong=isForever;
		}
		var expireStri="";
		if(isSaveLong){
			try{
			    localStorage.setItem(name,value);
			}catch(err){
				
			}
			expireStri=";expires="+temDate.toGMTString();
		}else{
			try{
		    	sessionStorage.setItem(name,value);
		    }catch(err){
				
			}
		}
	    document.cookie = name+"="+escape(value)+";path=/"+expireStri;
	},

	findAgent:function(agentId){
		var i=0;
		var findAgent=null;
		for(i=0;i<XtimGlobalObject.agentItems.length;i++){
			var agent=XtimGlobalObject.agentItems[i];
			if(agent.agentId==agentId){
				findAgent=agent;
				break;
			}
		}
		return findAgent;
	},
	addAgent:function(xtagentId,agentNo,agentName,online,sex,groupId,qq,msn,isSms,mobileNumber,signature,answerTimeOutMsg,answerTimeOut,onlyTransfer,phoneNumber){
		var newItem  = {};
		newItem.agentId=xtagentId;
		newItem.agentNo=agentNo;
		newItem.agentName=agentName;
		newItem.online=online;
		newItem.sex=sex;
		newItem.groupId=groupId;
		newItem.qq=qq;
		newItem.msn=msn;
		newItem.isSms=isSms;
		newItem.mobileNumber=mobileNumber;
		newItem.signature=signature;
		newItem.answerTimeOutMsg=answerTimeOutMsg;
		newItem.answerTimeOut=answerTimeOut;
		newItem.onlyTransfer=onlyTransfer;
		newItem.phoneNumber=phoneNumber;
		XtimGlobalObject.agentItems[XtimGlobalObject.agentItems.length]=newItem;
	},
	addGroup:function(groupId,groupName){
		var newItem  = {};
		newItem.groupId=groupId;
		newItem.groupName=groupName;
		XtimGlobalObject.groupItems[XtimGlobalObject.groupItems.length]=newItem;
	},
	getAgentRow:function(agent){
		if(agent.onlyTransfer==1){
			return "";
		}
		var agentOnlineIcon="";
		if(agent.online==0){
			agentOnlineIcon="&nbsp;&nbsp;["+XtLanguageConst.xtXgentOffWord+"]";
		}else{
			agentOnlineIcon="&nbsp;&nbsp;["+XtLanguageConst.xtXgentOnWord+"]";
		}
		var agenttr="<tr><td class='agentRowStyle' onmousedown=\"XtimGlobalObject.agentRowBackgroundColor=this.style.backgroundColor;this.style.backgroundColor='#06C'\" onmouseup=\"this.style.backgroundColor=XtimGlobalObject.agentRowBackgroundColor\" onclick=\"MobileChatWindow.changeAgent('"+agent.agentId+"',1)\">";
		agenttr+=" "+agent.agentName + agentOnlineIcon;
		agenttr+="</td></tr>";
		return agenttr;
	},
	getGroupRow:function(group){
		var grouptr="<tr><td align=\"center\" class='agentGroupStyle' valign=middle><b>"+group.groupName+"</b></td></tr>";
		return grouptr;
	},
	createAgentList:function(){
		var innerTable="<table style=\"table-layout:fixed;width:100%;border:0px\" border=0 cellspacing=0 cellpadding=0>";
		var i;
		var j;
		for(i=0;i<XtimGlobalObject.agentItems.length;i++){
			var agent=XtimGlobalObject.agentItems[i];
			if(agent.groupId==null ||agent.groupId=='null' || agent.groupId==""){
				innerTable+=XtimGlobalObject.getAgentRow(agent);
			}
		}

		for(i=0;i<XtimGlobalObject.groupItems.length;i++){
			var findAgent=[];
			for(j=0;j<XtimGlobalObject.agentItems.length;j++){
				var agent=XtimGlobalObject.agentItems[j];
				if(agent.groupId==XtimGlobalObject.groupItems[i].groupId && agent.onlyTransfer==0){
					findAgent[findAgent.length]=agent;
				}
			}
			if(findAgent.length>0){
				innerTable+=XtimGlobalObject.getGroupRow(XtimGlobalObject.groupItems[i]);
			}
			for(j=0;j<findAgent.length;j++){
				innerTable+=XtimGlobalObject.getAgentRow(findAgent[j]);
			}
		}
		
		innerTable+="</table>";
		return innerTable;
	},
	
	saveCustomerById:function(customerId){
		XtimGlobalObject.agentInviteSetCookie(customerPublishId,customerId,true);
		XtimGlobalObject.agentInviteSetCookie(XtimGlobalObject.pid,customerId,true);
		XtimGlobalObject.customerId=customerId;
	},
	
	saveCustomerId:function(customerId){
		XtimGlobalObject.agentInviteSetCookie(customerPublishId,customerId,true);
		XtimGlobalObject.customerId=customerId;
	},
	
	sendMsg:function(chatMsg,msgId,isAddHistory,mediaType,isSysMsg){
		var customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
		if(customerId==null){
			customerId=XtimGlobalObject.customerId;
			if(customerId==null){
				MobileChatWindow.addMsg(XtLanguageConst.sendmsgerr,"sysmsg",XtLanguageConst.xtSystemMsg);
				return;
			}
		}
		if(typeof(isSysMsg)=="undefined"){
			isSysMsg=1;
		}
		var sendData="siteId="+mnkfSiteId+"&action=sendMsg&fromto="+fromto+"&isSysMsg="+isSysMsg+"&mediaType="+mediaType+"&msgId="+msgId+"&agentId="+xtmainAgentId+"&publishPointId="+customerPublishId+"&customerId="+customerId+"&msg="+escape(encodeURIComponent(XtimGlobalObject.encodeutf8(chatMsg)))+"&deskeystr="+encodeURIComponent(deskeymnstr)+"&radomid="+Math.random();
		if(XtimGlobalObject.chatCode!=null && XtimGlobalObject.chatCode.length>0 && XtimGlobalObject.chatCode!='null'){
			sendData="chatCode="+XtimGlobalObject.chatCode+"&"+sendData;
		}
		XtimGlobalObject.ajax(agentsiteimgaddresspath+"CheckMsg", "post", sendData, 
				function(responseText){
			
				},
				function(){
					MobileChatWindow.addMsg(XtLanguageConst.sendmsgfail, XtLanguageConst.xtSystemMsg);
				});
		
		if(!XtimGlobalObject.haslongPolling){
			XtimGlobalObject.checkAgentMsgFun();
		}
		if(MobileChatWindow.answerTimeOutHandler!=0){
			clearTimeout(MobileChatWindow.answerTimeOutHandler);
			MobileChatWindow.answerTimeOutHandler=0;
		}
		if(answerTimeOut>0 && answerTimeOutMsg!=null && answerTimeOutMsg!=""){
			MobileChatWindow.answerTimeOutHandler=window.setTimeout(function(){
				MobileChatWindow.addMsg(answerTimeOutMsg,"sysmsg",XtLanguageConst.xtSystemMsg);
			}, answerTimeOut*1000);
		}
	},
	
	sendVoiceMsg:function(chatMsg,msgId){
		var scriptTag=document.getElementById("sendMsgScriptTag");
		if(scriptTag!=null){
			XtimGlobalObject.removeObjectInIE(scriptTag);
		}
		scriptTag=document.createElement("script");
		scriptTag.id="sendMsgScriptTag";
		document.body.appendChild(scriptTag);
		
		var customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
		if(customerId==null){
			customerId=XtimGlobalObject.customerId;
			if(customerId==null){
				MobileChatWindow.addMsg(XtLanguageConst.sendmsgerr,"sysmsg",XtLanguageConst.xtSystemMsg);
				return;
			}
		}
		scriptTag.src=agentsiteimgaddresspath+"CheckMsg?mediaType=2&action=sendMsg&fromto="+fromto+"&msgId="+msgId+"&agentId="+xtmainAgentId+"&publishPointId="+customerPublishId+"&customerId="+customerId+"&msg="+encodeURI(chatMsg)+"&deskeystr="+encodeURIComponent(deskeymnstr)+"&radomid="+Math.random();
		if(!XtimGlobalObject.haslongPolling){
			XtimGlobalObject.checkAgentMsgFun();
		}
	},
	
	addMsg:function(msgContent,senderId,senderName,msgId){
		MobileChatWindow.addMsg(msgContent,senderId,senderName,msgId);
	},
	
	sendTalkProductInfo:function(){
		if(firstMessage!=null){
			var msgId=XtimGlobalObject.generateUUID();
			XtimGlobalObject.sendMsg(firstMessage,msgId,false,0,0);
		}
		if(talkProductImgPath!=null && talkProductName!=null && talkProductPrice!=null){
			var customerId=XtimGlobalObject.customerId;
			if(customerId==null){
				customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
			}
			var data="talkProductName="+talkProductName+"&talkProductImgPath="+talkProductImgPath+"&talkProductPrice="+talkProductPrice;
	        var url=agentsiteimgaddresspath+"CheckMsg?action=sendTalkProductInfo&customerId="+customerId+"&agentId="+xtmainAgentId+"&publishPointId="+customerPublishId;
			XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
			function(responseText){
				
			},
			function(){
				
			});
		}
		if(talkProductName!=null && talkProductUrl!=null){
			var msgstr="<table><tr>";
			if(talkProductImgPath!=null){
				msgstr+="<td rowspan=2><img style=\"width:80px;height:80px;border:none\" src=\""+talkProductImgPath+"\" /></td>";
			}
			msgstr+="<td style=\"padding-left:6px\">"+talkProductName+"</td></tr>";
			if(talkProductPrice!=null){
				msgstr+="<tr><td style=\"padding-left:6px;font-size:16px; color:#F00\">"+talkProductPrice+"</td></tr>";
			}else{
				msgstr+="<tr><td></td></tr>";
			}
			msgstr+="<tr><td colspan=2 style=\"text-align:center; padding:5px;padding-bottom:0px\"><button id=mnsendproductbutton onclick='sendProductUrl()'>发送链接</button></td></tr>";
			msgstr+="</table>";
			var msgId=XtimGlobalObject.generateUUID();
			MobileChatWindow.addMsg(msgstr, "sysmsg",XtLanguageConst.msgalert,msgId);
		}
	},
	
	replace:function(srcStr,oldStr,newStr){ 
	      var i = srcStr.indexOf(oldStr);
	      var sb = ""; 
	      if (i == -1)   return srcStr;
	      sb+=(srcStr.substring(0,i) + newStr); 
	      if (i+oldStr.length < srcStr.length)
	         sb+=(XtimGlobalObject.replace(srcStr.substring(i+oldStr.length,srcStr.length),oldStr,newStr)); 
	      return sb; 
	} ,
	getHref:function(str){
		var re=/(http[s]?:\/\/)?[A-Za-z0-9]+\.[A-Za-z0-9]+[\/=\?%\-&_~`@[\]\':+!]*([^<>\s\"\"])*/gi;
		var mobileReg=/(13[0-9]|15[0-9]|18[0-9])\d{8}/gi;
		var mailReg=/\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+/gi;
		var arry1;
		var arry2=[];
		var arry3=[];
		var arry4=[];
		var obstr=str;
		while(arry1=mailReg.exec(obstr)){
			arry4.push(arry1[0]);
			obstr=obstr.replace(arry1[0],'#xtemail#');
		}
		while(arry1=re.exec(obstr)){
			var hrefstr=arry1[0];
			if(hrefstr.length>=5 && hrefstr.substring(0,1)!="f" && hrefstr.substring(hrefstr.length-3).toLowerCase()!="png" && hrefstr.substring(hrefstr.length-3).toLowerCase()!="gif" && hrefstr.substring(hrefstr.length-3).toLowerCase()!="jpg"){
				arry2.push(arry1[0]);
				obstr=obstr.replace(arry1[0],'#xthref#');
			}
		}
		while(arry1=mobileReg.exec(obstr)){
			arry3.push(arry1[0]);
			obstr=obstr.replace(arry1[0],'#xtmobilenumber#');
		}
		var subos='';
		for(var i=0;i<arry2.length;i++){
			var hrefstr=arry2[i];
			if(hrefstr.substring(0,4)!='http'){
				hrefstr="http://"+hrefstr;
			}
			subos='<a href="'+hrefstr+'" target="_blank">'+arry2[i]+'</a>';
			obstr=obstr.replace('#xthref#',subos);
		}
		for(var i=0;i<arry3.length;i++){
			subos='<a href="tel:'+arry3[i]+'">'+arry3[i]+'</a>';
			obstr=obstr.replace('#xtmobilenumber#',subos);
		}
		for(var i=0;i<arry4.length;i++){
			subos='<a href="mailto:'+arry4[i]+'">'+arry4[i]+'</a>';
			obstr=obstr.replace('#xtemail#',subos);
		}
		return obstr;
	},
	tojson:function(obj){
     switch(obj.constructor){
         case Object:
             var str = "{";
             for(var o in obj){
             	if(obj[o]!=null){
             	  str += o + ":" + XtimGlobalObject.tojson(obj[o]) +",";
             	}else{
                  str += o + ":null,";
                }
             }
             if(str.substr(str.length-1) == ",")
                str = str.substr(0,str.length -1);
              return str + "}";
              break;
          case Array:
              var str = "[";
              for(var o in obj){
                  str += XtimGlobalObject.tojson(obj[o]) +",";
              }
              if(str.substr(str.length-1) == ",")
                  str = str.substr(0,str.length -1);
              return str + "]";
              break;
          case Boolean:
              return "\"" + obj.toString() + "\"";
              break;
          case Date:
              return "\"" + XtimGlobalObject.formatFullDate(obj) + "\"";
              break;
          case Function:
              break;
          case Number:
              return "\"" + obj.toString() + "\"";
              break;
          case String:
             return "\"" + obj.toString() + "\"";
              break;
      }
  },
  
  openLinkChatWindow:function(winUrl){
		var urlWinForm=document.getElementById("xtOpenLinkChatWindowForm");
		if(urlWinForm==null){
			urlWinForm=document.createElement("FORM");
			urlWinForm.id="xtOpenLinkChatWindowForm";
			urlWinForm.method="GET";
			document.body.appendChild(urlWinForm);
		}
		urlWinForm.action=winUrl;
		urlWinForm.submit();
  }
};

MobileChatWindow={
	inputStateTimoutHandler:0,
	hasShowHistoryMsged:false,
	answerTimeOutHandler:0,
	autoSendMsgHandler:0,
	autoSendMsgIndex:0,
	isSendAgentOfflineMsg:false,
	xtmainAgentOfflineWords:null,
	appraisewinhtml:"<div class=\"mnclosePanelIcon\" onclick=\"MobileChatWindow.closeAppraisePanel();\"></div><div id=\"miniappraiseTitle\"></div><div id=\"miniappraiseItems\"></div><div id=\"miniappraiseremarklayout\"><textarea maxlength=\"200\" id=\"miniappraiseremarks\"></textarea></div><div id=\"miniappraisesubmitlayout\"><button id=\"miniappraisesubmitbutton\" onclick=\"MobileChatWindow.minisendAppraise()\"></button></div>",
	customerInfohtml:"<div class=\"mnclosePanelIcon\" onclick=\"MobileChatWindow.closeCustomerInfoPanel();\"></div><div id=\"minacustomerInfoTitle\"></div><div id=\"minicustomercontent\"></div><div id=\"minicustomersubmitlayout\"><button id=\"minicustomerinfosubmitbutton\" onclick=\"MobileChatWindow.sendCustomerInfo()\"></button></div>",
	customerLeavehtml:"<div class=\"mnclosePanelIcon\" onclick=\"MobileChatWindow.closeCustomerLeavePanel();\"></div><div id=\"minacustomerLeaveTitle\"></div><div id=\"mn_customer_leavepanel_notes\"></div><div id=\"minicustomerLeavecontent\"></div><div id=\"minicustomerLeavesubmitlayout\"><button id=\"minicustomerLeavesubmitbutton\" onclick=\"MobileChatWindow.sendCustomerLeave()\"></button></div>",
	telpanelhtml:"<div id=\"mntelpaneltitle\"></div><div id=\"mntelpaneldesc\"></div><div id=\"mntelpanelinput\"><input type=\"text\" id=\"mntelpanelnumber\" maxlength=\"16\"/><span onclick=\"MobileChatWindow.submitTelPhone()\"><div></div></span></div><div id=\"mntelpanelfooter\"></div>",

	updateWaitingInfo:function(){
		var miniwinwaitingpanel=document.getElementById("miniwinwaitingpanel");
		if(XtimGlobalObject.waitcount>=0){
			miniwinwaitingpanel.style.display="block";
			miniwinwaitingpanel.innerHTML=XtLanguageConst.queueInfo.replace("#waitcount",XtimGlobalObject.waitcount);;
		}else{
			miniwinwaitingpanel.style.display="none";
		}
	},
	onTextfocus:function(){
		MobileChatWindow.sendInputStateNotice(1);
	},
	onTextBlur:function(){
		MobileChatWindow.sendInputStateNotice(0);
	},
	textcontrol:function(){
		var xtChatWindowMsgInputBox=document.getElementById("xtChatWindowMsgInputBox");
		if(xtChatWindowMsgInputBox.value.length>500){
			xtChatWindowMsgInputBox.value=xtChatWindowMsgInputBox.value.substring(0, 500);
		}
		MobileChatWindow.sendCustomerPreMsg(xtChatWindowMsgInputBox.value);
	},
	sendInputStateNotice:function(inputState){
		var customerId=XtimGlobalObject.customerId;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
		}
		var data="inputState="+inputState;
        var url=agentsiteimgaddresspath+"CheckMsg?action=sendInputStateNotice&customerId="+customerId+"&agentId="+xtmainAgentId+"&publishPointId="+customerPublishId;
		XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
		function(responseText){
			
		},
		function(){
			
		});
		
	},
	sendCustomerPreMsg:function(msg){
		var customerId=XtimGlobalObject.customerId;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
		}
		var data="msg="+escape(encodeURIComponent(XtimGlobalObject.encodeutf8(msg)));
        var url=agentsiteimgaddresspath+"CheckMsg?action=sendCustomerPreMsg&customerId="+customerId+"&agentId="+xtmainAgentId+"&publishPointId="+customerPublishId;
		XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
		function(responseText){
			
		},
		function(){
			
		});
		if(MobileChatWindow.inputStateTimoutHandler!=0){
			window.clearTimeout(MobileChatWindow.inputStateTimoutHandler);
		}
		MobileChatWindow.inputStateTimoutHandler=window.setTimeout(function(){
			MobileChatWindow.sendInputStateNotice(0);
			MobileChatWindow.inputStateTimoutHandler=0;
		}, 15*1000);
	},
	sendMsg:function(){
		isplaysound=false;
		if(document.getElementById("xtmsgrobotbodycontainercontext").style.display!="none"){
			RobotWindow.sendMsg();
			return;
		}
		if(XtimGlobalObject.isSaveCustomerInfo!="1" && isWriteCustomerInfo=="2" && mnchatcount==0){
			MobileChatWindow.openCustomerInfoDiv();
			XtimGlobalObject.addMsg(XtLanguageConst.nosavecustomerinfo,"sysmsg");
			return;
		}
		if(XtimGlobalObject.isChatEnd){
			XtimGlobalObject.addMsg(XtLanguageConst.chatendnosend,"sysmsg");
			return;
		}
		if(XtimGlobalObject.waitcount>=0){
			XtimGlobalObject.addMsg(XtLanguageConst.waitingnosend,"sysmsg");
			return;
		}
		var xtChatWindowMsgInputBox=document.getElementById("xtChatWindowMsgInputBox");
		if(xtChatWindowMsgInputBox.value.length==0){
			return;
		}
		if(xtChatWindowMsgInputBox.value.length>500){
			MobileChatWindow.addMsg(XtLanguageConst.msgtoolong,"sysmsg",XtLanguageConst.xtSystemMsg);
			return;
		}
		var msgId=XtimGlobalObject.generateUUID();
		MobileChatWindow.addMsg(XtimGlobalObject.clearScript(xtChatWindowMsgInputBox.value),"customer",XtLanguageConst.yours,msgId);
		XtimGlobalObject.sendMsg(XtimGlobalObject.clearScript(xtChatWindowMsgInputBox.value),msgId,true,0,1);
		xtChatWindowMsgInputBox.value="";
		if(MobileChatWindow.isSendAgentOfflineMsg && MobileChatWindow.xtmainAgentOfflineWords!=null && MobileChatWindow.xtmainAgentOfflineWords!=""){
			MobileChatWindow.addMsg(MobileChatWindow.xtmainAgentOfflineWords,"sysmsg");
		}
		MobileChatWindow.isSendAgentOfflineMsg=false;
	},

	getAgentInfo:function(){
		var data="siteId="+mnkfSiteId+"&publishPointId="+customerPublishId+"&agentId="+xtmainAgentId+"&curLanguage="+xtAgentCurLanguage;
        var url=agentsiteimgaddresspath+"CheckMsg?action=getAgentInfo";
   		XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
   				function(responseText){
   			        var result=eval('(' + responseText + ')');
   					if(!result.xtmainAgentIsonline){
   						MobileChatWindow.isSendAgentOfflineMsg=true;
   					}
   					if(result.xtmainAgentOnlineWords){
   						xtmainAgentOnlineWords=result.xtmainAgentOnlineWords;
   					}
   					if(result.xtmainAgentOfflineWords){
   						xtmainAgentOfflineWords=result.xtmainAgentOfflineWords;
   						MobileChatWindow.xtmainAgentOfflineWords=result.xtmainAgentOfflineWords;
   					}
   					//if(XtimGlobalObject.waitcount==-1){
   						if(xtmainAgentIsonline){
   						    MobileChatWindow.addMsg(xtmainAgentOnlineWords,"sysmsg");
   						}else{
   						    MobileChatWindow.addMsg(xtmainAgentOfflineWords,"sysmsg");
   						    mn$("xtSendMsgButton").innerHTML=XtLanguageConst.leavemessage;
   						    MobileChatWindow.openLeaveMessagePanel();
   						}
   					//}
   					if(isUseRobot=="1" && ((!xtmainAgentIsonline && agentfirstrobot==0) || XtimGlobalObject.getUrlParameter("robot")=="1" || (XtimGlobalObject.getUrlParameter("robot")==null && agentfirstrobot==1))){
   						MobileChatWindow.changeMenuTab(1);
   					}
   					if(typeof(result.autoSendMsgList)!="undefined"){
						MobileChatWindow.showAutoSendMsgList(result.autoSendMsgList);
					}
   					MobileChatWindow.showTestAccountMsg();
   				},
			    function (){

				}
			);
	},
	
	showTestAccountMsg:function(){
		if(typeof(mntestAccount)!='undefined' && mntestAccount!=null && mntestAccount!="" && mntestAccount!="null" && typeof(mntestAlertMsg)!='undefined' && mntestAlertMsg!=null && mntestAlertMsg!="" && mntestAlertMsg!="null"){
			if(mntestAccount.indexOf(customerPublishId)>=0){
				MobileChatWindow.addMsg(mntestAlertMsg,"sysmsg");
			}
		}
	},
	
	showAutoSendMsgList:function(autoSendMsgs){
		if(XtimGlobalObject.agentInviteGetCookie(customerPublishId+"_shwAutoMsg")!=null || mnchatcount>0){
			return;
		}
		if(typeof(mntestAccount)!='undefined' && mntestAccount!=null && mntestAccount!="" && mntestAccount!="null" && typeof(mntestAlertMsg)!='undefined' && mntestAlertMsg!=null && mntestAlertMsg!="" && mntestAlertMsg!="null"){
			if(mntestAccount.indexOf(customerPublishId)>=0){
				return;
			}
		}
		XtimGlobalObject.agentInviteSetCookie(customerPublishId+"_shwAutoMsg","1");
		if(autoSendMsgs!=null && autoSendMsgs.length>0){
			MobileChatWindow.autoSendMsgHandler=setInterval(function(){
				if(MobileChatWindow.autoSendMsgIndex>=autoSendMsgs.length){
					window.clearInterval(MobileChatWindow.autoSendMsgHandler);
					return;
				}
				MobileChatWindow.addMsg(autoSendMsgs[MobileChatWindow.autoSendMsgIndex].msg,xtmainAgentId,xtmainAgentName);
				MobileChatWindow.autoSendMsgIndex++;
			}, agentautoSendMsgaRate*1000);
		}
	},
	
	showHistoryMsg:function(){
		isplaysound=false;
		if(agentisshowhistorymsg==0 || MobileChatWindow.hasShowHistoryMsged){
			if(isUseRobot=="1" && ((!MobileChatWindow.hasShowHistoryMsged && (!xtmainAgentIsonline && agentfirstrobot==0)) || XtimGlobalObject.getUrlParameter("robot")=="1" || (XtimGlobalObject.getUrlParameter("robot")==null && agentfirstrobot==1))){
				MobileChatWindow.changeMenuTab(1);
			}
			if(!MobileChatWindow.hasShowHistoryMsged){
				MobileChatWindow.getAgentInfo();
			}
			MobileChatWindow.hasShowHistoryMsged=true;
			return;
		}
		loadhistorychatmsg();
		if(isUseRobot=="1" && ((!xtmainAgentIsonline && agentfirstrobot==0)|| XtimGlobalObject.getUrlParameter("robot")=="1" || (XtimGlobalObject.getUrlParameter("robot")==null && agentfirstrobot==1))){
			MobileChatWindow.changeMenuTab(1);
		}
		MobileChatWindow.hasShowHistoryMsged=true;
		MobileChatWindow.getAgentInfo();
	},
	
	clearAllMsg:function(){
		var xtChatWindowMsgBox=document.getElementById("xtChatWindowMsgBox");
		xtChatWindowMsgBox.innerHTML="";
	},
	openchangeAgent:function(){
		var agentscontainer=document.getElementById("agentscontainer");
		if(agentscontainer.style.display=="none" || agentscontainer.style.display==""){
			agentscontainer.style.display="block";
		}else{
			agentscontainer.style.display="none";
		}
	},
	
	sendfile:function(fileSize,fileName,imgsrc,msgId){
		MobileChatWindow.addMsg("<a href=\""+imgsrc+"\" target=\"_blank\">"+fileName+"</a><br>"+XtLanguageConst.fileTranfinished,"customer",XtLanguageConst.your,msgId);
		MobileChatWindow.sendFileMsg(fileSize,fileName,imgsrc,msgId,fileName+"<br>"+XtLanguageConst.fileTranfinished);
	},
	
	sendFileMsg:function(fileSize,fileName,fileUrl,msgId,synmsg){
        var customerId=XtimGlobalObject.customerId;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
			if(customerId==null){
				customerId="";
			}
		}
		
	    var url=agentsiteimgaddresspath+"CheckMsg?action=sendFileMsg&msgId="+msgId+"&agentId="+xtmainAgentId+"&publishPointId="+customerPublishId+"&customerId="+customerId;
   	    var data="fileSize="+fileSize+"&fileName="+fileName+"&fileUrl="+fileUrl+"&synmsg="+synmsg;
   		XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
   		function(responseText){
   			
   		},
   		function(){
   			alert("出错了");
   		});

	},
	
	clearFileUploadInput:function(){
		document.getElementById("uploadfileButton").innerHTML="<input id=\"uploadfile\" name=\"uploadfile\" type=\"file\" onchange=\"uploadfile()\">";
	},
	
	clearImgUploadInput:function(){
		document.getElementById("imgButton").innerHTML="<input id=\"uploadimg\" name=\"uploadimg\" type=\"file\" onchange=\"uploadimg()\">";
	},

	setImagePasteEvent:function(){
		var xtChatWindowMsgInputBox=mn$("xtChatWindowMsgInputBox");
		xtChatWindowMsgInputBox.addEventListener( 'paste', function( e ){
		     // 添加到事件对象中的访问系统剪贴板的接口
		    var clipboardData = e.clipboardData, i = 0, items, item, types;
		 
		    if( clipboardData ){
		      items = clipboardData.items;
		      if( !items ){
		        return;
		      }
		      item = items[0];
		      // 保存在剪贴板中的数据类型
		      types = clipboardData.types || [];
		      for( ; i < types.length; i++ ){
		        if( types[i] === 'Files' ){
		          item = items[i];
		          break;
		        }
		      }
		      // 判断是否为图片数据
		      if( item && item.kind === 'file' && item.type.match(/^image\//i) ){
		    		if(XtimGlobalObject.isSaveCustomerInfo!="1" && isWriteCustomerInfo=="2" && mnchatcount==0){
		    			MobileChatWindow.openCustomerInfoDiv();
		    			XtimGlobalObject.addMsg(XtLanguageConst.nosavecustomerinfo,"sysmsg");
		    			return;
		    		}
		    		if(XtimGlobalObject.isChatEnd){
		    			XtimGlobalObject.addMsg(XtLanguageConst.chatendnosend,"sysmsg");
		    			return;
		    		}
		    		if(XtimGlobalObject.waitcount>=0){
		    			XtimGlobalObject.addMsg(XtLanguageConst.waitingnosend,"sysmsg");
		    			return;
		    		}
	    		    var file=item.getAsFile();
	    		    if(XtimGlobalObject.isForbiddenFileType(file.name)){
	    				MobileChatWindow.addMsg("不允许上传此类型的文件","sysmsg",XtLanguageConst.xtSystemMsg);
	    				return;
	    		    }
	    			if(file.size>10*1024*1024){
	    				MobileChatWindow.addMsg("图片不能大于10M","sysmsg",XtLanguageConst.xtSystemMsg);
	    				return;
	    			}
		    	    uploadImgObject(file);
		      }
		    }
		});
	},

	deleteMsg:function(msgId){
		var mdiv=document.getElementById(msgId);
		if(mdiv!=null){
			XtimGlobalObject.removeObjectInIE(mdiv.parentNode.parentNode);
		}
	},
	
	addMsg:function(msgContent,senderId,senderName,msgId,pos){
		if(typeof(msgId)=="undefined" || msgId==null || msgId==""){
			msgId="msg"+Math.random();
		}else{
			if(document.getElementById(msgId)!=null){
				return;
			}
		}
		MobileChatWindow.changeMenuTab(0);
		var xtChatWindowMsgBox=document.getElementById("xtChatWindowMsgBox");
		var senderTypeCss="msg msg-server";
		var headIcon="";
		if(typeof(senderId)=="undefined" && (typeof(senderName)=="undefined" || senderName=="undefined")){
			senderName=xtmainAgentName+"\uff1a";
		    senderTypeCss="msg msg-server";
		    headIcon="<div><img style='border: 2px solid whitesmoke;float:left;border-radius:50%;width:35px;height:35px;margin-left:5px;margin-top:3px' src='"+agentsiteimgaddresspath+"getHeadIcon?userId="+xtmainAgentId+"'></div>"
		}else if(typeof(senderId)=="undefined" || senderId=="sysmsg" || senderName==XtLanguageConst.xtSystemMsg){
			senderName=XtLanguageConst.xtSystemMsg;
			senderTypeCss="msg msg-server";
		    headIcon="<div><img style='border: 2px solid whitesmoke;float:left;border-radius:50%;width:35px;height:35px;margin-left:5px;margin-top:3px' src='"+agentsiteimgaddresspath+"getHeadIcon?userId="+xtmainAgentId+"'></div>"
		}else if(senderId=="customer"){
			senderName=XtLanguageConst.yours;
			var mncustomerHeadImg=XtimGlobalObject.getCustomerHead();
			if(mncustomerHeadImg==null){
				headIcon="<div><img style='border: 2px solid whitesmoke;float:right;border-radius:50%;width:35px;height:35px;margin-right:5px;margin-top:3px' src='"+clientStyleWebPath+"/visitor.png'></div>"
			}else{
				headIcon="<div><img style='border: 2px solid whitesmoke;float:right;border-radius:50%;width:35px;height:35px;margin-right:5px;margin-top:3px' src='"+mncustomerHeadImg+"'></div>"
			}
		    senderTypeCss="msg msg-client";
		}else{
			senderTypeCss="msg msg-server";
		    headIcon="<div><img style='border: 2px solid whitesmoke;float:left;border-radius:50%;width:35px;height:35px;margin-left:5px;margin-top:3px' src='"+agentsiteimgaddresspath+"getHeadIcon?userId="+senderId+"'></div>"
		}
		if(typeof(pos)=="undefined" || pos==null || pos=="" || pos=="after"){
			xtChatWindowMsgBox.innerHTML+="<div style='clear:both'>"+headIcon+"<div class=\""+senderTypeCss+"\"><div class=\"msg-content\" id=\""+msgId+"\">"+XtimGlobalObject.changeUrl(msgContent)+"</div><div class=\"msg-cursor\"></div></div><div id=\"mnmsglinediv\"></div></div>";
		}else{
			xtChatWindowMsgBox.innerHTML="<div style='clear:both'>"+headIcon+"<div class=\""+senderTypeCss+"\"><div class=\"msg-content\" id=\""+msgId+"\">"+XtimGlobalObject.changeUrl(msgContent)+"</div><div class=\"msg-cursor\"></div></div><div id=\"mnmsglinediv\"></div></div>"+xtChatWindowMsgBox.innerHTML;
		}
		if(isplaysound){
		  playxtmsgsound();
		}
		xtChatWindowMsgBox.scrollTop = xtChatWindowMsgBox.scrollHeight;
		var oldScripts =document.getElementById(msgId).getElementsByTagName('script');
		if(oldScripts!=null && oldScripts.length>0){
			var oldScript=oldScripts[0];
			var parentNodecont=oldScript.parentNode;
			parentNodecont.removeChild(oldScript);
			var newScript = document.createElement('script');
			newScript.type = 'text/javascript';
			newScript.innerHTML = oldScript.innerHTML;
			parentNodecont.appendChild(newScript);
		}
		var imgtags=document.getElementById(msgId).getElementsByTagName("img");
		if(imgtags!=null && imgtags.length>0){
			for(var i=0;i<imgtags.length;i++){
				var imgtag=imgtags[i];
				if(imgtag.id!="mnnewsImgtag" && imgtag.src.indexOf("mobileFace")==-1 && imgtag.src.indexOf("chatfrom_voice_playing.png")==-1 && imgtag.src.indexOf("apis.map.qq.com")==-1){
					imgtag.style.cursor="pointer";
					imgtag.setAttribute("oldwidth",imgtag.width);
					imgtag.setAttribute("oldheight",imgtag.height);
					imgtag.setAttribute("height","auto");
					imgtag.setAttribute("width","auto");
					imgtag.style.height="auto";
					imgtag.style.maxWidth="280px";
					imgtag.setAttribute("onclick","MobileChatWindow.showImage(event)");
				}
			}
		}
	},
	
	showImage:function(e){
		var e = e || window.event; 
		var imageob=XtimGlobalObject.ns6? e.target : e.srcElement;
		setPhotoShow( [
			       	    {
			    	        src:imageob.src,
			    	        w: imageob.getAttribute("oldwidth"),
			    	        h:imageob.getAttribute("oldheight")
			    	    }]);
	},
	
	changeMenuTab:function(menutype){
		var xtminititletab=document.getElementById("xtminititletab");
		var xtmsgbodycontainercontext=document.getElementById("xtChatWindowMsgBox");
		var xtmsgrobotbodycontainercontext=document.getElementById("xtmsgrobotbodycontainercontext");
		if(menutype==0){
			xtminititletab.innerHTML=XtLanguageConst.servicerobot;
			xtminititletab.setAttribute("onclick","MobileChatWindow.changeMenuTab(1)");
			xtmsgbodycontainercontext.style.display="block";
			xtmsgrobotbodycontainercontext.style.display="none";
			if(document.getElementById("agentNameTitle")==null){
				document.getElementById("titlelabel").innerHTML=xtmainAgentName;
			}else{
				document.getElementById("agentNameTitle").innerHTML=xtmainAgentName;
			}
			
			if(XtimGlobalObject.waitcount==-1){
				document.getElementById("miniwinwaitingpanel").style.display="none";
			}else{
				document.getElementById("miniwinwaitingpanel").style.display="block";
			}
			if(xtmainAgentIsonline){
				mn$("xtSendMsgButton").innerHTML=XtLanguageConst.send;
			}else{
				mn$("xtSendMsgButton").innerHTML=XtLanguageConst.leavemessage;
			}
		}else if(menutype==1){
			mn$("xtSendMsgButton").innerHTML=XtLanguageConst.send;
			xtminititletab.innerHTML=XtLanguageConst.personService;
			xtminititletab.setAttribute("onclick","MobileChatWindow.changeMenuTab(0)");
			xtmsgbodycontainercontext.style.display="none";
			xtmsgrobotbodycontainercontext.style.display="block";
			if(document.getElementById("agentNameTitle")==null){
				document.getElementById("titlelabel").innerHTML=XtLanguageConst.robottitle;
			}else{
				document.getElementById("agentNameTitle").innerHTML=XtLanguageConst.robottitle;
			}
			if(!RobotWindow.hasShowWecome){
				if(mnrobotWelcomeWords!=""){
					RobotWindow.addMsg(XtimGlobalObject.replace(mnrobotWelcomeWords,"xt",xtrobotName));
				}else{
					RobotWindow.addMsg(XtimGlobalObject.replace(XtLanguageConst.roboWelcomeMsg,"xt",xtrobotName));	
				}
				
				RobotWindow.hasShowWecome=true;
			}
		}
		if(isUseRobot=="1"){
			xtminititletab.style.display="block";
		}
	},
	
	addServiceMenuMsg:function(msgContent,senderName,parentLayout){
		var xtChatWindowMsgBox=null;
		if(typeof(parentLayout)=="undefined" || parentLayout==null){
			xtChatWindowMsgBox=document.getElementById("xtChatWindowMsgBox");
		}else{
			xtChatWindowMsgBox=parentLayout;
		}
		
		var senderTypeCss="msg msg-server";
		var headIcon="";
		if(typeof(senderName)=="undefined"){
			senderName=xtmainAgentName+"\uff1a";
		    senderTypeCss="msg msg-server";
		    headIcon="<div><img style='border: 2px solid whitesmoke;float:left;border-radius:50%;width:35px;height:35px;margin-left:5px;margin-top:3px' src='"+agentsiteimgaddresspath+"getHeadIcon?userId="+xtmainAgentId+"'></div>";
		    isplaysound=true;
		}else if(senderName==XtLanguageConst.xtSystemMsg){
		    senderTypeCss="msg msg-server";
		    headIcon="<div><img style='border: 2px solid whitesmoke;float:left;border-radius:50%;width:35px;height:35px;margin-left:5px;margin-top:3px' src='"+agentsiteimgaddresspath+"getHeadIcon?userId="+xtmainAgentId+"'></div>";
		    isplaysound=true;
		}else{
			headIcon="<div><img style='border: 2px solid whitesmoke;float:right;border-radius:50%;width:35px;height:35px;margin-right:5px;margin-top:3px' src='"+clientStyleWebPath+"/visitor.png'></div>";
		    senderTypeCss="msg msg-client";
		}
		var msgId="msg"+Math.random();
		xtChatWindowMsgBox.innerHTML+="<div style='clear:both'>"+headIcon+"<div class=\""+senderTypeCss+"\"><div class=\"msg-content\" id=\""+msgId+"\"></div><div class=\"msg-cursor\"></div></div><div id=\"mnmsglinediv\"></div></div>";
		if(isplaysound){
		  playxtmsgsound();
		}
		document.getElementById(msgId).appendChild(msgContent);
		xtChatWindowMsgBox.scrollTop = xtChatWindowMsgBox.scrollHeight;
	},
	
	addZhuanjieMsg:function(zhuanJieAgentId,zhuanJieAgentName,zhuanJieAgentSignature,zhuanJieAgentAnswerTimeOutMsg,zhuanJieAgentAnswerTimeOut){
		xtmainAgentId=zhuanJieAgentId;
		xtmainAgentName=zhuanJieAgentName;
		answerTimeOutMsg=zhuanJieAgentAnswerTimeOutMsg;
		answerTimeOut=zhuanJieAgentAnswerTimeOut;
		var findAgent=XtimGlobalObject.findAgent(zhuanJieAgentId);
		if(findAgent!=null){
			XtimGlobalObject.agentInviteSetCookie(customerPublishId+"_agentId",zhuanJieAgentId,false);
			XtimGlobalObject.agentInviteSetCookie(customerPublishId+"_agentName",findAgent.agentName,false);
			XtimGlobalObject.agentInviteSetCookie(customerPublishId+"_agentUserName",findAgent.agentNo,false);
			XtimGlobalObject.agentInviteSetCookie(customerPublishId+"_agentSex",findAgent.sex,false);
		}
	},
	
	saveZhuanjieMsg:function(zhuanJieAgentId,zhuanJieAgentNameNo,zhuanJieAgentName,zhuanJieAgentSignature,zhuanJieAgentAnswerTimeOutMsg,zhuanJieAgentAnswerTimeOut){
		
	},
	
	changeAgent:function(changeAgentId,isQueue){
		if(changeAgentId==xtmainAgentId){
			return;
		}
		var findAgent=XtimGlobalObject.findAgent(changeAgentId);
		if(findAgent!=null){
			XtimGlobalObject.connectAgent(findAgent,isQueue);
			if(document.getElementById("agentNameTitle")==null){
				document.getElementById("titlelabel").innerHTML=findAgent.agentName;
			}else{
				document.getElementById("agentNameTitle").innerHTML=findAgent.agentName;
			}
			
			document.title=findAgent.agentName;
			window.parent.postMessage({eventName:"setDocTitle",message: document.title}, "*");
			if(findAgent.phoneNumber!=null && findAgent.phoneNumber!=""){
				document.getElementById("gophonenumber").style.display="block";
				document.getElementById("gophonenumber").href="tel:"+findAgent.phoneNumber;
			}else{
				document.getElementById("gophonenumber").style.display="none";
			}
		}
		var agentscontainer=document.getElementById("agentscontainer");
		agentscontainer.style.display="none";
		var agentheadicon=document.getElementById("agentheadicon");
		agentheadicon.src=agentsiteimgaddresspath+"getHeadIcon?userId="+changeAgentId;
	},
	
	openAppraiseDiv:function(){
		MobileChatWindow.changeMenuTab(0);
		if(document.getElementById("miniappraiseWindowBox")!=null){
			XtimGlobalObject.removeObjectInIE(document.getElementById("miniappraiseWindowBox"));
		}
		var miniappraiseWindowBox=document.createElement("div");
		miniappraiseWindowBox.id="miniappraiseWindowBox";
		miniappraiseWindowBox.innerHTML=MobileChatWindow.appraisewinhtml;
		var xtChatWindowMsgBox=document.getElementById("xtChatWindowMsgBox");
		xtChatWindowMsgBox.appendChild(miniappraiseWindowBox);
		document.getElementById("miniappraiseTitle").innerHTML=XtLanguageConst.appraiseTitle;
		document.getElementById("miniappraisesubmitbutton").innerText=XtLanguageConst.submitAppraise;
		var appraiseitemstr="";
		for(var item in mnappraiseMap){
			appraiseitemstr+="<div class=\"miniappraiseitem\"><label><input type=\"radio\" id=\"miniappraiseSelect\" name=\"miniappraiseSelect\" value=\""+item+"\" /> "+mnappraiseMap[item]+"</label></div>";
		}
		document.getElementById("miniappraiseItems").innerHTML=appraiseitemstr;
		xtChatWindowMsgBox.scrollTop = xtChatWindowMsgBox.scrollHeight;
		document.getElementById("miniappraiseremarks").placeholder=XtLanguageConst.pleaseinputremark;
	},
	
	closeAppraisePanel:function(){
		if(document.getElementById("miniappraiseWindowBox")!=null){
			XtimGlobalObject.removeObjectInIE(document.getElementById("miniappraiseWindowBox"));
		}
	},
	
	minisendAppraise:function(){
		var appraiseValue=XtimGlobalObject.getRadioBoxValue("miniappraiseSelect");
		if(appraiseValue==null){
			alert(XtLanguageConst.selectAppraise);
			return;
		}
		var appraiseStar=mnappraiseMap[appraiseValue];
		var customerId=XtimGlobalObject.customerId;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
		}
		document.getElementById("miniappraisesubmitbutton").disabled=true;
		var url=agentsiteimgaddresspath+"CheckMsg?action=submitAppraise";

    	var data="agentId="+xtmainAgentId+"&customerId="+customerId+"&publishPointId="+customerPublishId+"&appraiseStar="+appraiseStar+"&appraiseValue="+appraiseValue+"&appraiseNote="+document.getElementById("miniappraiseremarks").value;
		XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
				function(responseText){
					if(responseText!=null && responseText=="1"){
						XtimGlobalObject.agentInviteSetCookie("hasAppraise_"+customerPublishId,"1");
						MobileChatWindow.addMsg(XtLanguageConst.appraiseforthanks,"sysmsg");
					}else{
						document.getElementById("miniappraisesubmitbutton").disabled=false;
						MobileChatWindow.addMsg(XtLanguageConst.appraisefaile,"sysmsg");
					}
				},
				function(){
					document.getElementById("miniappraisesubmitbutton").disabled=false;
					alert(XtLanguageConst.appraisefaile);
				});
	},
	

	onCustomerInfoInputFocus:function(e){
		var e = e || window.event; 
		var firedobj=XtimGlobalObject.ns6? e.target : e.srcElement;
		if(firedobj.id=="minicustomerName"){
			if(firedobj.value==XtLanguageConst.customerName){
				firedobj.value="";
			}
		}else if(firedobj.id=="mnmini_phoneNumber"){
			if(firedobj.value==XtLanguageConst.phoneNumber){
				firedobj.value="";
			}
		}else if(firedobj.id=="mnmini_phoneNumber"){
			if(firedobj.value==XtLanguageConst.phoneNumber){
				firedobj.value="";
			}
		}else if(firedobj.id=="mnmini_age"){
			if(firedobj.value==XtLanguageConst.age){
				firedobj.value="";
			}
		}else if(firedobj.id=="mnmini_mobileNumber"){
			if(firedobj.value==XtLanguageConst.mobileNumber){
				firedobj.value="";
			}
		}
	},
	
	onCustomerInfoInputBlur:function(){
		var e = e || window.event; 
		var firedobj=XtimGlobalObject.ns6? e.target : e.srcElement;
		if(firedobj.id=="minicustomerName"){
			if(firedobj.value==""){
				firedobj.value=XtLanguageConst.customerName;
			}
		}else if(firedobj.id=="mnmini_phoneNumber"){
			if(firedobj.value==""){
				firedobj.value=XtLanguageConst.phoneNumber;
			}
		}else if(firedobj.id=="mnmini_phoneNumber"){
			if(firedobj.value==""){
				firedobj.value=XtLanguageConst.phoneNumber;
			}
		}else if(firedobj.id=="mnmini_age"){
			if(firedobj.value==""){
				firedobj.value=XtLanguageConst.age;
			}
		}else if(firedobj.id=="mnmini_mobileNumber"){
			if(firedobj.value==""){
				firedobj.value=XtLanguageConst.mobileNumber;
			}
		}
	},
	
	openCustomerInfoDiv:function(){
		MobileChatWindow.changeMenuTab(0);
		if(document.getElementById("miniCustomerInfoWindowBox")!=null){
			XtimGlobalObject.removeObjectInIE(document.getElementById("miniCustomerInfoWindowBox"));
		}
		var miniappraiseWindowBox=document.createElement("div");
		miniappraiseWindowBox.id="miniCustomerInfoWindowBox";
		miniappraiseWindowBox.innerHTML=MobileChatWindow.customerInfohtml;
		var xtChatWindowMsgBox=document.getElementById("xtChatWindowMsgBox");
		xtChatWindowMsgBox.appendChild(miniappraiseWindowBox);
		document.getElementById("minacustomerInfoTitle").innerHTML=XtLanguageConst.custimerInfo;
		document.getElementById("minicustomerinfosubmitbutton").innerText=XtLanguageConst.submit;
		var appraiseitemstr="";
		appraiseitemstr+="<div class=\"minicustomerinforow\"><input onblur=\"MobileChatWindow.onCustomerInfoInputBlur(event)\" onfocus=\"MobileChatWindow.onCustomerInfoInputFocus(event)\" value=\""+XtLanguageConst.customerName+"\" class=\"minicustomerinputTextStyle\" type=\"text\" id=\"minicustomerName\" name=\"minicustomerName\"  maxlength=\"64\" /></div>";
		appraiseitemstr+="<div class=\"minicustomerinforow\"><label><input type=\"radio\" name=\"mnmini_sex\" id=\"mnmini_sex\" value=\"0\" > 男	</label><label><input type=\"radio\" name=\"mnmini_sex\" id=\"mnmini_sex\" value=\"1\"> 女</label></div>";
		appraiseitemstr+="<div class=\"minicustomerinforow\"><input onblur=\"MobileChatWindow.onCustomerInfoInputBlur(event)\" onfocus=\"MobileChatWindow.onCustomerInfoInputFocus(event)\"  maxlength=\"3\" type=\"text\" id=\"mnmini_age\" name=\"mnmini_age\" class=\"minicustomerinputTextStyle\" value=\""+XtLanguageConst.age+"\" /></div>";
		appraiseitemstr+="<div class=\"minicustomerinforow\"><input onblur=\"MobileChatWindow.onCustomerInfoInputBlur(event)\" onfocus=\"MobileChatWindow.onCustomerInfoInputFocus(event)\" type=\"text\" id=\"mnmini_phoneNumber\" name=\"mnmini_phoneNumber\"  maxlength=\"16\" class=\"minicustomerinputTextStyle\" value=\""+XtLanguageConst.phoneNumber+"\" /></div>";
		appraiseitemstr+="<div class=\"minicustomerinforow\"><input onblur=\"MobileChatWindow.onCustomerInfoInputBlur(event)\" onfocus=\"MobileChatWindow.onCustomerInfoInputFocus(event)\" type=\"text\" id=\"mnmini_mobileNumber\" name=\"mnmini_mobileNumber\"  maxlength=\"16\" class=\"minicustomerinputTextStyle\" value=\""+XtLanguageConst.mobileNumber+"\" /></div>";
		
		document.getElementById("minicustomercontent").innerHTML=appraiseitemstr;
		xtChatWindowMsgBox.scrollTop = xtChatWindowMsgBox.scrollHeight;
		MobileChatWindow.getCustomerInfo();
	},
	
	getCustomerInfo:function(){
		var customerId=XtimGlobalObject.customerId;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
			if(customerId==null){
				customerId="";
			}
		}
		var url=agentsiteimgaddresspath+"CheckMsg?action=getCustomerInfo";
    	var data="customerId="+customerId+"&publishPointId="+customerPublishId;
	    XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
	    		function(responseText){
	    			if(responseText!=null){
	    				var results=eval('(' + responseText + ')');
	    				if(results.id){
	    					mn$("minicustomerName").value=results.customerName;
	    					if(results.sex=="0"){
	    						document.getElementsByName("mnmini_sex")[0].checked=true;
	    					}else{
	    						document.getElementsByName("mnmini_sex")[1].checked=true;
	    					}
	    					mn$("mnmini_age").value=results.age;
	    					if(typeof(results.phone)=="undefined" || results.phone==null){
	    						mn$("mnmini_phoneNumber").value="";
	    					}else{
	    						mn$("mnmini_phoneNumber").value=results.phone;
	    					}
	    					if(typeof(results.mobileNum)=="undefined" || results.mobileNum==null){
	    						mn$("mnmini_mobileNumber").value="";
	    					}else{
	    						mn$("mnmini_mobileNumber").value=results.mobileNum;
	    					}
	    				}
	    			}
	    		});
	},
	
	closeCustomerInfoPanel:function(){
		if(document.getElementById("miniCustomerInfoWindowBox")!=null){
			XtimGlobalObject.removeObjectInIE(document.getElementById("miniCustomerInfoWindowBox"));
		}
	},
	
	sendCustomerInfo:function(){
		var customerName=document.getElementById("minicustomerName").value.trim();
		if(customerName=="" || customerName==XtLanguageConst.customerName){
			alert(XtLanguageConst.namenotnull);
			return;
		}
		var sexValue=XtimGlobalObject.getRadioBoxValue("mnmini_sex");
		if(sexValue==null){
			alert(XtLanguageConst.pleaseinputsex);
			return;
		}
		var age=document.getElementById("mnmini_age").value.trim();
		var re =/^\+?[0-9][0-9]*$/;
		if (!re.test(age)){
			alert(XtLanguageConst.agemustnum);;
			return;
		}
		
		var phoneNumber=document.getElementById("mnmini_phoneNumber").value.trim();
		var mobileNumber=document.getElementById("mnmini_mobileNumber").value.trim();
		if(phoneNumber==XtLanguageConst.phoneNumber){
			phoneNumber="";
		}
		if(mobileNumber==XtLanguageConst.mobileNumber){
			mobileNumber="";
		}
		var customerId=XtimGlobalObject.customerId;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
		}
		document.getElementById("minicustomerinfosubmitbutton").disabled=true;
		var url=agentsiteimgaddresspath+"CheckMsg?action=saveCustomer";

    	var data="customerId="+customerId+"&agentId="+xtmainAgentId+"&publishPointId="+customerPublishId+"&customerName="+customerName+"&sex="+sexValue+"&age="+age+"&phoneNumber="+phoneNumber+"&mobileNumber="+mobileNumber;
	    XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
	    		function(responseText){
	    			if(responseText!=null && responseText=="1"){
	    				document.getElementById("minicustomerinfosubmitbutton").disabled=false;
	    				XtimGlobalObject.isSaveCustomerInfo="1";
	    				XtimGlobalObject.agentInviteSetCookie("saveCustomer_"+customerPublishId,"1",true);
	    				MobileChatWindow.addMsg(XtLanguageConst.savesuccuss,"sysmsg");
	    			}else{
	    				document.getElementById("minicustomerinfosubmitbutton").disabled=false;
	    				MobileChatWindow.addMsg(XtLanguageConst.savefaile,"sysmsg");
	    			}
	    		},
	    		function(){
	    			MobileChatWindow.addMsg(XtLanguageConst.savefaile,"sysmsg");
	    		});

	},
	
	openLeaveMessagePanel:function(){
		if(mn$("miniCustomerLeaveWindowBox")!=null){
			XtimGlobalObject.removeObjectInIE(mn$("miniCustomerLeaveWindowBox"));
		}
		var miniappraiseWindowBox=document.createElement("div");
		miniappraiseWindowBox.id="miniCustomerLeaveWindowBox";
		miniappraiseWindowBox.innerHTML=MobileChatWindow.customerLeavehtml;
		var xtChatWindowMsgBox=mn$("xtChatWindowMsgBox");
		xtChatWindowMsgBox.appendChild(miniappraiseWindowBox);
		mn$("minacustomerLeaveTitle").innerHTML=XtLanguageConst.pleaseLeave;
		mn$("minicustomerLeavesubmitbutton").innerText=XtLanguageConst.submitleavemessage;
		var leaveitemsstr="";
		for(var i=0;i<mnCustomerLeaveMsgItems.length;i++){
			var item=mnCustomerLeaveMsgItems[i];
			var starStr="";
			if(item.allowNullValue==false){
				starStr="<span style=\"font-weight: bold\">* </span>";
			}
			if(item.fieldType==0){
				leaveitemsstr+="<div class=\"minicustomerinforow\"><div class=\"mnleaveitemlabel\">"+starStr+item.fieldName+"</div><input class=\"minicustomerinputTextStyle\" type=\"text\" id=\"mn_leaveitem_"+item.fieldName+"\"  maxlength=\"64\" /></div>";
			}else if(item.fieldType==1){
				leaveitemsstr+="<div class=\"minicustomerinforow\"><div class=\"mnleaveitemlabel\">"+starStr+item.fieldName+"</div><textarea class=\"minicustomerinputTextStyle\" maxlength=\"200\" id=\"mn_leaveitem_"+item.fieldName+"\" class=\"minicustomerTextareaStyle\"></textarea></div>";
			}
		}
		mn$("minicustomerLeavecontent").innerHTML=leaveitemsstr;
		mn$("mn_customer_leavepanel_notes").innerHTML=mncustomerLeaveNote;
		xtChatWindowMsgBox.scrollTop = xtChatWindowMsgBox.scrollHeight;
	},
	
	closeCustomerLeavePanel:function(){
		if(document.getElementById("miniCustomerLeaveWindowBox")!=null){
			XtimGlobalObject.removeObjectInIE(document.getElementById("miniCustomerLeaveWindowBox"));
		}
	},
	
	sendCustomerLeave:function(){
		var msgstr="";
		var hasvalue=false;
		for(var i=0;i<mnCustomerLeaveMsgItems.length;i++){
			var item=mnCustomerLeaveMsgItems[i];
			var fieldvalue=mn$("mn_leaveitem_"+item.fieldName).value;
			if(item.allowNullValue==false && fieldvalue==""){
				alert(XtLanguageConst.pleaseinput+":"+item.fieldName);
				return;
			}
			if(fieldvalue.length>0){
				hasvalue=true;
			}
			msgstr+=item.fieldName+":"+fieldvalue;
			if(i<mnCustomerLeaveMsgItems.length-1){
				msgstr+="<br>";
			}
		}
		if(!hasvalue){
			alert(XtLanguageConst.needinputoneitem);
			return;
		}
		msgstr=XtLanguageConst.receiveleave+":<br>"+msgstr;
		var msgId=XtimGlobalObject.generateUUID();
		XtimGlobalObject.sendMsg(msgstr,msgId,false,0,0);
		MobileChatWindow.addMsg(XtLanguageConst.leavescuess,"sysmsg",XtLanguageConst.msgalert,msgId);
	},
	
	openTelPanel:function(){
		MobileChatWindow.changeMenuTab(0);
		if(document.getElementById("miniTelpanelWindowBox")!=null){
			XtimGlobalObject.removeObjectInIE(mn$("miniTelpanelWindowBox"));
		}
		var telpanelWindowBox=document.createElement("div");
		telpanelWindowBox.id="miniTelpanelWindowBox";
		telpanelWindowBox.innerHTML=MobileChatWindow.telpanelhtml;
		var xtChatWindowMsgBox=mn$("xtChatWindowMsgBox");
		xtChatWindowMsgBox.appendChild(telpanelWindowBox);
		mn$("mntelpaneltitle").innerHTML=XtLanguageConst.telpaneltitle;
		mn$("mntelpaneldesc").innerHTML="<ul><li>"+XtLanguageConst.telinputmobile+"</li><li>"+XtLanguageConst.telinputphone+"</li><ul>";
		mn$("mntelpanelfooter").innerHTML=XtLanguageConst.telpanelfooter;
		xtChatWindowMsgBox.scrollTop = xtChatWindowMsgBox.scrollHeight;
	},
	
	submitTelPhone:function(){
		var telnumber=mn$("mntelpanelnumber").value.trim();
		if(telnumber==""){
			alert(XtLanguageConst.pleaseInputPhone);
			return;
		}
		var msgId=XtimGlobalObject.generateUUID();
		XtimGlobalObject.sendMsg(XtLanguageConst.backphone+":"+telnumber,msgId,false,0,0);
		MobileChatWindow.addMsg(XtLanguageConst.sendPhoneResult,"sysmsg",XtLanguageConst.msgalert,msgId);
	}
};


RobotWindow={
	hasShowWecome:false,
	sendMsg:function(){
		var xtChatWindowMsgInputBox=document.getElementById("xtChatWindowMsgInputBox");
		if(xtChatWindowMsgInputBox.value.length==0){
			return;
		}
		if(xtChatWindowMsgInputBox.value.length>500){
			RobotWindow.addMsg(XtLanguageConst.msgtoolong,XtLanguageConst.msgalert);
			return;
		}
		var customerId=XtimGlobalObject.customerId;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
			if(customerId==null){
				customerId="";
			}
		}
		var sendmsgstr=xtChatWindowMsgInputBox.value;
		RobotWindow.addMsg(XtimGlobalObject.clearScript(sendmsgstr),XtLanguageConst.yours);
		xtChatWindowMsgInputBox.value="";
        var url=agentsiteimgaddresspath+"CheckMsg?action=queryRobot&publishPointId="+customerPublishId+"&customerId="+customerId+"&agentId="+xtmainAgentId;
        
       	var data="msg="+sendmsgstr;
   		XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
   				function(responseText){
   					if(responseText=="no anwser"){
		    			RobotWindow.addMsg(XtLanguageConst.noanwser);
		    		}else{
		    			RobotWindow.addMsg(responseText);
		    		}
   				},
   				function(){
   					alert(XtLanguageConst.neterr);
   				});
	},
	
	clearAllMsg:function(){
		var xtChatWindowMsgBox=document.getElementById("xtmsgrobotbodycontainercontext");
		xtChatWindowMsgBox.innerHTML="";
	},
	
	queryResultMsg:function(result){
		if(result.result=="no anwser"){
			RobotWindow.addMsg(XtLanguageConst.noanwser);
		}else{
			RobotWindow.addMsg(responseText);
		}
	},
	
	addMsg:function(msgContent,senderName){
		msgContent=msgContent.replace(/<font[^>]*?>/gim,"");
		msgContent=msgContent.replace(new RegExp("</font>","gim"),"");
		msgContent=msgContent.replace(/<p[^>]*?>/gim,"");
		msgContent=msgContent.replace(new RegExp("</p>","gim"),"");
		var xtChatWindowMsgBox=document.getElementById("xtmsgrobotbodycontainercontext");
		var senderTypeCss="msg msg-server";
		var headIcon="";
		if(typeof(senderName)=="undefined" || senderName=="undefined"){
			senderName=xtmainAgentName+"\uff1a";
		    senderTypeCss="msg msg-server";
		    headIcon="<div><img style='border: 2px solid whitesmoke;float:left;border-radius:50%;width:35px;height:35px;margin-left:3px;margin-top:3px' src='"+clientStyleWebPath+"/webrobot.png'></div>";
		    isplaysound=true;
		}else if(senderName==XtLanguageConst.xtSystemMsg){
		    senderTypeCss="msg msg-server";
		    headIcon="<div><img style='border: 2px solid whitesmoke;float:left;border-radius:50%;width:35px;height:35px;margin-left:3px;margin-top:3px' src='"+clientStyleWebPath+"/webrobot.png'></div>";
		    isplaysound=true;
		}else{
			var mncustomerHeadImg=XtimGlobalObject.getCustomerHead();
			if(mncustomerHeadImg==null){
				headIcon="<div><img style='border: 2px solid whitesmoke;float:right;border-radius:50%;width:35px;height:35px;margin-right:3px;margin-top:3px' src='"+clientStyleWebPath+"/visitor.png'></div>";
			}else{
				headIcon="<div><img style='border: 2px solid whitesmoke;float:right;border-radius:50%;width:35px;height:35px;margin-right:3px;margin-top:3px' src='"+mncustomerHeadImg+"'></div>";
			}
		    senderTypeCss="msg msg-client";
		}
		var msgId="msg"+Math.random();
		xtChatWindowMsgBox.innerHTML+="<div style='clear:both'>"+headIcon+"<div class=\""+senderTypeCss+"\"><div class=\"msg-content\" id=\""+msgId+"\">"+XtimGlobalObject.changeUrl(msgContent)+"</div><div class=\"msg-cursor\"></div></div><div id=\"mnmsglinediv\"></div></div>";
		if(isplaysound){
		  playxtmsgsound();
		}
		xtChatWindowMsgBox.scrollTop = xtChatWindowMsgBox.scrollHeight;
		var oldScripts =document.getElementById(msgId).getElementsByTagName('script');
		if(oldScripts!=null && oldScripts.length>0){
			var oldScript=oldScripts[0];
			var parentNodecont=oldScript.parentNode;
			parentNodecont.removeChild(oldScript);
			var newScript = document.createElement('script');
			newScript.type = 'text/javascript';
			newScript.innerHTML = oldScript.innerHTML;
			parentNodecont.appendChild(newScript);
		}
	}
};

var openMediaType=XtimGlobalObject.getUrlParameter("openMediaType");
if(openMediaType==null){
	openMediaType=0;
}
var talkProductImgPath=XtimGlobalObject.getUrlParameter("talkProductImgPath");
var talkProductName=XtimGlobalObject.getUrlParameter("talkProductName");
var talkProductPrice=XtimGlobalObject.getUrlParameter("talkProductPrice");
var talkProductUrl=XtimGlobalObject.getUrlParameter("talkProductUrl");
var appinner=XtimGlobalObject.getUrlParameter("appinner");
if(appinner==null){
	appinner=0;
}
var urlcustomerName=XtimGlobalObject.getUrlParameter("customerName");
var firstMessage=XtimGlobalObject.getUrlParameter("message");


var serviceMenuActionArray=new Array();
var serviceMenuActionindex=0;

function ServiceMenuAction(id,serviceMenu,serviceSubMenu,getParentServiceMenu,getNextServiceMenu,getRobot,changeAgentFun,changeGroup,autoGetAgent){
	this.id=id;
	this.serviceMenu=serviceMenu;
	this.serviceSubMenu=serviceSubMenu;
	this.getParentServiceMenu=getParentServiceMenu;
	this.getNextServiceMenu=getNextServiceMenu;
	this.getRobot=getRobot;
	this.changeAgentFun=changeAgentFun;
	this.changeGroup=changeGroup;
	this.autoGetAgent=autoGetAgent;
	
	this.clickAction=function(){
			if(serviceSubMenu.action=="0"){
				getNextServiceMenu(serviceSubMenu.id);
			}else if(serviceSubMenu.action=="1"){
				XtimGlobalObject.openLinkChatWindow(serviceSubMenu.hrefAddress);
			}else if(serviceSubMenu.action=="2"){
				autoGetAgent();
			}else if(serviceSubMenu.action=="3"){
				changeAgentFun(serviceSubMenu.connectAgentId,1);
			}else if(serviceSubMenu.action=="4"){
				changeGroup(serviceSubMenu.connectGroupId);
			}else if(serviceSubMenu.action=="5"){
				getRobot();
			}else if(serviceSubMenu.action=="6"){
				if(serviceMenu.serviceSubMenuId==null){
					return;
				}
				getParentServiceMenu(serviceMenu.serviceSubMenuId);
			}
		};
}

function serviceMenuClickAction(id){
		var serviceMenuAction=null;
		for(var i=0;i<serviceMenuActionArray.length;i++){
			var curServiceMenuAction=serviceMenuActionArray[i];
			if(curServiceMenuAction.id==id){
				serviceMenuAction=curServiceMenuAction;
				break;
			}
		}
		if(serviceMenuAction!=null){
				if(serviceMenuAction.serviceSubMenu.action=="0"){
					serviceMenuAction.getNextServiceMenu(serviceMenuAction.serviceSubMenu.id);
				}else if(serviceMenuAction.serviceSubMenu.action=="1"){
					location.href=serviceMenuAction.serviceSubMenu.hrefAddress;
				}else if(serviceMenuAction.serviceSubMenu.action=="2"){
					serviceMenuAction.autoGetAgent();
				}else if(serviceMenuAction.serviceSubMenu.action=="3"){
					serviceMenuAction.changeAgentFun(serviceMenuAction.serviceSubMenu.connectAgentId,1);
				}else if(serviceMenuAction.serviceSubMenu.action=="4"){
					serviceMenuAction.changeGroup(serviceMenuAction.serviceSubMenu.connectGroupId);
				}else if(serviceMenuAction.serviceSubMenu.action=="5"){
					serviceMenuAction.getRobot();
				}else if(serviceMenuAction.serviceSubMenu.action=="6"){
					if(serviceMenuAction.serviceMenu.serviceSubMenuId==null){
						return;
					}
					serviceMenuAction.getParentServiceMenu(serviceMenuAction.serviceMenu.serviceSubMenuId);
				}
		}
};

function loadServiceMenu(serviceSubMenuId){
		var idtype=0;
		if(typeof serviceSubMenuId=="undefined" || serviceSubMenuId==null){
			idtype=1;
			serviceSubMenuId=customerPublishId;
		}
		loadServiceMenuCommon(serviceSubMenuId,idtype);
}

function loadServiceMenuCommon(serviceSubMenuId,idtype){
		var customerId=XtimGlobalObject.customerId;
		if(customerId==null){
			customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
			if(customerId==null){
				customerId="";
			}
		}
		var data="idtype="+idtype+"&serviceSubMenuId="+serviceSubMenuId+"&siteId="+mnkfSiteId+"&publishPointId="+customerPublishId+"&customerId="+customerId;
        var url=agentsiteimgaddresspath+"CheckMsg?action=getServiceMenu";
		XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
		function(responseText){
			var result=eval('(' + responseText + ')');
			var curServiceMenu=result.serviceMenu;
			var curServiceSubMenus=result.serviceSubMenuList;
			var curserviceMenuActionArray=new Array();
			if(curServiceSubMenus!=null && curServiceSubMenus.length>0){
				for (var i=0;i<curServiceSubMenus.length;i++){
				   var serviceSubMenu=curServiceSubMenus[i];
				   serviceMenuActionindex++;
					var serviceMenuAction=new ServiceMenuAction(serviceMenuActionindex,curServiceMenu,serviceSubMenu,getParentServiceMenu,loadServiceMenu,menubackrobot,changeAgent,getAgentByGroup,autoGetAgent);
					serviceMenuActionArray.push(serviceMenuAction);
					curserviceMenuActionArray.push(serviceMenuAction);
				}
			}
			var xtChatWindowMsgBox=document.getElementById("xtChatWindowMsgBox");
			if(xtChatWindowMsgBox.style.display!="none"){
				addServiceMenu(curServiceMenu,curServiceSubMenus,curserviceMenuActionArray,xtChatWindowMsgBox);
				if(idtype==1 &&  isUseRobot=="1"){
					addServiceMenu(curServiceMenu,curServiceSubMenus,curserviceMenuActionArray,document.getElementById("xtmsgrobotbodycontainercontext"));
				}
			}else{
				if( isUseRobot=="1"){
					addServiceMenu(curServiceMenu,curServiceSubMenus,curserviceMenuActionArray,document.getElementById("xtmsgrobotbodycontainercontext"));	
				}				
				if(idtype==1){
					addServiceMenu(curServiceMenu,curServiceSubMenus,curserviceMenuActionArray,xtChatWindowMsgBox);
				}
			}
			MobileChatWindow.showHistoryMsg();
		},
		function(){
			alert(XtLanguageConst.loadservicemenufaile);
		});
}

function menubackrobot(){
	MobileChatWindow.changeMenuTab(1);
}

function addServiceMenu(curServiceMenu,curServiceSubMenus,serviceMenuActionArray,parentLayout){
	var msgtext="";
	var msgdiv=document.createElement("div");
	if(typeof(curServiceMenu)!="undefined" && typeof(curServiceMenu.menuText)!="undefined" && curServiceMenu.menuText!=null && curServiceMenu.menuText!=""){
		var menuText=document.createElement("span");
		menuText.innerHTML=XtimGlobalObject.replace(curServiceMenu.menuText, "\r","<br>");
		msgdiv.appendChild(menuText);
		msgdiv.appendChild(document.createElement("br"));
	}
	if(curServiceSubMenus!=null && curServiceSubMenus.length>0){
		msgtext+="<br/>";
		for(var i=0;i<curServiceSubMenus.length;i++){
			var serviceSubMenu=curServiceSubMenus[i];
			var row=document.createElement("a");
			row.innerHTML=serviceSubMenu.menuTitle;
			row.className="serviceMenuClickActionStyle";
			if(serviceSubMenu.action=="1"){
				row.setAttribute("href", serviceSubMenu.hrefAddress);
				row.setAttribute("target","_blank");
			}else{
				row.setAttribute("onclick", "serviceMenuClickAction('"+serviceMenuActionArray[i].id+"')");
			}
			msgdiv.appendChild(row);
			msgdiv.appendChild(document.createElement("br"));
		}
	}
	if(msgdiv.innerHTML!=null && msgdiv.innerHTML!=""){
		MobileChatWindow.addServiceMenuMsg(msgdiv,XtLanguageConst.xtSystemMsg,parentLayout);
	}
}

function getParentServiceMenu(serviceSubMenuId){
	loadServiceMenuCommon(serviceSubMenuId,2);
}

function autoGetAgent(){
	MobileChatWindow.addMsg(xtmainAgentName+XtLanguageConst.serviceingforyou,"sysmsg");
}

function changeAgent(changeAgentId,isQueue){
	if(changeAgentId==xtmainAgentId){
		MobileChatWindow.addMsg(xtmainAgentName+XtLanguageConst.serviceingforyou,"sysmsg");
		return;
	}
	MobileChatWindow.changeAgent(changeAgentId,isQueue);
}

function getAgentByGroup(agentGroupId){
	var customerId=XtimGlobalObject.customerId;
	if(customerId==null){
		customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
	}
	var url=agentsiteimgaddresspath+"CheckMsg?action=allocGroupAgent";
	var data="agentGroupId="+agentGroupId+"&publishPointId="+customerPublishId+"&customerId="+customerId;
	XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
		function(responseText){
			var result=eval('(' + responseText + ')');
			if(result.agentId=="0"){
				alert("分配客服失败");
			}else{
				if(result.agentId==xtmainAgentId){
					MobileChatWindow.addMsg(xtmainAgentName+XtLanguageConst.serviceingforyou,"sysmsg");
				}else{
					MobileChatWindow.changeAgent(result.agentId,1);
				}
			}
		},
		function(){
			alert(XtLanguageConst.neterr);
		}
	);
}

function showInputMsg(){
	  var u = navigator.userAgent;
	  var isiOS = !!u.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
	  var timerId=0;
	  var cnt = 0;
	  setInterval(function(){
	    if (cnt < 3) {
	      cnt++;
	    } else {
	      clearInterval(timerId);
	      return;
	    }
	    if(isiOS){
	    	document.getElementById("sendmsglayout").scrollIntoView(true);  
		}else{
			if(appinner==1){
				document.getElementById("sendmsglayout").style.bottom=document.body.clientHeight/2+"px";
			}
		}
	  }, 300);
}

function restoreInputMsg(){
	document.getElementById("sendmsglayout").style.bottom="0px";
	setTimeout(function() {
		var scrollHeight = document.documentElement.scrollTop || document.body.scrollTop || 0;
		window.scrollTo(0, Math.max(scrollHeight - 1, 0));
		}, 50);
}

function sendProductUrl(){
	var sendmsg="我要咨询:<br>";
	sendmsg+="商品名称:"+talkProductName+"<br>";
	sendmsg+="商品价格:"+talkProductPrice+"<br>";
	sendmsg+="商品链接:"+talkProductUrl;
	var msgId=XtimGlobalObject.generateUUID();
	XtimGlobalObject.sendMsg(sendmsg,msgId,false,0,0);
	MobileChatWindow.addMsg("链接已发送","sysmsg",XtLanguageConst.xtSystemMsg);
}

WxManager={
		recordStartTime:0,
		recordEndTime:0,
		recordTimer:null,
		localId:null,
		checkWxBrower:function(){
			var ua = window.navigator.userAgent.toLowerCase();
			if (ua.match(/MicroMessenger/i) == 'micromessenger') {
				return true;
			} else {
				return false;
			}
		},
		
		configWxJssdk:function(){
			if(WxManager.checkWxBrower() && appId!=null && appId!="" && signature!=null && mnisUseMic=="1"){
				wx.config({
				    debug: false, // 开启调试模式,调用的所有api的返回值会在客户端alert出来，若要查看传入的参数，可以在pc端打开，参数信息会通过log打出，仅在pc端时才会打印。
				    appId:appId, // 必填，公众号的唯一标识
				    timestamp:timestamp , // 必填，生成签名的时间戳
				    nonceStr:nonceStr , // 必填，生成签名的随机串
				    signature:signature,// 必填，签名，见附录1
				    jsApiList: [ 'checkJsApi','startRecord','onVoiceRecordEnd','stopRecord','uploadVoice'] // 必填，需要使用的JS接口列表，所有JS接口列表见附录2
				});

				wx.ready(function(){
					wx.miniProgram.getEnv(function(res) {
						XtimGlobalObject.isMiniprogram=res.miniprogram;
					});
					mn$("mnSoundRecordButton").addEventListener('touchstart',WxManager.startRecordSound, false);
					mn$("mnSoundRecordButton").addEventListener('touchend',WxManager.stopRecordSound, false);
					mn$("mnSoundRecordIcon").className="mnSoundRecordIcon";
					mn$("mnSoundRecordIcon").addEventListener("click", WxManager.changeInputStyle, false);
					mn$("mnSoundRecordIcon").style.display="block";
					mn$("mnSoundRecordIcon").parentNode.style.width="32px";
				    // config信息验证后会执行ready方法，所有接口调用都必须在config接口获得结果之后，config是一个客户端的异步操作，所以如果需要在页面加载时就调用相关接口，则须把相关接口放在ready函数中调用来确保正确执行。对于用户触发时才调用的接口，则可以直接调用，不需要放在ready函数中。
				});

				wx.error(function(res){
					//alert(res.errMsg);
				});
			}
		},
		
		changeInputStyle:function(){
			mn$("mnSoundRecordButton").style.backgroundColor="#fff";
			if(mn$("mnSoundRecordIcon").className=="mnSoundRecordIcon"){
				mn$("mnSoundRecordIcon").className="mnTextInputIcon";
				mn$("mnSoundRecordButton").style.display="block";
				mn$("xtChatWindowMsgInputBox").style.display="none";
				if(!localStorage.rainAllowRecord || localStorage.rainAllowRecord !== 'true'){
				    wx.startRecord({
				        success: function(){
				            localStorage.rainAllowRecord = 'true';
				            wx.stopRecord();
				        },
				        cancel: function () {
				            XtimGlobalObject.addMsg('您未授权录音,录音功能将不可能',"sysmsg");
				        }
				    });
				}
			}else{
				mn$("mnSoundRecordIcon").className="mnSoundRecordIcon";
				mn$("mnSoundRecordButton").style.display="none";
				mn$("xtChatWindowMsgInputBox").style.display="block";
			}
		},
		
		startRecordSound:function(event){
			event.preventDefault();
			mn$("mnSoundRecordButton").style.backgroundColor="#f5f5f5";
			WxManager.recordStartTime = new Date().getTime();
			WxManager.recordTimer = setTimeout(function(){
				WxManager.stopRecordSound();
			 },60*1000);
			
			setTimeout(function(){
		        wx.startRecord({
		            success: function(){
		                localStorage.rainAllowRecord = 'true';
		            },
		            cancel: function () {
		            	XtimGlobalObject.addMsg('您未授权录音,录音功能将不可能',"sysmsg");
		            }
		        });
		    },300);
		},
		
		stopRecordSound:function(event){
			if(typeof(event)!='undefined'){
				event.preventDefault();
			}
			clearTimeout(WxManager.recordTimer);
			mn$("mnSoundRecordButton").style.backgroundColor="#fff";
			WxManager. recordEndTime= new Date().getTime();
		    if(WxManager. recordStartTime>0){
			    if((WxManager. recordEndTime - WxManager. recordStartTime) < 300){
			        //小于300ms，不录音
			        XtimGlobalObject.addMsg('录音时间太短',"sysmsg");
			    }else{
			        wx.stopRecord({
			          success: function (res) {
			        	  WxManager.localId = res.localId;
			        	  WxManager.uploadVoice();
			          },
			          fail: function (res) {
			            
			          }
			        });
			    }
		    }
	    	WxManager. recordEndTime = 0;
	    	WxManager. recordStartTime = 0;
		},
		
		uploadVoice:function(){
			wx.uploadVoice({
		        localId: WxManager.localId, // 需要上传的音频的本地ID，由stopRecord接口获得
		        isShowProgressTips: 1, // 默认为1，显示进度提示
		        success: function (res) {
		        	var customerId=XtimGlobalObject.customerId;
					if(customerId==null){
						customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
					}
		        	var data="serverId="+res.serverId;
			        var url="sendWxVoiceMsg.jsp?serverId="+res.serverId+"&customerId="+customerId+"&appId="+appId+"&agentId="+xtmainAgentId+"&publishPointId="+customerPublishId;
					XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
					function(responseText){
						responseText=responseText.trim();
						var result= JSON.parse(responseText);
						var msgId=XtimGlobalObject.generateUUID();
						var mymsg="<span style=\"cursor:pointer;\" onclick=\"playchatmsgsound('"+result.voiceUrl+"')\"><img src=\""+agentsiteimgaddresspath+"static/image/chatfrom_voice_playing.png\"></span>";
						MobileChatWindow.addMsg(mymsg,"customer",XtLanguageConst.yours,msgId);
						var msgjsonob=new Object();
						msgjsonob.localpath=null;
						msgjsonob.remotepath=result.voiceUrl;
						msgjsonob.legnth=0;
						XtimGlobalObject.sendVoiceMsg(JSON.stringify(msgjsonob),msgId);
					},
					function(){
						XtimGlobalObject.addMsg("发送语音失败","sysmsg");
					});
		        },
		        fail:function(){
		        	XtimGlobalObject.addMsg("上传录音失败","sysmsg");
                },
		    });
		}
};

RecordManager={
		recorder:null,
		timer:0,
		mask:null,
		isCanel:false,
		supportMedia:function(){
			 if(location.protocol!="https:"){
				 return false;
			 }
			 navigator.getUserMedia = navigator.getUserMedia ||
             navigator.webkitGetUserMedia ||
             navigator.mozGetUserMedia ||
			 navigator.mediaDevices.getUserMedia ||
             navigator.msGetUserMedia;
			 if(navigator.getUserMedia){
				 return true;
			 }
			 return false;
		},
		
		init:function(){
			if(mnisUseMic!="1" || !RecordManager.supportMedia()){
				return;
			}
			RecordManager.mask=mn$("mask");
			mn$("mnSoundRecordButton").addEventListener('touchstart',RecordManager.startRecordSound, false);
			mn$("mnSoundRecordButton").addEventListener('touchend',RecordManager.stopRecordSound, false);
			mn$("mnSoundRecordButton").addEventListener('touchmove',function(){
				RecordManager.isCanel=true;
               	RecordManager.mask.style.display="none";
       			if(RecordManager.timer>0){
       	            clearTimeout(RecordManager.timer);
       			}
              	RecordManager.timer = 0;
              	RecordManager.recorder.stop();
            });
			mn$("mnSoundRecordIcon").className="mnSoundRecordIcon";
			mn$("mnSoundRecordIcon").addEventListener("click", RecordManager.changeInputStyle, false);
			mn$("mnSoundRecordIcon").style.display="block";
			mn$("mnSoundRecordIcon").parentNode.style.width="32px";
		},
		
		changeInputStyle:function(){
			mn$("mnSoundRecordButton").style.backgroundColor="#fff";
			if(mn$("mnSoundRecordIcon").className=="mnSoundRecordIcon"){
				mn$("mnSoundRecordIcon").className="mnTextInputIcon";
				mn$("mnSoundRecordButton").style.display="block";
				mn$("xtChatWindowMsgInputBox").style.display="none";
				if(RecordManager.recorder==null){
					RecordManager.recorder = new Recorder({
	                    sampleRate: 44100, //采样频率，默认为44100Hz(标准MP3采样率)
	                    bitRate: 128, //比特率，默认为128kbps(标准MP3质量)
	                    success: function(){ //成功回调函数

	                    },
	                    error: function(msg){ //失败回调函数
	                    	RecordManager.recorder=null;
	                    	RecordManager.mask.style.display="none";
							if (msg==="获取麦克风权限失败"){
								XtimGlobalObject.addMsg(XtLanguageConst.micaccessdenied,"sysmsg");
							}else{
								XtimGlobalObject.addMsg(msg,"sysmsg");
							}
	                    },
	                    fix: function(msg){ //不支持H5录音回调函数
	                    	RecordManager.recorder=null;
	                    	RecordManager.mask.style.display="none";
	                        XtimGlobalObject.addMsg(msg,"sysmsg");
	                    }
	                });
				}
			}else{
				mn$("mnSoundRecordIcon").className="mnSoundRecordIcon";
				mn$("mnSoundRecordButton").style.display="none";
				mn$("xtChatWindowMsgInputBox").style.display="block";
			}
		},
		
		startRecordSound:function(event){
			if(RecordManager.recorder==null){
				return;
			}
			if(typeof(event)!='undefined' && event!=null){
				event.preventDefault();
			}
			RecordManager.isCanel=false;
			mn$("mnSoundRecordButton").style.backgroundColor="#f5f5f5";
			RecordManager.timer = setTimeout(function(){
				  RecordManager.mask.style.display="block";
				  RecordManager.timer=0;
                  RecordManager.recorder.start();
            },500);
		},
		
		stopRecordSound:function(event){
			if(typeof(event)!='undefined' && event!=null){
				event.preventDefault();
			}
			RecordManager.mask.style.display="none";
			mn$("mnSoundRecordButton").style.backgroundColor="#fff";
			RecordManager.recorder.stop();
			if(RecordManager.timer>0){
	            clearTimeout(RecordManager.timer);
	            RecordManager.timer=0;
			}else{
				if(!RecordManager.isCanel){
					RecordManager.recorder.getBlob(function(blob){
						if(!RecordManager.isCanel){
							RecordManager.isCanel=true;
							if(blob.size>10000){
								RecordManager.uploadVoice(blob);
							}else{
								MobileChatWindow.addMsg("录音太短，不能发送","sysmsg",XtLanguageConst.xtSystemMsg);
							}
						}
		             });
				}
			}
		},
		
		uploadVoice:function(blob){
			var fd = new FormData(document.getElementById("uploadForm"));
	        fd.append("isMobile","1");
	        fd.append("uploadimg"  , blob , "voice.mp3");
	        var xhr=XtimGlobalObject.createXHR();
	        xhr.addEventListener('load', function(event) {
	            //成功
	            var result=eval('(' + xhr.responseText + ')');
	            var msgId=XtimGlobalObject.generateUUID();
				var mymsg="<span style=\"cursor:pointer;\" onclick=\"playchatmsgsound('"+result.url+"')\"><img src=\""+agentsiteimgaddresspath+"static/image/chatfrom_voice_playing.png\"></span>";
				MobileChatWindow.addMsg(mymsg,"customer",XtLanguageConst.yours,msgId);
				var msgjsonob=new Object();
				msgjsonob.localpath=null;
				msgjsonob.remotepath=result.url;
				msgjsonob.legnth=parseInt(result.fileSize/1024);
				XtimGlobalObject.sendVoiceMsg(JSON.stringify(msgjsonob),msgId);
	        }, false);
	        xhr.addEventListener('error', function() {
	            //失败
	        	MobileChatWindow.addMsg("发送语音失败","sysmsg",XtLanguageConst.xtSystemMsg);
	        }, false);
	        xhr.addEventListener('abort', function() {
	            //上传中断
	        	MobileChatWindow.addMsg("发送语音失败","sysmsg",XtLanguageConst.xtSystemMsg);
	        }, false);
	        xhr.open("POST",uploadimgaddresspath+"ChatImageUploadServlet?publishId="+customerPublishId);
	        xhr.send(fd);
		}
};

function sendFace(imgsrc){
	closeFaceDiv();
	if(XtimGlobalObject.isSaveCustomerInfo!="1" && isWriteCustomerInfo=="2" && mnchatcount==0){
		MobileChatWindow.openCustomerInfoDiv();
		XtimGlobalObject.addMsg(XtLanguageConst.nosavecustomerinfo,"sysmsg");
		return;
	}
	var msgId=XtimGlobalObject.generateUUID();
	MobileChatWindow.addMsg("<img width=\"36\" height=\"36\" src=\""+agentsiteimgaddresspath+imgsrc+"\">","customer",XtLanguageConst.yours,msgId);
	XtimGlobalObject.sendMsg("<img width=\"56\" height=\"56\" src=\""+agentsiteimgaddresspath+imgsrc+"\">",msgId,true,0,1);
}

function openFaceDiv(){
	if(XtimGlobalObject.isChatEnd){
		XtimGlobalObject.addMsg(XtLanguageConst.chatendnosend,"sysmsg");
		return;
	}
	if(XtimGlobalObject.waitcount>=0){
		XtimGlobalObject.addMsg(XtLanguageConst.waitingnosend,"sysmsg");
		return;
	}
    var faceContainer=document.getElementById("faceContainer");
	var facediv=document.getElementById("facediv");
	if(facediv==null){
		facediv=document.createElement("div");
		facediv.id="facediv";
		facediv.style.display="block";
	    facediv.style.borderWidth="0";
	    facediv.style.borderColor="#CCCCCC";
	    facediv.style.width="100%";
	    facediv.style.backgroundColor="#FFFFFF";
	    
	    var faceimgstr="";
	    for(var i=0;i<23;i++){
			faceimgstr+="<img style=\"padding:2px;width:36px;height:36px;\" src=\""+agentsiteimgaddresspath+"static/mobileFace/f0"+i+".png\" onClick=\"sendFace('static/mobileFace/f0"+i+".png')\" style=\"padding:6px\">";
		}
		faceimgstr+="<img style=\"padding:2px;width:36px;height:36px;\" onClick=\"closeFaceDiv()\" src=\""+agentsiteimgaddresspath+"static/mobileFace/button_cancel.png\">";
	    facediv.innerHTML=faceimgstr;
	    faceContainer.appendChild(facediv);
	}
	faceContainer.style.display="block";
}

function uploadimg(){
	if(XtimGlobalObject.isSaveCustomerInfo!="1" && isWriteCustomerInfo=="2" && mnchatcount==0){
		MobileChatWindow.openCustomerInfoDiv();
		XtimGlobalObject.addMsg(XtLanguageConst.nosavecustomerinfo,"sysmsg");
		return;
	}
	if(XtimGlobalObject.isChatEnd){
		XtimGlobalObject.addMsg(XtLanguageConst.chatendnosend,"sysmsg");
		return;
	}
	if(XtimGlobalObject.waitcount>=0){
		XtimGlobalObject.addMsg(XtLanguageConst.waitingnosend,"sysmsg");
		return;
	}
	var file = document.getElementById("uploadimg").files[0];
	var rFilter = /^(image\/bmp|image\/gif|image\/jpeg|image\/png|image\/tiff)$/i;
    if(!rFilter.test(file.type)) {
    	MobileChatWindow.addMsg("文件格式必须为图片","sysmsg",XtLanguageConst.xtSystemMsg);
        return;
    }
    if(!FileReader){
    	MobileChatWindow.addMsg("您的浏览器不支持文件上传","sysmsg",XtLanguageConst.xtSystemMsg);
    	return;
    }
    if(!Image){
    	MobileChatWindow.addMsg("您的浏览器不支持文件上传","sysmsg",XtLanguageConst.xtSystemMsg);
    	return;
    }
    uploadImgObject(file);
}

function uploadImgObject(file){
	var reader = new FileReader() , image = new Image() ,  canvas = document.createElement("canvas") , ctx = canvas.getContext("2d");
    reader.onload = function() {        //文件加载完成
        var url = reader.result;
        image.src = url;
    };
    image.onload = function() {        //图片加载完成
        var w = image.naturalWidth , h = image.naturalHeight;
        var scale = 1;        //图片缩放比例
    	if(w>800){
    		scale=w/800;
    	}
        canvas.width = w / scale;
        canvas.height = h / scale;
        ctx.fillStyle = "white";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.drawImage(image, 0 , 0 , w , h ,  0 , 0 , canvas.width , canvas.height);
        fileUpload();
    };
    reader.readAsDataURL(file);
    function fileUpload() {        //文件上传方法
        var quality = 0.8;        //图片的质量，这里设置的是0.3
        var data = canvas.toDataURL("image/jpeg", quality);//获取画布图片，并且要jpg格式
        data = data.split(',')[1];
        data = window.atob(data);
        var ia = new Uint8Array(data.length);
        for(var i = 0; i < data.length; i++) {
            ia[i] = data.charCodeAt(i);
        }
        var blob = new Blob([ia], {            //以上均为二进制参数处理，从而获取一个blob对象
            type: "image/jpeg"
        });
        var fd = new FormData(document.getElementById("uploadForm"));
        fd.append("isMobile","1");
        fd.append("uploadimg"  , blob , "upload.jpg");    //向form中加入图片数据，name属性是XXX，文件名是upload.jpg
        var xhr=XtimGlobalObject.createXHR();
        var msgId=XtimGlobalObject.generateUUID();
        isplaysound=false;
        MobileChatWindow.addMsg("图片发送中...","customer",XtLanguageConst.yours,msgId);
        xhr.upload.addEventListener('progress', function(event) {
            if (event.lengthComputable) {
              var percent = (event.loaded / event.total) * 100;
              if(document.getElementById(msgId)!=null){
            	  document.getElementById(msgId).innerHTML="图片发送中,进度: " + percent.toFixed(2) + "%";
              }
            } else {
            	if(document.getElementById(msgId)!=null){
            		document.getElementById(msgId).innerHTML="图片发送中,已上传:" + event.loaded + "字节";
            	}
            }
        });
        
        xhr.addEventListener('load', function(event) {
            //成功
    		MobileChatWindow.deleteMsg(msgId);
            var results=eval('(' + xhr.responseText + ')');
            if(results.success==true){
	            var msgjsonob=new Object();
	    		msgjsonob.url=results.url.trim();
	    		msgjsonob.width=canvas.width;
	    		msgjsonob.height=canvas.height;
	        	MobileChatWindow.addMsg("<img src=\""+results.url.trim()+"\" width=\""+canvas.width+"\" height=\""+canvas.height+"\">","customer",XtLanguageConst.yours,msgId);
	        	XtimGlobalObject.sendMsg(JSON.stringify(msgjsonob),msgId,true,1,1);
            }else{
            	if(results.info=="refuseUpload"){
        			MobileChatWindow.addMsg("不支持上传此类文件","sysmsg",XtLanguageConst.xtSystemMsg);
        		}else if(results.info=="sizeLimit"){
        			MobileChatWindow.addMsg("文件太大,上传失败","sysmsg",XtLanguageConst.xtSystemMsg);
        		}else{
        			MobileChatWindow.addMsg("文件上传失败","sysmsg",XtLanguageConst.xtSystemMsg);
        		}
            }
        }, false);
        xhr.addEventListener('error', function() {
    		MobileChatWindow.deleteMsg(msgId);
            //失败
        	MobileChatWindow.addMsg("图片上传失败","sysmsg",XtLanguageConst.xtSystemMsg);
        }, false);
        xhr.addEventListener('abort', function() {
    		MobileChatWindow.deleteMsg(msgId);
            //上传中断
        	MobileChatWindow.addMsg("图片上传失败","sysmsg",XtLanguageConst.xtSystemMsg);
        }, false);
        xhr.open("POST",uploadimgaddresspath+"ChatImageUploadServlet?publishId="+customerPublishId);
        xhr.send(fd);
    }
}

function uploadfile(){
	if(XtimGlobalObject.isSaveCustomerInfo!="1" && isWriteCustomerInfo=="2" && mnchatcount==0){
		MobileChatWindow.openCustomerInfoDiv();
		XtimGlobalObject.addMsg(XtLanguageConst.nosavecustomerinfo,"sysmsg");
		return;
	}
	if(XtimGlobalObject.isChatEnd){
		XtimGlobalObject.addMsg(XtLanguageConst.chatendnosend,"sysmsg");
		return;
	}
	if(XtimGlobalObject.waitcount>=0){
		XtimGlobalObject.addMsg(XtLanguageConst.waitingnosend,"sysmsg");
		return;
	}
    if(typeof FormData=="undefined"){
    	MobileChatWindow.clearFileUploadInput();
    	MobileChatWindow.addMsg("您的浏览器不支持文件上传","sysmsg",XtLanguageConst.xtSystemMsg);
    	return;
    }
	var file = document.getElementById("uploadfile").files[0];
    if(XtimGlobalObject.isForbiddenFileType(file.name)){
		MobileChatWindow.clearFileUploadInput();
		MobileChatWindow.addMsg("不允许上传此类型的文件","sysmsg",XtLanguageConst.xtSystemMsg);
		return;
    }
	if(file.size>50*1024*1024){
		MobileChatWindow.clearFileUploadInput();
		MobileChatWindow.addMsg("文件不能大于50M","sysmsg",XtLanguageConst.xtSystemMsg);
		return;
	}
    if(document.getElementById("mnuploadForm")==null){
    	var uploadForm=document.createElement("form");
    	uploadForm.id="mnuploadForm";
    	uploadForm.enctype="multipart/form-data";
		document.body.appendChild(uploadForm);
    }
    var fd = new FormData(document.getElementById("mnuploadForm"));
    fd.append("isMobile","1");
    fd.append("uploadimg"  , file ,file.name);
    var xhr=XtimGlobalObject.createXHR();
    var msgId=XtimGlobalObject.generateUUID();
    isplaysound=false;
    MobileChatWindow.addMsg("文件发送中...","customer",XtLanguageConst.yours,msgId);
    xhr.upload.addEventListener('progress', function(event) {
        if (event.lengthComputable) {
          var percent = (event.loaded / event.total) * 100;
          if(document.getElementById(msgId)!=null){
              document.getElementById(msgId).innerHTML="文件发送中,进度: " + percent.toFixed(2) + "%";
          }
        } else {
        	if(document.getElementById(msgId)!=null){
            	document.getElementById(msgId).innerHTML="文件发送中,已上传:" + event.loaded + "字节";
        	}
        }
    });
    
    xhr.addEventListener('load', function(event) {
		MobileChatWindow.deleteMsg(msgId);
        //成功
    	var results=eval('(' + xhr.responseText + ')');
    	MobileChatWindow.clearFileUploadInput();
        if(results.success==true){
        	MobileChatWindow.sendfile(results.fileSize,results.showName,results.url,msgId);
        	MobileChatWindow.changeMenuTab(0);
    	}else{
    		if(results.info=="refuseUpload"){
    			MobileChatWindow.addMsg("不支持上传此类文件","sysmsg",XtLanguageConst.xtSystemMsg);
    		}else if(results.info=="sizeLimit"){
    			MobileChatWindow.addMsg("文件太大,上传失败","sysmsg",XtLanguageConst.xtSystemMsg);
    		}else{
    			MobileChatWindow.addMsg("文件上传失败","sysmsg",XtLanguageConst.xtSystemMsg);
    		}
    	}
    }, false);
    xhr.addEventListener('error', function() {
        //失败
		MobileChatWindow.deleteMsg(msgId);
        MobileChatWindow.clearFileUploadInput();
    	MobileChatWindow.addMsg("文件上传失败","sysmsg",XtLanguageConst.xtSystemMsg);
    	MobileChatWindow.changeMenuTab(0);
    }, false);
    xhr.addEventListener('abort', function() {
        //上传中断
		MobileChatWindow.deleteMsg(msgId);
        MobileChatWindow.clearFileUploadInput();
    	MobileChatWindow.addMsg("文件上传失败","sysmsg",XtLanguageConst.xtSystemMsg);
    	MobileChatWindow.changeMenuTab(0);
    }, false);
    xhr.open("POST",uploadimgaddresspath+"ChatImageUploadServlet?publishId="+customerPublishId);
    xhr.send(fd);
}

function onDocClickHideFaceDiv(e){
	var firedobj=XtimGlobalObject.ns6? e.target : event.srcElement;
	var topelement=XtimGlobalObject.ns6? "HTML" : "BODY";
	
	while (firedobj.nodeName!=topelement && firedobj.id!="facediv"){
		if(firedobj.parentNode==null){
			break;
		}else{
			firedobj=firedobj.parentNode;
		}
	}
	if(firedobj.id=="facediv"){
		return;
	}
	closeFaceDiv();
}

function closeFaceDiv(){
	var facediv=document.getElementById("faceContainer");
	if(facediv!=null){
		facediv.style.display="none";
	}
}

function onDocClickHideAgentscontainerDiv(e){
	var firedobj=XtimGlobalObject.ns6? e.target : event.srcElement;
	var topelement=XtimGlobalObject.ns6? "HTML" : "BODY";
	
	while (firedobj.nodeName!=topelement && firedobj.id!="agentscontainer"){
		if(firedobj.parentNode==null){
			break;
		}else{
			firedobj=firedobj.parentNode;
		}
	}
	if(firedobj.id=="agentscontainer"){
		return;
	}
	document.getElementById("agentscontainer").style.display="none";
}

setPhotoShow=function(items){
	var pswpElement = document.querySelectorAll('.pswp')[0];
	var options = {
		    index: 0,// start at first slide
		    shareButtons: [
				             {id:'download', label:'保存图片', url:'{{raw_image_url}}', download:true}
				             ], // 分享按钮
		};

	var gallery = new PhotoSwipe( pswpElement, PhotoSwipeUI_Default, items, options);
	gallery.init();
};

function setNoUser(errInfo){
	document.body.innerHTML=errInfo;
}

if(showTitleBar==0){
	document.getElementById("xtChatWindowToolbar").style.display="none";
	document.getElementById("container").style.top="0px";
}


function loadhistorychatmsg(){
	isplaysound=false;
	document.getElementById("mnloading").style.display="block";
	mnstop=false;
    var customerId=XtimGlobalObject.customerId;
	if(customerId==null){
		customerId=XtimGlobalObject.agentInviteGetCookie(customerPublishId,true);
		if(customerId==null){
			customerId="";
		}
	}
	var data="start="+mnchatcount+"&customerId="+customerId+"&publishPointId="+customerPublishId+"&limit="+mnchatlimit;
    var url=agentsiteimgaddresspath+"CheckMsg?action=getHistoryChatMsg";
	XtimGlobalObject.ajax(url+"&radomid="+Math.random(),"post",data,
	function(responseText){
		document.getElementById("mnloading").style.display="none";
		mnchatlimit=8;
		mnstop=true;
		var result=eval('(' + responseText + ')');
		if(result.records!=null && result.records.length>0){
			var xtChatWindowMsgBox =document.getElementById('xtChatWindowMsgBox');
			var oldoffsetHeight=xtChatWindowMsgBox.offsetHeight+xtChatWindowMsgBox.scrollHeight;
			var item;
			for(var i=0;i<result.records.length;i++){
				item=result.records[i];
				MobileChatWindow.addMsg(XtimGlobalObject.decodeBase64(item.msg),item.senderId==customerId?"customer":item.senderId,item.senderName,item.id,"front");
			}
			if(mnchatcount>0){
				var newoffsetHeight=document.getElementById('xtChatWindowMsgBox').offsetHeight+xtChatWindowMsgBox.scrollHeight;
				xtChatWindowMsgBox.scrollTop=newoffsetHeight-oldoffsetHeight-30;
			}else{
				xtChatWindowMsgBox.scrollTop = xtChatWindowMsgBox.scrollHeight;
			}
			mnchatcount+=result.records.length;
		}else{
			mnhasdata=false;
		}
		isplaysound=true;
	},
	function(){
		document.getElementById("mnloading").style.display="none";
		alert("加载聊天记录失败");
	});
}


function msgBoxscroll() {
    if(agentisshowhistorymsg==2 && document.getElementById("xtChatWindowMsgBox").scrollTop==0){
    	if(mnstop && mnhasdata){
    		loadhistorychatmsg();
    	}
    }
}

function historyMsgInit(){
	document.getElementById("mnSoundRecordButton").innerHTML=XtLanguageConst.holdtotalk;
	document.getElementById("mnloading").innerHTML="<img style=\"vertical-align:middle\" src=\""+clientcdnStyleWebPath+"/loading.gif\"> "+XtLanguageConst.loading+"...";
	document.getElementById("xtChatWindowMsgBox").addEventListener('touchmove',function(event) {
        clearTimeout(msgBoxscroll.timer);
        msgBoxscroll.timer = setTimeout(msgBoxscroll,500);
	},false);
	document.getElementById("xtChatWindowMsgBox").addEventListener('scroll',function(event) {
        clearTimeout(msgBoxscroll.timer);
        msgBoxscroll.timer = setTimeout(msgBoxscroll,500);
	},false);
	MobileChatWindow.setImagePasteEvent();
}

loadScript();
