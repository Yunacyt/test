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
const sectionButtons = document.querySelectorAll(".section-button");
const sectionPanels = document.querySelectorAll(".section-panel");

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
  document.getElementById("case-screen").hidden = false;
  document.getElementById("case-heading").focus();
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
