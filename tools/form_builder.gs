// ============================================================
// せかいラボ 思考ログフォーム自動作成スクリプト
//
// 使い方（1回だけ・約2分）:
// 1. script.google.com を開く（学校のGoogleアカウント）
// 2. 「新しいプロジェクト」→ このファイルの中身を全部貼り付け
// 3. 上の関数選択で buildSekaiLabLogForm を選んで「実行」
// 4. 初回は承認を求められる →「許可」
// 5. 下の「実行ログ」に出る3行を config.js に書き写す（またはそのまま担当者へ渡す）
//
// できるもの:
// - Googleフォーム「せかいラボ 思考ログ」（質問2つ: 章とカード／ログ本文）
// - 回答が自動でたまるスプレッドシート「せかいラボ 思考ログ（回答）」
// どちらも実行した人のマイドライブに作られる。閲覧権限は作った本人（教員）のみ。
// ============================================================

function buildSekaiLabLogForm() {
  // フォーム本体
  const form = FormApp.create('せかいラボ 思考ログ');
  form.setDescription(
    '探究の節目で、自分の判断とその理由を記録するフォーム。\n' +
    '読めるのは先生だけ（他の生徒には見えません）。\n' +
    'ナビの「提出する」ボタンから開くと、内容は自動で入っています。送信を押すだけ。'
  );
  form.setCollectEmail(true); // 誰のログか分かるように（学校アカウントのメールを自動記録）

  const q1 = form.addTextItem().setTitle('章とカード').setRequired(true);
  q1.setHelpText('ナビから開いた場合は自動で入っています');
  const q2 = form.addParagraphTextItem().setTitle('ログ本文').setRequired(true);
  q2.setHelpText('ナビで書いた内容が自動で入っています。確認して送信');

  // 回答の保存先スプレッドシート
  const ss = SpreadsheetApp.create('せかいラボ 思考ログ（回答）');
  form.setDestination(FormApp.DestinationType.SPREADSHEET, ss.getId());

  // 事前入力ID（entry.XXXX）を自動で取り出す
  const resp = form.createResponse()
    .withItemResponse(q1.createResponse('DUMMY_CARD'))
    .withItemResponse(q2.createResponse('DUMMY_TEXT'));
  const prefillUrl = resp.toPrefilledUrl();
  const ids = prefillUrl.match(/entry\.\d+/g) || [];

  Logger.log('================================================');
  Logger.log('↓↓ この3行を webapp/js/config.js に書き写す ↓↓');
  Logger.log('LOG_FORM_URL: "' + form.getPublishedUrl() + '",');
  Logger.log('LOG_ENTRY_CARD: "' + ids[0] + '",');
  Logger.log('LOG_ENTRY_TEXT: "' + ids[1] + '",');
  Logger.log('================================================');
  Logger.log('回答スプレッドシート: ' + ss.getUrl());
  Logger.log('フォーム編集画面: ' + form.getEditUrl());
  Logger.log('※おすすめ: フォーム編集画面の設定⚙で「回答のコピーを回答者に送信: 常に表示」をONにすると、生徒にも控えのメールが届く');
}
