package com.example.amountcalculationlist

import android.annotation.SuppressLint
import android.app.AlertDialog
import android.content.Context
import android.os.Bundle
import android.webkit.JavascriptInterface
import android.webkit.WebResourceRequest
import android.webkit.WebView
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import androidx.core.view.WindowCompat
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

/**
 * メインクラス
 */
class MainActivity : AppCompatActivity() {
    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // Edge-to-Edgeを解除する。
        // （enableEdgeToEdgeメソッドを呼ばなければ設定されないが、
        // 設定されると、アクションバー・ナビゲーションバーが透過されるため、念のため、解除する。）
        WindowCompat.setDecorFitsSystemWindows(window, true)

        // WebViewを生成し、画面に配置する。
        val webView = WebView(this)
        setContentView(webView)

        // WebViewAssetLoaderを生成する。
        val assetLoader = WebViewAssetLoader.Builder()
            .addPathHandler("/assets/", WebViewAssetLoader.AssetsPathHandler(this))
            .build()

        // webViewClientを設定する。
        webView.webViewClient = object : WebViewClientCompat() {
            override fun shouldInterceptRequest(
                view: WebView,
                request: WebResourceRequest
            ) = assetLoader.shouldInterceptRequest(request.url)
        }

        // WebViewの基本設定を行う。
        webView.settings.apply {
            javaScriptEnabled = true    // JavaScriptを有効にする。
            domStorageEnabled = true    // ローカルストレージを使用可能にする。
        }

        // JavaScriptから、ネイティブ機能を呼べるようにする。
        webView.addJavascriptInterface(JsBridge(this), "Android")

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }
}

/**
 * JavaScriptインターフェースクラス
 * （JavaScriptから呼ばれる処理を実装しているクラス）
 */
class JsBridge(private val context: Context) {
    /**
     * エラーメッセージ表示処理
     */
    @JavascriptInterface
    fun showError(message: String) {
        AlertDialog.Builder(context)
            .setTitle("エラー")
            .setMessage(message)
            .setPositiveButton("OK", null)
            .show()
    }

    /**
     * トースト表示処理
     */
    @JavascriptInterface
    fun showToast(message: String) {
        Toast.makeText(context, message, Toast.LENGTH_SHORT).show()
    }
}