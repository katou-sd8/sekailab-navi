// ============================================================
// せかいラボ・ナビ 本体
// 生徒の書き込みはこの端末のlocalStorageにだけ保存される。
// サーバー・リポジトリには一切送信しない。
// ============================================================

const STORE_KEY = "sekailab-navi-v1";

function loadState() {
  try { return Object.assign({ seed: "", question: "", route: "", done: {} }, JSON.parse(localStorage.getItem(STORE_KEY) || "{}")); }
  catch (e) { return { seed: "", question: "", route: "", done: {} }; }
}
function saveState() { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) { /* プライベートブラウズ等で保存不可でも動作は継続 */ } }
let state = loadState();

function esc(s) {
  return String(s || "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
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
  const done = () => { btn.textContent = "✓ コピーした"; btn.classList.add("copied"); setTimeout(() => { btn.textContent = "📋 コピー"; btn.classList.remove("copied"); }, 2000); };
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
  if (CONFIG.LOG_FORM_URL && CONFIG.LOG_ENTRY_CARD) {
    const url = CONFIG.LOG_FORM_URL + (CONFIG.LOG_FORM_URL.includes("?") ? "&" : "?") +
      "usp=pp_url&" + CONFIG.LOG_ENTRY_CARD + "=" + encodeURIComponent(card);
    window.open(url, "_blank");
    return;
  }
  const text = logTemplate(card);
  openModal("📓 思考ログを書く", `
    <p class="hint">下の型をコピーして、先生が指定した方法（フォームなど）で提出しよう。ログは<b>先生だけ</b>が読む。他の生徒には見えない。</p>
    <div class="btnrow"><button class="primary" id="copy-log">📋 コピー</button></div>
    <textarea readonly>${esc(text)}</textarea>
  `);
  document.getElementById("copy-log").addEventListener("click", e => copyText(text, e.target));
}

// ---------- 画面 ----------
const app = document.getElementById("app");

function cardHtml(o) {
  return `<div class="card">
    ${o.chip ? `<span class="chip">${esc(o.chip)}</span>` : ""}
    <h3>${esc(o.title)}</h3>
    ${(o.body || []).map(b => `<p>${esc(b)}</p>`).join("")}
  </div>`;
}

function viewHome() {
  const r = state.route && ROUTES[state.route];
  let current;
  if (r) {
    const next = r.steps.find(s => !state.done[s.id]);
    current = `<div class="card accent">
      <span class="chip">現在地</span>
      <h3>${esc(r.ch)}｜${esc(r.name)}</h3>
      <p>${next ? "次のステップ：<b>" + esc(next.title) + "</b>" : "全ステップ完了！🎉"}</p>
      ${state.question ? `<p>問い：「${esc(state.question)}」</p>` : ""}
      <div class="btnrow"><a class="btn primary" href="#/route/${state.route}">章をひらく</a></div>
    </div>`;
  } else {
    current = `<div class="card accent">
      <span class="chip">現在地</span>
      <h3>玄関：種候補 → 問い → 章を決める</h3>
      ${state.seed ? `<p>種候補：「${esc(state.seed)}」</p>` : "<p>まだ種候補がない。それが普通のスタート。</p>"}
      <div class="btnrow"><a class="btn primary" href="#/genkan">玄関からはじめる</a></div>
    </div>`;
  }
  app.innerHTML = `
    <h1>せかいラボ・ナビ</h1>
    <p class="sub">世界を1ミリでも良くする探究の、今やることだけを示すナビ。順番に全部読まなくていい。</p>
    ${current}
    <h2>4つのルート</h2>
    <ul class="steplist">
      ${Object.entries(ROUTES).map(([rid, rt]) => `
        <li class="r-${rid}"><a href="#/route/${rid}">
          <span class="no">${rt.ch.replace("CHAPTER ", "")}</span>
          <span class="t">${esc(rt.name)}<br><small style="font-weight:400;color:var(--ink3)">${esc(rt.tagline)}／予想の呼び名：${esc(rt.yobina)}</small></span>
        </a></li>`).join("")}
    </ul>
    <p class="sub">問いも章も途中で変えてよい（<a href="#/switch">乗り換え</a>）。書いたものは<a href="#/about-log">ログ</a>として先生にだけ届く。</p>
  `;
}

function viewGenkan() {
  const g = GENKAN;
  app.innerHTML = `
    <div class="crumb"><a href="#/">ホーム</a> › 玄関</div>
    <h1>玄関：種候補 → 問い → 章を決める</h1>
    ${cardHtml(g.worldview)}
    ${cardHtml(g.seedQuestion)}
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
      <div class="note">${esc(g.toi.note)}</div>
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
      a.href = "#/route/" + state.route;
      a.textContent = "🚀 " + ROUTES[state.route].name + "へ出発";
    });
  });
}

function viewRoute(rid) {
  const rt = ROUTES[rid];
  if (!rt) { location.hash = "#/"; return; }
  app.innerHTML = `
    <div class="crumb"><a href="#/">ホーム</a> › ${esc(rt.name)}</div>
    <div class="card route-head r-${rid}">
      <div class="ch">${esc(rt.ch)}</div>
      <div class="nm">${esc(rt.name)}</div>
      <p class="sub" style="margin:2px 0 0">${esc(rt.tagline)}｜予想の呼び名：<b>${esc(rt.yobina)}</b></p>
    </div>
    <div class="note">${esc(rt.banner)}</div>
    <ul class="steplist r-${rid}">
      ${rt.steps.map((s, i) => `
        <li class="${state.done[s.id] ? "is-done" : ""}"><a href="#/step/${rid}/${s.id}">
          <span class="no">${state.done[s.id] ? "✓" : i + 1}</span>
          <span class="t">${esc(s.title)}</span>
          ${s.prompt ? `<span class="has-ai">🤖 壁打ちあり</span>` : ""}
        </a></li>`).join("")}
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
    <div class="crumb"><a href="#/">ホーム</a> › <a href="#/route/${rid}">${esc(rt.name)}</a> › ${esc(s.title)}</div>
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
  `;
  document.getElementById("done-btn").addEventListener("click", e => {
    state.done[s.id] = !state.done[s.id]; saveState();
    e.target.classList.toggle("is-done", !!state.done[s.id]);
    e.target.textContent = state.done[s.id] ? "✓ できた" : "できたら押す";
  });
}

function viewSwitch() {
  app.innerHTML = `
    <div class="crumb"><a href="#/">ホーム</a> › 乗り換え</div>
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
        <a class="btn" href="#/genkan">玄関に戻る</a>
        <button class="ghost" id="reset-route">章の選択だけリセット</button>
        <button class="ghost" id="reset-all">最初からやり直す（この端末の記録を消す）</button>
      </div>
    </div>
  `;
  document.getElementById("reset-route").addEventListener("click", () => {
    state.route = ""; saveState(); location.hash = "#/genkan";
  });
  document.getElementById("reset-all").addEventListener("click", () => {
    if (confirm("この端末に保存した種候補・問い・チェックを消します。提出済みのログは消えません。いい？")) {
      state = { seed: "", question: "", route: "", done: {} }; saveState(); location.hash = "#/";
    }
  });
}

function viewAboutLog() {
  app.innerHTML = `
    <div class="crumb"><a href="#/">ホーム</a> › ログとは</div>
    <h1>📓 思考ログについて</h1>
    <div class="card">
      <h3>なぜ書くのか</h3>
      <p>探究の評価は、結果だけでなく「どう考え、どう判断したか」で行われる。ログはその証拠であり、君自身の思考の鏡であり、大学入試（総合型選抜）の面接で語る材料にもなる。</p>
      <p><b>きれいなログより、迷い・撤回・方向転換が残っているログの方が価値が高い。</b>本物の思考の跡は汚れている。</p>
    </div>
    <div class="card">
      <h3>誰が読むのか（大事）</h3>
      <ul>
        <li>ログを読めるのは<b>先生だけ</b>。他の生徒からは見えない。</li>
        <li>このアプリは君の書いたものを保存・送信しない。ログはフォームから先生のシートへ直接届く。</li>
        <li>本名以外の個人情報（住所・アカウント名）や、他人の本名は書かない。人は「部活の先輩」のような呼び方で。</li>
      </ul>
    </div>
    <div class="card">
      <h3>いつ書くのか</h3>
      <ul>
        <li>AI壁打ちをした回：最後に出る下書きの【現在の判断と理由】だけ自分で書いて提出。</li>
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
  if (h === "#/" || h === "") return viewHome();
  if (parts[0] === "genkan") return viewGenkan();
  if (parts[0] === "route" && parts[1]) return viewRoute(parts[1]);
  if (parts[0] === "step" && parts[1] && parts[2]) return viewStep(parts[1], parts[2]);
  if (parts[0] === "switch") return viewSwitch();
  if (parts[0] === "about-log") return viewAboutLog();
  viewHome();
}
window.addEventListener("hashchange", render);
render();
