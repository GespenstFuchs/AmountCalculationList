declare const Android: {
    showToast(message: string): void;
    showError(message: string): void;
};

// グローバルに関数を公開する。（minifyした際に削除されないようにする。）
(window as any).toggleMinus = toggleMinus;
(window as any).addItem = addItem;
(window as any).deleteItems = deleteItems;
(window as any).saveItem = saveItem;

/**
 * キー
 */
const KEY: string = "AMOUNT_CALCULATION_LIST";

/**
 * DOM要素
 */
const dateInput = document.getElementById("date") as HTMLInputElement;
const yenInput = document.getElementById("yen") as HTMLInputElement;
const memoInput = document.getElementById("memo") as HTMLInputElement;
const deleteButton = document.getElementById("deleteButton") as HTMLButtonElement;
const saveButton = document.getElementById("saveButton") as HTMLButtonElement;
const totalAmount = document.getElementById("totalAmount") as HTMLSpanElement;

/**
 * 状態管理
 */
let DateText: string = "";
let YenText: string = "";
let SelectedIndex: number = -1;
let CheckedAr: boolean[] = [];

/**
 * データ読み込み処理
 */
const loadData = (): string[] =>
    (localStorage.getItem(KEY) || "")
        .split("\n")
        .filter(x => x !== "");

/**
 * データ保存処理
 */
const saveData = (list: string[]): void => {
    localStorage.setItem(KEY, list.join("\n"));
};

/**
 * 本日日付設定処理
 */
function setToday(): void {
    const today = new Date();
    dateInput.value =
        `${today.getFullYear()}/` +
        `${String(today.getMonth() + 1).padStart(2, "0")}/` +
        `${String(today.getDate()).padStart(2, "0")}`;
}

/**
 * ボタンの有効・無効制御処理
 */
function setDisabledButtons(): void {
    deleteButton.disabled = !CheckedAr.some(v => v);
    saveButton.disabled = SelectedIndex === -1;
}

/**
 * 画面描画処理
 */
function render(
    addedIndex: number = -1,
    savedIndex: number = -1,
    initFlg: boolean = false
): void {

    const listDiv = document.getElementById("list") as HTMLDivElement;
    listDiv.innerHTML = "";

    let total: number = 0;
    const rows = loadData();

    if (initFlg) {
        CheckedAr = new Array<boolean>(rows.length).fill(false);
    }

    // フラグメントを生成する。
    const fragment = document.createDocumentFragment();

    if (rows.length === 0) {
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.innerHTML = `
            <div onclick="addItem()">
                <div style="font-size:26px;">🦊</div>
                <div>👻まだ無いよ👻</div>
            </div>
        `;
        fragment.appendChild(empty);
    }

    rows.forEach((row: string, index: number) => {
        const [dateStr, yenStr, memoStr] = row.split(",", 3);
        const yenNum: number = Number(yenStr ?? 0);
        total += yenNum;

        const item = document.createElement("div");
        item.className = "item";

        if (index === SelectedIndex) item.classList.add("selected");
        if (index === addedIndex) {
            item.classList.add("added");
            setTimeout(() => item.classList.remove("added"), 350);
        }

        if (index === savedIndex) {
            item.classList.add("saved");
            setTimeout(() => item.classList.remove("saved"), 500);
        }

        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "star-check";
        cb.checked = CheckedAr[index] ?? false;

        cb.onclick = (e: MouseEvent): void => {
            e.stopPropagation();

            cb.classList.remove(cb.checked ? "rotate-off" : "rotate-on");
            void cb.offsetWidth;
            cb.classList.add(cb.checked ? "rotate-on" : "rotate-off");

            CheckedAr[index] = cb.checked;
            setDisabledButtons();
        };

        item.appendChild(cb);

        const l1 = document.createElement("div");
        l1.className = "line1";

        const sp1 = document.createElement("span");
        sp1.textContent = dateStr ?? "";

        const sp2 = document.createElement("span");
        sp2.className = "yen";
        sp2.textContent =
            yenNum < 0
                ? `￥-${Math.abs(yenNum).toLocaleString()}`
                : `￥${yenNum.toLocaleString()}`;
        sp2.style.color = yenNum < 0 ? "red" : "#6840D8";

        l1.append(sp1, sp2);

        const l2 = document.createElement("div");
        l2.className = "line2";
        l2.textContent = memoStr || "";

        item.append(l1, l2);

        item.onclick = (): void => {
            SelectedIndex = index;
            dateInput.value = dateStr ?? "";
            yenInput.value = yenStr ?? "";
            memoInput.value = memoStr ?? "";

            render();
            setDisabledButtons();
        };

        fragment.appendChild(item);
    });

    // フラグメントを追加する。
    listDiv.appendChild(fragment);

    totalAmount.textContent = `¥${total.toLocaleString()}`;
    totalAmount.style.color = total < 0 ? "red" : "#6840D8";

    setDisabledButtons();
}

/**
 * 入力チェック処理
 */
function valueCheck(dateText: string, yenText: string): boolean {

    if (dateText.trim() === "") {
        Android.showError("日付が未入力");
        return false;
    }

    if (dateText.trim().length > 10) {
        Android.showError("日付は１０桁まで入力可能");
        return false;
    }

    if (!/^[0-9/]+$/.test(dateText.trim())) {
        Android.showError("日付は【半角数値】・【/】のみ入力可能");
        return false;
    }

    const checkValue = yenText.trim();

    if (checkValue === "") {
        Android.showError("金額が未入力");
        return false;
    }

    const idx = checkValue.indexOf("-");
    if (idx !== -1 && idx !== 0) {
        Android.showError("【-】の位置が不正");
        return false;
    }

    if (!/^-?\d+$/.test(checkValue)) {
        Android.showError("金額は【-】・【半角数値】のみ入力可能");
        return false;
    }

    if (memoInput.value.includes(",")) {
        Android.showError("メモに【,】は入力不可");
        return false;
    }

    DateText = dateText.trim();
    YenText = checkValue;
    return true;
}

/**
 * 項目追加処理
 */
function addItem(): void {
    if (!valueCheck(dateInput.value, yenInput.value)) return;

    const list = loadData();
    list.unshift(`${DateText},${YenText},${memoInput.value}`);
    saveData(list);

    CheckedAr.unshift(false);
    if (SelectedIndex !== -1) SelectedIndex++;

    render(0);
    setToday();
    yenInput.value = "";
    memoInput.value = "";

    Android.showToast("新規追加しました。");
}

/**
 * 項目削除処理
 */
function deleteItems(): void {

    const rows = loadData();
    const items = document.querySelectorAll<HTMLDivElement>(".item");

    const checkedFlg: boolean = !!CheckedAr[SelectedIndex];
    let nextSelectedIndex = -1;

    items.forEach((item, index) => {
        if (CheckedAr[index]) {
            item.classList.add("puff");
        } else if (index <= SelectedIndex) {
            nextSelectedIndex++;
        }
    });

    setTimeout(() => {
        const newRows: string[] = [];
        const newChecked: boolean[] = [];

        rows.forEach((row, index) => {
            if (!CheckedAr[index]) {
                newRows.push(row);
                newChecked.push(false);
            }
        });

        saveData(newRows);
        CheckedAr = newChecked;
        SelectedIndex = checkedFlg ? -1 : nextSelectedIndex;

        render();
        Android.showToast("削除しました。");
    }, 350);
}

/**
 * 保存処理
 */
function saveItem(): void {
    if (!valueCheck(dateInput.value, yenInput.value)) return;

    const list = loadData();
    list[SelectedIndex] = `${dateInput.value},${yenInput.value},${memoInput.value}`;
    saveData(list);

    render(-1, SelectedIndex);
    Android.showToast("保存しました。");
}

/**
 * マイナス切り替え処理
 */
function toggleMinus(): void {
    yenInput.value = yenInput.value.startsWith("-")
        ? yenInput.value.substring(1)
        : "-" + yenInput.value;
};

/**
 * 初期化処理
 */
setToday();
render(-1, -1, true);
