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

// CASE 002：初次紀錄、免費追加詢問與推理節點分開保存。
const twoPeople = [
  {
    id: 'chinatsu', name: '藤原千夏', age: 28, relation: '高中同學／多年好友',
    description: '與莉奈自高中時期相識，兩人多年來一直保持聯絡。案發當晚19:45左右前往203號室拜訪莉奈。',
    clue: '「那天只是去找莉奈聊聊天。我們認識很久了，偶爾會像以前一樣聊些高中時候的事情。」\n\n「我大概八點半左右就離開了，沒有特別看時間。她那時候還好好的，也沒有什麼不對勁。」\n\n「後來發生這種事……我真的沒想到。」'
  },
  {
    id: 'takumi', name: '相澤拓海', age: 30, relation: '204號室住戶',
    description: '莉奈的隔壁鄰居。兩人平時關係不錯，偶爾會一起吃飯，也會互相幫忙。',
    clue: '「我大概20:55左右回到公寓。」\n\n「那天晚上，我沒有見到高橋小姐。」\n\n「後來警察來了，我才知道出事。」'
  },
  {
    id: 'maki', name: '小野寺真紀', age: 43, relation: '103號室住戶',
    description: '居住於203正下方的103號室。與莉奈偶爾在走廊碰面，平時沒有太多往來。',
    clue: '「九點多吧，我聽到樓上浴室有水聲。」\n\n「這棟公寓隔音不好，樓上放水的聲音其實滿明顯的。」\n\n「所以我以為高橋小姐那時候正在洗澡。」\n\n「我跟她不算熟，平常就是碰到會打招呼而已。」'
  },
  {
    id: 'ryo', name: '神谷遼', age: 30, relation: '前男友',
    description: '曾與莉奈交往約三年。兩人因遼與其他女性交往而分手，之後關係惡化。',
    clue: '「對，我出軌了。」\n\n「她發現之後，我們就分手了。」\n\n「我知道你們找到那則訊息。『妳敢去找她，我不會放過妳』是我傳的。」\n\n「我那時候很怕她去找那個女生。那句話是我說的，我不否認。」\n\n「但我沒有殺她。」'
  }
];
const twoEvidence = [
  { id: 'heater', name: '給湯器使用紀錄', tags: ['scheduledWater', 'water42'], clue: '21:12　預約自動注水\n設定水溫：42°C\n注水結束：21:15' },
  { id: 'entry', name: '莉奈的出入紀錄', clue: '公寓入口監視器拍到莉奈於18:37返回公寓。此後直到遺體被發現，沒有再次拍到她離開。' },
  { id: 'balcony', name: '203陽台地面', clue: '203號室陽台地面積有一層薄灰，其中留有較新的鞋印。鞋底紋路與相澤拓海當晚所穿鞋款一致。' },
  { id: 'letter', name: '莉奈抽屜內的信封', clue: '莉奈臥室的書桌抽屜中找到一只信封。\n\n收件人為『莉奈』，署名『拓海』，封面角落畫有小小的愛心。\n\n信封內沒有信件。' },
  { id: 'tea', name: '矮櫃下方的茶漬', tags: ['spilledTea'], clue: '客廳矮櫃下方留有少量已乾涸的茶漬。位置較深，表面清潔時不易注意。' },
  { id: 'cup', name: '垃圾桶內的碎杯', tags: ['spilledTea'], clue: '垃圾桶內找到數片破裂的瓷杯碎片，以紙巾包裹。\n\n杯片及紙巾上均殘留已乾涸的茶漬。' },
  { id: 'clean', name: '客廳地板', tags: ['wipedFloor'], clue: '客廳中央部分地板明顯比周圍乾淨，擦拭方向不規則。附近家具底部仍可見少量未清除的污漬。' },
  { id: 'phone2', name: '莉奈的手機', clue: '20:16，莉奈傳出最後一則訊息：\n\n『等等再跟你說，千夏現在在我這。』\n\n此後沒有任何發出的訊息紀錄。' },
  { id: 'record', name: '手機音訊檔案', clue: '手機中找到一段於20:03開始的錄音。\n\n千夏：『妳到底還要拿那件事威脅我多久？』\n\n莉奈：『我從來沒有威脅妳。』\n\n莉奈：『我只是提醒妳，別忘記以前發生過什麼。』\n\n千夏：『我已經受夠了。』\n\n錄音於20:20結束。' },
  { id: 'cabinet', name: '客廳矮櫃', tags: ['victimBlood'], clue: '矮櫃右側邊角有明顯擦拭痕跡。木質接縫中仍殘留少量暗褐色痕跡。\n\n經檢驗確認為高橋莉奈的血液。' },
  { id: 'bath', name: '浴室與走道', clue: '客廳通往浴室的地面可見數道不連續的拖擦痕跡。' }
];
const CASE_TWO_AP = 13;
const caseTwo = {
  points: CASE_TWO_AP, acquired: new Set(), followups: new Set(), nodes: new Set(),
  rewards: new Set(), paid: 0, answers: {}, attempts: 0, firstAccuracy: null,
  solved: false, closed: false, truthStage: 'crime'
};
const hasTwo = id => caseTwo.acquired.has(id) || caseTwo.followups.has(id);
const allTwo = ids => ids.every(hasTwo);
const twoFollowups = [
  {
    id: 'chinatsuAudio', owner: 'chinatsu', title: '那天談了什麼？',
    unlocked: () => allTwo(['chinatsu', 'record']),
    clue: '「……我們確實吵架了。」\n\n「是以前的一些事情。我不想說得太詳細。」\n\n「我那時候很生氣，所以說了很難聽的話。但我們沒有動手。」\n\n「我離開的時候，她還活著。」'
  },
  {
    id: 'chinatsuTime', owner: 'chinatsu', title: '離開時間',
    unlocked: () => allTwo(['chinatsu', 'makiWitness']),
    clue: '「……可能是我記錯了吧。我沒有特別看時間。」\n\n「那天我們吵得很不愉快，我也不想讓你們知道我在她那裡待了那麼久。」\n\n「如果小野寺小姐看到我是20:47，那應該就是20:47。」\n\n「但我離開的時候，莉奈真的還活著。」'
  },
  {
    id: 'takumiBalcony', owner: 'takumi', title: '203號室的陽台',
    unlocked: () => allTwo(['takumi', 'balcony']),
    clue: '「……我不知道。」\n\n「陽台本來就連在一起，之前也不是沒有過去幫忙。」\n\n「那不代表我那天晚上進過她家。」'
  },
  {
    id: 'makiWitness', owner: 'maki', title: '案發當晚還看到其他人嗎？',
    unlocked: () => allTwo(['maki', 'chinatsu']) && caseTwo.paid >= 5,
    clue: '「對了……藤原小姐那天也有來。」\n\n「我記得她離開的時候大概20:47。因為我正準備出門倒垃圾，看了一眼手機。」\n\n「她走得很快，臉色也不太好看。」'
  },
  {
    id: 'makiRelation', owner: 'maki', title: '與莉奈的關係',
    unlocked: () => allTwo(['maki', 'record']) && (caseTwo.nodes.has('B') || caseTwo.nodes.has('C')),
    clue: '「我不是討厭她。只是……有一次我在走廊聽見她跟藤原小姐說話。」\n\n「她說：『妳不會真的以為，過了這麼多年，那件事就不存在了吧？』」\n\n「然後她一看到我，就馬上笑著跟我說『晚上好』。」\n\n「從那之後，我就不太想跟她有太多來往。」'
  },
  {
    id: 'ryoShared', owner: 'ryo', title: '共同生活期間', tags: ['habit38'],
    unlocked: () => allTwo(['ryo', 'heater']),
    clue: '「生活習慣？……她很怕熱。」\n\n「以前一起住的時候，我喜歡把水開到四十一、四十二度，她每次都嫌燙。」\n\n「她自己泡澡大概就是三十八度左右。」\n\n「這跟案子有關嗎？」'
  },
  {
    id: 'takumiConfront', owner: 'takumi', title: '對質',
    unlocked: () => hasTwo('takumi') && caseTwo.nodes.has('A'),
    clue: '「……好。我進去了。」\n\n「但我沒有殺她。」\n\n「那封信是我以前寫給她的。我那時候……以為我們之間可能有什麼。」\n\n「後來我才知道，她把信拍給別人看。」\n\n「我只是想把它拿回來。」\n\n「我只拿走裡面的信。信封我放回去了。」\n\n「整個拿走的話，她馬上就會知道有人翻過抽屜。」\n\n「我只是……不想再讓那封信留在她手上。」\n\n「我知道這算擅自闖入，所以一開始才沒說。」\n\n「但我真的沒有見到她。」'
  }
];
const causeRecord = { id: 'cause', name: '初步死因', tags: ['headInjury'], clue: '死者後腦受到強烈撞擊，死因初步判定為顱內出血。' };

// 節點以「判斷＋支持紀錄」驗證，不再使用兩張證據的固定配方。
const noteNodes = [
  {
    id: 'A', title: '拓海隱瞞了什麼？',
    unlocked: () => allTwo(['takumi', 'balcony', 'letter']),
    record: '拓海當晚曾進入203號室，但他聲稱沒有見到莉奈。'
  },
  {
    id: 'B', title: '21:12的浴室用水',
    unlocked: () => allTwo(['maki', 'heater', 'ryoShared']),
    record: '21:12的水聲本身不足以證明莉奈當時仍然活著。\n\n21:12的浴缸用水與莉奈平時的使用習慣不符。'
  },
  {
    id: 'C', title: '浴室真的是第一現場嗎？',
    unlocked: () => allTwo(['tea', 'cup', 'clean', 'cabinet']),
    record: '莉奈受到致命傷的地點可能是203號室客廳。'
  },
  {
    id: 'D', title: '重新建構時間線',
    unlocked: () => allTwo(['phone2', 'record', 'makiWitness']) && caseTwo.nodes.has('B') && caseTwo.nodes.has('C'),
    record: '莉奈可能在21:12以前便已死亡。'
  }
];
const timelineRecords = [
  { id: 'audioStart', time: '20:03', label: '手機錄音開始' },
  { id: 'message', time: '20:16', label: '莉奈最後傳出訊息' },
  { id: 'audioEnd', time: '20:20', label: '錄音結束' },
  { id: 'leave', time: '20:47', label: '千夏離開203' },
  { id: 'water', time: '21:12', label: '浴室預約自動注水' },
  { id: 'found', time: '22:05', label: '遺體被發現' }
];
const finalQuestions = [
  { id: 'culprit', label: '1. 造成高橋莉奈死亡的人是誰？', answer: 'chinatsu', options: [['ryo', '神谷遼'], ['chinatsu', '藤原千夏'], ['takumi', '相澤拓海'], ['maki', '小野寺真紀']] },
  { id: 'place', label: '2. 莉奈受到致命傷的位置是？', answer: 'living', options: [['bathroom', '203號室浴室'], ['bedroom', '203號室臥室'], ['balcony', '203號室陽台'], ['living', '203號室客廳']] },
  { id: 'water', label: '3. 21:12的水聲實際來自什麼？', answer: 'automatic', options: [['automatic', '事先設定的浴室自動注水'], ['rina', '莉奈當時親自操作浴室放水'], ['visitor', '當時進屋的人手動打開熱水'], ['leak', '浴室漏水持續流入排水管']] },
  { id: 'purpose', label: '4. 為什麼要設定21:12自動注水？', answer: 'alibi', options: [['cleaning', '清除浴室痕跡，讓檢修漏水時不易被察覺'], ['habit', '完成莉奈原定的泡澡安排，讓生活紀錄不變'], ['alibi', '製造莉奈在21:12左右仍然活著的假象，誤導死亡時間'], ['intrusion', '掩蓋稍後有人闖入的聲音，讓鄰居無法察覺']] },
  { id: 'aftermath', label: '5. 莉奈死亡後，現場發生了什麼？', answer: 'staged', options: [['bathScene', '浴室發生撞擊，客廳遭清理，注水用來洗去浴室痕跡'], ['staged', '遺體移至浴室、客廳遭清理，並以自動注水製造死亡時間與浴室死亡假象'], ['later', '遺體留在客廳，後來的入屋者搬動遺體並設定浴室注水'], ['unchanged', '遺體留在浴室，客廳只是先前打掃，注水按原定安排開始']] }
];

// 初期只建立中性的項目與空白紀錄；調查後才填入指定文案。
document.getElementById('two-people-list').innerHTML = twoPeople.map(person => `
  <details class="investigation-card person-card" id="person-${person.id}">
    <summary><span class="person-name">${person.name}｜${person.age}歲</span><span class="relation">關係：${person.relation}</span><span class="expand-hint">查看紀錄 ＋</span></summary>
    <div class="person-details"><p>${person.description}</p><button type="button" class="paper-button two-investigate" data-id="${person.id}">初次詢問 · 1 AP</button><p id="two-clue-${person.id}" class="clue" hidden></p><div id="followups-${person.id}"></div></div>
  </details>`).join('');
document.getElementById('two-evidence-list').innerHTML = twoEvidence.map(item => `
  <article class="investigation-card evidence-card"><h3>${item.name}</h3><button type="button" class="paper-button two-investigate" data-id="${item.id}">調查 · 1 AP</button><p id="two-clue-${item.id}" class="clue" hidden></p></article>`).join('');

function twoItem(id) { return [...twoPeople, ...twoEvidence].find(item => item.id === id); }
function investigateTwo(id) {
  const item = twoItem(id);
  if (!item || caseTwo.acquired.has(id) || caseTwo.points <= 0) return;
  caseTwo.points -= 1;
  caseTwo.paid += 1;
  caseTwo.acquired.add(id);
  const clue = document.getElementById(`two-clue-${id}`);
  clue.textContent = item.clue;
  clue.hidden = false;
  updateTwo();
}
function askFollowup(id) {
  const item = twoFollowups.find(item => item.id === id);
  if (!item || !item.unlocked() || caseTwo.followups.has(id)) return;
  caseTwo.followups.add(id);
  const clue = document.getElementById(`followup-clue-${id}`);
  clue.textContent = item.clue;
  clue.hidden = false;
  updateTwo();
}
document.querySelectorAll('.two-investigate').forEach(button => button.addEventListener('click', () => investigateTwo(button.dataset.id)));
document.getElementById('two-people-list').addEventListener('click', event => {
  const button = event.target.closest('[data-followup]');
  if (button) askFollowup(button.dataset.followup);
});
document.querySelectorAll('.two-tab').forEach(button => button.addEventListener('click', () => {
  document.querySelectorAll('.two-panel').forEach(panel => { panel.hidden = panel.id !== `two-${button.dataset.panel}`; });
  document.querySelectorAll('.two-tab').forEach(tab => {
    const active = tab === button;
    tab.classList.toggle('active', active);
    tab.setAttribute('aria-pressed', String(active));
  });
}));

function renderFollowups() {
  twoFollowups.filter(item => item.unlocked()).forEach(item => {
    let section = document.getElementById(`followup-${item.id}`);
    if (!section) {
      section = document.createElement('section');
      section.id = `followup-${item.id}`;
      section.className = 'followup newly-available';
      section.innerHTML = `<h3>${item.title} <span class="new-label">NEW</span></h3><button class="paper-button" data-followup="${item.id}" type="button">${item.id === 'takumiConfront' ? '對質' : '追加詢問'} · 免費</button><p id="followup-clue-${item.id}" class="clue" hidden></p>`;
      document.getElementById(`followups-${item.owner}`).append(section);
    }
    const done = caseTwo.followups.has(item.id);
    section.classList.toggle('newly-available', !done);
    section.querySelector('.new-label').hidden = done;
    const button = section.querySelector('button');
    button.disabled = done;
    button.textContent = done ? (item.id === 'takumiConfront' ? '已對質' : '已詢問') : `${item.id === 'takumiConfront' ? '對質' : '追加詢問'} · 免費`;
  });
  twoPeople.forEach(person => {
    const summary = document.querySelector(`#person-${person.id} summary`);
    let badge = summary.querySelector('.new-label');
    const pending = twoFollowups.some(item => item.owner === person.id && item.unlocked() && !caseTwo.followups.has(item.id));
    if (pending && !badge) {
      badge = document.createElement('span');
      badge.className = 'new-label';
      badge.textContent = 'NEW';
      summary.append(badge);
    }
    if (badge) badge.hidden = !pending;
  });
}

function acquiredRecords() {
  return [causeRecord,
    ...[...twoPeople, ...twoEvidence].filter(item => caseTwo.acquired.has(item.id)),
    ...twoFollowups.filter(item => caseTwo.followups.has(item.id)).map(item => ({ ...item, name: `${twoPeople.find(p => p.id === item.owner).name}／${item.title}` }))
  ];
}
function recordCheckboxes() {
  return acquiredRecords().map(item => `<label class="record-choice"><input type="checkbox" name="records" value="${item.id}"><span>${item.name}</span></label>`).join('');
}
function radioChoices(name, entries) {
  return entries.map(([value, text]) => `<label class="note-choice"><input type="radio" name="${name}" value="${value}" required><span>${text}</span></label>`).join('');
}
function noteForm(node) {
  if (node.id === 'A') return `<p>根據目前的調查，拓海最可能隱瞞了什麼？</p><fieldset>${radioChoices('judgment', [['early','他在20:55以前就回到公寓'],['entered','他當晚曾進入203號室'],['conflict','他與莉奈發生肢體衝突'],['heater','他操作了浴室給湯器']])}</fieldset>`;
  if (node.id === 'B') return `<p>根據樓下住戶證詞，21:12至21:15曾聽見203號室浴室傳出水聲，因此警方初步將死亡時間推定於21:12之後。</p><fieldset class="supporting-records"><legend>從已取得的調查紀錄中，選取足以讓這項判斷需要重新檢視的資訊。</legend><div class="record-options">${recordCheckboxes()}</div></fieldset>`;
  if (node.id === 'C') return `<fieldset><legend>莉奈受到致命傷的位置可能是？</legend>${radioChoices('judgment', [['bath','203號室浴室'],['living','203號室客廳'],['bedroom','203號室臥室'],['balcony','203號室陽台']])}</fieldset><fieldset class="supporting-records"><legend>從已取得的調查紀錄中，選取支持判斷的資訊。</legend><div class="record-options">${recordCheckboxes()}</div></fieldset>`;
  return `<fieldset class="timeline-editor"><legend>重建各項紀錄的時間</legend>${[4,2,0,5,3,1].map(index => { const entry = timelineRecords[index]; return `<label>${entry.label}<select name="${entry.id}" required><option value="">選擇時間</option>${timelineRecords.map(item => `<option value="${item.time}">${item.time}</option>`).join('')}</select></label>`; }).join('')}</fieldset><fieldset><legend>原推定死亡時間</legend>${radioChoices('judgment', [['after','莉奈在21:12之後受到致命傷。'],['before','莉奈可能在21:12以前便已死亡。'],['water','21:12的水聲可確定莉奈當時仍然活著。']])}</fieldset>`;
}
function renderNotes() {
  noteNodes.filter(node => node.unlocked()).forEach(node => {
    let section = document.getElementById(`note-${node.id}`);
    if (!section) {
      section = document.createElement('article');
      section.id = `note-${node.id}`;
      section.className = 'reasoning-block note-sheet newly-available';
      section.innerHTML = `<p class="document-label">NOTE ${node.id} / <span class="note-state">NEW</span></p><h3>${node.title}</h3><form data-node="${node.id}">${noteForm(node)}<button class="paper-button" type="submit">記錄判斷</button></form><p class="note-feedback" role="status"></p><p class="note-record clue" hidden></p>`;
      document.getElementById('two-notes').append(section);
    }
    const done = caseTwo.nodes.has(node.id);
    section.classList.toggle('newly-available', !done);
    section.classList.toggle('confirmed-note', done);
    section.querySelector('.note-state').textContent = done ? '已記錄' : 'NEW';
    const form = section.querySelector('form');
    form.hidden = done;
    // 取得新紀錄後更新勾選列表，保留玩家已勾選的內容。
    if (!done && ['B','C'].includes(node.id)) {
      const selected = [...form.querySelectorAll('input[name="records"]:checked')].map(input => input.value);
      const options = form.querySelector('.record-options');
      if (options.children.length !== acquiredRecords().length) {
        options.innerHTML = recordCheckboxes();
        options.querySelectorAll('input').forEach(input => { input.checked = selected.includes(input.value); });
      }
    }
    const record = section.querySelector('.note-record');
    const mayRecord = done && (node.id !== 'A' || hasTwo('takumiConfront'));
    record.hidden = !mayRecord;
    if (mayRecord) record.textContent = node.record;
  });
}

// 支持紀錄要涵蓋命題所需的事實；可以引用不同來源的同類資訊。
function supportsJudgment(form, requiredTags) {
  const selected = new FormData(form).getAll('records');
  const records = acquiredRecords().filter(item => selected.includes(item.id));
  const tags = new Set(records.flatMap(item => item.tags || []));
  return records.length > 0 && requiredTags.every(tag => tags.has(tag))
    && records.every(item => (item.tags || []).some(tag => requiredTags.includes(tag)) || item.id === 'maki' && requiredTags.includes('scheduledWater'));
}
function validateNode(id, form) {
  const answers = new FormData(form);
  if (id === 'A') return answers.get('judgment') === 'entered';
  if (id === 'B') return supportsJudgment(form, ['scheduledWater','water42','habit38']);
  if (id === 'C') return answers.get('judgment') === 'living' && supportsJudgment(form, ['headInjury','victimBlood','wipedFloor','spilledTea']);
  return answers.get('judgment') === 'before' && timelineRecords.every(item => answers.get(item.id) === item.time);
}
document.getElementById('two-notes').addEventListener('submit', event => {
  event.preventDefault();
  const form = event.target.closest('form[data-node]');
  if (!form) return;
  const node = noteNodes.find(node => node.id === form.dataset.node);
  if (!node || !node.unlocked() || caseTwo.nodes.has(node.id)) return;
  const feedback = form.parentElement.querySelector('.note-feedback');
  if (!validateNode(node.id, form)) {
    feedback.textContent = '目前的資訊不足以支持這項判斷。';
    return;
  }
  caseTwo.nodes.add(node.id);
  feedback.textContent = '';
  // 每個初步節點只返還一次；沒有零 AP 免費調查的保底機制。
  if (['A','B','C'].includes(node.id) && !caseTwo.rewards.has(node.id)) {
    caseTwo.rewards.add(node.id);
    caseTwo.points = Math.min(CASE_TWO_AP, caseTwo.points + 1);
  }
  if (node.id === 'D') {
    const announcement = document.getElementById('timeline-announcement');
    announcement.textContent = 'TIMELINE CONTRADICTION';
    announcement.hidden = false;
  }
  updateTwo();
});

function finalReady() {
  return ['A','B','C','D'].every(id => caseTwo.nodes.has(id))
    && allTwo(['takumiConfront', 'chinatsuAudio', 'chinatsuTime', 'bath']);
}
function revealFinalQuestions() {
  const container = document.getElementById('two-final-content');
  const gate = document.getElementById('final-gate');
  if (!finalReady()) {
    gate.textContent = 'FINAL DEDUCTION\n\n最終推理尚未開放。\n\n目前掌握的資訊不足以重建案件全貌。';
    return;
  }
  if (container.children.length) return;
  gate.textContent = 'FINAL DEDUCTION UNLOCKED';
  gate.classList.add('unlocked-gate');
  container.innerHTML = `<form id="two-final-form">${finalQuestions.map(q => `<label class="final-question">${q.label}<select name="${q.id}" required><option value="">請選擇</option>${q.options.map(([value, text]) => `<option value="${value}">${text}</option>`).join('')}</select></label>`).join('')}<button id="two-submit" class="paper-button" type="submit">提交最終推理</button></form><p id="two-final-feedback" role="status"></p>`;
}
function updateTwo() {
  document.getElementById('two-points').textContent = caseTwo.points;
  document.getElementById('two-action-message').textContent = caseTwo.points === 0
    ? '剩餘AP：0。追加詢問、對質與調查筆記不消耗AP。'
    : '初次詢問與新證物調查：1 AP。追加詢問、對質與調查筆記：0 AP。';
  document.querySelectorAll('.two-investigate').forEach(button => {
    const item = twoItem(button.dataset.id);
    const done = caseTwo.acquired.has(item.id);
    button.disabled = done || caseTwo.points <= 0;
    button.textContent = done ? (twoPeople.includes(item) ? '已詢問' : '已調查') : caseTwo.points <= 0 ? 'AP不足' : (twoPeople.includes(item) ? '初次詢問 · 1 AP' : '調查 · 1 AP');
    button.closest('.investigation-card').classList.toggle('investigated', done);
  });
  renderFollowups();
  renderNotes();
  const revised = caseTwo.nodes.has('D');
  document.getElementById('initial-time').classList.toggle('struck-time', revised);
  document.getElementById('current-time').textContent = revised ? '重新調查中' : '';
  revealFinalQuestions();
}

document.getElementById('two-final-content').addEventListener('change', () => {
  const feedback = document.getElementById('two-final-feedback');
  if (feedback) feedback.textContent = '';
});
document.getElementById('two-final-content').addEventListener('submit', event => {
  event.preventDefault();
  if (!finalReady() || caseTwo.solved) return;
  const form = event.target.closest('#two-final-form');
  if (!form) return;
  const answers = Object.fromEntries(new FormData(form));
  if (finalQuestions.some(q => !answers[q.id])) return;
  caseTwo.answers = answers;
  const correctCount = finalQuestions.filter(q => answers[q.id] === q.answer).length;
  caseTwo.attempts += 1;
  if (caseTwo.firstAccuracy === null) caseTwo.firstAccuracy = correctCount;
  if (correctCount !== 5) {
    document.getElementById('two-final-feedback').textContent = '這項推論與現有紀錄仍有矛盾。';
    return;
  }
  caseTwo.solved = true;
  document.getElementById('two-status').textContent = 'SOLVED';
  renderEnding();
  showScreen('ending-screen', 'ending-heading');
});

function renderEnding() {
  // 高中資料只在犯罪重建讀完後建立，從一般證物和前期 DOM 移除。
  const crime = [
    '19:45左右，千夏前往203找莉奈。約20:05，兩人因過去事件開始爭執。莉奈留下了手機錄音。20:16，莉奈仍正常傳出訊息。',
    '爭執中，千夏試圖搶走莉奈的手機。兩人拉扯，莉奈失去平衡，後腦撞上客廳矮櫃。這次致命撞擊不是預謀殺人。',
    '莉奈失去反應後，千夏恐慌。她將莉奈移至浴室，清理客廳部分痕跡，處理破裂茶杯，設定21:12浴室預約自動注水，水溫42°C。',
    '她要製造莉奈在21:12左右仍活著、正在洗澡的假象，將死亡時間往後推。千夏約20:47離開203。',
    '約20:55，拓海回到204。約21:00，他從204陽台翻入203，直接前往莉奈臥室的書桌抽屜，只取走自己以前寫給莉奈的信紙，把空信封留回原處。他沒有進浴室，沒有看到莉奈，再從陽台返回204。',
    '21:12，自動注水開始。真紀聽見水聲，以為莉奈當時正在洗澡。22:05，管理人發現遺體。',
    '致命撞擊不是預謀。但搬動遺體、清理現場、設定自動注水、製造假死亡時間、對警方說謊，都是千夏後續主動做出的選擇。'
  ];
  const school = [
    '案件破解後，警方從莉奈保存的舊資料與數位資料中確認：高中時真正匿名散播那些內容的人，其實是莉奈。',
    '高中時期，千夏非常討厭班上一名女同學。她私下向自己最信任的莉奈抱怨對方，說過很惡毒的話，也把對方的一些私人資訊告訴莉奈。',
    '之後，這些內容遭人匿名散播。那名同學遭受長期且嚴重的校園霸凌、排擠與孤立，最後因霸凌而轉學。',
    '千夏一直認為這場悲劇的源頭是自己。她認為那些內容只有自己與莉奈知道，莉奈卻始終否認曾將內容告訴任何人。千夏長年背負「是自己害那名同學遭霸凌並轉學」的罪惡感，莉奈利用這份罪惡感控制她多年。',
    '千夏確實說過惡毒的話，也確實洩漏過他人隱私。但她沒有把內容公開散播，也不是她主動發起後續霸凌。她多年來背負的罪惡感遠超過她真正做過的事。',
    '莉奈曾長期操控、傷害他人，但她不因此應該死亡。千夏長期受到操控，但她在莉奈死亡後偽造現場與欺騙警方，仍需為自己的選擇負責。',
    '「……原來不是我。」\n\n「那件事……不是我做的。」\n\n「如果我早一點知道……」\n\n「我是不是就能早一點離開她？」',
    '……',
    '「我那天去找她，真的只是想告訴她……」\n\n「以後不要再聯絡了。」\n\n「就只有這樣而已。」'
  ];
  const story = caseTwo.truthStage === 'crime' ? crime : school;
  document.getElementById('ending-story').replaceChildren(...story.map(text => {
    const paragraph = document.createElement('p');
    paragraph.textContent = text;
    return paragraph;
  }));
  document.getElementById('continue-truth').hidden = caseTwo.truthStage !== 'crime';
  document.getElementById('close-case').hidden = caseTwo.truthStage !== 'school';
  const score = caseTwo.firstAccuracy * 10 + caseTwo.nodes.size * 8 + (hasTwo('makiRelation') ? 8 : 0) + (caseTwo.paid <= 14 ? 10 : 5);
  const rank = score >= 95 ? 'S' : score >= 80 ? 'A' : score >= 65 ? 'B' : 'C';
  document.getElementById('deduction-rank').textContent = `DEDUCTION RANK / ${rank}`;
  document.getElementById('rank-detail').textContent = `首次推理 ${caseTwo.firstAccuracy}／5 · 調查 ${caseTwo.paid} AP`;
}
document.getElementById('continue-truth').addEventListener('click', () => {
  if (!caseTwo.solved || caseTwo.truthStage !== 'crime') return;
  caseTwo.truthStage = 'school';
  renderEnding();
  window.scrollTo(0, 0);
  document.getElementById('ending-heading').focus();
});
document.getElementById('close-case').addEventListener('click', async event => {
  if (!caseTwo.solved || caseTwo.truthStage !== 'school' || caseTwo.closed) return;
  event.currentTarget.disabled = true;
  const screen = document.getElementById('ending-screen');
  if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    await screen.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 650, easing: 'ease' }).finished;
  }
  caseTwo.closed = true;
  showScreen('closed-screen');
});
updateTwo();
