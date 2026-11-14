package com.lemonkiwi.estudiamos;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.os.Bundle;
import android.speech.tts.TextToSpeech;
import android.speech.tts.Voice;
import android.webkit.JavascriptInterface;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.util.HashMap;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/* Estudiamos for Android: the whole app ships inside the APK (assets/www) and runs offline in a web view.
   Pages are served from https://appassets.androidplatform.net so saving (IndexedDB) works like in a browser.
   Read-aloud goes through the phone's own text-to-speech (see the AndroidTTS bridge and the shim in index.html). */
public class MainActivity extends Activity {
    private static final String HOST = "appassets.androidplatform.net";
    private static final int PICK_FILE = 7;
    private WebView web;
    private TextToSpeech tts;
    private boolean ttsReady = false;
    private ValueCallback<Uri[]> fileCallback;

    @Override
    protected void onCreate(Bundle saved) {
        super.onCreate(saved);
        web = new WebView(this);
        setContentView(web);
        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setDatabaseEnabled(true);
        s.setMediaPlaybackRequiresUserGesture(false);
        s.setAllowFileAccess(false);
        s.setTextZoom(100);
        tts = new TextToSpeech(this, status -> ttsReady = status == TextToSpeech.SUCCESS);
        web.addJavascriptInterface(new Speech(), "AndroidTTS");
        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                return HOST.equals(u.getHost()) ? asset(u.getPath()) : null;
            }
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest req) {
                Uri u = req.getUrl();
                if (HOST.equals(u.getHost())) return false;
                try { startActivity(new Intent(Intent.ACTION_VIEW, u)); } catch (Exception ignored) { }
                return true;   // other websites (feedback, donations) open in the phone's browser
            }
        });
        web.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onShowFileChooser(WebView view, ValueCallback<Uri[]> callback, FileChooserParams params) {
                if (fileCallback != null) fileCallback.onReceiveValue(null);
                fileCallback = callback;
                try { startActivityForResult(params.createIntent(), PICK_FILE); }
                catch (Exception e) { fileCallback = null; return false; }
                return true;
            }
        });
        if (saved != null) web.restoreState(saved);
        else web.loadUrl("https://" + HOST + "/index.html");
    }

    private static final HashMap<String, String> TYPES = new HashMap<>();
    static {
        TYPES.put("html", "text/html"); TYPES.put("js", "text/javascript"); TYPES.put("css", "text/css"); TYPES.put("json", "application/json");
        TYPES.put("webmanifest", "application/manifest+json"); TYPES.put("png", "image/png"); TYPES.put("jpg", "image/jpeg"); TYPES.put("svg", "image/svg+xml");
        TYPES.put("ico", "image/x-icon"); TYPES.put("wasm", "application/wasm"); TYPES.put("txt", "text/plain"); TYPES.put("traineddata", "application/octet-stream");
        TYPES.put("gz", "application/octet-stream"); TYPES.put("mp3", "audio/mpeg"); TYPES.put("wav", "audio/wav");
    }

    private WebResourceResponse asset(String path) {
        if (path == null || path.equals("/") || path.isEmpty()) path = "/index.html";
        String name = path.substring(1);
        String ext = name.contains(".") ? name.substring(name.lastIndexOf('.') + 1).toLowerCase(Locale.ROOT) : "";
        String type = TYPES.containsKey(ext) ? TYPES.get(ext) : "application/octet-stream";
        HashMap<String, String> headers = new HashMap<>();
        headers.put("Cache-Control", "no-cache");
        try {
            InputStream in = getAssets().open("www/" + name);
            boolean text = type.startsWith("text/") || type.endsWith("json") || type.endsWith("javascript");
            return new WebResourceResponse(type, text ? "utf-8" : null, 200, "OK", headers, in);
        } catch (Exception e) {
            return new WebResourceResponse("text/plain", "utf-8", 404, "Not found", headers, new ByteArrayInputStream(new byte[0]));
        }
    }

    @Override
    protected void onActivityResult(int request, int result, Intent data) {
        if (request == PICK_FILE && fileCallback != null) {
            fileCallback.onReceiveValue(WebChromeClient.FileChooserParams.parseResult(result, data));
            fileCallback = null;
            return;
        }
        super.onActivityResult(request, result, data);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onSaveInstanceState(Bundle out) {
        super.onSaveInstanceState(out);
        if (web != null) web.saveState(out);
    }

    @Override
    protected void onDestroy() {
        if (tts != null) tts.shutdown();
        super.onDestroy();
    }

    /* window.AndroidTTS in the page */
    private class Speech {
        @JavascriptInterface
        public void speak(String text, String lang, float rate) {
            if (!ttsReady || text == null) return;
            if (lang != null && !lang.isEmpty()) tts.setLanguage(Locale.forLanguageTag(lang.replace('_', '-')));
            tts.setSpeechRate(Math.max(0.3f, Math.min(3f, rate)));
            tts.speak(text, TextToSpeech.QUEUE_FLUSH, null, "estudiamos");
        }
        @JavascriptInterface
        public void stop() { if (tts != null) tts.stop(); }
        @JavascriptInterface
        public String voices() {
            StringBuilder sb = new StringBuilder("[");
            Set<String> seen = new HashSet<>();
            try {
                if (ttsReady && tts.getVoices() != null) for (Voice v : tts.getVoices()) {
                    String tag = v.getLocale().toLanguageTag();
                    if (!seen.add(tag)) continue;
                    if (sb.length() > 1) sb.append(',');
                    sb.append("{\"name\":\"Phone voice (").append(tag).append(")\",\"lang\":\"").append(tag).append("\",\"voiceURI\":\"android:").append(tag).append("\",\"localService\":true}");
                }
            } catch (Exception ignored) { }
            return sb.append(']').toString();
        }
    }
}
