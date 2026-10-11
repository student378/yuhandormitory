// 본문 HTML 정리 (공개 화면·관리자 공용)
// 게시글·페이지·팝업 본문에서 스크립트, on* 이벤트, javascript: 주소, 허용하지 않은 iframe을 제거합니다.
// 데이터 파일이 변조되거나 외부에서 복사한 HTML이 섞여도 방문자·관리자 브라우저에서 코드가 실행되지 않게 합니다.
(function () {
  'use strict';

  var DROP = /^(script|style|link|meta|base|object|embed|applet|form|input|button|textarea|select|option|svg|math|template|noscript|frame|frameset|title|head)$/;
  var KEEP = /^(p|br|b|strong|i|em|u|s|strike|del|ins|sub|sup|small|mark|span|div|font|h1|h2|h3|h4|h5|h6|ul|ol|li|dl|dt|dd|a|img|table|thead|tbody|tfoot|tr|th|td|caption|colgroup|col|blockquote|hr|figure|figcaption|pre|code|section|article|iframe|center)$/;
  var ATTRS = /^(href|src|alt|title|class|style|colspan|rowspan|width|height|target|color|align|valign|scope|start|type|allowfullscreen|frameborder|loading|allow)$/;

  // 지도·영상 퍼가기로 넣을 수 있는 주소 (CSP frame-src와 같게 유지)
  var FRAME_HOSTS = [
    'www.youtube.com', 'youtube.com', 'www.youtube-nocookie.com',
    'www.google.com', 'maps.google.com',
    'map.naver.com', 'm.map.naver.com', 'tv.naver.com',
    'map.kakao.com', 'tv.kakao.com', 'play-tv.kakao.com'
  ];

  function safeUrl(url, kind) {
    var u = String(url == null ? '' : url).trim();
    // 제어문자·공백을 끼워 넣은 "java\tscript:" 같은 우회도 막기 위해 정규화 후 검사
    var probe = u.replace(/[\u0000- \u007f-\u009f]/g, '').toLowerCase();
    var m = /^([a-z][a-z0-9+.-]*):/.exec(probe);
    if (!m) return u; // 상대 주소, #/m/..., uploads/... 등
    var scheme = m[1];
    if (scheme === 'http' || scheme === 'https') return u;
    if (kind === 'link' && (scheme === 'mailto' || scheme === 'tel')) return u;
    if (kind === 'img' && /^data:image\/(png|jpe?g|gif|webp);/.test(probe)) return u;
    if (kind === 'img' && scheme === 'blob') return u; // 관리자 화면의 업로드 직후 미리보기
    return '';
  }

  function frameAllowed(src) {
    try {
      var a = new URL(src, location.href);
      if (a.protocol !== 'https:') return false;
      if (FRAME_HOSTS.indexOf(a.hostname) < 0) return false;
      if ((a.hostname === 'www.google.com' || a.hostname === 'maps.google.com') && a.pathname.indexOf('/maps') !== 0) return false;
      return true;
    } catch (e) { return false; }
  }

  function clean(node) {
    var kids = Array.prototype.slice.call(node.childNodes);
    kids.forEach(function (n) {
      if (n.nodeType === 8) { n.remove(); return; }       // 주석
      if (n.nodeType !== 1) return;                         // 텍스트
      var tag = n.tagName.toLowerCase();
      if (DROP.test(tag)) { n.remove(); return; }
      if (!KEEP.test(tag)) {                                // 모르는 태그는 내용만 남김
        clean(n);
        while (n.firstChild) n.parentNode.insertBefore(n.firstChild, n);
        n.remove();
        return;
      }
      Array.prototype.slice.call(n.attributes).forEach(function (at) {
        var name = at.name.toLowerCase();
        if (!ATTRS.test(name)) { n.removeAttribute(at.name); return; }
        if (name === 'href') {
          var h = safeUrl(at.value, 'link');
          if (h) n.setAttribute('href', h); else n.removeAttribute('href');
        } else if (name === 'src') {
          var s = safeUrl(at.value, tag === 'img' ? 'img' : 'frame');
          if (s) n.setAttribute('src', s); else n.removeAttribute('src');
        } else if (name === 'style') {
          // CSS 안의 스크립트·외부 추적 주소 차단
          if (/expression\s*\(|javascript:|behaviou?r\s*:|url\s*\(|@import/i.test(at.value)) n.removeAttribute('style');
        }
      });
      if (tag === 'iframe') {
        var src = n.getAttribute('src') || '';
        if (!frameAllowed(src)) { n.remove(); return; }
        // 퍼가기 화면이 우리 페이지를 다른 곳으로 이동시키지 못하게 함
        n.setAttribute('sandbox', 'allow-scripts allow-same-origin allow-popups allow-presentation');
        n.setAttribute('referrerpolicy', 'strict-origin-when-cross-origin');
        n.setAttribute('loading', 'lazy');
      }
      if (tag === 'a') {
        var href = n.getAttribute('href') || '';
        if (/^https?:/i.test(href)) { n.setAttribute('target', '_blank'); n.setAttribute('rel', 'noopener noreferrer'); }
        else if (n.getAttribute('target')) n.removeAttribute('target');
      }
      if (tag === 'img' && !n.getAttribute('src')) { n.remove(); return; }
      clean(n);
    });
  }

  // DOMParser로 만든 문서는 화면과 분리되어 있어 <img onerror> 등이 실행되지 않음
  window.dormSanitize = function (html) {
    if (!html) return '';
    var doc = new DOMParser().parseFromString('<!doctype html><body>' + String(html), 'text/html');
    clean(doc.body);
    return doc.body.innerHTML;
  };
  window.dormSafeUrl = safeUrl;
  window.dormFrameHosts = FRAME_HOSTS.slice();
  window.dormText = function (html) {
    var doc = new DOMParser().parseFromString('<!doctype html><body>' + String(html || ''), 'text/html');
    return (doc.body.textContent || '').trim();
  };
})();
