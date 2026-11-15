package com.lemonkiwi.estudiamos;

import android.Manifest;
import android.app.Activity;
import android.content.pm.PackageManager;
import android.speech.RecognitionListener;
import android.speech.RecognizerIntent;
import android.speech.SpeechRecognizer;
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
import java.util.ArrayList;
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
    private static final int MIC_PERMISSION = 8;
    private SpeechRecognizer recognizer;
    private String pendingLang = null;

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
        if (SpeechRecognizer.isRecognitionAvailable(this)) web.addJavascriptInterface(new Listen(), "AndroidSpeech");
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

    /* the Say it! game: listen with the phone's own speech recognizer, send what it heard to the page */
    private void sendToPage(String fn, String arg) { runOnUiThread(() -> web.evaluateJavascript("window." + fn + " && window." + fn + "(" + arg + ")", null)); }
    private static String json(String t) {
        StringBuilder b = new StringBuilder("\"");
        for (char c : t.toCharArray()) { if (c == '"' || c == '\\') b.append('\\').append(c); else if (c < 32) b.append(String.format("\\u%04x", (int) c)); else b.append(c); }
        return b.append('"').toString();
    }
    private long lastLevel = 0;
    private static String jsonList(Bundle results) {
        ArrayList<String> list = results == null ? null : results.getStringArrayList(SpeechRecognizer.RESULTS_RECOGNITION);
        StringBuilder b = new StringBuilder("[");
        if (list != null) for (int i = 0; i < list.size(); i++) { if (i > 0) b.append(','); b.append(json(list.get(i))); }
        return b.append(']').toString();
    }
    private void startListening(String lang) {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            pendingLang = lang; requestPermissions(new String[] { Manifest.permission.RECORD_AUDIO }, MIC_PERMISSION); return;
        }
        if (recognizer == null) {
            recognizer = SpeechRecognizer.createSpeechRecognizer(this);
            recognizer.setRecognitionListener(new RecognitionListener() {
                public void onResults(Bundle results) { sendToPage("__androidSpeechResult", jsonList(results)); }
                public void onPartialResults(Bundle partial) { sendToPage("__androidSpeechPartial", jsonList(partial)); }
                public void onError(int error) { sendToPage("__androidSpeechError", String.valueOf(error)); }
                public void onRmsChanged(float db) {   // the sound level for the meter, about 12 times a second
                    long now = System.currentTimeMillis();
                    if (now - lastLevel > 80) { lastLevel = now; sendToPage("__androidSpeechLevel", String.valueOf(db)); }
                }
                public void onReadyForSpeech(Bundle p) { } public void onBeginningOfSpeech() { }
                public void onBufferReceived(byte[] b) { } public void onEndOfSpeech() { } public void onEvent(int t, Bundle p) { }
            });
        }
        Intent i = new Intent(RecognizerIntent.ACTION_RECOGNIZE_SPEECH);
        i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_MODEL, RecognizerIntent.LANGUAGE_MODEL_FREE_FORM);
        i.putExtra(RecognizerIntent.EXTRA_MAX_RESULTS, 5);
        i.putExtra(RecognizerIntent.EXTRA_PARTIAL_RESULTS, true);
        // wait through short pauses instead of stopping at the first breath (some phones ignore these)
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS, 2500L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS, 2000L);
        i.putExtra(RecognizerIntent.EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS, 1500L);
        if (lang != null && !lang.isEmpty()) { i.putExtra(RecognizerIntent.EXTRA_LANGUAGE, lang); i.putExtra(RecognizerIntent.EXTRA_LANGUAGE_PREFERENCE, lang); }
        recognizer.startListening(i);
    }
    @Override
    public void onRequestPermissionsResult(int request, String[] perms, int[] grants) {
        if (request != MIC_PERMISSION) { super.onRequestPermissionsResult(request, perms, grants); return; }
        String lang = pendingLang; pendingLang = null;
        if (grants.length > 0 && grants[0] == PackageManager.PERMISSION_GRANTED) startListening(lang);
        else sendToPage("__androidSpeechError", "9");
    }
    private class Listen {
        @JavascriptInterface
        public void start(String lang) { runOnUiThread(() -> startListening(lang)); }
        @JavascriptInterface
        public void stop() { runOnUiThread(() -> { if (recognizer != null) recognizer.stopListening(); }); }
    }

    @Override
    protected void onDestroy() {
        if (recognizer != null) recognizer.destroy();
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
