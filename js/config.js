// ============================================================
// せかいラボ・ナビ 設定ファイル（教員が編集するのはこのファイルだけ）
// ============================================================
// 思考ログ用Googleフォームを作ったら、下の2つを書き換えてください。
//
// 1) LOG_FORM_URL:
//    フォームの「送信」→リンク→URLの末尾が /viewform のもの。
//    未設定（空文字）の間は、アプリは「ログをコピーしてフォームに貼る」案内を出します。
//
// 2) LOG_ENTRY_CARD:
//    「章とカード」質問の事前入力ID。
//    フォーム編集画面 → その他（︙）→「事前入力したURLを取得」→
//    「章とカード」に何か入力してURLを発行 → URL中の entry.XXXXXXX の部分。
//    例: "entry.1234567"
// ============================================================

const CONFIG = {
  LOG_FORM_URL: "",      // 例: "https://docs.google.com/forms/d/e/1FAIpQL.../viewform"
  LOG_ENTRY_CARD: "",    // 例: "entry.1234567"

  // 生徒が使うAIの名前（画面の案内文に表示されます）
  APPROVED_AI: "Gemini（学校のGoogleアカウントでログインして使う）",

  // ============================================================
  // Gemリンク（任意・推奨）
  // GeminiのGemに各プロンプトを仕込み、共有リンクをここに貼ると、
  // 壁打ち画面に「Geminiで開く」ボタンが出ます（コピペ不要になる）。
  // 作り方: gemini.google.com → 左メニュー「Gem」→「Gemを作成」→
  //   「指示」欄に data/prompts.js の該当プロンプト全文を貼る → 保存 →
  //   共有（学校ドメイン内のみ）→ リンクをコピー → 下に貼る。
  // キーはプロンプトID（tane, toi, emp_rq, emp_design, emp_analysis, emp_paper,
  //   con_mitate, con_yomikomi, con_paper, act_mitate, act_furikaeri, act_report,
  //   cre_nerai, cre_hannou, cre_doc）。
  // 未設定のプロンプトは自動でコピペ方式になります。
  // ============================================================
  GEM_LINKS: {
    // 例: tane: "https://gemini.google.com/gem/xxxxxxxx",
  },
};
