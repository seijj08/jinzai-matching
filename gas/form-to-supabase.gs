/**
 * YSタレント求人登録フォーム → Supabase(gm_cands) 自動連携
 * =========================================================
 * 機能:
 *  1. setup() を実行すると:
 *     - 既存フォーム(インドネシア語版)の先頭に「国籍」質問を追加
 *     - 「希望月給」「夜勤(可/不可/要相談)」質問を追加
 *     - ミャンマー語版・ベトナム語版フォームを自動作成(同じ質問構成)
 *     - 3フォームすべてに回答送信トリガーを設定
 *     ※何度実行しても質問・フォーム・トリガーは重複しません(再実行OK)
 *  2. 以後、誰かがフォームに回答すると onFormSubmit() が動き、
 *     マッチング管理アプリの人材プール(Supabase gm_cands)に自動登録される
 *
 * セットアップ手順:
 *  1. https://script.google.com で「新しいプロジェクト」を作成
 *     (既存フォームの編集権限があるGoogleアカウントで!)
 *  2. このファイルの中身を全部貼り付ける
 *  3. 下の CONFIG の SB_EMAIL / SB_PASSWORD をアプリのログイン情報に書き換える
 *  4. testSupabaseConnection() を実行 → ログに「接続OK」が出ることを確認
 *  5. setup() を実行(権限承認が出るので許可する)
 *  6. ログに表示される各言語版のURLを控える
 */

// ===== CONFIG =====
var CONFIG = {
  // 既存のインドネシア語版フォームID
  FORM_ID_INDONESIA: "1KDRCugBoVNby5riRw16TkHu9iGj01Arhk0xLIKVL2SA",
  // Supabase(マッチング管理アプリと同じ)
  SUPABASE_URL: "https://yfqzmmiughpenrvuaymm.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_MHOfAdgTIU8ITDkpSbPFeA_aJchLFOn",
  // ★マッチング管理アプリのログイン情報に書き換えてください★
  SB_EMAIL: "ここにアプリのログインメールアドレス",
  SB_PASSWORD: "ここにアプリのログインパスワード"
};

// =====================================================================
// 翻訳データ(質問タイトル内の日本語キーワードで対応付け。並び順に依存しない)
// =====================================================================
var TRANSLATIONS = {
  id: {
    formName: null, // 既存フォームの名前は変えない
    desc: null,
    byKey: {
      nationality: { title: "Kewarganegaraan（国籍）", choices: ["Indonesia（インドネシア）", "Myanmar（ミャンマー）", "Vietnam（ベトナム）", "Lainnya（その他）"] },
      salary: { title: "Gaji Bulanan yang Diinginkan (Yen)（希望月給）", help: "Contoh: 250000 / 25万" },
      night: { title: "Kerja Shift Malam（夜勤）", choices: ["Bisa（可）", "Tidak bisa（不可）", "Perlu konsultasi（要相談）"] }
    }
  },
  my: {
    formName: "YSタレント求人登録（ミャンマー語版）",
    desc: "【YS TALENT】ဂျပန်နိုင်ငံ အလုပ်အကိုင် လျှောက်လွှာဖောင်",
    byKey: {
      nationality: { title: "နိုင်ငံသား（国籍）", choices: ["မြန်မာ（ミャンマー）", "အင်ဒိုနီးရှား（インドネシア）", "ဗီယက်နမ်（ベトナム）", "အခြား（その他）"] },
      name: "အမည်အပြည့်အစုံ（フルネーム）",
      kana: "အမည် (Katakana ဖြင့်)（カタカナ）",
      phoneWA: "ဖုန်းနံပါတ် (Viber/WhatsApp)（携帯番号）",
      phoneJP: "ဂျပန်ဖုန်းနံပါတ်（日本の番号）",
      gender: { title: "ကျား/မ（性別）", choices: ["ကျား（男性）", "မ（女性）"] },
      domisili: { title: "လက်ရှိနေထိုင်ရာနိုင်ငံ（住んでいます）", choices: ["ဂျပန်（日本）", "မြန်မာ（ミャンマー）"] },
      address: "လက်ရှိနေရပ်လိပ်စာ（現住所）",
      currentJob: "လက်ရှိအလုပ်အကိုင်（就職）",
      company: "လက်ရှိအလုပ်လုပ်နေသော ကုမ္ပဏီအမည် (မရှိပါက「မရှိ」ဟုရေးပါ)（会社名）",
      arrival: "ဂျပန်နိုင်ငံသို့ ပထမဆုံးရောက်ရှိသည့်နေ့（来日）",
      visa: "ဗီဇာအမျိုးအစား（在留資格）",
      quals: "ရရှိထားသော အောင်လက်မှတ်များ（習得資格）",
      jp: "ဂျပန်ဘာသာစွမ်းရည် အောင်လက်မှတ်（日本語資格）",
      field: "လုပ်ကိုင်လိုသော အလုပ်အကိုင်နယ်ပယ်（就職希望）",
      desiredLoc: "အလုပ်လုပ်လိုသော ဒေသ（地域希望）",
      salary: { title: "လိုချင်သော လစာ (ယန်း)（希望月給）", help: "ဥပမာ: 250000 / 25万" },
      night: { title: "ညဆိုင်းအလုပ်（夜勤）", choices: ["ရနိုင်ပါသည်（可）", "မရနိုင်ပါ（不可）", "ဆွေးနွေးလိုပါသည်（要相談）"] },
      visaRemain: "Tokutei Ginou ကျန်ရှိသက်တမ်း（残り在留期限）",
      visaExpiry: "Zairyuu Card သက်တမ်း（在留期限）",
      jobCode: "အလုပ်ကုဒ်နံပါတ်（求人コード）"
    }
  },
  vi: {
    formName: "YSタレント求人登録（ベトナム語版）",
    desc: "【YS TALENT】Phiếu đăng ký việc làm tại Nhật Bản",
    byKey: {
      nationality: { title: "Quốc tịch（国籍）", choices: ["Việt Nam（ベトナム）", "Indonesia（インドネシア）", "Myanmar（ミャンマー）", "Khác（その他）"] },
      name: "Họ và tên（フルネーム）",
      kana: "Họ và tên bằng Katakana（カタカナ）",
      phoneWA: "Số điện thoại (Zalo/WhatsApp)（携帯番号）",
      phoneJP: "Số điện thoại tại Nhật（日本の番号）",
      gender: { title: "Giới tính（性別）", choices: ["Nam（男性）", "Nữ（女性）"] },
      domisili: { title: "Nơi ở hiện tại（住んでいます）", choices: ["Nhật Bản（日本）", "Việt Nam（ベトナム）"] },
      address: "Địa chỉ hiện tại（現住所）",
      currentJob: "Công việc hiện tại（就職）",
      company: "Tên công ty đang làm việc (Nếu không có, ghi \"không có\")（会社名）",
      arrival: "Lần đầu đến Nhật（来日）",
      visa: "Loại visa（在留資格）",
      quals: "Chứng chỉ đang có（習得資格）",
      jp: "Chứng chỉ năng lực tiếng Nhật（日本語資格）",
      field: "Ngành nghề mong muốn（就職希望）",
      desiredLoc: "Khu vực mong muốn（地域希望）",
      salary: { title: "Mức lương tháng mong muốn (Yên)（希望月給）", help: "Ví dụ: 250000 / 25万" },
      night: { title: "Làm ca đêm（夜勤）", choices: ["Có thể（可）", "Không thể（不可）", "Cần trao đổi（要相談）"] },
      visaRemain: "Thời hạn còn lại của Tokutei Ginou（残り在留期限）",
      visaExpiry: "Thời hạn thẻ lưu trú（在留期限）",
      jobCode: "Mã công việc（求人コード）"
    }
  }
};

// =====================================================================
// セットアップ(何度実行してもOK)
// =====================================================================
function setup() {
  // 1) インドネシア語版: 国籍質問(先頭)+希望月給+夜勤を追加
  var src = FormApp.openById(CONFIG.FORM_ID_INDONESIA);
  ensureNationality_(src, "id");
  ensureExtraQuestions_(src, "id");
  Logger.log("✅ インドネシア語版の質問を更新しました");

  // 2) ミャンマー語版・ベトナム語版を作成(既にあれば再利用)+ 翻訳 + 質問追加
  var myId = ensureTranslatedCopy_("my");
  var viId = ensureTranslatedCopy_("vi");

  // 3) 回答送信トリガーを3フォームに設定(重複防止)
  [CONFIG.FORM_ID_INDONESIA, myId, viId].forEach(ensureTrigger_);

  Logger.log("========================================");
  Logger.log("🎉 セットアップ完了！ 回答者用URL:");
  Logger.log("インドネシア語版: " + src.getPublishedUrl());
  Logger.log("ミャンマー語版:   " + FormApp.openById(myId).getPublishedUrl());
  Logger.log("ベトナム語版:     " + FormApp.openById(viId).getPublishedUrl());
  Logger.log("========================================");
}

// 国籍質問を先頭に追加(既にあれば何もしない)
function ensureNationality_(form, lang) {
  var def = TRANSLATIONS[lang].byKey.nationality;
  var exists = form.getItems().some(function (it) { return it.getTitle().indexOf("国籍") >= 0; });
  if (exists) return;
  var item = form.addMultipleChoiceItem();
  item.setTitle(def.title).setChoiceValues(def.choices).setRequired(true);
  form.moveItem(item.getIndex(), 0);
}

// 希望月給・夜勤の質問を追加(既にあれば何もしない)。地域希望の直後に配置
function ensureExtraQuestions_(form, lang) {
  var t = TRANSLATIONS[lang].byKey;
  var titles = form.getItems().map(function (it) { return it.getTitle(); });
  var hasSalary = titles.some(function (s) { return s.indexOf("希望月給") >= 0; });
  var hasNight = titles.some(function (s) { return s.indexOf("夜勤") >= 0; });

  // 挿入位置 = 「地域希望」質問の直後(見つからなければ末尾)
  function posAfterLoc() {
    var items = form.getItems();
    for (var i = 0; i < items.length; i++) {
      if (items[i].getTitle().indexOf("地域希望") >= 0) return items[i].getIndex() + 1;
    }
    return items.length - 1;
  }

  if (!hasSalary) {
    var s = form.addTextItem();
    s.setTitle(t.salary.title).setHelpText(t.salary.help);
    form.moveItem(s.getIndex(), posAfterLoc());
  }
  if (!hasNight) {
    var n = form.addMultipleChoiceItem();
    n.setTitle(t.night.title).setChoiceValues(t.night.choices);
    // 希望月給の直後に配置
    var items = form.getItems(), pos = posAfterLoc();
    for (var i = 0; i < items.length; i++) {
      if (items[i].getTitle().indexOf("希望月給") >= 0) { pos = items[i].getIndex() + 1; break; }
    }
    form.moveItem(n.getIndex(), pos);
  }
}

// 翻訳版フォームを作成(既にあれば再利用)し、タイトル・選択肢を翻訳、質問を追加
function ensureTranslatedCopy_(lang) {
  var t = TRANSLATIONS[lang];
  var props = PropertiesService.getScriptProperties();
  var propKey = lang === "my" ? "FORM_MY" : "FORM_VI";
  var form = null;

  var existing = props.getProperty(propKey);
  if (existing) {
    try { form = FormApp.openById(existing); } catch (e) { form = null; }
  }
  if (!form) {
    var copy = DriveApp.getFileById(CONFIG.FORM_ID_INDONESIA).makeCopy(t.formName);
    form = FormApp.openById(copy.getId());
    props.setProperty(propKey, form.getId());
    Logger.log("✅ " + t.formName + " を新規作成しました");
  } else {
    Logger.log(t.formName + " は作成済み → 質問を更新します");
  }

  form.setTitle(t.formName);
  form.setDescription(t.desc);

  // 各質問を日本語キーワードで判定して翻訳(並び順に依存しない)
  form.getItems().forEach(function (item) {
    var key = detectKey_(item.getTitle());
    if (!key || !t.byKey[key]) return;
    var def = t.byKey[key];
    if (typeof def === "string") {
      item.setTitle(def);
    } else {
      item.setTitle(def.title);
      if (def.help) item.setHelpText(def.help);
      if (def.choices && item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
        item.asMultipleChoiceItem().setChoiceValues(def.choices);
      }
    }
  });

  // 国籍・希望月給・夜勤がまだ無ければ追加
  ensureNationality_(form, lang);
  ensureExtraQuestions_(form, lang);
  return form.getId();
}

// トリガー設定(重複防止)
function ensureTrigger_(formId) {
  var exists = ScriptApp.getProjectTriggers().some(function (tr) {
    return tr.getHandlerFunction() === "onFormSubmit" && tr.getTriggerSourceId() === formId;
  });
  if (!exists) {
    ScriptApp.newTrigger("onFormSubmit").forForm(formId).onFormSubmit().create();
    Logger.log("トリガー設定: " + formId);
  }
}

// =====================================================================
// 回答送信時の処理
// =====================================================================
function onFormSubmit(e) {
  try {
    var responses = e.response.getItemResponses();
    var a = {};   // フィールドキー → 回答
    responses.forEach(function (ir) {
      var key = detectKey_(ir.getItem().getTitle());
      if (key) a[key] = ir.getResponse();
    });

    var cand = buildCandidate_(a, e.source.getTitle());
    insertToSupabase_(cand);
    Logger.log("✅ 人材プールに登録: " + cand.name);
  } catch (err) {
    Logger.log("❌ エラー: " + err + "\n" + (err.stack || ""));
    throw err; // 失敗として記録させる(Apps Scriptのエラー通知メールが飛ぶ)
  }
}

// 質問タイトル(日本語部分)からフィールドを判定
function detectKey_(title) {
  if (title.indexOf("国籍") >= 0) return "nationality";
  if (title.indexOf("フルネーム") >= 0) return "name";
  if (title.indexOf("カタカナ") >= 0) return "kana";
  if (title.indexOf("日本の番号") >= 0) return "phoneJP";
  if (title.indexOf("携帯番号") >= 0) return "phoneWA";
  if (title.indexOf("性別") >= 0) return "gender";
  if (title.indexOf("住んでいます") >= 0) return "domisili";
  if (title.indexOf("現住所") >= 0) return "address";
  if (title.indexOf("希望月給") >= 0) return "salary";
  if (title.indexOf("夜勤") >= 0) return "night";
  if (title.indexOf("就職希望") >= 0) return "field";      // 「就職」より先に判定
  if (title.indexOf("就職") >= 0) return "currentJob";
  if (title.indexOf("会社名") >= 0) return "company";
  if (title.indexOf("来日") >= 0) return "arrival";
  if (title.indexOf("在留資格") >= 0) return "visa";
  if (title.indexOf("習得資格") >= 0) return "quals";
  if (title.indexOf("日本語資格") >= 0) return "jp";
  if (title.indexOf("地域希望") >= 0) return "desiredLoc";
  if (title.indexOf("残り在留期限") >= 0) return "visaRemain"; // 「在留期限」より先に判定
  if (title.indexOf("在留期限") >= 0) return "visaExpiry";
  if (title.indexOf("求人コード") >= 0) return "jobCode";
  return null;
}

// アプリの人材データ形式に変換
function buildCandidate_(a, formTitle) {
  var memo = [];
  function addMemo(label, v) {
    if (v && String(v).trim()) memo.push(label + ": " + (Array.isArray(v) ? v.join("、") : v));
  }
  addMemo("📋 応募フォーム", formTitle);
  addMemo("WhatsApp/現地携帯", a.phoneWA);
  addMemo("居住地", a.domisili);
  addMemo("現住所", a.address);
  addMemo("現在の仕事", a.currentJob);
  addMemo("会社名", a.company);
  addMemo("来日時期", a.arrival);
  addMemo("在留資格(原文)", a.visa);
  addMemo("保有資格(原文)", a.quals);
  addMemo("日本語資格(原文)", a.jp);
  addMemo("就職希望分野", a.field);
  addMemo("希望月給(原文)", a.salary);
  addMemo("残り在留期限", a.visaRemain);
  addMemo("求人コード", a.jobCode);

  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
    name: String(a.name || "(氏名未入力)"),
    kana: String(a.kana || ""),
    nationality: mapNationality_(a.nationality),
    birth: "",
    gender: mapGender_(a.gender),
    visa: mapVisa_(a.visa),
    visaExpiry: String(a.visaExpiry || ""),
    jpLevel: mapJpLevel_(a.jp),
    quals: mapQuals_(a.quals),
    expYears: "",
    desiredLoc: String(a.desiredLoc || ""),
    desiredSalary: parseSalary_(a.salary),
    night: mapNight_(a.night),
    phone: String(a.phoneJP || a.phoneWA || ""),
    email: "",
    status: "未マッチ",
    sourceJob: "",
    memo: memo.join("\n"),
    createdAt: new Date().toISOString()
  };
}

function mapNationality_(v) {
  if (!v) return "";
  v = String(v);
  if (v.indexOf("インドネシア") >= 0 || v.indexOf("Indonesia") >= 0) return "インドネシア";
  if (v.indexOf("ミャンマー") >= 0 || v.indexOf("Myanmar") >= 0) return "ミャンマー";
  if (v.indexOf("ベトナム") >= 0 || v.indexOf("Việt Nam") >= 0 || v.indexOf("Vietnam") >= 0) return "ベトナム";
  return v; // その他は原文のまま
}

function mapGender_(v) {
  if (!v) return "";
  v = String(v);
  if (v.indexOf("男性") >= 0 || v.indexOf("Laki") >= 0) return "男性";
  if (v.indexOf("女性") >= 0 || v.indexOf("Perempuan") >= 0) return "女性";
  return "";
}

function mapVisa_(v) {
  if (!v) return "";
  v = String(v);
  if (v.indexOf("技能実習") >= 0) return "技能実習";
  if (v.indexOf("特定技能1") >= 0 || v.indexOf("特定技能１") >= 0) return "特定技能1号";
  if (v.indexOf("特定技能2") >= 0 || v.indexOf("特定技能２") >= 0) return "特定技能2号";
  if (v.indexOf("特定活動") >= 0) return "特定活動";
  if (v.indexOf("留学") >= 0) return "留学";
  return "その他"; // 不明なもの(原文はメモに残る)
}

function mapJpLevel_(arr) {
  if (!arr) return "";
  var s = Array.isArray(arr) ? arr.join(",") : String(arr);
  var levels = ["N1", "N2", "N3", "N4", "N5"];
  for (var i = 0; i < levels.length; i++) {
    if (s.indexOf(levels[i]) >= 0) return levels[i]; // 最上位を採用
  }
  if (s.indexOf("JFT") >= 0) return "JFT-Basic"; // JLPT未取得でJFT合格の場合(N4相当)
  return "";
}

// フォームの資格選択肢 → アプリの資格名(前方一致ではなく含有判定、上から順に評価)
var QUAL_MAP = [
  ["介護技能実習評価試験", "介護技能実習評価試験"],
  ["食品製造技能実習評価試験", "食品製造技能実習評価試験"],
  ["機械加工技能実習評価試験", "機械加工技能実習評価試験"],
  ["溶接技能実習評価試験", "溶接技能実習評価試験"],
  ["建設技能実習評価試験", "建設技能実習評価試験"],
  ["専門級（介護）", "専門級(介護)"],
  ["専門級（食品製造）", "専門級(食品製造)"],
  ["専門級（プラスチック成形）", "専門級(プラスチック成形)"],
  ["専門級（溶接）", "専門級(溶接)"],
  ["初任者研修", "初任者研修"],
  ["実務者研修", "実務者研修"],
  ["介護福祉士", "介護福祉士"],
  ["認知症", "認知症介護基礎研修"],
  ["飲食料品製造", "飲食料品製造業"],
  ["工業製品製造", "工業製品製造業"],
  ["外食", "外食業"]
];

function mapQuals_(arr) {
  if (!arr) return [];
  var list = Array.isArray(arr) ? arr : [String(arr)];
  var out = [];
  list.forEach(function (v) {
    for (var i = 0; i < QUAL_MAP.length; i++) {
      if (v.indexOf(QUAL_MAP[i][0]) >= 0) { push_(out, QUAL_MAP[i][1]); return; }
    }
    push_(out, "その他資格"); // どれにも該当しないもの(原文はメモに残る)
  });
  return out;
}
function push_(arr, v) { if (arr.indexOf(v) < 0) arr.push(v); }

// 希望月給の回答を「万円」の数値に変換
// 例: "250000"→25 / "25万"→25 / "25"→25 / "¥230,000"→23
function parseSalary_(v) {
  if (!v) return null;
  // 全角数字→半角
  var s = String(v).replace(/[０-９]/g, function (c) { return String.fromCharCode(c.charCodeAt(0) - 0xFEE0); });
  var m = s.replace(/[,，¥￥\s]/g, "").match(/\d+(\.\d+)?/);
  if (!m) return null;
  var n = parseFloat(m[0]);
  if (s.indexOf("万") >= 0) return Math.round(n);   // 「25万」表記
  if (n >= 1000) return Math.round(n / 10000);      // 円表記(250000など)
  return Math.round(n);                              // 万円表記(25など)
}

// 夜勤の回答をアプリの選択肢(可/不可/応相談)に変換
function mapNight_(v) {
  if (!v) return "応相談";
  v = String(v);
  if (v.indexOf("不可") >= 0) return "不可";
  if (v.indexOf("要相談") >= 0 || v.indexOf("相談") >= 0) return "応相談";
  if (v.indexOf("可") >= 0) return "可";
  return "応相談";
}

// =====================================================================
// Supabase 連携
// =====================================================================
function getSbToken_() {
  var res = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + "/auth/v1/token?grant_type=password", {
    method: "post",
    contentType: "application/json",
    headers: { apikey: CONFIG.SUPABASE_ANON_KEY },
    payload: JSON.stringify({ email: CONFIG.SB_EMAIL, password: CONFIG.SB_PASSWORD }),
    muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) {
    throw new Error("Supabaseログイン失敗(" + res.getResponseCode() + "): " + res.getContentText());
  }
  return JSON.parse(res.getContentText()).access_token;
}

function insertToSupabase_(cand) {
  var token = getSbToken_();
  var res = UrlFetchApp.fetch(CONFIG.SUPABASE_URL + "/rest/v1/gm_cands", {
    method: "post",
    contentType: "application/json",
    headers: {
      apikey: CONFIG.SUPABASE_ANON_KEY,
      Authorization: "Bearer " + token,
      Prefer: "return=minimal"
    },
    payload: JSON.stringify({ id: cand.id, data: cand, updated_at: new Date().toISOString() }),
    muteHttpExceptions: true
  });
  var code = res.getResponseCode();
  if (code !== 201 && code !== 200) {
    throw new Error("Supabase登録失敗(" + code + "): " + res.getContentText());
  }
}

// 接続テスト(セットアップ前に実行推奨)
function testSupabaseConnection() {
  var token = getSbToken_();
  Logger.log("✅ 接続OK(ログイン成功)。token: " + token.slice(0, 20) + "...");
}
