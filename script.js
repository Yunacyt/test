// 案件資料與畫面操作分開，之後修改文字時可以先看這裡。
const suspects = [
  {
    id: "sato", name: "佐藤美咲", relation: "死者的助理",
    description: "負責館內帳目，近日與館長為一筆不明支出起了爭執。",
    testimony: "「20:05 我把茶放上桌就離開了，之後再也沒進去。館長當時還在看資料。」"
  },
  {
    id: "kobayashi", name: "小林悠", relation: "死者的姪子",
    description: "協助整理藏書，當晚來找館長商量家族舊書的捐贈。",
    testimony: "「20:10 我在門口和叔叔說了幾句話，沒有碰茶。20:12 起，我一直在櫃台幫忙。」"
  },
  {
    id: "mori", name: "森直人", relation: "死者的同事",
    description: "圖書館的設備管理員，當晚負責檢查二樓照明。",
    testimony: "「20:15 我在門口問過燈的狀況，館長還回了話。我沒進房，20:17 就到一樓修燈了。」"
  }
];

const evidence = [
  { id: "phone", name: "手機", description: "館長留在桌邊的手機。", clue: "20:18 的已傳送訊息寫著：『美咲，帳目的事明早交給警方。』之後沒有新的操作紀錄。" },
  { id: "cup", name: "茶杯", description: "一只剩下半杯冷茶的瓷杯。", clue: "杯內驗出毒物，旁邊封存的茶壺卻沒有。毒物是在茶倒入杯中後才加入的。" },
  { id: "lock", name: "電子門鎖", description: "可記錄個別鑰匙的使用時間。", clue: "20:10 為小林的鑰匙，20:15 為森的鑰匙，20:22 為佐藤的鑰匙。三人確認鑰匙整晚由自己保管，沒有借出。" },
  { id: "clock", name: "時鐘與值班紀錄", description: "館長室的掛鐘，以及一樓的值班表。", clue: "掛鐘與門鎖時間一致。值班員與一樓監視器確認：小林自 20:12、森自 20:17 起，直到發現死者都未再上樓。" },
  { id: "bin", name: "垃圾桶", description: "桌下的一只小型紙簍。", clue: "找到殘留同種毒物的小紙包。紙包由帳目影本折成，內側印著『佐藤美咲／經手』；上面只有佐藤的指紋。" }
];

// 所有遊戲狀態集中在這裡。重新整理網頁會回到初始狀態。
const gameState = {
  actionPoints: 8,
  investigatedPeople: new Set(),
  investigatedEvidence: new Set(),
  selectedSuspect: null
};
const culpritId = "sato";
const sectionButtons = document.querySelectorAll("#case-screen .section-button");
const sectionPanels = document.querySelectorAll("#case-screen .section-panel");

// 人物使用原生 details 元素：點姓名可展開，再決定是否詢問。
document.getElementById("people-list").innerHTML = suspects.map((person, index) => `
  <details class="investigation-card person-card">
    <summary><span class="card-number">PERSON 0${index + 1}</span><span class="person-name">${person.name}</span><span class="relation">${person.relation}</span><span class="expand-hint">查看紀錄 ＋</span></summary>
    <div class="person-details">
      <p>${person.description}</p>
      <button type="button" class="paper-button investigation-button" data-kind="people" data-id="${person.id}">詢問 · 1 行動力</button>
      <p id="clue-${person.id}" class="clue" hidden></p>
    </div>
  </details>
`).join("");

document.getElementById("evidence-list").innerHTML = evidence.map((item, index) => `
  <article class="investigation-card evidence-card">
    <p class="card-number">EVIDENCE 0${index + 1}</p>
    <h3>${item.name}</h3><p>${item.description}</p>
    <button type="button" class="paper-button investigation-button" data-kind="evidence" data-id="${item.id}">調查 · 1 行動力</button>
    <p id="clue-${item.id}" class="clue" hidden></p>
  </article>
`).join("");

document.getElementById("suspect-options").innerHTML = suspects.map(person => `
  <label class="suspect-option"><input type="radio" name="suspect" value="${person.id}" required><span>${person.name}<small>${person.relation}</small></span></label>
`).join("");

document.getElementById("start-button").addEventListener("click", () => {
  document.getElementById("home-screen").hidden = true;
  showScreen("selection-screen", "selection-heading");
});

sectionButtons.forEach(button => {
  button.addEventListener("click", () => {
    sectionPanels.forEach(panel => {
      panel.hidden = panel.id !== `${button.dataset.section}-panel`;
    });
    sectionButtons.forEach(tab => {
      const selected = tab === button;
      tab.classList.toggle("active", selected);
      tab.setAttribute("aria-pressed", String(selected));
    });
  });
});

// 每次調查前先檢查紀錄及行動力，避免重複扣除或出現負數。
function investigate(kind, id) {
  const records = kind === "people" ? gameState.investigatedPeople : gameState.investigatedEvidence;
  if (records.has(id) || gameState.actionPoints <= 0) return;

  const item = (kind === "people" ? suspects : evidence).find(item => item.id === id);
  records.add(id);
  gameState.actionPoints -= 1;
  const clue = document.getElementById(`clue-${id}`);
  clue.textContent = kind === "people" ? item.testimony : item.clue;
  clue.hidden = false;
  updateInvestigationState();
}

function updateInvestigationState() {
  document.getElementById("action-count").textContent = gameState.actionPoints;
  document.getElementById("action-message").textContent = gameState.actionPoints === 0
    ? "行動力已用完。你仍可重讀已取得的線索，並前往「推理」提交答案。"
    : "每次詢問或調查消耗 1 點；已取得的內容可免費重讀。";

  document.querySelectorAll(".investigation-button").forEach(button => {
    const isPerson = button.dataset.kind === "people";
    const records = isPerson ? gameState.investigatedPeople : gameState.investigatedEvidence;
    const investigated = records.has(button.dataset.id);
    button.textContent = investigated ? (isPerson ? "已詢問" : "已調查")
      : gameState.actionPoints === 0 ? "行動力不足" : (isPerson ? "詢問 · 1 行動力" : "調查 · 1 行動力");
    button.disabled = investigated || gameState.actionPoints === 0;
    button.closest(".investigation-card").classList.toggle("investigated", investigated);
  });
}

document.querySelectorAll(".investigation-button").forEach(button => {
  button.addEventListener("click", () => investigate(button.dataset.kind, button.dataset.id));
});

const reasoningForm = document.getElementById("reasoning-form");
reasoningForm.addEventListener("change", () => {
  gameState.selectedSuspect = reasoningForm.elements.suspect.value;
  document.getElementById("submit-reasoning").disabled = false;
  // 選擇改變時先收起舊結果，避免把上一次判定當成新答案。
  document.getElementById("reasoning-result").hidden = true;
});
reasoningForm.addEventListener("submit", event => {
  event.preventDefault();
  if (!gameState.selectedSuspect) return;
  const correct = gameState.selectedSuspect === culpritId;
  const result = document.getElementById("reasoning-result");
  result.textContent = correct
    ? "推理正確。犯人是佐藤美咲。她聲稱沒有返回，門鎖卻記錄她在 20:22 進入；毒物紙包也留下她的名字與指紋。其餘兩人的不在場紀錄與她的證詞矛盾相互對照，指出她為掩蓋帳目問題下毒。"
    : "推理尚未正確。請重新對照返回館長室的時間、兩人的不在場紀錄，以及垃圾桶中的紙包。你可以重新選擇並提交。";
  result.hidden = false;
  document.getElementById("case-status").textContent = correct ? "SOLVED" : "UNSOLVED";
});

// 多案件只共用畫面切換；CASE 001 的資料與八點玩法保持原樣。
function showScreen(id, headingId) {
  document.querySelectorAll('body > main').forEach(screen => { screen.hidden = screen.id !== id; });
  window.scrollTo(0, 0);
  if (headingId) document.getElementById(headingId).focus();
}
document.querySelectorAll('.return-button').forEach(button => {
  button.addEventListener('click', () => showScreen('selection-screen', 'selection-heading'));
});
document.querySelectorAll('.case-choice').forEach(button => {
  button.addEventListener('click', () => {
    if (button.dataset.case === '001') showScreen('case-screen', 'case-heading');
    else if (caseTwo.closed) showScreen('closed-screen');
    else if (caseTwo.solved) showScreen('ending-screen', 'ending-heading');
    else showScreen('case-two-screen', 'case-two-heading');
  });
});

// CASE 002：四份人物問題、十二項證物。資料不會自動變成推論。
const twoPeople = [
  { id: 'chinatsu', name: '藤原千夏', relation: '28 歲／高中同學、多年好友', description: '19:45 來到 203，希望莉奈刪掉高中事件的相關資料，結束多年牽扯。', clue: '「我大約 20:30 就離開了，莉奈那時候還好好的。我只是來談一些以前的事。」' },
  { id: 'takumi', name: '相澤拓海', relation: '30 歲／隔壁 204 住戶', description: '曾以為莉奈也喜歡他。她會半夜找他聊天、請他幫忙、一起吃飯，還說過「如果是你這種人當男朋友好像也不錯」。', clue: '「20:55 我才回到 204。案發當晚我沒有進過莉奈家。」他提到莉奈時避開了視線。' },
  { id: 'maki', name: '小野寺真紀', relation: '43 歲／正下方 103 住戶', description: '安靜，與鄰居保持距離，不想捲入別人的事情。', clue: '「我跟她不熟。20:47 我看見千夏從昏黃走廊旁的金屬樓梯離開。21:12 到 21:15，我聽見樓上浴室的水聲；高橋小姐應該還活著，在洗澡吧。」追問後她確認：只聽見水，沒有看見莉奈。' },
  { id: 'ryo', name: '神谷遼', relation: '30 歲／交往三年的前男友', description: '他確實出軌，也曾威脅莉奈。警方告知死訊時，他冷淡地說：「……死了？那不是很好嗎。」', clue: '「我出軌，傷害過她，也說過『妳敢去找她，我不會放過妳』。我恨她，但沒有殺她。她很怕熱，泡澡只用約 38°C，40°C 以上她受不了。她回家第一件事就是洗澡。她干涉交友、看我的手機，總說是因為在乎我。她是怕有一天，所有人都發現其實根本不需要她。」' }
];
const twoEvidence = [
  { id: 'heater', name: '給湯器紀錄', description: '核對水聲的來源、模式與設定時間。', clue: '21:12 啟動的是「預約自動注水」，設定 42°C，運作至 21:15。這代表預約程序執行，不代表當時有人操作。面板可在離開前設定，未記錄操作者身份。' },
  { id: 'habit', name: '回家時間與生活筆記', description: '房東的目擊與莉奈自己的日常紀錄。', clue: '房東約 18:30 看見莉奈回到 203。她的生活筆記寫著「回家先洗澡」，當晚 18:40 的訊息也寫著「洗好澡了」。她早已洗過澡。' },
  { id: 'balcony', name: '203／204 陽台隔板', description: '查看房間後方的相鄰陽台。', clue: '隔板上有新鮮翻越擦痕，203 側留下鞋印，花盆灰塵中有與拓海鞋底相符的紋路。需再核對他取走的東西，不能只憑鞋印判定殺人。' },
  { id: 'letter', name: '情書照片與空信封', description: '抽屜中的空信封，以及莉奈保留的聊天照片。', clue: '莉奈把拓海的認真情書拍給朋友看，嘲笑他真的以為兩人互相喜歡。今晚 21:02 拓海傳給莉奈的訊息是：「原件我拿回來了，別再給別人看。」抽屜只剩寫有拓海姓名的空信封。' },
  { id: 'tea', name: '矮櫃下方茶漬', description: '檢查不容易擦到的地板縫隙。', clue: '矮櫃下的地板縫隙留著少量乾涸茶漬，與客廳茶壺的茶相符。浴室沒有同樣的茶漬。' },
  { id: 'cup', name: '垃圾桶中的碎茶杯', description: '紙巾包裹的瓷片。', clue: '碎片上殘留茶漬，紙巾濕過後已乾。杯子是在客廳使用的，碎片像是事後收拾才丟進垃圾桶。' },
  { id: 'clean', name: '客廳局部清潔痕跡', description: '查看矮櫃前地板與抹布。', clue: '矮櫃前局部地板比周圍乾淨，擦拭邊緣仍有茶痕。潮濕抹布藏在櫃邊。有人清理過這一小塊現場。' },
  { id: 'phone2', name: '莉奈手機最後操作', description: '核對最後一次正常傳訊。', clue: '20:16 傳出的訊息：「等等再跟你說，千夏現在在我這。」之後沒有正常操作紀錄。單憑沒有操作，還不能斷言死亡時間。' },
  { id: 'record', name: '秘密錄音', description: '核對 20:03 開始的錄音，不播放音效。', clue: '20:03 開始。20:05 後，千夏：「妳到底還要拿那件事威脅我多久？刪掉那些資料，別再聯絡我。」莉奈：「我從來沒有威脅妳。我只是提醒妳，別忘記以前發生過什麼。」後段有爭執聲、碰撞聲，約 20:20 中斷。沒有錄到完整過程，也沒有明確的殺人自白。' },
  { id: 'cabinet', name: '客廳矮櫃邊角', description: '比對撞擊位置與初步檢驗。', clue: '邊角留有擦拭後的微量接觸痕跡。初步檢驗指出後腦撞擊，形狀與這個邊角一致；不像溺水或熱水直接致死。仍需結合茶杯、清潔痕跡與錄音判斷。' },
  { id: 'bath', name: '浴室移動痕跡', description: '查看走道、浴室地面與預約面板。', clue: '客廳通往浴室的地面有拖移擦痕，浴室未見對應的撞擊現場。自動注水面板就在浴室入口旁，千夏離開前可接近並設定它；無法僅憑面板辨認是誰設定。' },
  { id: 'archive', name: '高中事件封存資料', description: '取得秘密錄音後，可免費核對其提到的資料。', requires: 'record', free: true, clue: '莉奈保留的高中訊息、匿名帳號匯出紀錄與原始上傳郵件互相吻合：匿名散播同學私人資訊的人是莉奈。當年千夏因討厭那名同學，把難聽的話與私人資訊告訴莉奈；散播造成排擠，那名同學後來自殺。千夏以為抱怨被旁人聽到，背負罪惡感多年。莉奈既是散播者，又安慰千夏、替她「保守秘密」，用「如果大家知道最初是妳告訴我的，妳的人生會怎樣？」維持控制。' }
];
// 只有支線情書不是結案必要資料；行動耗盡時必要資料改為免費核對。
const caseTwo = { points: 12, acquired: new Set(), deductions: new Set(), confronted: new Set(), paid: 0, attempts: 0, firstAccuracy: null, answers: {}, solved: false, closed: false, rank: '' };
const deductions = [
  { id: 'temperature', pair: ['ryo', 'heater'], title: '不自然的水溫', text: '莉奈平常只用約 38°C，無法忍受 40°C 以上；42°C 不是她自然會選擇的泡澡設定。' },
  { id: 'waterWitness', pair: ['habit', 'maki'], title: '水聲與人的存在不同', text: '莉奈 18:30 回家後已洗澡。真紀只是聽見水，沒有看見她本人；水聲並不是目擊生存。' },
  { id: 'timeConflict', pair: ['temperature', 'waterWitness'], title: '21:12 的水聲不能證明莉奈仍活著', text: 'TIMELINE CONTRADICTION／21:12 那缸水，不是為莉奈準備的。自動注水可預先設定，原推定 21:12–22:05 不再成立。', reward: true },
  { id: 'spill', pair: ['tea', 'cup'], title: '客廳裡破碎的茶杯', text: '地板縫的茶與包好的碎杯相互對照，客廳曾發生茶杯碎裂與茶水灑落。' },
  { id: 'cleanup', pair: ['spill', 'clean'], title: '有人清理客廳', text: '碎杯被收起、地板局部被擦拭，殘留痕跡顯示事後整理而非原本整潔。' },
  { id: 'scene', pair: ['cleanup', 'cabinet'], title: '真正的撞擊地點：203 客廳', text: '矮櫃與傷勢相符，周圍又有爭執後的破杯與清理痕跡。真正的撞擊應在客廳，而非浴室。' },
  { id: 'interruption', pair: ['phone2', 'record'], title: '20:16 後的爭執與中斷', text: '20:16 莉奈仍正常傳訊，錄音於約 20:20 在爭執與碰撞後中斷。這能縮小時段，但錄音本身沒有完整記錄死因。' },
  { id: 'incident', pair: ['interruption', 'scene'], title: '客廳事故與失去活動的時段', text: '手機、錄音與現場相互支持：20:16 之後客廳發生撞擊，隨後有人清理。需要離開目擊作為上界。' },
  { id: 'reconstructed', pair: ['incident', 'maki'], requires: 'timeConflict', title: '真正可能的死亡時間：20:16–20:47', text: 'TIMELINE RECONSTRUCTED／20:16 最後正常操作至千夏 20:47 離開。拓海約 21:00 才進屋，已晚於重建時段。這是可能區間，不是精確死亡分鐘。', reward: true },
  { id: 'staging', pair: ['bath', 'heater'], requires: 'reconstructed', title: '搬動遺體與延後時間的偽裝', text: '客廳撞擊、浴室移動痕跡與預約注水互相對照。莉奈被移到浴室後，預約水聲讓旁人誤以為她仍在準備洗澡。' }
];
const confrontationText = {
  takumi: 'CONTRADICTION DETECTED／拓海低下頭：「她把我的情書拍給朋友，笑我。我 20:55 回到 204，約 21:00 翻過隔板，只想拿回原件。我找完抽屜就走，沒有進浴室，也不知道她死了。」他確實入屋且說謊，但動機是羞恥。若已完成時間線及浴室痕跡比對，就能核對他進屋時莉奈已被移到浴室；不能僅憑這段自述排除嫌疑。說謊 ≠ 犯人。',
  chinatsu: 'CONTRADICTION DETECTED／真紀親眼目擊的是 20:47，不是 20:30。千夏改口：「我……後來又留了一會兒。」手機與錄音證明她在爭執時仍在場，重建時段涵蓋她停留的時間；她能在離開前接近浴室面板。這些資料須相互核對，不能只憑說謊就定罪。'
};
const finalQuestions = [
  { id: 'culprit', label: '1. 犯人是誰？', options: [['chinatsu','藤原千夏'],['takumi','相澤拓海'],['maki','小野寺真紀'],['ryo','神谷遼']], answer: 'chinatsu' },
  { id: 'place', label: '2. 莉奈真正死亡的地點？', options: [['living','203 客廳'],['bathroom','203 浴室'],['balcony','陽台']], answer: 'living' },
  { id: 'water', label: '3. 21:12 的水聲是什麼？', options: [['automatic','預先設定的浴缸自動注水'],['rina','莉奈當時親手放水'],['neighbor','隔壁房間洗澡']], answer: 'automatic' },
  { id: 'purpose', label: '4. 為什麼要製造這段水聲？', options: [['alibi','製造莉奈仍活著的假象，推遲死亡時間，建立不在場證明'],['cleaning','只為了清洗茶杯'],['habit','只是維持她平常的生活習慣']], answer: 'alibi' },
  { id: 'conflict', label: '5. 最關鍵的矛盾之一是什麼？', options: [['heat','莉奈怕熱、平常約 38°C，但自動注水設為 42°C'],['silent','沒有水聲卻有使用紀錄'],['door','203 從未有人進入']], answer: 'heat' }
];

document.getElementById('two-people-list').innerHTML = twoPeople.map(person => `
  <details class="investigation-card person-card"><summary><span class="person-name">${person.name}</span><span class="relation">${person.relation}</span><span class="expand-hint">查看紀錄 ＋</span></summary><div class="person-details"><p>${person.description}</p><button type="button" class="paper-button two-investigate" data-id="${person.id}"></button><p id="two-clue-${person.id}" class="clue" hidden></p></div></details>`).join('');
document.getElementById('two-evidence-list').innerHTML = twoEvidence.map(item => `
  <article class="investigation-card evidence-card"><h3>${item.name}</h3><p>${item.description}</p><button type="button" class="paper-button two-investigate" data-id="${item.id}"></button><p id="two-clue-${item.id}" class="clue" hidden></p></article>`).join('');
document.getElementById('final-questions').innerHTML = finalQuestions.map(q => `<label class="final-question">${q.label}<select name="${q.id}" required><option value="">請選擇</option>${q.options.map(([value,text]) => `<option value="${value}">${text}</option>`).join('')}</select></label>`).join('');

function twoItem(id) { return [...twoPeople, ...twoEvidence].find(item => item.id === id); }
function available(id) { return caseTwo.acquired.has(id) || caseTwo.deductions.has(id); }
function isFree(item) { return item.free || (caseTwo.points === 0 && item.id !== 'letter'); }
function investigateTwo(id) {
  const item = twoItem(id);
  if (!item || caseTwo.acquired.has(id) || (item.requires && !available(item.requires))) return;
  if (!isFree(item)) {
    if (caseTwo.points <= 0) return;
    caseTwo.points -= 1;
    caseTwo.paid += 1;
  }
  caseTwo.acquired.add(id);
  const clue = document.getElementById(`two-clue-${id}`);
  clue.textContent = item.clue;
  clue.hidden = false;
  updateTwo();
}
document.querySelectorAll('.two-investigate').forEach(button => button.addEventListener('click', () => investigateTwo(button.dataset.id)));
document.querySelectorAll('.two-tab').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.two-panel').forEach(panel => { panel.hidden = panel.id !== `two-${button.dataset.panel}`; });
  document.querySelectorAll('.two-tab').forEach(tab => { const active = tab === button; tab.classList.toggle('active',active); tab.setAttribute('aria-pressed',String(active)); });
}));

// 保留選擇；只把已取得的資料放進比對清單，未調查內容不會洩漏。
function fillSelect(id, entries) {
  const select = document.getElementById(id);
  const previous = select.value;
  select.replaceChildren(new Option('請選擇', ''));
  entries.forEach(([value,text]) => select.add(new Option(text,value)));
  if (entries.some(([value]) => value === previous)) select.value = previous;
}
function finalReady() {
  return ['timeConflict','reconstructed','staging'].every(id => caseTwo.deductions.has(id)) && caseTwo.confronted.has('chinatsu') && caseTwo.acquired.has('archive');
}
function updateTwo() {
  document.getElementById('two-points').textContent = caseTwo.points;
  document.getElementById('two-action-message').textContent = caseTwo.points === 0
    ? '行動力已耗盡：必要資料開放免費補充核對。組合、對質與最終推理仍可操作。'
    : '調查消耗 1 點；組合與對質免費。兩項關鍵時間推論各返還 1 點，必要資料在零點時免費核對。';
  document.querySelectorAll('.two-investigate').forEach(button => {
    const item = twoItem(button.dataset.id);
    const done = caseTwo.acquired.has(item.id);
    const locked = item.requires && !available(item.requires);
    button.disabled = done || locked || (caseTwo.points === 0 && !isFree(item));
    button.textContent = done ? (twoPeople.includes(item) ? '已詢問' : '已調查') : locked ? '尚未解鎖：先取得秘密錄音' : isFree(item) ? '新解鎖／免費核對' : caseTwo.points === 0 ? '行動力不足（支線）' : (twoPeople.includes(item) ? '詢問 · 1 行動力' : '調查 · 1 行動力');
    button.closest('.investigation-card').classList.toggle('investigated',done);
    button.closest('.investigation-card').classList.toggle('newly-available',!done && !locked && isFree(item));
  });
  if (caseTwo.acquired.has('maki') && caseTwo.acquired.has('record')) {
    document.getElementById('two-clue-maki').textContent = twoPeople.find(p => p.id === 'maki').clue + ' 免費追問／提到錄音中的語氣後，真紀補充：「以前我在樓梯轉角聽見她對千夏說，妳不會真的以為，過了這麼多年，那件事就不存在了吧？千夏離開後，她看見我，立刻又笑著說晚上好，今天也很冷呢。我只是不想惹麻煩。」她對水聲的目擊沒有改變，改變的只是她願意說出的背景。';
  }
  const entries = [...twoPeople,...twoEvidence].filter(item => caseTwo.acquired.has(item.id)).map(item => [item.id, item.name]);
  deductions.filter(d => caseTwo.deductions.has(d.id)).forEach(d => entries.push([d.id, `推論：${d.title}`]));
  ['combine-first','combine-second','confront-evidence'].forEach(id => fillSelect(id, entries));
  fillSelect('confront-person', twoPeople.filter(p => ['takumi','chinatsu'].includes(p.id) && caseTwo.acquired.has(p.id)).map(p => [p.id, p.id === 'takumi' ? '拓海：我沒有進過莉奈家' : '千夏：20:30 就離開了']));
  document.getElementById('deduction-list').innerHTML = deductions.filter(d => caseTwo.deductions.has(d.id)).map(d => `<article class="paper-note"><h3>${d.title}</h3><p>${d.text}</p></article>`).join('');
  document.getElementById('confrontations').innerHTML = [...caseTwo.confronted].map(id => `<p class="paper-note">${confrontationText[id]}</p>`).join('');
  const conflict = caseTwo.deductions.has('timeConflict');
  const rebuilt = caseTwo.deductions.has('reconstructed');
  document.getElementById('initial-time').classList.toggle('struck-time',conflict);
  document.getElementById('current-time').textContent = rebuilt ? '20:16–20:47' : conflict ? 'UNKNOWN' : '';
  document.getElementById('timeline-log').textContent = rebuilt
    ? 'TIMELINE RECONSTRUCTED／18:30 回家並洗澡 → 19:45 千夏到訪 → 20:03 錄音 → 20:16 最後正常操作 → 約 20:20 碰撞與中斷 → 20:47 千夏離開 → 20:55 拓海回家 → 約 21:00 取信（對質後確認）→ 21:12 自動注水 → 約 22:05 發現遺體。可能死亡區間：20:16–20:47。'
    : conflict ? 'TIMELINE CONTRADICTION／水聲不是生存證明。推定死亡時間：UNKNOWN。下一步核對客廳、手機、錄音與離開目擊。' : '暫定：21:12 水聲 → 莉奈仍活著？這仍是推測。';
  document.getElementById('final-gate').textContent = finalReady() ? '核心資料已核對，可以回答五題。拓海對質仍可補查；說謊並不等於犯人。'
    : '提交前請推翻水聲時間、重建客廳死亡時段、比對浴室與給湯器、對質千夏，並免費核對已解鎖的高中資料。';
  document.getElementById('two-submit').disabled = !finalReady();
}

document.getElementById('combine-form').addEventListener('submit', event => {
  event.preventDefault();
  const a = document.getElementById('combine-first').value;
  const b = document.getElementById('combine-second').value;
  const output = document.getElementById('combine-feedback');
  if (!available(a) || !available(b)) return;
  const rule = deductions.find(d => d.pair.includes(a) && d.pair.includes(b) && a !== b);
  if (!rule) { output.textContent = '這兩項資訊目前無法形成有效推論。'; return; }
  if (rule.requires && !available(rule.requires)) { output.textContent = '先核對水聲時間矛盾，或重建死亡時段，再比對這兩項資料。'; return; }
  if (caseTwo.deductions.has(rule.id)) { output.textContent = '這份推論已記錄，不會重複返還行動力。'; return; }
  caseTwo.deductions.add(rule.id);
  if (rule.reward) caseTwo.points = Math.min(12, caseTwo.points + 1);
  output.textContent = `推論成立：${rule.title}${rule.reward ? '／返還 1 點行動力' : ''}`;
  output.className = 'success-feedback';
  updateTwo();
});
document.getElementById('confront-form').addEventListener('submit', event => {
  event.preventDefault();
  const person = document.getElementById('confront-person').value;
  const proof = document.getElementById('confront-evidence').value;
  const output = document.getElementById('confront-feedback');
  if (!caseTwo.acquired.has(person) || !available(proof)) return;
  if (caseTwo.confronted.has(person)) { output.textContent = '已完成這段對質，新證詞保留在下方。'; return; }
  if (person === 'takumi' && proof === 'balcony' && !caseTwo.acquired.has('letter')) {
    output.textContent = '陽台痕跡仍需佐證。請核對情書照片、空信封與取回原件的訊息。'; return;
  }
  const correct = person === 'takumi' ? proof === 'balcony' && caseTwo.acquired.has('letter')
    : person === 'chinatsu' && proof === 'maki' && available('reconstructed');
  if (!correct) { output.textContent = '這份資料尚不足以反駁。拓海需陽台及取信佐證；千夏需離開目擊與已重建的時間線。'; return; }
  caseTwo.confronted.add(person);
  output.textContent = 'CONTRADICTION DETECTED／新證詞已免費解鎖。';
  output.className = 'success-feedback';
  updateTwo();
});
const twoFinalForm = document.getElementById('two-final-form');
twoFinalForm.addEventListener('change', () => { document.getElementById('two-final-feedback').textContent = ''; });
twoFinalForm.addEventListener('submit', event => {
  event.preventDefault();
  if (!finalReady()) return;
  const answers = Object.fromEntries(new FormData(twoFinalForm));
  if (finalQuestions.some(q => !answers[q.id])) return;
  caseTwo.answers = answers;
  const correctCount = finalQuestions.filter(q => answers[q.id] === q.answer).length;
  caseTwo.attempts += 1;
  if (caseTwo.firstAccuracy === null) caseTwo.firstAccuracy = correctCount;
  if (correctCount < 5) {
    document.getElementById('two-final-feedback').textContent = `目前 ${correctCount}／5 題吻合已取得的線索。請重讀時間、水溫與客廳紀錄；可重新作答，不扣行動力。`;
    return;
  }
  caseTwo.solved = true;
  document.getElementById('two-status').textContent = 'SOLVED';
  renderEnding();
  showScreen('ending-screen','ending-heading');
});
function renderEnding() {
  // 完整真相僅在五題正確後重建；關鍵資訊已在結案前的資料中出現。
  const story = [
    '19:45，千夏來到 203。她不是帶著殺人的計畫來的，她想結束十年的控制，請莉奈刪除高中事件的資料，從此不再聯絡。',
    '20:03，莉奈偷偷開啟錄音。20:05 起，兩人爭執。莉奈否認威脅，卻再次提醒她：「別忘記以前發生過什麼。」20:16，莉奈仍傳出正常訊息。',
    '約 20:18–20:20，千夏試圖搶走手機。推擠中，莉奈向後跌倒，後腦撞上客廳矮櫃的邊角。茶杯碎了，茶水灑進地板縫。莉奈死在客廳，錄音約 20:20 中斷。',
    '千夏本來仍可以報警。但在 20:25–20:45，她選擇搬動遺體、擦拭客廳、收起碎杯。她把莉奈移到浴室，預約 21:12 自動注入 42°C 的熱水。20:47，她從玄關離開。',
    '20:55，拓海回到 204。約 21:00，他從陽台翻入 203，只為拿回被拍照嘲笑的情書。他沒有進浴室，不知道莉奈已死。他說謊是為了隱瞞入屋與羞恥，不是因為殺人。',
    '21:12，機器準時注水。真紀確實聽到了水聲，卻把水聲理解成莉奈仍活著。遼確實出軌、威脅並傷害過莉奈，但沒有殺她；他的生活習慣證詞揭開了 42°C 的矛盾。約 22:05，房東發現遺體。',
    '封存資料證明：高中時匿名散播私人資訊的人，其實是莉奈。千夏當年說出了傷人的話與別人的秘密；莉奈把它們散播出去，導致那名女生被排擠並自殺。她又扮演安慰者與保密者，讓千夏以為自己間接害了同學，用罪惡感控制她多年。',
    '莉奈擅長觀察人的弱點，用溫柔維持依賴。她害怕被拋下，害怕別人發現不再需要她。但這不能替千夏免責。死亡最初可能是意外；搬動遺體、偽造現場、欺騙警方，都是千夏自己的選擇。',
    '「如果我早一點知道……」\n「當年的事情不是我做的……」\n「我是不是就能早一點離開她？」',
    '她停了很久。',
    '「我那天去找她的時候，真的只是想告訴她……」\n「以後不要再聯絡了。」\n「就只有這樣而已。」'
  ];
  document.getElementById('ending-story').replaceChildren(...story.map(text => { const p = document.createElement('p'); p.textContent = text; return p; }));
  const score = caseTwo.firstAccuracy * 8 + 15 + (caseTwo.confronted.has('takumi') ? 20 : 0) + 10 + (caseTwo.acquired.has('cabinet') && caseTwo.acquired.has('bath') ? 10 : 0) + (caseTwo.paid <= 12 ? 5 : 0);
  caseTwo.rank = score >= 95 ? 'S' : score >= 80 ? 'A' : score >= 65 ? 'B' : 'C';
  document.getElementById('deduction-rank').textContent = `DEDUCTION RANK / ${caseTwo.rank}`;
  document.getElementById('rank-detail').textContent = `首次推理 ${caseTwo.firstAccuracy}／5 · 時間矛盾已發現 · 拓海對質${caseTwo.confronted.has('takumi') ? '已完成' : '未完成'} · 高中真相已核對 · 付費調查 ${caseTwo.paid} 次。評價不影響結案。`;
}
document.getElementById('close-case').addEventListener('click', async event => {
  event.currentTarget.disabled = true;
  const screen = document.getElementById('ending-screen');
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await screen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'ease' }).finished;
  }
  caseTwo.closed = true;
  showScreen('closed-screen');
});
updateTwo();
