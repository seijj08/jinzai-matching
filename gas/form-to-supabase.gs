/**
 * YSタレント求人登録フォーム → Supabase(gm_cands) 自動連携
 * =========================================================
 * 機能:
 *  1. setup() を1回実行すると:
 *     - 既存フォーム(インドネシア語版)の先頭に「国籍」質問を追加
 *     - ミャンマー語版・ベトナム語版フォームを自動作成(国籍質問付き)
 *     - 3フォームすべてに回答送信トリガーを設定
 *  2. 以後、誰かがフォームに回答すると onFormSubmit() が動き、
 *     マッチング管理アプリの人材プール(Supabase gm_cands)に自動登録される
 *
 * セットアップ手順:
 *  1. https://script.google.com で「新しいプロジェクト」を作成
 *  2. このファイルの中身を全部貼り付ける
 *  3. 下の CONFIG の SB_EMAIL / SB_PASSWORD をアプリのログイン情報に書き換える
 *  4. testSupabaseConnection() を実行 → ログに「接続OK」が出ることを確認
 *  5. setup() を実行(権限承認が2回ほど出るので許可する)
 *  6. ログに表示されるミャンマー語版・ベトナム語版のURLを控える
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

// ===== 翻訳データ =====
// 国籍質問(各言語版の先頭に追加)
var NATIONALITY_Q = {
  id: { title: "Kewarganegaraan（国籍）", choices: ["Indonesia（インドネシア）", "Myanmar（ミャンマー）", "Vietnam（ベトナム）", "Lainnya（その他）"] },
  my: { title: "နိုင်ငံသား（国籍）", choices: ["မြန်မာ（ミャンマー）", "အင်ဒိုနီးရှား（インドネシア）", "ဗီယက်နမ်（ベトナム）", "အခြား（その他）"] },
  vi: { title: "Quốc tịch（国籍）", choices: ["Việt Nam（ベトナム）", "Indonesia（インドネシア）", "Myanmar（ミャンマー）", "Khác（その他）"] }
};

// 既存18問の翻訳(フォーム内の並び順どおり)。国籍質問追加後は index 1〜18 になる
var TRANSLATIONS = {
  my: {
    desc: "【YS TALENT】ဂျပန်နိုင်ငံ အလုပ်အကိုင် လျှောက်လွှာဖောင်",
    titles: [
      "အမည်အပြည့်အစုံ（フルネーム）",
      "အမည် (Katakana ဖြင့်)（カタカナ）",
      "ဖုန်းနံပါတ် (Viber/WhatsApp)（携帯番号）",
      "ဂျပန်ဖုန်းနံပါတ်（日本の番号）",
      "ကျား/မ（性別）",
      "လက်ရှိနေထိုင်ရာနိုင်ငံ（住んでいます）",
      "လက်ရှိနေရပ်လိပ်စာ（現住所）",
      "လက်ရှိအလုပ်အကိုင်（就職）",
      "လက်ရှိအလုပ်လုပ်နေသော ကုမ္ပဏီအမည် (မရှိပါက「မရှိ」ဟုရေးပါ)（会社名）",
      "ဂျပန်နိုင်ငံသို့ ပထမဆုံးရောက်ရှိသည့်နေ့（来日）",
      "ဗီဇာအမျိုးအစား（在留資格）",
      "ရရှိထားသော အောင်လက်မှတ်များ（習得資格）",
      "ဂျပန်ဘာသာစွမ်းရည် အောင်လက်မှတ်（日本語資格）",
      "လုပ်ကိုင်လိုသော အလုပ်အကိုင်နယ်ပယ်（就職希望）",
      "အလုပ်လုပ်လိုသော ဒေသ（地域希望）",
      "Tokutei Ginou ကျန်ရှိသက်တမ်း（残り在留期限）",
      "Zairyuu Card သက်တမ်း（在留期限）",
      "အလုပ်ကုဒ်နံပါတ်（求人コード）"
    ],
    gender: ["ကျား（男性）", "မ（女性）"],
    domisili: ["ဂျပန်（日本）", "မြန်မာ（ミャンマー）"],
    formName: "YSタレント求人登録（ミャンマー語版）"
  },
  vi: {
    desc: "【YS TALENT】Phiếu đăng ký việc làm tại Nhật Bản",
    titles: [
      "Họ và tên（フルネーム）",
      "Họ và tên bằng Katakana（カタカナ）",
      "Số điện thoại (Zalo/WhatsApp)（携帯番号）",
      "Số điện thoại tại Nhật（日本の番号）",
      "Giới tính（性別）",
      "Nơi ở hiện tại（住んでいます）",
      "Địa chỉ hiện tại（現住所）",
      "Công việc hiện tại（就職）",
      "Tên công ty đang làm việc (Nếu không có, ghi \"không có\")（会社名）",
      "Lần đầu đến Nhật（来日）",
      "Loại visa（在留資格）",
      "Chứng chỉ đang có（習得資格）",
      "Chứng chỉ năng lực tiếng Nhật（日本語資格）",
      "Ngành nghề mong muốn（就職希望）",
      "Khu vực mong muốn（地域希望）",
      "Thời hạn còn lại của Tokutei Ginou（残り在留期限）",
      "Thời hạn thẻ lưu trú（在留期限）",
      "Mã công việc（求人コード）"
    ],
    gender: ["Nam（男性）", "Nữ（女性）"],
    domisili: ["Nhật Bản（日本）", "Việt Nam（ベトナム）"],
    formName: "YSタレント求人登録（ベトナム語版）"
  }
};

// =====================================================================
// セットアップ(1回だけ実行)
// =====================================================================
function setup() {
  // 1) インドネシア語版の先頭に国籍質問を追加
  var src = FormApp.openById(CONFIG.FORM_ID_INDONESIA);
  addNationalityQuestion_(src, NATIONALITY_Q.id);
  Logger.log("✅ インドネシア語版に国籍質問を追加しました");

  // 2) ミャンマー語版・ベトナム語版を作成
  var myId = createTranslatedCopy_("my");
  var viId = createTranslatedCopy_("vi");

  // 3) 回答送信トリガーを3フォームに設定
  var props = PropertiesService.getScriptProperties();
  props.setProperty("FORM_MY", myId);
  props.setProperty("FORM_VI", viId);
  [CONFIG.FORM_ID_INDONESIA, myId, viId].forEach(function (fid) {
    ensureTrigger_(fid);
  });

  Logger.log("========================================");
  Logger.log("🎉 セットアップ完了！ 回答者用URL:");
  Logger.log("インドネシア語版: " + src.getPublishedUrl());
  Logger.log("ミャンマー語版:   " + FormApp.openById(myId).getPublishedUrl());
  Logger.log("ベトナム語版:     " + FormApp.openById(viId).getPublishedUrl());
  Logger.log("========================================");
}

// 国籍質問を先頭に追加(既にあれば何もしない)
function addNationalityQuestion_(form, def) {
  var exists = form.getItems().some(function (it) {
    return it.getTitle().indexOf("国籍") >= 0;
  });
  if (exists) { Logger.log("国籍質問は既に存在します: " + form.getTitle()); return; }
  var item = form.addMultipleChoiceItem();
  item.setTitle(def.title).setChoiceValues(def.choices).setRequired(true);
  form.moveItem(item.getIndex(), 0);
}

// 翻訳版フォームを作成
function createTranslatedCopy_(lang) {
  var t = TRANSLATIONS[lang];
  var props = PropertiesService.getScriptProperties();
  var existing = props.getProperty(lang === "my" ? "FORM_MY" : "FORM_VI");
  if (existing) {
    try { FormApp.openById(existing); Logger.log(t.formName + " は作成済みです"); return existing; } catch (e) {}
  }
  var copy = DriveApp.getFileById(CONFIG.FORM_ID_INDONESIA).makeCopy(t.formName);
  var form = FormApp.openById(copy.getId());
  form.setTitle(t.formName);
  form.setDescription(t.desc);

  var items = form.getItems();
  // 期待: 国籍(1) + 既存18問 = 19問
  if (items.length !== t.titles.length + 1) {
    Logger.log("⚠️ 質問数が想定(" + (t.titles.length + 1) + ")と異なります: " + items.length + "問。翻訳をスキップした質問がある可能性があります。");
  }
  // 先頭 = 国籍質問を翻訳
  var natDef = NATIONALITY_Q[lang];
  if (items.length > 0 && items[0].getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
    items[0].asMultipleChoiceItem().setTitle(natDef.title).setChoiceValues(natDef.choices);
  }
  // 2問目以降を翻訳
  for (var i = 1; i < items.length && i - 1 < t.titles.length; i++) {
    var item = items[i];
    var newTitle = t.titles[i - 1];
    item.setTitle(newTitle);
    // 性別・居住地は選択肢も翻訳
    if (newTitle.indexOf("性別") >= 0 && item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
      item.asMultipleChoiceItem().setChoiceValues(t.gender);
    }
    if (newTitle.indexOf("住んでいます") >= 0 && item.getType() === FormApp.ItemType.MULTIPLE_CHOICE) {
      item.asMultipleChoiceItem().setChoiceValues(t.domisili);
    }
  }
  Logger.log("✅ " + t.formName + " を作成しました");
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
    var a = {};   // 日本語キーワード → 回答
    responses.forEach(function (ir) {
      var title = ir.getItem().getTitle();
      var val = ir.getResponse();
      var key = detectKey_(title);
      if (key) a[key] = val;
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
    desiredSalary: null,
    night: "応相談",
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
  if (v.indexOf("留学") >= 0) return "留学";
  return "その他"; // 特定活動など(原文はメモに残る)
}

function mapJpLevel_(arr) {
  if (!arr) return "";
  var s = Array.isArray(arr) ? arr.join(",") : String(arr);
  var levels = ["N1", "N2", "N3", "N4", "N5"];
  for (var i = 0; i < levels.length; i++) {
    if (s.indexOf(levels[i]) >= 0) return levels[i]; // 最上位を採用
  }
  return "";
}

function mapQuals_(arr) {
  if (!arr) return [];
  var list = Array.isArray(arr) ? arr : [String(arr)];
  var out = [];
  list.forEach(function (v) {
    if (v.indexOf("初任者研修") >= 0) push_(out, "初任者研修");
    else if (v.indexOf("実務者研修") >= 0) push_(out, "実務者研修");
    else if (v.indexOf("介護福祉士") >= 0) push_(out, "介護福祉士");
    else if (v.indexOf("介護技能実習評価試験") >= 0) push_(out, "介護技能評価試験合格");
    else push_(out, "その他資格"); // アプリの選択肢にないもの(原文はメモに残る)
  });
  return out;
}
function push_(arr, v) { if (arr.indexOf(v) < 0) arr.push(v); }

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
