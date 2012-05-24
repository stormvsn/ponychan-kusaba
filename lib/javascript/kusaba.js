var style_cookie, kumod_set = false, quick_reply = false;

/* IE/Opera fix, because they need to go learn a book on how to use indexOf with arrays */
if (!Array.prototype.indexOf) {
  Array.prototype.indexOf = function(elt /*, from*/) {
	var len = this.length;

	var from = Number(arguments[1]) || 0;
	from = (from < 0)
		 ? Math.ceil(from)
		 : Math.floor(from);
	if (from < 0)
	  from += len;

	for (; from < len; from++) {
	  if (from in this &&
		  this[from] === elt)
		return from;
	}
	return -1;
  };
}

/**
*
*  UTF-8 data encode / decode
*  http://www.webtoolkit.info/
*
**/

var Utf8 = {

	// public method for url encoding
	encode : function (string) {
		string = string.replace(/\r\n/g,"\n");
		var utftext = "";

		for (var n = 0; n < string.length; n++) {

			var c = string.charCodeAt(n);

			if (c < 128) {
				utftext += String.fromCharCode(c);
			}
			else if((c > 127) && (c < 2048)) {
				utftext += String.fromCharCode((c >> 6) | 192);
				utftext += String.fromCharCode((c & 63) | 128);
			}
			else {
				utftext += String.fromCharCode((c >> 12) | 224);
				utftext += String.fromCharCode(((c >> 6) & 63) | 128);
				utftext += String.fromCharCode((c & 63) | 128);
			}

		}

		return utftext;
	},

	// public method for url decoding
	decode : function (utftext) {
		var string = "";
		var i = 0;
		var c = c1 = c2 = 0;

		while ( i < utftext.length ) {

			c = utftext.charCodeAt(i);

			if (c < 128) {
				string += String.fromCharCode(c);
				i++;
			}
			else if((c > 191) && (c < 224)) {
				c2 = utftext.charCodeAt(i+1);
				string += String.fromCharCode(((c & 31) << 6) | (c2 & 63));
				i += 2;
			}
			else {
				c2 = utftext.charCodeAt(i+1);
				c3 = utftext.charCodeAt(i+2);
				string += String.fromCharCode(((c & 15) << 12) | ((c2 & 63) << 6) | (c3 & 63));
				i += 3;
			}

		}

		return string;
	}

}

function _(msgid) {return msgid;}

function togglemenuarea(button, area) {
	var tog=document.getElementById(area);
	if(tog.style.display)    {
		tog.style.display="";
	}    else {
		tog.style.display="none";
	}
	button.innerHTML=(tog.style.display)?'+':'&minus;';
	set_cookie('nav_show_'+area, tog.style.display?'0':'1', 30);
}

function removeframes() {
	var boardlinks = document.getElementsByTagName("a");
	for(var i=0;i<boardlinks.length;i++) if(boardlinks[i].className == "boardlink") boardlinks[i].target = "_top";

	document.getElementById("removeframes").innerHTML = 'Frames removed.';

	return false;
}

function reloadmain() {
	if (parent.main) {
		parent.main.location.reload();
	}
}

function replaceAll( str, from, to ) {
	var idx = str.indexOf( from );
	while ( idx > -1 ) {
		str = str.replace( from, to );
		idx = str.indexOf( from );
	}
	return str;
}

function insert(text, scrollToTop) {
	if(!ispage || quick_reply) {
		var textarea=document.forms.postform.message;
		if(textarea) {
			if(textarea.createTextRange && textarea.caretPos) { // IE
				var caretPos=textarea.caretPos;
				caretPos.text=caretPos.text.charAt(caretPos.text.length-1)==" "?text+" ":text;
			} else if(textarea.setSelectionRange) { // Firefox
				var start=textarea.selectionStart;
				var end=textarea.selectionEnd;
				textarea.value=textarea.value.substr(0,start)+text+textarea.value.substr(end);
				textarea.setSelectionRange(start+text.length,start+text.length);
			} else {
				textarea.value+=text+" ";
			}

			if (scrollToTop) {
				jQuery(window).scrollTop(jQuery('#postbox').offset().top);
				textarea.focus();
			}

			return false;
		}
	}
	return true;
}

function clickReflinkNo(event, id) {
	if (!ispage) {
		insert('>>' + id + '\n', false);
		highlight(id);
		event.preventDefault();
	}
}

function clickReflinkNum(event, id) {
	if (!ispage) {
		insert('>>' + id + '\n', true);
		event.preventDefault();
	}
}

function quote(b, a) {
	var v = eval("document." + a + ".message");
	v.value += (">>" + b + "\r");
	v.focus();
}

function checkhighlight() {
	var match;

	if(match = /#i([0-9]+)/.exec(document.location.toString()))
		if(!document.forms.postform.message.value)
			insert(">>" + match[1] + "\n");

	if(match = /#([0-9]+)/.exec(document.location.toString()))
		highlight(match[1]);
}

function highlight(post, checknopage) {

	if ((checknopage && ispage) || ispage) {
		// Uncomment the following line to always send the user to the thread if the link was clicked on the board page.
		//return;
	}

	var cells = document.getElementsByTagName("td");
	for(var i=0;i<cells.length;i++) if(cells[i].className == "highlight") cells[i].className = "reply";

	var reply = document.getElementById("reply" + post);
	if (!reply)
		return;
	var replytable = reply.parentNode;
	while (replytable.nodeName != 'TABLE') {
		replytable = replytable.parentNode;
	}

	if((reply || document.postform.quickreply.value == post) && replytable.parentNode.className != "reflinkpreview") {
		if(reply) {
			reply.className = "highlight";
		}
		var match = /^([^#]*)/.exec(document.location.toString());
		document.location = match[1] + "#" + post;
		return false;
	}

	return true;
}

function truncatePosts() {
	var offset = /#(|.*&)start=(-?[0-9]+)/.exec(document.location.toString());
	var count = /#(|.*&)count=(-?[0-9]+)/.exec(document.location.toString());
	offset = offset ? parseInt(offset[2], 10) : 0;
	count = count ? parseInt(count[2], 10) : -1;

	var replies = $$('.thread > table');
	if (offset < 0)
		offset = replies.length + offset;
	if (offset < 0 || offset >= replies.length)
		offset = 0;
	if (count <= 0)
		count = replies.length;
	if (offset + count > replies.length)
		count = replies.length - offset;
		
	if (offset === 0 && count === replies.length)
		return;

	try {window.stop();} catch(ex) {}
	try {document.execCommand('Stop');} catch(ex) {}  // IE

	for (var r = 0; r < replies.length; ++r) {
		if (r >= offset && r < offset + count)
			continue;
		var reply = replies[r];
		reply.remove();
	}

	$$('img').each(function (img) {
		img.src = img.src;
	});

	var omitted = document.createElement('div');
	omitted.className = 'omittedposts';
	omitted.innerHTML = '(Showing replies ' + (offset + 1) + ' to ' + (offset + count) + ' out of ' + replies.length + ')';
	var threadblock = $$('.thread > blockquote')[0];
	threadblock.parentNode.insertBefore(omitted, threadblock.nextSibling);
}

function get_password(name) {
	var pass = getCookie(name);
	if(pass) return pass;

	var chars="abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
	var pass='';

	for(var i=0;i<8;i++) {
		var rnd = Math.floor(Math.random()*chars.length);
		pass += chars.substring(rnd, rnd+1);
	}
	set_cookie(name, pass, 365);
	return(pass);
}

function toggleOptions(threadid, formid, board) {
	if (document.getElementById('opt' + threadid)) {
		if (document.getElementById('opt' + threadid).style.display == '') {
			document.getElementById('opt' + threadid).style.display = 'none';
			document.getElementById('opt' + threadid).innerHTML = '';
		} else {
			var newhtml = '<td class="label"><label for="formatting">Formatting:</label></td><td colspan="3"><select name="formatting"><option value="" onclick="javascript:document.getElementById(\'formattinginfo' + threadid + '\').innerHTML = \'All formatting is performed by the user.\';">Normal</option><option value="aa" onclick="javascript:document.getElementById(\'formattinginfo' + threadid + '\').innerHTML = \'[aa] and [/aa] will surround your message.\';"';
			if (getCookie('kuformatting') == 'aa') {
				newhtml += ' selected';
			}
			newhtml += '>Text Art</option></select> <input type="checkbox" name="rememberformatting"><label for="rememberformatting">Remember</label> <span id="formattinginfo' + threadid + '">';
			if (getCookie('kuformatting') == 'aa') {
				newhtml += '[aa] and [/aa] will surround your message.';
			} else {
				newhtml += 'All formatting is performed by the user.';
			}
			newhtml += '</span></td><td><input type="button" value="Preview" class="submit" onclick="javascript:postpreview(\'preview' + threadid + '\', \'' + board + '\', \'' + threadid + '\', document.' + formid + '.message.value);"></td>';

			document.getElementById('opt' + threadid).innerHTML = newhtml;
			document.getElementById('opt' + threadid).style.display = '';
		}
	}
}

function getCookie(name) {
	with(document.cookie) {
		var regexp=new RegExp("(^|;\\s+)"+name+"=(.*?)(;|$)");
		var hit=regexp.exec(document.cookie);
		if(hit&&hit.length>2) return Utf8.decode(unescape(replaceAll(hit[2],'+','%20')));
		else return '';
	}
}

function set_cookie(name,value,days) {
	if(days) {
		var date=new Date();
		date.setTime(date.getTime()+(days*24*60*60*1000));
		var expires="; expires="+date.toGMTString();
	} else expires="";
	document.cookie=name+"="+value+expires+"; path=/";
}
function del_cookie(name) {
	document.cookie = name +'=; expires=Thu, 01-Jan-70 00:00:01 GMT; path=/';
}

function set_stylesheet(name) {
	var link = document.getElementById("userstylelink");
	link.href = link.href.replace(/[^\/]+\.css$/, name + '.css');
	set_cookie('pcstyle', name, 7);
}

function test_stylesheet(url) {
	var link = document.getElementById("userstylelink");
	link.href = link.href = url;
}

function set_preferred_stylesheet() {
	var links=document.getElementsByTagName("link");
	for(var i=0;i<links.length;i++) {
		var rel=links[i].getAttribute("rel");
		var title=links[i].getAttribute("title");
		if(rel.indexOf("style")!=-1&&title) links[i].disabled=(rel.indexOf("alt")!=-1);
	}
}

function get_active_stylesheet() {
	var links=document.getElementsByTagName("link");
	for(var i=0;i<links.length;i++) {
		var rel=links[i].getAttribute("rel");
		var title=links[i].getAttribute("title");
		if(rel.indexOf("style")!=-1&&title&&!links[i].disabled) return title;
	}

	return null;
}

function get_preferred_stylesheet() {
	var links=document.getElementsByTagName("link");
	for(var i=0;i<links.length;i++) {
		var rel=links[i].getAttribute("rel");
		var title=links[i].getAttribute("title");
		if(rel.indexOf("style")!=-1&&rel.indexOf("alt")==-1&&title) return title;
	}

	return null;
}
function get_default_stylesheet() {
	var links=document.getElementsByTagName("link");
	for(var i=0;i<links.length;i++) {
		var rel=links[i].getAttribute("rel");
		var title=links[i].getAttribute("title");
		if(rel.indexOf("style")!=-1&&title&&rel!='alternate stylesheet') return title;
	}

	return null;
}

function checkMod() {
	var kumod = getCookie('kumod');
	if (!kumod)
		return false;
	if (kumod === 'allboards')
		return true;

	var listofboards = kumod.split('|');
	var thisboard = document.getElementById('postform').board.value;
	for (var cookieboard in listofboards) {
		if (listofboards[cookieboard] == thisboard)
			return true;
	}
}

function togglethread(threadid) {
	if (hiddenthreads.toString().indexOf(threadid)!==-1) {
		document.getElementById('unhidethread' + threadid).style.display = 'none';
		document.getElementById('thread' + threadid).style.display = 'block';
		hiddenthreads.splice(hiddenthreads.indexOf(threadid),1);
		set_cookie('hiddenthreads',hiddenthreads.join('!'),30);
	} else {
		document.getElementById('unhidethread' + threadid).style.display = 'block';
		document.getElementById('thread' + threadid).style.display = 'none';
		hiddenthreads.push(threadid);
		set_cookie('hiddenthreads',hiddenthreads.join('!'),30);
	}
	return false;
}

function toggleblotter(save) {
	var elem = document.getElementsByTagName('li');
	var arr = new Array();
	var blotterentry;
	for(i = 0,iarr = 0; i < elem.length; i++) {
		att = elem[i].getAttribute('class');
		if(att == 'blotterentry') {
			blotterentry = elem[i];
			if (blotterentry.style.display == 'none') {
				blotterentry.style.display = '';
				if (save) {
					set_cookie('ku_showblotter', '1', 365);
				}
			} else {
				blotterentry.style.display = 'none';
				if (save) {
					set_cookie('ku_showblotter', '0', 365);
				}
			}
		}
	}
}

function expandthread(threadid, board) {
	if (document.getElementById('replies' + threadid + board)) {
		var repliesblock = document.getElementById('replies' + threadid + board);
		repliesblock.innerHTML = _('Expanding thread') + '...<br><br>' + repliesblock.innerHTML;

		new Ajax.Request(ku_cgipath + '/expand.php?board=' + board + '&threadid=' + threadid,
		{
			method:'get',
			onSuccess: function(transport){
				var response = transport.responseText || _("something went wrong (blank response)");
				repliesblock.innerHTML = response;
				delandbanlinks();
				addpreviewevents();
			},
			onFailure: function(){ alert(_('Something went wrong...')) }
		});
	}

	return false;
}

function quickreply(threadid) {
	quick_reply = threadid != 0;
	if (quick_reply) {
		jQuery('.postform input[type=submit]').val('Reply');
		document.getElementById('posttypeindicator').innerHTML = 'to <a href="#' + threadid + '">&gt;&gt;' + threadid + '</a> &nbsp;[<a href="#postbox" onclick="javascript:quickreply(\'0\')">Cancel</a>]';
	} else {
		jQuery('.postform input[type=submit]').val('New thread');
		document.getElementById('posttypeindicator').innerHTML = '';
	}

	document.postform.quickreply.value = threadid;
}

function getwatchedthreads(threadid, board) {
	if (!document.getElementById('watchedthreadlist'))
		return;

	var watchedthreadbox = document.getElementById('watchedthreadlist');
	watchedthreadbox.innerHTML = _('Loading watched threads...');

	new Ajax.Request(ku_cgipath + '/threadwatch.php?board=' + board + '&threadid=' + threadid,
	{
		method:'get',
		onSuccess: function (transport) {
			wts = JSON.parse(transport.responseText.replace('/*cached*/', ''));
			renderwatchedthreads(watchedthreadbox, wts);
		},
		onFailure: function() {
			watchedthreadbox.innerHTML = _('Error loading watched threads');
		}
	});
}

function renderwatchedthreads(container, wts) {
	var $ = jQuery;
	container.innerHTML = '';
	var redThreads = 0;

	for (var w = 0; w < wts.threads.length; ++w) {
		var wt = wts.threads[w];
		var curDiv = $('<div>').addClass('watchedthread').data('wt', wt);
		var buttons = $('<div>').addClass('watchedthreadbuttons');
		var topLine = $('<div>').addClass('topline');
		var prev = $('<div>').addClass('preview');

		buttons.append($('<a>').addClass('removelink').attr('href', '#').click(function (e) {
			var wt = $(this).closest('.watchedthread').data('wt');
			removefromwatchedthreads(wt.threadid, wt.board);
			e.preventDefault();
		}).html('&times;'));
		buttons.append($('<a>').addClass('golink').attr('href', wt.url).html('&#187;'));

		var smallurl = wt.newreplies ? wt.url : /^[^#]*/.exec(wt.url)[0];
		topLine.append($('<a>').attr('href', smallurl).text('/' + wt.board + '/'))
			.append(' &nbsp;&ndash;&nbsp; ');
		if (wt.name)
			topLine.append($('<span>').addClass('postername').text(wt.name));
		if (wt.tripcode)
			topLine.append($('<span>').addClass('postertrip').text('!' + wt.tripcode));
		if (wt.newreplies) {
			topLine.append($('<a>').addClass('watchedthreadnewreplies')
				.attr('href', wt.url)
				.text(' (' + wt.newreplies + ' new repl' + (wt.newreplies - 1 ? 'ies' : 'y') + ')'));
			++redThreads;
		}

		if (wt.subject)
			prev.append($('<span>').addClass('filetitle').html(wt.subject))
				.append(' &nbsp;&ndash;&nbsp; ');
		if (wt.message)
			prev.append(wt.message);

		curDiv.append(buttons).append(topLine).append(prev);
		container.appendChild(curDiv[0]);

		if (wts.threads.length > w && wt.newreplies && !wts.threads[w + 1].newreplies)
			container.appendChild(document.createElement('hr'));
	}

	if (redThreads)
		$('#watchedthreadsdroplink').html('WT <span class=watchedthreadnewreplies>(' + redThreads + ')</span> &#9660;');
	else
		$('#watchedthreadsdroplink').html('WT &#9660;');
}

function addtowatchedthreads(threadid, board) {
	new Ajax.Request(ku_cgipath + '/threadwatch.php?do=addthread&board=' + board + '&threadid=' + threadid,
	{
		method:'get',
		onSuccess: function(transport){
			var response = transport.responseText || _("something went wrong (blank response)");
			alert('Thread successfully added to your watch list.');
			getwatchedthreads('0', board);
		},
		onFailure: function(){ alert(_('Something went wrong...')) }
	});
}

function removefromwatchedthreads(threadid, board) {
	if (document.getElementById('watchedthreadlist')) {
		new Ajax.Request(ku_cgipath + '/threadwatch.php?do=removethread&board=' + board + '&threadid=' + threadid,
		{
			method:'get',
			onSuccess: function(transport){
				var response = transport.responseText || _("something went wrong (blank response)");
				getwatchedthreads('0', board);
			},
			onFailure: function(){ alert(_('Something went wrong...')) }
		});
	}
}

function showwatchedthreads() {
	showDropdown($('watchedthreads'), $('watchedthreadsdroplink'));
}

function hidewatchedthreads() {
	set_cookie('showwatchedthreads','0',30);
	if (document.getElementById('watchedthreads')) {
		document.getElementById('watchedthreads').style.display = 'none';
	}
}

function emitwatchedthreads(board, threadid) {
	if (getCookie('showwatchedthreads') !== '1')
		return;

	jQuery('body').append('<div class="reply" id="watchedthreads" style="display:none"><div id="watchedthreadlist"></div>' +
		//'<div id="watchedthreadsbuttons"><a href="#" onclick="javascript:hidewatchedthreads();return false;" title="Hide the watched threads box"><img src="/chan/css/icons/blank.gif" border="0" class="hidewatchedthreads" alt="hide" /><\/a>&nbsp;<a href="#" onclick="javascript:getwatchedthreads(\'0\', \'' + board + '\');return false;" title="Refresh watched threads"><img src="/chan/css/icons/blank.gif" border="0" class="refreshwatchedthreads" alt="refresh" /></a></div>' +
		'<div class="darkbar" style="position:static;margin:0;padding:2px 0.5em">' +
			'<a href="#" onclick="getwatchedthreads(\'0\', \'' + board + '\');event.preventDefault()">Refresh</a>' +
			' &nbsp;&bull;&nbsp; ' +
			'<a href="' + ku_cgipath + '/threadwatchui.php" target="_blank">Pop-out</a>' +
		'</div>' +
		'</div>');

	getwatchedthreads(threadid, board);

	if (getCookie('autoexpandwatchedthreads') === '1')
		showwatchedthreads();
}

function togdisp(e, x) {
	var hoverdiv = document.getElementById(e);
	if (!x) x = hoverdiv.style.display == 'none' ? 1 : 2;
	if (x == 1) hoverdiv.style.display = 'block';
	if (x == 2) hoverdiv.style.display = 'none';
	return false;
}

function checkcaptcha(formid) {
	if (document.getElementById(formid)) {
		if (document.getElementById(formid).captcha) {
			if (document.getElementById(formid).captcha.value == '') {
				alert('Please enter the captcha image text.');
				document.getElementById(formid).captcha.focus();

				return false;
			}
		}
	}

	return true;
}

// Thanks to 7chan for this
function expandimg(PN, H, F, C, G, E, A) {
    element = document.getElementById("thumb" + PN);
    var D = '<img src="' + F + '" alt="' + PN + '" class="thumb" width="' + E + '" height="' + A + '">';
    var J = '<img src="' + F + '" alt="' + PN + '" class="thumb" height="' + A + '" width="' + E + '">';
    var K = '<img src="' + F + '" alt="' + PN + '" class="thumb" height="' + A + '" width="' + E + '"/>';
    var B = "<img class=thumb height=" + A + " alt=" + PN + ' src="' + F + '" width=' + E + ">";
    if (element.innerHTML.toLowerCase() != D && element.innerHTML.toLowerCase() != B && element.innerHTML.toLowerCase() != J && element.innerHTML.toLowerCase() != K) {
        element.innerHTML = D
    } else {
        element.innerHTML = '<img src="' + H + '" alt="' + PN + '" class="thumb" height="' + G + '" width="' + C + '">'
    }
}

function postpreview(divid, board, parentid, message) {
	if (document.getElementById(divid)) {
		new Ajax.Request(ku_cgipath + '/expand.php?preview&board=' + board + '&parentid=' + parentid + '&message=' + escape(message),
		{
			method:'get',
			onSuccess: function(transport){
				var response = transport.responseText || _("something went wrong (blank response)");
				document.getElementById(divid).innerHTML = response;
			},
			onFailure: function(){ alert(_('Something went wrong...')) }
		});
	}
}

function set_inputs(id) {
	var form = document.getElementById(id);
	if (!form)
		return;
	var $form = jQuery(form);

	if (!form.name.value) form.name.value = getCookie("name");
	if (!form.em.value) form.em.value = getCookie("email");
	if (!form.postpassword.value) form.postpassword.value = get_password("postpassword");

	var refer = document.referrer;
	if (refer && !/:\/\/[^/]*\bponychan.net\//.exec(refer))
		set_cookie('stats.referrer', refer.slice(0, 128), 30);
	else
		refer = getCookie('stats.referrer');
	$form.append(jQuery('<input type=hidden name=stats.referrer>').val(refer));
}

function set_delpass(id) {
	var delform = document.getElementById(id);
	if (delform && delform.postpassword && !delform.postpassword.value) {
		delform.postpassword.value = get_password("postpassword");
	}
}

function addreflinkpreview(e) {
	var e_out;
	var ie_var = "srcElement";
	var moz_var = "href";
	this[moz_var] ? e_out = this : e_out = e[ie_var];
	ainfo = e_out.className.split('|');

	var previewdiv = document.createElement('div');

	previewdiv.setAttribute("id", "preview" + e_out.className);
	previewdiv.setAttribute('class', 'reflinkpreview');
	previewdiv.setAttribute('className', 'reflinkpreview');
	if (e.pageX) {
		previewdiv.style.left = (e.pageX + 50) + 'px';
		previewdiv.style.top = (e.pageY + 20) + 'px';
	} else {
		previewdiv.style.left = (e.clientX + 50);
		previewdiv.style.top = (e.clientY + 20);
	}

	var src = $$('a[name="' + ainfo[3] + '"]');
	var content = src.length ? src[0].parentNode.innerHTML : '';
	if (!content)
		return;
	previewdiv.innerHTML = content;
	jQuery('.reflink, .postfooter', previewdiv).remove();

	document.body.appendChild(previewdiv);
	replies = Element.getElementsBySelector(previewdiv, 'table');
	for(var i = 0; i < replies.length; i++)
		Element.remove(replies[i]);
}

function delreflinkpreview(e) {
	var e_out;
	var ie_var = "srcElement";
	var moz_var = "href";
	this[moz_var] ? e_out = this : e_out = e[ie_var];

	while(true) {
		var previewelement = document.getElementById("preview" + e_out.className);
		if (previewelement) {
			previewelement.parentNode.removeChild(previewelement);
		} else
			break;
	}
}

function addpreviewevents() {
	var aelements = document.getElementsByTagName('a');
	var aelement;
	var ainfo;
	for(var i=0;i<aelements.length;i++){
		aelement = aelements[i];
		if (aelement.className) {
			if (aelement.className.substr(0, 4) == "ref|") {
				if (aelement.addEventListener){
					aelement.addEventListener("mouseover", addreflinkpreview, false);
					aelement.addEventListener("mouseout", delreflinkpreview, false);
				}
				else if (aelement.attachEvent){
					aelement.attachEvent("onmouseover", addreflinkpreview);
					aelement.attachEvent("onmouseout", delreflinkpreview);
				}
				/*if (!$$('a[name="' + aelement.className.split('|')[3] + '"]').length) {
					aelement.style.opacity = 0.4;
				}*/
			}
		}
	}
}

function resetWatchedThreadsPosition() {
	set_cookie('watchedthreadsleft', '', 0);
	set_cookie('watchedthreadstop', '', 0);
	set_cookie('watchedthreadswidth', '', 0);
	set_cookie('watchedthreadsheight', '', 0);
}

function keypress(e) {
	if (!e) e=window.event;
	if (e.altKey) {
		var docloc = document.location.toString();
		if ((docloc.indexOf('catalog.html') == -1 && docloc.indexOf('/res/') == -1) || (docloc.indexOf('catalog.html') == -1 && e.keyCode == 80)) {
			if (e.keyCode != 18 && e.keyCode != 16) {
				if (docloc.indexOf('.html') == -1 || docloc.indexOf('board.html') != -1) {
					var page = 0;
					var docloc_trimmed = docloc.substr(0, docloc.lastIndexOf('/') + 1);
				} else {
					var page = docloc.substr((docloc.lastIndexOf('/') + 1));
					page = (+page.substr(0, page.indexOf('.html')));
					var docloc_trimmed = docloc.substr(0, docloc.lastIndexOf('/') + 1);
				}
				if (page == 0) {
					var docloc_valid = docloc_trimmed;
				} else {
					var docloc_valid  = docloc_trimmed + page + '.html';
				}

				if (e.keyCode == 222 || e.keyCode == 221) {
					if(match=/#s([0-9])/.exec(docloc)) {
						var relativepost = (+match[1]);
					} else {
						var relativepost = -1;
					}

					if (e.keyCode == 222) {
						if (relativepost == -1 || relativepost == 9) {
							var newrelativepost = 0;
						} else {
							var newrelativepost = relativepost + 1;
						}
					} else if (e.keyCode == 221) {
						if (relativepost == -1 || relativepost == 0) {
							var newrelativepost = 9;
						} else {
							var newrelativepost = relativepost - 1;
						}
					}

					document.location.href = docloc_valid + '#s' + newrelativepost;
				} else if (e.keyCode == 59 || e.keyCode == 219) {
					if (e.keyCode == 59) {
						page = page + 1;
					} else if (e.keyCode == 219) {
						if (page >= 1) {
							page = page - 1;
						}
					}

					if (page == 0) {
						document.location.href = docloc_trimmed;
					} else {
						document.location.href = docloc_trimmed + page + '.html';
					}
				} else if (e.keyCode == 80) {
					document.location.href = docloc_valid + '#postbox';
				}
			}
		}
	}
}


function charsToSpans(span) {
	var str=span.firstChild.data;
	var a=str.length;
	span.removeChild(span.firstChild);
	for(var i=0; i<a; i++) {
		var theSpan=document.createElement('span');
		theSpan.appendChild(document.createTextNode(str.charAt(i)));
		span.appendChild(theSpan);
	}
}

function Rainbow(span, brt, anim, spd, hspd) {
	this.hue=0;
	this.hspd=(hspd==null?3:(hspd+360)%360);
	this.length=span.firstChild.data.length;
	this.span=span;
	this.speed=(spd==null?50:Math.abs(spd));
	this.hInc=360/this.length;
	this.brt=(brt==null?255:Math.abs(brt)%256);
	charsToSpans(span);
	this.moveRainbow();
	var self=this;
	this.timer=anim && window.setInterval(function(){self.moveRainbow()}, this.speed);
}

Rainbow.prototype.moveRainbow = function() {
	this.hue%=360;
	var color;
	var b=this.brt;
	var a=this.length;
	var h=this.hue;

	for(var i=0; i<a; i++) {
		h=(h+360)%360;
		if(h<60) { color=Math.floor(((h)/60)*b); red=b;grn=color;blu=0; }
		else if(h<120) { color=Math.floor(((h-60)/60)*b); red=b-color;grn=b;blu=0; }
		else if(h<180) { color=Math.floor(((h-120)/60)*b); red=0;grn=b;blu=color; }
		else if(h<240) { color=Math.floor(((h-180)/60)*b); red=0;grn=b-color;blu=b; }
		else if(h<300) { color=Math.floor(((h-240)/60)*b); red=color;grn=0;blu=b; }
		else { color=Math.floor(((h-300)/60)*b); red=b;grn=0;blu=b-color; }
		h+=this.hInc;
		this.span.childNodes[i].style.color="rgb("+red+", "+grn+", "+blu+")";
	}
	this.hue+=this.hspd;
}


var hiddenthreads = (getCookie('hiddenthreads') || '').split('!');
set_stylesheet(getCookie('pcstyle') || pc_default_stylesheet);

function pinNavBar() {
	if (getCookie('pinnavbar') != '0') {
		$('verytopbar').setStyle({position: 'fixed', left: '0', top: '0'});
		if ($('watchedthreads'))
			$('watchedthreads').setStyle({position: 'fixed'});
	}
	if ($('verytopbar').style.position === 'fixed')
		$('bodywrap1').style.marginTop = $('verytopbar').getHeight() + 'px';

	// Prevent anchor links (x.html#anchor) from appearing under the header bar... instead, offset them vertically a bit
	var topBarHeight = jQuery('#verytopbar').outerHeight() * 1.5;
	jQuery('a[name]').add('a[id]').each(function () {
		var $this = jQuery(this);
		if (!$this.closest('.postarea').length && !$this.closest('form').length)
			return;
		$this.css({position: 'relative', top: -topBarHeight + 'px'})
			.wrapInner(jQuery('<span>').css({position: 'relative', top: topBarHeight + 'px'}));
	});
}

function showThemeMenu() {
	try {
		set_cookie('settingversionseen', '4', 365);
		$('setting-showwatchedthreads').checked = getCookie('showwatchedthreads') === '1';
		$('setting-12hr').checked = getCookie('twelvehour') !== '0';
		$('setting-pinnav').checked = getCookie('pinnavbar') !== '0';
		$('setting-hidenames').checked = getCookie('hidenames') & 1;
		$('setting-hidenamesshowhover').checked = getCookie('hidenames') & 2;
		$('setting-hidenames').onclick();
		$('setting-unspoilall').checked = getCookie('unspoilall') === '1';
		$('setting-autoexpandwatchedthreads').checked = getCookie('autoexpandwatchedthreads') === '1';
	} catch(ex) {}

	showDropdown($('themedropdown'), $('thememenulink'));
}

function showDropdown(dropdown, from) {
	if (dropdown.style.display === 'none') {
		var pos = Position.cumulativeOffset(from);
		var dw = document.body.clientWidth;

		if (pos[0] + dropdown.getWidth() > dw)
			dropdown.style.right = '0';
		else
			dropdown.style.left = pos[0] + 'px';
		dropdown.style.top = from.getHeight() + 'px';
		dropdown.show();

		from.innerHTML = from.innerHTML.replace('\u25bc', '\u25b2');
	} else {
		dropdown.hide();
		from.innerHTML = from.innerHTML.replace('\u25b2', '\u25bc');
	}


}

function saveSettings() {
	try {
		set_cookie('showwatchedthreads', $('setting-showwatchedthreads').checked ? '1' : '0', 365);
		set_cookie('pinnavbar', $('setting-pinnav').checked ? '1' : '0', 365);
		set_cookie('twelvehour', $('setting-12hr').checked ? '1' : '0', 365);
		if ($('setting-hidenames').checked)
			set_cookie('hidenames', $('setting-hidenamesshowhover').checked ? 3 : 1, 365);
		else
			set_cookie('hidenames', 0, 365);
		set_cookie('unspoilall', $('setting-unspoilall').checked ? '1' : '0', 365);
		set_cookie('autoexpandwatchedthreads', $('setting-autoexpandwatchedthreads').checked ? '1' : '0', 365);
	} catch(ex) {}
	location.reload(true);
}

function showNotifications() {
	var lastseen = getCookie('settingversionseen');
	if (lastseen && parseInt(lastseen) < 4) {
		// ...
	}
}

function catalogSearchInterface() {
	var searchThreads = function () {
		var SearchText = $("SearchText").value.toLowerCase();
		var results = [];
		searchArea.getElementsBySelector('a').each(function(link) {
			var title = link.parentNode.getElementsBySelector('.post-title')[0].innerHTML || '';
			var body = link.parentNode.getElementsBySelector('.post-message')[0].innerHTML || '';
			if ((title + body).toLowerCase().indexOf(SearchText) == -1) return;
			if (!title) {
				title = link.href.replace(/^.*\/([0-9]+)\.html$/, "$1");
			}
			var ImgHtml = link.innerHTML;
			if (ImgHtml=="None") {
				ImgHtml = '<span style="border: 1px solid gray; padding: 3px 2px">None</span>';
			}
			var item =
				'<tr><td colspan=2><hr style="margin: 2px 0px"></tr>\n' +
				'<tr><td valign=middle height=50><a href="' + link.href + '" ' +
				' style="display: block; padding: 3px 0px;">' +
				'<span style="display: inline-block; width: 50px; text-align: right;">' +
				ImgHtml + "</span> " +
				'<td valign=middle>' +
				'<div style="padding: 4px 10px 4px; max-height: 100px; overflow: hidden">' +
				'<a href="' + link.href + '"> ' + title + '</a> &nbsp '  + body + '</div>';
			results.push(item);
		});
		if (results.length)
			searchResults.innerHTML =
				'<table cellpadding=0 cellspacing=0>' + results.join("\n") + '</table>';
		else
			searchResults.innerHTML = '<b>No threads found</b>';
		window.scrollTo(0, Position.cumulativeOffset(searchResults)[1]);
	};

	var searchForm = document.createElement('div'), searchResults = document.createElement('div');
	searchForm.style.textAlign = 'center';
	searchForm.style.marginBottom = '1em';
	searchForm.innerHTML =
		'Search: <input id="SearchText" type=text size=40>' +
		'<input id="SearchBtn" type=button value="Search Threads">';
	searchResults.style.padding = '10px 0';
	var searchArea = $$('.catalogtable')[0];
	searchArea.parentNode.insertBefore(searchForm, searchArea);
	searchArea.parentNode.insertBefore(searchResults, searchArea.nextSibling);
	$('SearchBtn').onclick = searchThreads;
	$('SearchText').onkeypress = function(e) {if (e.keyCode==13) {searchThreads();}};
}

function domReady() {
	document.onkeydown = keypress;
	truncatePosts();
	checkhighlight();
	addpreviewevents();
	showNotifications();

	if (kumod_set = checkMod()) {
		var modscript = document.createElement('script');
		modscript.type = 'text/javascript';
		modscript.src = ku_cgipath + '/manage_page.php?action=modboardpagejs';
		$$('head')[0].appendChild(modscript);
	}

	var frontPage = document.location.pathname.match(/\/chan[^\/]*\/($|\?)/);
	jQuery('#verytopbar').add('.adminbar').addClass('darkbar');  // while template changes propogate
	if (!frontPage) {
		pinNavBar();
		set_inputs('postform');
		set_delpass('delform');
	}

	var hideNamesCheck = $('setting-hidenames');
	if (hideNamesCheck)
		hideNamesCheck.onclick = function () {
			$('setting-hidenamesshowhover').disabled = !hideNamesCheck.checked;
		};

	if (getCookie('hidenames') & 1) {
		$$('.postername').each(function (name) {
			if (name.parentNode.getElementsBySelector('.mod,.admin').length)
				return;
			var tripNode = name.parentNode.getElementsBySelector('.postertrip');
			var trip = tripNode.length ? ' ' + tripNode[0].innerHTML : '';
			var fullName = name.innerHTML + trip;
			if (tripNode.length)
				tripNode[0].innerHTML = '';
			if (getCookie('hidenames') & 2) {
				name.innerHTML = '<a>Anonpony</a>';
				name.title = fullName;
			} else
				name.innerHTML = 'Anonpony';
		});
	}
	var tzServer = -7;
	try {
		tzServer = getServerTimezone();
	} catch(ex) {}
	try {
		var timezone = Date.today().setTimeToNow().getUTCOffset();
		var tzHours = parseInt(timezone.substring(0,3), 10);
		var tzMinutes = parseInt(timezone.substring(0,1) + timezone.substring(3,5), 10);
		var timeFormat = 'ddd, MMM d, yyyy ' + (getCookie('twelvehour') !== '0' ? 'h:mm tt' : 'H:mm');
		$$('.posttime').each(function (span) {
			span.innerHTML = Date.parse(span.innerHTML).addHours(tzHours - tzServer).addMinutes(tzMinutes)
				.toString(timeFormat).replace(/([AP]M)$/, '<span style="font-size:0.75em">$1</span>');
		});
	} catch(ex) {}

	if (getCookie('unspoilall') === '1') {
		var spoilers = $$('.spoiler');
		for (var s = 0; s < spoilers.length; ++s) {
			spoilers[s].className += ' spoiler-hover';
			spoilers[s].onmouseover = spoilers[s].onmouseout = '';
		}
	}

	$$('.rd').each(function (rd) {
		new Rainbow(rd,224,true,100,-20);
	});

	$$('.ov').each(function (octavia) {
		var note = document.createElement('span');
		note.style.position = 'absolute';
		octavia.appendChild(note);

		var waiting = false, xVel = 0, yVel = 0;

		var reset = function () {
			note.innerHTML = ['&#9834;', '&#9835;'][Math.floor(Math.random() * 2)];
			var origin = Position.cumulativeOffset(octavia);
			xVel = Math.floor(Math.random() * 3) - 1;
			note.style.left = origin[0] + Element.getWidth(octavia) - Element.getWidth(note) / 2 + 'px';
			note.style.top = origin[1] - Element.getHeight(note) / 2 + 'px';
			note.style.opacity = 1.0;
		};

		var move = function () {
			note.style.left = parseInt(note.style.left, 10) + xVel - 2 + Math.floor(Math.random() * 5) + 'px';
			note.style.top = parseInt(note.style.top, 10) + yVel - 2 - Math.floor(Math.random() * 2) + 'px';
			var opac = note.style.opacity - 0.04 - Math.random() * 0.07;
			if (opac < 0.02)
				opac = 0;  // Prevent rounding bugs
			note.style.opacity = Math.max(note.style.opacity - 0.07, 0);
			if (note.style.opacity == 0 && !waiting)
				delay();
		};

		var delay = function () {
			waiting = true;
			window.setTimeout(function () {
				waiting = false;
				reset();
			}, Math.floor(Math.pow(Math.random(), 2.5) * 3000));
		};

		window.setInterval(move, 30);
		delay();
	});

	$$('.postertrip').each(function (span) {
		if (span.innerHTML === '!!PinkiePie') {
			span.innerHTML = '<img src="/chan/css/images/pinkie-cutie-sm.png" alt="!!" width=12 height=20 style="position:relative;top:3px"><span style="color:#e4a">PinkiePie</span>';
		}
		if (span.innerHTML === '!!Rarity') {
			span.innerHTML = '<img src="/chan/css/images/rock-sm.png" alt="!!" width=15 height=20 style="vertical-align:top">Rarity';
		}
	});

	var sitesidebar = $('sitesidebar');
	if (sitesidebar) {
		Position.absolutize(sitesidebar);
		var abstop = parseInt(sitesidebar.style.top, 10);
		var fixtop = 8;
		window.onscroll = function (e) {
			if (window.scrollY > abstop - fixtop) {
				sitesidebar.style.position = 'fixed';
				sitesidebar.style.top = fixtop + 'px';
			} else {
				sitesidebar.style.position = 'absolute';
				sitesidebar.style.top = abstop + 'px';
			}
		};
	}

	jQuery('body').delegate('.postreportlink', 'click', function (e) {
		var $target = jQuery(e.target),
			reply = $target.closest('.reply'),
			thread = $target.closest('.thread'),
			threadMatch = /^thread(\d+)(.+)$/.exec(thread[0].id),
			boardName = threadMatch[2],
			postID = reply.length ? reply[0].id.substring(5) : threadMatch[1],
			popup = jQuery('<div class="reflinkpreview" style="display:none"><form>' +
				'<input type=hidden name=board value="' + boardName + '">' +
				'<input type=hidden name="post[]" value="' + postID + '">' +
				'<input type=hidden name="reportpost" value="yourmother">' +
				'<label>Reason: <input name=reportreason style="width:95%"></label><br>' +
				'<input type=submit value="Send report">' +
				'<a href="#" class=cancellink style="display:block;float:right">Cancel</a>' +
			'</form></div>').appendTo(document.body);

		popup.css({
			position: 'absolute',
			padding: '0.5em',
			width: '20em',
			minWidth: '20em',
		}).css({
			left: (reply.length ? reply : thread).offset().left + (reply.length ? reply : thread).outerWidth() - popup.outerWidth(),
			top: $target.offset().top + $target.outerHeight() - popup.outerHeight()
		});
		popup.find('.cancellink').css({position: 'absolute', right: '0.2em', bottom: 0, fontSize: '0.8em'}).click(function (e) {
			popup.fadeOut(200, function () {
				popup.remove();
			});
			e.preventDefault();
		});
		popup.find('form').submit(function (e) {
			var submit = popup.find('input[type=submit]').prop('disabled', true).val('Sending...');
			jQuery.ajax({
				url: ku_cgipath + '/board.php',
				type: 'post',
				data: popup.find('form').serialize(),
				success: function (data) {
					popup.text(data.slice(0, data.indexOf("<")));
					setTimeout(function () {
						popup.fadeOut(100, function () {
							popup.remove();
						});
					}, 1500);
				},
				error: function () {
					submit.prop('disabled', false).val('Report failed. Try again?');
				}
			});
			e.preventDefault();
		});
		document.body.appendChild(popup[0]);
		popup.fadeIn(100, function () {
			popup.find('[name=reportreason]').focus();
		});

		e.preventDefault();
	});

	var reportbutton = $$('#delform [name=reportpost]')[0]
	if(reportbutton) {
		reportbutton.onclick = function (e) {
			var reason = $$('#delform [name=reportreason]')[0];
			if (!reason.value) {
				reason.focus();
				var oldbg = reason.style.backgroundColor;
				reason.style.backgroundColor = '#fab';
				window.setTimeout(function () {
					reason.style.backgroundColor = oldbg;
				}, 1000);
				e.preventDefault();
			}
		};
	}
}
