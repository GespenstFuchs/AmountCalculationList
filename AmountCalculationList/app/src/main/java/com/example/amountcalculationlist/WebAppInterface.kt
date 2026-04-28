package com.example.amountcalculationlist

import android.app.Activity
import android.content.Context
import android.webkit.JavascriptInterface

/**
 * JavaScriptインターフェースクラス
 */
class WebAppInterface(private val context: Context) {
    /**
     * セーフエリア（インセット）情報取得処理
     * （Androidのステータスバーとナビゲーションバーの高さを取得し、
     * CSSピクセル（dp）に変換してJSON形式で返却する。）
     * @return JSON文字列
     */
    @JavascriptInterface
    fun getSafeAreaInsets(): String {
        if (context !is Activity) return "{}"

        val density = context.resources.displayMetrics.density

        val windowMetrics = context.windowManager.currentWindowMetrics
        val insets = windowMetrics.windowInsets.getInsetsIgnoringVisibility(
            android.view.WindowInsets.Type.systemBars() or android.view.WindowInsets.Type.displayCutout()
        )

        // CSSのピクセルはAndroidのdpに相当するため、物理ピクセルを密度（density）で割る。
        val top = insets.top / density
        val bottom = insets.bottom / density

        // JSON形式で返却する。
        return "{\"top\": $top, \"bottom\": $bottom}"
    }
}