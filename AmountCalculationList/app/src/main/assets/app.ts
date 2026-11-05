/* ===============================
   型定義
================================ */
// Androidインターフェース
declare const Android: {
    getSafeAreaInsets(): string;
};

/* ===============================
   項目定義
================================ */
const totalAmount = document.getElementById("totalAmount") as HTMLSpanElement;
const listDiv = document.getElementById("list") as HTMLDivElement;
const dateInput = document.getElementById("date") as HTMLInputElement;
const yenInput = document.getElementById("yen") as HTMLInputElement;
const toggleMinusButton = document.getElementById("toggleMinusButton") as HTMLButtonElement;
const memoInput = document.getElementById("memo") as HTMLInputElement;
const addButton = document.getElementById("addButton") as HTMLDivElement;
const saveButton = document.getElementById("saveButton") as HTMLDivElement;
const deleteButton = document.getElementById("deleteButton") as HTMLDivElement;
const clearButton = document.getElementById("clearButton") as HTMLDivElement;

// メニュー
const deleteMenu = document.getElementById("deleteMenu") as HTMLDivElement;
const selectDeleteItem = document.getElementById("selectDeleteItem") as HTMLDivElement;
const allDeleteItem = document.getElementById("allDeleteItem") as HTMLDivElement;

// カスタムトースト
const customToast = document.getElementById("customToast") as HTMLDivElement;

// カスタム確認ダイアログ
const confirmOverlay = document.getElementById("customConfirmOverlay") as HTMLDivElement;
const confirmMessage = document.getElementById("confirmMessage") as HTMLDivElement;
const confirmOkButton = document.getElementById("confirmOkButton") as HTMLButtonElement;
const confirmCancelButton = document.getElementById("confirmCancelButton") as HTMLButtonElement;

/* ===============================
   定数定義
================================ */
// キー
const KEY: string = "AMOUNT_CALCULATION_LIST";

/* ===============================
   変数定義
================================ */
// 状態管理
let DateText: string = "";
let YenText: string = "";
let SelectedIndex: number = -1;
let CheckedAr: boolean[] = [];
let previousTotal: number | null = null;
let toastTimeout: number | null = null;

// コールバック関数
let confirmCallback: (() => void) | null = null;

/**
 * カスタム確認ダイアログ表示処理
 * @param message 表示メッセージ
 * @param okButtonLabel ＯＫボタンラベル
 * @param onOkButtonClicked ＯＫボタン押下イベント（コールバック）
 */
function showConfirm(message: string, okButtonLabel: string, onOkButtonClicked: () => void): void {
    confirmMessage.textContent = message;
    confirmOkButton.textContent = okButtonLabel;
    confirmCallback = onOkButtonClicked;
    confirmOverlay.classList.add("show");
}

/**
 * カスタム確認ダイアログ非表示処理
 */
function closeConfirm(): void {
    confirmOverlay.classList.remove("show");
    confirmCallback = null;
}

/**
 * カスタムトースト表示処理
 * @param message メッセージ
 */
function showCustomToast(message: string): void {
    if (customToast) {
        // 既存のタイマーがあればクリアする。
        if (toastTimeout) clearTimeout(toastTimeout);

        // アニメーションを再起動するために一度クラスを外す。
        customToast.classList.remove("show");
        void customToast.offsetWidth; // リフロー強制

        // textContentを使用することで、改行コードを安全に解釈させる。
        customToast.textContent = message;

        // クラスを付けて表示する。
        customToast.classList.add("scroll", "show");

        // ２秒後にフェードアウトさせる。
        toastTimeout = window.setTimeout(() => {
            customToast.classList.remove("show");
        }, 2000);
    }
}

/**
 * セーフエリア再計算処理
 */
function refreshSafeArea(): void {
    const jsonStr = Android.getSafeAreaInsets();
    if (jsonStr && jsonStr !== "{}") {
        // インセットを取得し、CSS変数を更新する。
        const insets = JSON.parse(jsonStr);
        const doc = document.documentElement;
        doc.style.setProperty('--safe-top', `${insets.top}px`);
        doc.style.setProperty('--safe-bottom', `${insets.bottom}px`);
    }
}

/**
 * データ読み込み処理
 */
const loadData = (): string[] => (localStorage.getItem(KEY) || "").split("\n").filter(item => item !== "");

/**
 * データ保存処理
 */
const saveData = (list: string[]): void => localStorage.setItem(KEY, list.join("\n"));

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
 * コントロールの有効・無効制御処理
 */
function setDisabledControl(): void {
    const hasChecked = CheckedAr.some(check => check);

    // 保存ボタン
    if (SelectedIndex === -1) {
        saveButton.classList.add("disabled");
    } else {
        saveButton.classList.remove("disabled");
    }

    // 選択削除メニュー
    if (hasChecked) {
        selectDeleteItem.classList.remove("disabled");
    } else {
        selectDeleteItem.classList.add("disabled");
    }

    // 全削除メニュー
    if (loadData().length > 0) {
        allDeleteItem.classList.remove("disabled");
    } else {
        allDeleteItem.classList.add("disabled");
    }
}

/**
 * 画面描画処理
 * @param [addedIndex=-1] 追加された項目位置
 * @param [savedIndex=-1] 保存された項目位置
 * @param [initFlg=false] 初期表示フラグ
 */
function render(
    addedIndex: number = -1,
    savedIndex: number = -1,
    initFlg: boolean = false
): void {
    listDiv.innerHTML = "";

    let total: number = 0;
    const rows = loadData();

    if (initFlg) {
        CheckedAr = new Array<boolean>(rows.length).fill(false);
    }

    // フラグメントを生成する。
    const fragment = document.createDocumentFragment();

    // 項目が存在しない場合は、空項目を設定する。
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

    // データを元に項目を生成する。
    rows.forEach((row: string, index: number) => {
        const [dateStr, yenStr, memoStr] = row.split(",", 3);
        const yenNum: number = Number(yenStr ?? 0);
        total += yenNum;

        const item = document.createElement("div");
        item.className = "item";

        // 初期表示時は時間差でふわっと表示させるアニメーション
        if (initFlg) {
            item.classList.add("stagger-in");
            item.style.animationDelay = `${index * 0.05}s`;
            // アニメーション完了後にクラスを外して、通常の浮遊アニメーションに移行させる。
            setTimeout(() => {
                item.classList.remove("stagger-in");
                item.style.animationDelay = "";
            }, index * 50 + 400);
        }

        if (index === SelectedIndex) item.classList.add("selected");
        if (index === addedIndex) {
            item.classList.add("added");
            setTimeout(() => item.classList.remove("added"), 350);
        }

        if (index === savedIndex) {
            item.classList.add("saved");
            setTimeout(() => item.classList.remove("saved"), 500);
        }

        // チェックボックスを生成する。
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
            setDisabledControl();
        };

        item.appendChild(cb);

        // 日付と金額を表示する行を生成する。
        const l1 = document.createElement("div");
        l1.className = "line1";

        const sp1 = document.createElement("span");
        sp1.textContent = dateStr ?? "";

        const sp2 = document.createElement("span");
        sp2.className = "yen";
        sp2.textContent = yenNum < 0
            ? `￥-${Math.abs(yenNum).toLocaleString()}`
            : `￥${yenNum.toLocaleString()}`;
        sp2.style.color = yenNum < 0 ? "red" : "#6840D8";

        l1.append(sp1, sp2);

        // メモを表示する行を生成する。
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
            setDisabledControl();
        };

        fragment.appendChild(item);
    });

    // フラグメントを追加する。
    listDiv.appendChild(fragment);

    totalAmount.textContent = `¥${total.toLocaleString()}`;
    totalAmount.style.color = total < 0 ? "red" : "#6840D8";

    if (previousTotal !== null && previousTotal !== total) {
        // 合計金額のアニメーションを再起動するために一度クラスを外す。
        totalAmount.classList.remove("pop-total");
        void totalAmount.offsetWidth;
        totalAmount.classList.add("pop-total");
    }
    previousTotal = total;

    setDisabledControl();
}

/**
 * 入力チェック処理
 * @param dateText 日付テキスト
 * @param yenText 金額テキスト
 * @return チェック結果
 */
function valueCheck(dateText: string, yenText: string): boolean {
    if (dateText.trim() === "") {
        showCustomToast("日付が未入力です ❌");
        return false;
    }

    if (dateText.trim().length > 10) {
        showCustomToast("日付は１０桁までです ❌");
        return false;
    }

    if (!/^[0-9/]+$/.test(dateText.trim())) {
        showCustomToast("日付は【半角数値】・【/】のみです ❌");
        return false;
    }

    const checkValue = yenText.trim();

    if (checkValue === "") {
        showCustomToast("金額が未入力です ❌");
        return false;
    }

    const idx = checkValue.indexOf("-");
    if (idx !== -1 && idx !== 0) {
        showCustomToast("【-】の位置が不正です ❌");
        return false;
    }

    if (!/^-?\d+$/.test(checkValue)) {
        showCustomToast("金額は【-】・【半角数値】のみです ❌");
        return false;
    }

    if (memoInput.value.includes(",")) {
        showCustomToast("メモに【,】は入力不可です ❌");
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
    // 入力チェックを行う。
    if (!valueCheck(dateInput.value, yenInput.value)) return;

    // データを保存する。
    const list = loadData();
    list.unshift(`${DateText},${YenText},${memoInput.value}`);
    saveData(list);

    CheckedAr.unshift(false);
    if (SelectedIndex !== -1) SelectedIndex++;

    render(0);
    setToday();
    yenInput.value = "";
    memoInput.value = "";

    showCustomToast("新規追加しました ✨");
}

/**
 * 項目削除処理
 */
function deleteItems(): void {
    // 削除対象の件数を取得する。
    const deleteCount = CheckedAr.filter(checked => checked).length;

    // 件数の数字を全角に変換する。
    const fullWidthDeleteCount = String(deleteCount).replace(/[0-9]/g, digit =>
        String.fromCharCode(digit.charCodeAt(0) + 0xFEE0)
    );

    // 確認ダイアログを表示し、ＯＫが押された場合だけ削除する。
    showConfirm(
        `チェックした${fullWidthDeleteCount}件のデータを削除してもよろしいですか？`,
        "選択削除",
        () => {
            const rows = loadData();
            const items = document.querySelectorAll<HTMLDivElement>(".item");

            // 確認時点の選択状態と選択項目を保持する。
            // アニメーション中にチェック状態が変わっても削除対象が変わらないようにする。
            const checkedSnapshot = [...CheckedAr];
            const selectedIndexSnapshot = SelectedIndex;
            const checkedFlg: boolean = !!checkedSnapshot[selectedIndexSnapshot];
            let nextSelectedIndex = -1;

            // 削除対象にアニメーションを設定する。
            items.forEach((item, index) => {
                if (checkedSnapshot[index]) {
                    item.classList.add("puff");
                } else if (index <= selectedIndexSnapshot) {
                    nextSelectedIndex++;
                }
            });

            // アニメーション完了後にデータを削除する。
            setTimeout(() => {
                const newRows: string[] = [];
                const newChecked: boolean[] = [];

                rows.forEach((row, index) => {
                    if (!checkedSnapshot[index]) {
                        newRows.push(row);
                        newChecked.push(false);
                    }
                });

                saveData(newRows);
                CheckedAr = newChecked;
                SelectedIndex = checkedFlg ? -1 : nextSelectedIndex;

                render();
                showCustomToast("削除しました 🗑️");
            }, 350);
        }
    );
}

/**
 * 保存処理
 */
function saveItem(): void {
    // 入力チェックを行う。
    if (!valueCheck(dateInput.value, yenInput.value)) return;

    // データを保存する。
    const list = loadData();
    list[SelectedIndex] = `${dateInput.value},${yenInput.value},${memoInput.value}`;
    saveData(list);

    render(-1, SelectedIndex);
    showCustomToast("保存しました 💾");
}

/**
 * クリア処理
 */
function clear(): void {
    // 値をクリアする。
    setToday();
    yenInput.value = "";
    memoInput.value = "";

    showCustomToast("クリアしました 🧹");
}

/**
 * 全削除処理
 */
function deleteAllItems(): void {
    // カスタム確認ダイアログを表示する。
    showConfirm(
        "全てのデータを削除してもよろしいですか？",
        "全削除",
        () => {
            saveData([]);
            CheckedAr = [];
            SelectedIndex = -1;
            render(-1, -1, true);
            showCustomToast("全項目を削除しました 💣");
    });
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
 * イベントリスナー設定処理
 */
function setEventListeners(): void {
    toggleMinusButton.addEventListener("click", toggleMinus);
    addButton.addEventListener("click", addItem);
    saveButton.addEventListener("click", saveItem);
    deleteButton.addEventListener("click", () => {
        if (deleteMenu.classList.contains("show")) {
            deleteMenu.classList.remove("show");
            return;
        }

        setDisabledControl();
        deleteMenu.classList.add("show");
    });
    clearButton.addEventListener("click", clear);
    confirmOkButton.addEventListener("click", () => {
        if (confirmCallback) {
            confirmCallback();
        }
        closeConfirm();
    });
    confirmCancelButton.addEventListener("click", closeConfirm);

    // メニュー
    selectDeleteItem.addEventListener("click", () => {
        deleteMenu.classList.remove("show");
        setTimeout(() => {
            deleteItems();
        }, 0);
    });
    allDeleteItem.addEventListener("click", () => {
        deleteMenu.classList.remove("show");
        setTimeout(() => {
            deleteAllItems();
        }, 0);
    });

    // ドキュメント
    document.addEventListener("click", e => {
        const target = e.target as HTMLElement;

        // メニュー以外の場所がクリックされた場合、メニューを閉じる。
        if (!deleteMenu.contains(target) && !deleteButton.contains(target)) {
            deleteMenu.classList.remove("show");
        }
    });
}

// ===========================================
// ページ読み込み完了後初期化処理
// ===========================================
document.addEventListener("DOMContentLoaded", async () => {
    setToday();
    render(-1, -1, true);

    // イベントリスナー設定処理を呼び出す。
    setEventListeners();

    // 描画完了後に表示する。
    document.body.classList.remove("preload");

    // セーフエリアを再計算させる。
    requestAnimationFrame(() => refreshSafeArea());
});

// ===========================================
// ページ読み込み完了後初期化処理
// ===========================================
document.addEventListener("visibilitychange", () => {
    if (!document.hidden) {
        // セーフエリアを再計算させる。
        requestAnimationFrame(() => refreshSafeArea());
    }
});
