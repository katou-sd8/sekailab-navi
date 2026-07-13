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
  LOG_FORM_URL: "https://docs.google.com/forms/d/e/1FAIpQLSeepvoNUG4C04APpVmVRSUf7bCDhfPBtv9y-4xvK-hyghyWXQ/viewform",
  LOG_ENTRY_CARD: "entry.582764719",
  LOG_ENTRY_TEXT: "entry.2002175275",
  // ↑この2つが揃うと、アプリの「📤 提出する」ボタンが有効になり、
  //   生徒が書いたログが自動で入った状態でフォームが開く（生徒は送信を押すだけ）。
  //   同時にマイログにも自動保存されるので、二度書きは発生しない。

  // 生徒が使うAIの名前（画面の案内文に表示されます）
  APPROVED_AI: "Gemini（学校のGoogleアカウントでログインして使う）",

  // ============================================================
  // マニュアル（スライド）へのリンク
  // Googleスライド等のURLを貼ると、各画面に「📖 マニュアルを開く」ボタンが出ます。
  // 空文字のままならボタンは表示されません。
  // ============================================================
  MANUAL_LINKS: {
    start: "https://docs.google.com/presentation/d/1UTJ6SJyXeyPdHQMtHzvV2opYqqUvgT6uxiCsmAv-GvA/edit",  // せかいラボ マニュアル β版
    emp: "https://docs.google.com/presentation/d/1_-L5XZqf9ZMBZ7aesomD9BOjrL1BB6_A8CmwQ37btgs/edit",    // Ch4 実証研究 生徒用スライド
    con: "https://docs.google.com/presentation/d/18qtX0acYiPSeGi2nkP2MY5_KOCgDc4qO_xlfKRdPwMg/edit",    // Ch5 構成研究 生徒用スライド
    act: "https://docs.google.com/presentation/d/1bR6TNyYyQHQwfi7e-1ANUp-NgWYOAWpUj2iaGUbL9nM/edit",    // Ch6 行動 生徒用スライド
    cre: "https://docs.google.com/presentation/d/1c461QkOCBWnfobJ1wdxtxmZrcyPqupKVnCWbenJUNzg/edit",    // Ch7 創作 生徒用スライド
  },

  // ルート別ワークブック（Googleスプレッドシート）
  WORKBOOK_LINKS: {
    emp: "https://docs.google.com/spreadsheets/d/181UWoGo2IlvLRzt1YNmEsikwqwQNl8AcF2LoZHOO29c/edit",    // Ch4 実証研究 ワークブック
    con: "https://docs.google.com/spreadsheets/d/1HDxSZ3PQkgEzb8of8lBhKeJ5nqvoDiLAHu74Rpt2Ymk/edit",    // Ch5 構成研究 ワークブック
    act: "https://docs.google.com/spreadsheets/d/1YAP9cxrAci4ghQstOi93_tC4Ky3uw3cVcVksrREwXpQ/edit",    // Ch6 行動 ワークブック
    cre: "https://docs.google.com/spreadsheets/d/1dRgONPRkAnuf9vgfVEedwOgCtBT7R_9B3iXuU-vqJHI/edit",    // Ch7 創作 ワークブック
  },

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
