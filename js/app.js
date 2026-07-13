// ============================================================
// せかいラボ・ナビ 本体
// 生徒の書き込み（種候補・問い・チェック・マイログ）はこの端末のlocalStorageにだけ保存される。
// サーバー・リポジトリには一切送信しない。
// ============================================================

const STORE_KEY = "sekailab-navi-v1";

function loadState() {
  try { return Object.assign({ seed: "", question: "", route: "", done: {}, logs: [] }, JSON.parse(localStorage.getItem(STORE_KEY) || "{}")); }
  catch (e) { return { seed: "", question: "", route: "", done: {}, logs: [] }; }
}
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* プライベートブラウズ等で保存不可でも動作は継続 */ } }
let state = loadState();

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}
function fmtDate(t) {
  const d = new Date(t);
  return d.getFullYear() + "/" + (d.getMonth() + 1) + "/" + d.getDate() + " " + d.getHours() + ":" + String(d.getMinutes()).padStart(2, "0");
}

// ---------- モーダル ----------
const modal = document.getElementById("modal");
const modalTitle = document.getElementById("modal-title");
const modalBody = document.getElementById("modal-body");
document.getElementById("modal-close").addEventListener("click", closeModal);
modal.addEventListener("click", e => { if (e.target === modal) closeModal(); });
function openModal(title, html) {
  modalTitle.textContent = title;
  modalBody.innerHTML = html;
  modal.classList.remove("hidden");
}
function closeModal() { modal.classList.add("hidden"); }

function copyText(text, btn) {
  const done = () => { const old = btn.textContent; btn.textContent = "✓ コピーした"; btn.classList.add("copied"); setTimeout(() => { btn.textContent = old.startsWith("✓") ? "📋 コピー" : old; btn.classList.remove("copied"); }, 2000); };
  if (navigator.clipboard && navigator.clipboard.writeText) {
    navigator.clipboard.writeText(text).then(done).catch(() => fallbackCopy(text, done));
  } else { fallbackCopy(text, done); }
}
function fallbackCopy(text, done) {
  const ta = document.createElement("textarea");
  ta.value = text; document.body.appendChild(ta); ta.select();
  try { document.execCommand("copy"); done(); } catch (e) { alert("コピーできませんでした。長押しで選択してコピーしてください。"); }
  document.body.removeChild(ta);
}

// ---------- マニュアルリンク ----------
function manualBtn(key) {
  const url = (CONFIG.MANUAL_LINKS || {})[key];
  if (!url) return "";
  return `<a class="btn ghost" href="${esc(url)}" target="_blank" rel="noopener">📖 マニュアル（スライド）を開く</a>`;
}

// ---------- AI壁打ちモーダル ----------
function openPrompt(id) {
  const p = PROMPTS[id];
  if (!p) return;
  const text = getPromptText(id);
  const gem = (CONFIG.GEM_LINKS || {})[id];
  const hint = gem
    ? `① 「Geminiで開く」を押す（学校のGoogleアカウントでログイン）→ ② AIの質問に一つずつ答える → ③ 最後に出るログの下書きを保存。<b>個人情報（本名など）は入力しない。</b>`
    : `① 下のプロンプトを全部コピー → ② ${esc(CONFIG.APPROVED_AI)}に貼って送信 → ③ AIの質問に一つずつ答える → ④ 最後に出るログの下書きを保存。<b>個人情報（本名など）は入力しない。</b>`;
  openModal("🤖 " + p.title, `
    <p class="hint">${hint}</p>
    <div class="btnrow">
      ${gem ? `<a class="btn primary" href="${esc(gem)}" target="_blank" rel="noopener">💎 Geminiで開く</a>` : ""}
      <button class="${gem ? "" : "primary"}" id="copy-prompt">📋 コピー</button>
    </div>
    <textarea readonly id="prompt-text">${esc(text)}</textarea>
  `);
  document.getElementById("copy-prompt").addEventListener("click", e => copyText(text, e.target));
}

// ---------- ログ ----------
function logTemplate(card) {
  return `章とカード: ${card}
【自分の最初の案】（AIと話す前に考えていたこと）
【AIと話したこと】（要点1〜2行。AIを使わなかった回は「AI利用なし」）
【判断】そのまま採用／修正して採用／不採用／保留／提案なし
【判断の理由】
【差分】（最初の案から何が変わったか）
【次の一歩】
【困り度】順調／やや不安／🆘
【本人要約または壁打ちログ】（壁打ちの最後に出た下書きがあれば貼る）`;
}
function openLog(card) {
  const hasForm = CONFIG.LOG_FORM_URL && CONFIG.LOG_ENTRY_CARD;
  const formUrl = hasForm
    ? CONFIG.LOG_FORM_URL + (CONFIG.LOG_FORM_URL.includes("?") ? "&" : "?") + "usp=pp_url&" + CONFIG.LOG_ENTRY_CARD + "=" + encodeURIComponent(card)
    : "";
  openModal("📓 思考ログを書く", `
    <p class="hint">型に沿って書いたら、<b>💾 マイログに保存</b>（この端末に残って自分で見返せる）。提出するときは${hasForm ? "<b>フォームを開く</b>から送信" : "コピーして先生指定の方法で提出"}。ログを読めるのは<b>先生だけ</b>——他の生徒には見えない。</p>
    <textarea id="log-text">${esc(logTemplate(card))}</textarea>
    <div class="btnrow">
      <button class="primary" id="save-log">💾 マイログに保存</button>
      <button id="copy-log">📋 コピー</button>
      ${hasForm ? `<a class="btn" href="${esc(formUrl)}" target="_blank" rel="noopener">📤 フォームを開く</a>` : ""}
    </div>
  `);
  const ta = document.getElementById("log-text");
  document.getElementById("save-log").addEventListener("click", e => {
    state.logs.unshift({ t: Date.now(), card: card, text: ta.value });
    saveState();
    e.target.textContent = "✓ 保存した（マイログへ）";
    e.target.classList.add("copied");
  });
  document.getElementById("copy-log").addEventListener("click", e => copyText(ta.value, e.target));
}

// ---------- 画面 ----------
const app = document.getElementById("app");

function currentLocation() {
  if (!state.route || !ROUTES[state.route]) {
    if (!state.seed) return { label: "スタート：種候補をつくる", href: "#/start" };
    if (!state.question) return { label: "スタート：問いをつくる", href: "#/start" };
    return { label: "スタート：章をえらぶ", href: "#/start" };
  }
  const rt = ROUTES[state.route];
  const next = rt.steps.find(s => !state.done[s.id]);
  if (!next) return { label: rt.name + "：全ステップ完了 🎉", href: "#/route/" + state.route };
  return { label: rt.name + "：" + next.title, href: "#/step/" + state.route + "/" + next.id };
}

function roadNode(opts) {
  // opts: {href, no, title, sub, done, now, color}
  return `<li class="${opts.done ? "is-done" : ""} ${opts.now ? "is-now" : ""}"><a href="${opts.href}">
    <span class="no">${opts.done ? "✓" : opts.no}</span>
    <span class="t">${esc(opts.title)}${opts.sub ? `<br><small>${esc(opts.sub)}</small>` : ""}</span>
    ${opts.now ? `<span class="now-chip">今ここ</span>` : (opts.ai ? `<span class="has-ai">🤖</span>` : "")}
  </a></li>`;
}

function viewHome() {
  const loc = currentLocation();
  const rt = state.route && ROUTES[state.route];

  // スタート区間のノード
  const startDone1 = !!state.seed, startDone2 = !!state.question, startDone3 = !!rt;
  let firstUndoneStart = !startDone1 ? 1 : (!startDone2 ? 2 : (!startDone3 ? 3 : 0));
  const startNodes = [
    roadNode({ href: "#/start", no: "1", title: "種候補をつくる", sub: state.seed ? "「" + state.seed + "」" : "気になることを1行に（AI壁打ちあり）", done: startDone1, now: firstUndoneStart === 1, ai: true }),
    roadNode({ href: "#/start", no: "2", title: "問いをつくる（種 × 学術レンズ）", sub: state.question ? "「" + state.question + "」" : "大きな問いを1行（AI壁打ちあり）", done: startDone2, now: firstUndoneStart === 2, ai: true }),
    roadNode({ href: "#/start", no: "3", title: "章をえらぶ", sub: rt ? rt.ch + " " + rt.name : "問いのタイプで決まる（仮決め・乗り換えOK）", done: startDone3, now: firstUndoneStart === 3 }),
  ].join("");

  // ルート区間のノード
  let routeSection = "";
  if (rt) {
    const next = rt.steps.find(s => !state.done[s.id]);
    routeSection = `
      <div class="road-head r-${state.route}">
        <span class="rh-ch">${esc(rt.ch)}</span>
        <span class="rh-nm">${esc(rt.name)}</span>
        <a class="rh-link" href="#/route/${state.route}">章の説明 ›</a>
      </div>
      <ul class="road r-${state.route}">
        ${rt.steps.map((s, i) => roadNode({
          href: "#/step/" + state.route + "/" + s.id,
          no: i + 1, title: s.title, sub: "",
          done: !!state.done[s.id],
          now: next && next.id === s.id,
          ai: !!s.prompt,
        })).join("")}
      </ul>
      ${manualBtn(state.route) ? `<div class="btnrow" style="margin-top:4px">${manualBtn(state.route)}</div>` : ""}
    `;
  } else {
    routeSection = `
      <div class="road-head"><span class="rh-nm">章えらびの先にある4つのルート</span></div>
      <ul class="steplist">
        ${Object.entries(ROUTES).map(([rid, r]) => `
          <li class="r-${rid}"><a href="#/route/${rid}">
            <span class="no">${r.ch.replace("CHAPTER ", "")}</span>
            <span class="t">${esc(r.name)}<br><small style="font-weight:400;color:var(--ink3)">${esc(r.tagline)}／予想の呼び名：${esc(r.yobina)}</small></span>
          </a></li>`).join("")}
      </ul>`;
  }

  app.innerHTML = `
    <h1>🗺 ロードマップ</h1>
    <div class="loc-bar"><span class="loc-label">現在地</span><a href="${loc.href}">${esc(loc.label)}</a></div>
    <div class="road-head"><span class="rh-nm">スタート</span>${manualBtn("start") ? `<a class="rh-link" href="${esc((CONFIG.MANUAL_LINKS || {}).start)}" target="_blank" rel="noopener">📖 マニュアル ›</a>` : ""}</div>
    <ul class="road">
      ${startNodes}
    </ul>
    ${routeSection}
    <p class="sub" style="margin-top:14px">🌀 進む順番は目安。悩んで戻るのも、方向を変えるのも、正常な前進（<a href="#/switch">乗り換え</a>）。書いたログは<a href="#/mylog">マイログ</a>にたまる。</p>
  `;
}

function viewStart() {
  const g = GENKAN;
  app.innerHTML = `
    <div class="crumb"><a href="#/">ロードマップ</a> › スタート</div>
    <h1>スタート：種候補 → 問い → 章を決める</h1>
    <div class="card">
      ${g.worldview.chip ? `<span class="chip">${esc(g.worldview.chip)}</span>` : ""}
      <h3>${esc(g.worldview.title)}</h3>
      ${g.worldview.body.map(b => `<p>${esc(b)}</p>`).join("")}
    </div>
    <div class="card">
      ${g.seedQuestion.chip ? `<span class="chip">${esc(g.seedQuestion.chip)}</span>` : ""}
      <h3>${esc(g.seedQuestion.title)}</h3>
      ${g.seedQuestion.body.map(b => `<p>${esc(b)}</p>`).join("")}
    </div>
    <div class="card">
      <h3>ある人：一行で仮置きしよう</h3>
      <input type="text" id="seed-input" placeholder="例：誰も悪くない食品ロス" value="${esc(state.seed)}">
      <p class="sub" style="margin-top:6px">書けたらそのまま下の問い作成へ。ない人・言葉にできない人は、次のカードへ。</p>
    </div>
    <div class="card">
      <h3>${esc(g.tane.title)}</h3>
      ${g.tane.body.map(b => `<p>${esc(b)}</p>`).join("")}
      <div class="dekita"><b>できたサイン</b>：${esc(g.tane.dekita)}</div>
      <div class="btnrow">
        <button class="primary" onclick="openPrompt('tane')">🤖 壁打ちをひらく</button>
        <button onclick="openLog('${esc(g.tane.log)}')">📓 ログを書く</button>
      </div>
    </div>
    <div class="card">
      ${g.toi.chip ? `<span class="chip">${esc(g.toi.chip)}</span>` : ""}
      <h3>${esc(g.toi.title)}</h3>
      ${g.toi.body.map(b => `<p>${esc(b)}</p>`).join("")}
      ${g.toi.note ? `<div class="note">${esc(g.toi.note)}</div>` : ""}
      <div class="dekita"><b>できたサイン</b>：${esc(g.toi.dekita)}</div>
      <div class="btnrow">
        <button class="primary" onclick="openPrompt('toi')">🤖 壁打ちをひらく</button>
        <button onclick="openLog('${esc(g.toi.log)}')">📓 ログを書く</button>
      </div>
    </div>
    <div class="card accent">
      <h3>決まった問いと、タイプを記録しよう</h3>
      <input type="text" id="q-input" placeholder="大きな問いを1行（例：なぜ誰も悪くないのに食品ロスが起きるのか？）" value="${esc(state.question)}">
      <div class="qtype">
        ${QTYPES.map(q => `<button class="q-${q.id} ${state.route === q.id ? "selected" : ""}" data-qtype="${q.id}">${q.icon} ${esc(q.label)}<small>${esc(q.desc)}</small></button>`).join("")}
      </div>
      <div class="btnrow" id="depart-row" style="${state.route ? "" : "display:none"}">
        <a class="btn primary" href="#/route/${state.route || ""}" id="depart-btn">🚀 ${state.route && ROUTES[state.route] ? esc(ROUTES[state.route].name) + "へ出発" : "出発"}</a>
      </div>
    </div>
    ${manualBtn("start") ? `<div class="btnrow">${manualBtn("start")}</div>` : ""}
    <p class="sub" style="margin-top:10px">🌀 決められなくても大丈夫。仮決めして進んで、違ったら<a href="#/switch">乗り換え</a>ればいい。</p>
  `;
  document.getElementById("seed-input").addEventListener("input", e => { state.seed = e.target.value; saveState(); });
  document.getElementById("q-input").addEventListener("input", e => { state.question = e.target.value; saveState(); });
  document.querySelectorAll("[data-qtype]").forEach(btn => {
    btn.addEventListener("click", () => {
      state.route = btn.dataset.qtype; saveState();
      document.querySelectorAll("[data-qtype]").forEach(b => b.classList.remove("selected"));
      btn.classList.add("selected");
      const row = document.getElementById("depart-row");
      row.style.display = "";
      const a = document.getElementById("depart-btn");
      a.setAttribute("href", "#/route/" + state.route);
      a.textContent = "🚀 " + ROUTES[state.route].name + "へ出発";
    });
  });
}

function viewRoute(rid) {
  const rt = ROUTES[rid];
  if (!rt) { location.hash = "#/"; return; }
  const next = rt.steps.find(s => !state.done[s.id]);
  app.innerHTML = `
    <div class="crumb"><a href="#/">ロードマップ</a> › ${esc(rt.name)}</div>
    <div class="card route-head r-${rid}">
      <div class="ch">${esc(rt.ch)}</div>
      <div class="nm">${esc(rt.name)}</div>
      <p class="sub" style="margin:2px 0 0">${esc(rt.tagline)}｜予想の呼び名：<b>${esc(rt.yobina)}</b></p>
      ${manualBtn(rid) ? `<div class="btnrow">${manualBtn(rid)}</div>` : ""}
    </div>
    <div class="note">${esc(rt.banner)}</div>
    <ul class="road r-${rid}">
      ${rt.steps.map((s, i) => roadNode({
        href: "#/step/" + rid + "/" + s.id,
        no: i + 1, title: s.title,
        done: !!state.done[s.id],
        now: next && next.id === s.id && rid === state.route,
        ai: !!s.prompt,
      })).join("")}
    </ul>
    <p class="sub">最初から順に全部やらなくていい。今の自分のステップだけ開こう。違うと感じたら<a href="#/switch">乗り換え</a>へ。</p>
  `;
}

function viewStep(rid, sid) {
  const rt = ROUTES[rid];
  const s = rt && rt.steps.find(x => x.id === sid);
  if (!s) { location.hash = "#/"; return; }
  const i = rt.steps.indexOf(s);
  const prev = rt.steps[i - 1], next = rt.steps[i + 1];
  app.innerHTML = `
    <div class="crumb"><a href="#/">ロードマップ</a> › <a href="#/route/${rid}">${esc(rt.name)}</a> › ${esc(s.title)}</div>
    <div class="card route-head r-${rid}">
      <div class="ch">${esc(rt.ch)}｜STEP ${i + 1}</div>
      <div class="nm" style="font-size:18px">${esc(s.title)}</div>
      <h2 style="margin-top:10px">今やること</h2>
      <ul>${s.ima.map(x => `<li>${esc(x)}</li>`).join("")}</ul>
      ${s.dekita ? `<div class="dekita"><b>できたサイン</b>：${esc(s.dekita)}</div>` : ""}
      ${s.warn ? `<div class="warn">${esc(s.warn)}</div>` : ""}
      <div class="btnrow">
        ${s.prompt ? `<button class="primary" onclick="openPrompt('${s.prompt}')">🤖 壁打ちをひらく</button>` : ""}
        <button onclick="openLog('${esc(s.log)}')">📓 ログを書く</button>
        <button class="done-toggle ${state.done[s.id] ? "is-done" : ""}" id="done-btn">${state.done[s.id] ? "✓ できた" : "できたら押す"}</button>
      </div>
    </div>
    <div class="btnrow">
      ${prev ? `<a class="btn ghost" href="#/step/${rid}/${prev.id}">← ${esc(prev.title)}</a>` : ""}
      ${next ? `<a class="btn" href="#/step/${rid}/${next.id}">${esc(next.title)} →</a>` : `<a class="btn" href="#/route/${rid}">章の一覧へ</a>`}
    </div>
    <p class="sub" style="margin-top:10px">🌀 悩んだら戻っていい。前のステップをやり直すのも、問い・章ごと変えるのも（<a href="#/switch">乗り換え</a>）、全部正常な前進。</p>
  `;
  document.getElementById("done-btn").addEventListener("click", e => {
    state.done[s.id] = !state.done[s.id]; saveState();
    e.target.classList.toggle("is-done", !!state.done[s.id]);
    e.target.textContent = state.done[s.id] ? "✓ できた" : "できたら押す";
  });
}

function viewMyLog() {
  const items = state.logs || [];
  app.innerHTML = `
    <div class="crumb"><a href="#/">ロードマップ</a> › マイログ</div>
    <h1>📓 マイログ</h1>
    <p class="sub">自分で保存した思考ログの一覧（新しい順）。<b>この端末の中にだけ</b>あって、誰にも送信されない。提出はコピーして先生のフォームへ。端末を変えると消えるので、大事なログは提出しておこう。<a href="#/about-log">ログとは？ ›</a></p>
    ${items.length === 0 ? `
      <div class="card"><h3>まだログがない</h3><p>各ステップの「📓 ログを書く」から書いて「💾 マイログに保存」すると、ここにたまっていく。迷い・撤回・方向転換が残っているログほど、あとで価値が出る。</p></div>
    ` : items.map((l, idx) => `
      <div class="card log-item">
        <div class="log-head"><b>${esc(l.card)}</b><span>${fmtDate(l.t)}</span></div>
        <pre class="log-text">${esc(l.text)}</pre>
        <div class="btnrow">
          <button data-copy="${idx}">📋 コピー</button>
          <button class="ghost" data-del="${idx}">削除</button>
        </div>
      </div>`).join("")}
  `;
  app.querySelectorAll("[data-copy]").forEach(b => b.addEventListener("click", e => copyText(items[+b.dataset.copy].text, e.target)));
  app.querySelectorAll("[data-del]").forEach(b => b.addEventListener("click", () => {
    if (confirm("このログを端末から削除する？（提出済みのものは消えない）")) {
      state.logs.splice(+b.dataset.del, 1); saveState(); viewMyLog();
    }
  }));
}

function viewSwitch() {
  app.innerHTML = `
    <div class="crumb"><a href="#/">ロードマップ</a> › 乗り換え</div>
    <h1>🔄 問い・章は途中で変えてよい</h1>
    <div class="card">
      <h3>最初の選択は「約束」ではなく「乗り物」</h3>
      <p>乗り換えは失敗じゃない。君の解像度が上がった証拠（構成研究では、見立てが変わること自体が成果になる）。</p>
      <ul>
        <li>興味が消えた・ワクワクしなくなった</li>
        <li>証拠や資料がどうしても集まらない</li>
        <li>もっと良い問い・もっと合う手段が見えてしまった</li>
      </ul>
      <p>——どれかに当てはまったら、乗り換えのサイン。先生に一言伝えてから移ろう。</p>
      <div class="warn">🔒 1つだけ例外：実証研究でデータを取り始めた後の仮説の書き換えは不可（後出しジャンケン）。その場合は「不支持」として報告して、次の問いへ。</div>
    </div>
    <div class="card">
      <h3>乗り換え方</h3>
      <ul>
        <li>問いを作り直す → 問い作成AIを何度でもやり直してOK（問いカードの「見なかった方向」も乗り換え先）</li>
        <li>種から考え直す → 種発見AIへ戻る</li>
        <li>章だけ移る → 下のボタンで選び直す</li>
      </ul>
      <div class="btnrow">
        <a class="btn" href="#/start">スタートに戻る</a>
        <button class="ghost" id="reset-route">章の選択だけリセット</button>
        <button class="ghost" id="reset-all">最初からやり直す（この端末の記録を消す）</button>
      </div>
    </div>
  `;
  document.getElementById("reset-route").addEventListener("click", () => {
    state.route = ""; saveState(); location.hash = "#/start";
  });
  document.getElementById("reset-all").addEventListener("click", () => {
    if (confirm("この端末に保存した種候補・問い・チェック・マイログを消します。提出済みのログは消えません。いい？")) {
      state = { seed: "", question: "", route: "", done: {}, logs: [] }; saveState(); location.hash = "#/";
    }
  });
}

function viewAboutLog() {
  app.innerHTML = `
    <div class="crumb"><a href="#/">ロードマップ</a> › <a href="#/mylog">マイログ</a> › ログとは</div>
    <h1>📓 思考ログについて</h1>
    <div class="card">
      <h3>なぜ書くのか</h3>
      <p>探究の評価は、結果だけでなく「どう考え、どう判断したか」で行われる。ログはその証拠であり、君自身の思考の鏡であり、大学入試（総合型選抜）の面接で語る材料にもなる。</p>
      <p><b>きれいなログより、迷い・撤回・方向転換が残っているログの方が価値が高い。</b>本物の思考の跡は汚れている。</p>
    </div>
    <div class="card">
      <h3>誰が読むのか（大事）</h3>
      <ul>
        <li>提出したログを読めるのは<b>先生だけ</b>。他の生徒からは見えない。</li>
        <li><b>マイログはこの端末の中にだけ</b>あって、どこにも送信されない。自分の見返し用。</li>
        <li>本名以外の個人情報（住所・アカウント名）や、他人の本名は書かない。人は「部活の先輩」のような呼び方で。</li>
      </ul>
    </div>
    <div class="card">
      <h3>いつ書くのか</h3>
      <ul>
        <li>AI壁打ちをした回：最後に出る下書きの【現在の判断と理由】だけ自分で書いて、保存＆提出。</li>
        <li>AIを使わなかった回：自分の判断と理由を短く書いて提出（AI利用なし、と書けばOK）。</li>
        <li>毎回の長文はいらない。判断があった時に、1〜2行。</li>
      </ul>
      <div class="btnrow"><button class="primary" onclick="openLog('（章とカードを自分で選ぶ）')">📓 ログを書く</button></div>
    </div>
  `;
}

// ---------- ルーター ----------
function render() {
  const h = location.hash || "#/";
  const parts = h.replace(/^#\//, "").split("/");
  window.scrollTo(0, 0);
  closeModal();
  if (h === "#/" || h === "") return viewHome();
  if (parts[0] === "start" || parts[0] === "genkan") return viewStart();
  if (parts[0] === "route" && parts[1]) return viewRoute(parts[1]);
  if (parts[0] === "step" && parts[1] && parts[2]) return viewStep(parts[1], parts[2]);
  if (parts[0] === "mylog") return viewMyLog();
  if (parts[0] === "switch") return viewSwitch();
  if (parts[0] === "about-log") return viewAboutLog();
  viewHome();
}
window.addEventListener("hashchange", render);
render();
