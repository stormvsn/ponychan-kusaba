<?php
require_once dirname(__FILE__) . "/../config.php";

ini_set('pcre.backtrack_limit', '1000000');
define("CACHED_FILE", dirname(__FILE__) . "/cache.html");
define("ALLBOARDS_PAGE_TITLE", "Overpony");
define("THREAD_LIMIT_PER_BOARD", 3);
define("THREAD_LIMIT_TOTAL", 25);
$exclude_boards = array();

if (filemtime(CACHED_FILE) > time() - 10) {
	echo file_get_contents(CACHED_FILE);
	exit;
}

function get_threads($board) {
	global $boards_shuffle;

	$doc = file_get_contents(KU_BOARDSDIR . $board . "/" . KU_FIRSTPAGE);
	# Stickies shouldn't show up here
	$doc = preg_replace("@<div class=\"stickyregion\">(.*?)</div>([\r\n]*)<hr class=\"stickyregionsep\" />@s", "", $doc);

	if (!$GLOBALS['template_board_page'])
		$GLOBALS['template_board_page'] = $doc;

	# Make an array of all the threads on the page.
	$matches = array();
	preg_match_all("@<span id=\"unhidethread.*?<hr />@s", $doc, $matches);
	$threads = array();
	foreach ($matches[0] as $v) {
		$m = array();
		# Extract the last post id.
		preg_match_all("@(>No[.]&nbsp;.*?>)([0-9]+)(</a>)@s", $v, $m);
		$post_id = sprintf("%09u", end($m[2]));
		# Extract the last post time.
		preg_match_all("/<span class=\"posttime\">([^<]+)</s", $v, $m);
		$post_time = strtotime(end($m[1]));
		$post_time += array_key_exists('timestamp', $boards_shuffle[$board]) ? $boards_shuffle[$board]['timestamp'] : 0;

		# Replace, e.g., "No. 42" with "No. /oat/42" in the span[class="reflink"] elements.
		$k = "{$post_time}-{$board}-{$post_id}";
		$v = preg_replace("@(>No[.]&nbsp;.*?>)([0-9]+)(</a>)@", "$1/$board/$2$3", $v, 1);
		$threads[$k] = $v;
	}
	krsort($threads);
	array_splice($threads, THREAD_LIMIT_PER_BOARD);
	return $threads;
}

$generated_start = microtime(true);

$boards = $tc_db->GetAll("SELECT `section`, `name` FROM `" . KU_DBPREFIX . "boards` WHERE `section` != 0 ORDER BY `section`, `order`");
foreach($boards as $i => $board)
	$boards[$i] = $board['name'];

$boards_shuffle = unserialize(KU_BOARDS_SHUFFLE);

$threads = array();
foreach ($boards as $bd)
	if (!in_array($bd, $exclude_boards))
		$threads = array_merge($threads, get_threads($bd));

krsort($threads);
array_splice($threads, THREAD_LIMIT_TOTAL);

$doc = $template_board_page;

# Replace the post form with the settings
$jsboards = '["' . implode('", "', $boards) . '"]';
$doc = preg_replace("@<form [a-z]+=\"postform\".*?(?=<hr />)@s", <<<EOS
<form id=overpony-settings style="text-align:left"></form>
<script type="text/javascript">
var overpony = {
	init: function () {
		this.allBoards = $jsboards;
		this.settingsForm = document.getElementById('overpony-settings');
		var f = '<table border=0 style="margin:0"><tr><td>Boards:</td><td>';
		for (var b = 0, bl = this.allBoards.length; b < bl; ++b) {
			f += '<label><input class=boardCheck type=checkbox data-boardname="' +
				this.allBoards[b] + '"> ' + this.allBoards[b] + '</label>&nbsp;&nbsp;';
			if (b && !(b % 6))
				f += '<br />';
		}
		f += '</td></tr></table><button onclick="overpony.saveSettings();event.preventDefault()">Save</button>';
		this.settingsForm.innerHTML += f;
		this.filter();
	},
	loadSettings: function () {
		var s = JSON.parse(window.localStorage.getItem('overponySettings'));
		if (!s)
			s = {boards: this.allBoards};
		jQuery(this.settingsForm).find('.boardCheck').each(function () {
			this.checked = s.boards.indexOf('"'+this.getAttribute('data-boardname')+'"') !== -1;
		});
		return s;
	},
	saveSettings: function (form) {
		var s = {boards: []};
		jQuery(this.settingsForm).find('.boardCheck').each(function () {
			if (this.checked)
				s.boards.push(this.getAttribute('data-boardname'));
		});
		window.localStorage.setItem('overponySettings', JSON.stringify(s));
		this.filter();
	},
	filter: function () {
		var settings = this.loadSettings();
		jQuery('.thread').each(function () {
			var \$this = jQuery(this);
			var boardName = /thread\d+(.+)\$/.exec(this.id)[1];
			var show = settings.boards.indexOf('"'+boardName+'"') !== -1;
			var parts = \$this;
			parts.push(parts[0].next('br'));
			parts.push(parts[1].next('hr'));
			parts[show ? 'show' : 'hide']();
			var threadID = /thread(\d+.+)\$/.exec(this.id)[1];
			if (hiddenthreads.toString().indexOf(threadID) !== -1) {
				if (show) {
					this.hide();
					jQuery("unhide" + this.id).style.display = 'block';
				} else {
					jQuery("unhide" + this.id).hide();
				}
			}
		});
	}
};
jQuery(function () {overpony.init();});
</script>
EOS
, $doc);

# Remove search link
$doc = preg_replace("@<a[^>]+catalog.html[^>]*>[^<]*</a>@", "", $doc);
# Remove reference to RSS feed
$doc = preg_replace("@<link rel=\"alternate\".+?/>\s*@s", "", $doc);
# Remove highlight of template board in top menu
$doc = preg_replace("@\s*navbarcurboard@", "", $doc);
# Remove the pagination at the bottom
$doc = preg_replace("@<table border=\"0\">\s*<tbody>\s*<tr>\s*<td>\s*Previous.+?</table>@s", "", $doc);

# Replace the actual threads
$doc = preg_replace("@<form id=\"delform\".*?</form>@s", str_replace('$', '\\$', implode("\n", $threads)), $doc);
# Replace the html title
$doc = preg_replace("@<title>[^<]*</title>@",
	"<title>" . ALLBOARDS_PAGE_TITLE . "</title>\n<base href=\"http://www.ponychan.net/chan/\">", $doc);
# Replace the page title
$doc = preg_replace("@(<div class=\"logo\">)[^<]*(</div>)@", "$1" . ALLBOARDS_PAGE_TITLE . "$2", $doc);

$doc .= '<!-- Collected in ' . round(microtime(true) - $generated_start, 3) . " seconds -->\n";

echo $doc;
file_put_contents(CACHED_FILE, $doc);
?>
