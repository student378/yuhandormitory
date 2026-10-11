// data/*.js 데이터 파일 불러오기 (공개 화면·관리자 공용)
// JSON 대신 <script>로 읽기 때문에 웹서버 없이 index.html을 더블클릭해도 동작합니다.
window.loadDormData = function () {
  var names = ['site', 'posts', 'meals'];
  window.DORM_DATA = {};
  var bust = location.protocol === 'file:' ? '' : '?v=' + Date.now();
  return Promise.all(names.map(function (n) {
    return new Promise(function (res, rej) {
      var s = document.createElement('script');
      s.src = 'data/' + n + '.js' + bust;
      s.onload = function () { s.remove(); res(); };
      s.onerror = function () { s.remove(); rej(new Error('data/' + n + '.js 파일을 불러오지 못했습니다')); };
      document.head.appendChild(s);
    });
  })).then(function () {
    var d = window.DORM_DATA;
    names.forEach(function (n) { if (!d[n]) throw new Error('data/' + n + '.js 파일 형식이 올바르지 않습니다'); });
    return { site: d.site, posts: d.posts, meals: d.meals };
  });
};

// 데이터 → data/*.js 파일 내용
window.dormDataToJs = function (name, obj) {
  return '/* 관리자 페이지에서 생성·수정되는 데이터 파일입니다. 직접 수정할 때는 JSON 형식을 지켜 주세요. */\n' +
    'window.DORM_DATA = window.DORM_DATA || {};\n' +
    'window.DORM_DATA.' + name + ' = ' + JSON.stringify(obj, null, 1) + ';\n';
};

// data/*.js 파일 내용 → 데이터
window.dormJsToData = function (name, text) {
  var key = 'window.DORM_DATA.' + name + ' =';
  var i = text.indexOf(key);
  if (i < 0) throw new Error(name + '.js 형식 오류');
  var body = text.slice(i + key.length).trim().replace(/;\s*$/, '');
  return JSON.parse(body);
};

// 선택 데이터 파일 하나 불러오기 (없으면 null) — 관리자 암호 파일(data/admin.js) 등
window.loadDormFile = function (name) {
  return new Promise(function (res) {
    var s = document.createElement('script');
    s.src = 'data/' + name + '.js' + (location.protocol === 'file:' ? '' : '?v=' + Date.now());
    s.onload = function () { s.remove(); res((window.DORM_DATA || {})[name] || null); };
    s.onerror = function () { s.remove(); res(null); };
    document.head.appendChild(s);
  });
};
