package com.example.amountcalculationlist

import android.annotation.SuppressLint
import android.os.Bundle
import android.webkit.WebResourceRequest
import android.webkit.WebView
import androidx.activity.enableEdgeToEdge
import androidx.appcompat.app.AppCompatActivity
import androidx.webkit.WebViewAssetLoader
import androidx.webkit.WebViewClientCompat

/**
 * メインクラス
 */
class MainActivity : AppCompatActivity() {
    /**
     * WebAppInterface
     */
    private lateinit var webAppInterface: WebAppInterface

    @SuppressLint("SetJavaScriptEnabled")
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)

        // エッジツーエッジの表示を有効にして、システムUI（ステータスバーなど）に重なって表示可能にする。
        enableEdgeToEdge()

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
        webAppInterface = WebAppInterface(this)
        webView.addJavascriptInterface(webAppInterface, "Android")

        webView.loadUrl("https://appassets.androidplatform.net/assets/index.html")
    }
}