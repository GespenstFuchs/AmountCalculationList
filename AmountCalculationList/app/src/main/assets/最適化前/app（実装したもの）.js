/**
 * キー
 */
const KEY = "AMOUNT_CALCULATION_LIST";

/**
 * 日付要素
 */
const dateInput = document.getElementById("date");

/**
 * 金額要素
 */
const yenInput = document.getElementById("yen");

/**
 * メモ要素
 */
const memoInput = document.getElementById("memo");

/**
 * 削除ボタン
 */
const deleteButton = document.getElementById("deleteButton");

/**
 * 保存ボタン
 */
const saveButton = document.getElementById("saveButton");

// 日付テキスト
let DateText = "";

// 金額テキスト
let YenText = "";

// 選択位置
let SelectedIndex = -1;

// 各項目のチェック状態を保持する配列
let CheckedAr = [];

// データ読み込み処理
const loadData = () => (localStorage.getItem(KEY) || "").split("\n").filter(x => x !== "");

// データ保存処理
const saveData = list => localStorage.setItem(KEY, list.join("\n"));

/**
 * 本日日付設定処理
 */
function setToday() {
    const today = new Date();
    date.value = `${today.getFullYear()}/${String(today.getMonth() + 1).padStart(2, "0")}/${String(today.getDate()).padStart(2, "0")}`;
}

/**
 * ボタンの有効・無効設定処理
 */
function setDisabledButtons() {
    deleteButton.disabled = !CheckedAr.some(value => value);
    saveButton.disabled = SelectedIndex === -1;
}

/**
 * 画面描画処理
 */
function render(addedIndex = -1, savedIndex = -1, initFlg = false) {
    // リスト表示領域を取得・保持し、クリアする。
    const listDiv = document.getElementById("list");
    listDiv.innerHTML = "";

    let total = 0;

    // 保存済みのデータを読み込む。
    const rows = loadData();

    // 初期化フラグを判定する。
    if (initFlg) {
        // 【未チェック】で初期化する。
        CheckedAr = new Array(rows.length).fill(false);
    }

    // 項目数を判定する。
    if (rows.length === 0) {
        // ０件の場合
        const empty = document.createElement("div");
        empty.className = "empty";
        empty.innerHTML = `
                <div onclick="addItem()">
                    <div style="font-size:26px;">🦊</div>
                    <div>👻まだ無いよ👻</div>
                </div>
`;
        listDiv.appendChild(empty);
    }

    // 各行を処理する。
    rows.forEach((row, index) => {
        // 各値を分解し、保持する。
        const [dateStr, yenStr, memoStr] = row.split(",", 3);
        const yenNum = parseInt(yenStr, 10) || 0;
        total += yenNum;

        // 項目を取得し、スタイルを設定する。
        const item = document.createElement("div");
        item.className = "item";

        // 選択
        if (index === SelectedIndex) {
            item.classList.add("selected");
        }

        // 追加
        if (index === addedIndex) {
            item.classList.add("added");
            item.addEventListener("animationend", () => {
                item.classList.remove("added");
            }, { once: true });
        }

        // 保存
        if (index === savedIndex) {
            item.classList.add("saved");
            item.addEventListener("animationend", () => {
                item.classList.remove("saved");
            }, { once: true });
        }

        // チェックボックスを設定する。
        const cb = document.createElement("input");
        cb.type = "checkbox";
        cb.className = "star-check";
        cb.checked = CheckedAr[index];

        // チェックボックス押下処理
        cb.onclick = e => {
            // 親要素のクリック処理を止める。
            e.stopPropagation();

            // チェックの有無を判定し、アニメーションを実行する。
            if (cb.checked) {
                cb.classList.remove("rotate-off");
                void cb.offsetWidth;    // 強制的に再描画させ、確実にアニメーションを動かすようにする。
                cb.classList.add("rotate-on");
            } else {
                cb.classList.remove("rotate-on");
                void cb.offsetWidth;    // 強制的に再描画させ、確実にアニメーションを動かすようにする。
                cb.classList.add("rotate-off");
            }

            // チェック状態を保持し、ボタンの有効・無効設定処理を呼び出す。
            CheckedAr[index] = cb.checked;
            setDisabledButtons();
        };

        // 項目にチェックボックスを追加する。
        item.appendChild(cb);

        // １行目
        const l1 = document.createElement("div");
        l1.className = "line1";

        // 日付
        const sp1 = document.createElement("span");
        sp1.textContent = dateStr;

        // 金額
        const sp2 = document.createElement("span");
        sp2.className = "yen";
        sp2.textContent = yenNum < 0 ? `￥-${Math.abs(yenNum).toLocaleString()}` : `￥${yenNum.toLocaleString()}`;
        sp2.style.color = yenNum < 0 ? "red" : "#6840D8";

        // １行目に日付・金額を追加する。
        l1.appendChild(sp1);
        l1.appendChild(sp2);

        // ２行目
        // メモ
        const l2 = document.createElement("div");
        l2.className = "line2";
        l2.textContent = memoStr || "";

        // 項目に１行目・２行目を追加する。
        item.appendChild(l1);
        item.appendChild(l2);

        // 項目押下処理
        item.onclick = () => {
            // 各値を保持する。
            SelectedIndex = index;
            date.value = dateStr;
            yen.value = yenStr;
            memo.value = memoStr;

            // 画面を再描画し、ボタンの有効・無効設定処理を呼び出す。
            render();
            setDisabledButtons();
        };

        // リストに項目を追加する。
        listDiv.appendChild(item);
    });

    // 合計金額表示領域を更新する。
    totalAmount.textContent = `¥${total.toLocaleString()}`;
    totalAmount.style.color = total < 0 ? "red" : "#6840D8";

    // ボタンの有効・無効設定処理を呼び出す。
    setDisabledButtons();
}

/**
 * チェック処理
 */
function valueCheck(dateText, yenText) {
    // 日付未入力チェック
    if (dateText.trim() === "") {
        Android.showError("日付が未入力");
        return false;
    }

    // 桁数チェック
    if (dateText.trim().length > 10) {
        Android.showError("日付は１０桁まで入力可能");
        return false;
    }

    // 半角数値・スラッシュのみチェック
    if (!/^[0-9/]+$/.test(dateText.trim())) {
        Android.showError("日付は【半角数値】・【/】のみ入力可能");
        return false;
    }

    let checkValue = yenText.trim();

    // 金額未入力チェック
    if (checkValue === "") {
        Android.showError("金額が未入力");
        return false;
    }

    // ハイフンの位置チェック
    let index = checkValue.indexOf("-");
    if (index !== -1 && index !== 0) {
        Android.showError("【-】の位置が不正");
        return false;
    }

    // ハイフン・半角数値のみチェック
    if (!/^-?\d+$/.test(checkValue.trim())) {
        Android.showError("金額は【-】・【半角数値】のみ入力可能");
        return false;
    }

    // 値を保持する。
    DateText = dateText.trim();
    YenText = checkValue;

    // カンマチェック
    if (memo.value.indexOf(",") !== -1) {
        Android.showError("メモに【,】は入力不可");
        return false;
    }

    return true;
}

/**
 * 項目追加処理
 */
function addItem() {
    if (valueCheck(date.value, yen.value)) {
        // リストを読み込み、入力項目を先頭に追加する。
        const list = loadData();
        list.unshift(`${DateText},${YenText},${memo.value}`);
        saveData(list);

        // 新規項目は、未チェックとして保持する。
        CheckedAr.unshift(false);

        // 選択位置を判定する。
        if (SelectedIndex !== -1) {
            // 項目が選択されている場合、項目が先頭に追加されるので、選択位置もインクリメントする。
            SelectedIndex += 1;
        }

        // 再描画する。
        render(0);

        // 各値を設定する。
        setToday();
        yen.value = "";
        memo.value = "";

        // トーストを表示する。
        Android.showToast("新規追加しました。");
    }
}

/**
 * 項目削除処理
 */
function deleteItems() {
    const rows = loadData();
    const items = document.querySelectorAll(".item");

    // チェックフラグを設定する。
    // （ディープコピーする。）
    let checkedFlg = structuredClone(CheckedAr[SelectedIndex]);

    let nextSelectedIndex = -1;

    // 全項目に処理を行う。
    items.forEach((item, index) => {
        // チェックの有無を判定する。
        if (CheckedAr[index]) {
            // チェックされている場合

            // 削除アニメーションを設定する。
            item.classList.add("puff");
        } else {
            // チェックされていない場合

            // 現在の選択位置までインクリメントを行い、削除後の選択位置を設定する。
            if (index <= SelectedIndex) {
                nextSelectedIndex += 1
            }
        }
    });

    // アニメーションが完了したら、リストを再生成させるため、待機してから処理を行う。
    setTimeout(() => {
        // チェックされていない項目で、新しい配列を生成する。
        const newRows = [];
        const newCheckedAr = [];
        rows.forEach((row, index) => {
            if (!CheckedAr[index]) {
                newRows.push(row);
                newCheckedAr.push(false);
            }
        });

        // データ保存処理を呼び出し、チェック配列を更新する。
        saveData(newRows);
        CheckedAr = newCheckedAr;

        // チェックフラグを判定する。
        if (checkedFlg) {
            // チェックされている場合
            SelectedIndex = -1;
        } else {
            // チェックされていない場合
            SelectedIndex = nextSelectedIndex;
        }

        // 再描画する。
        render();

        // トーストを表示する。
        Android.showToast("削除しました。");
    }, 350);
}

/**
 * 項目保存処理
 */
function saveItem() {
    if (valueCheck(date.value, yen.value)) {
        // リストを読み込み、選択項目を更新する。
        const list = loadData();
        list[SelectedIndex] = `${date.value},${yen.value},${memo.value}`;
        saveData(list);

        // 再描画する。
        render(-1, SelectedIndex);

        // トーストを表示する。
        Android.showToast("保存しました。");
    }
}

/**
 * ハイフン切り替え処理
 */
const toggleMinus = () => {
    yen.value = yen.value.startsWith("-") ? yen.value.substring(1) : "-" + yen.value;
};

// 初期化処理：本日日付を設定し、リストを描画する。
setToday();
render(-1, -1, true);