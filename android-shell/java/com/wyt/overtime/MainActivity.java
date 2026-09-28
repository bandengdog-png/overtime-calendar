package com.wyt.overtime;

import android.app.Activity;
import android.app.AlertDialog;
import android.content.ContentResolver;
import android.content.ContentValues;
import android.content.Context;
import android.content.DialogInterface;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.database.Cursor;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.Handler;
import android.os.Looper;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.provider.MediaStore;
import android.webkit.JavascriptInterface;
import android.webkit.JsResult;
import android.webkit.ValueCallback;
import android.webkit.WebChromeClient;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.Toast;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.File;
import java.io.FileOutputStream;
import java.io.OutputStream;

/**
 * 加班日历 —— 超薄 WebView 壳。
 * 界面与业务逻辑全部在 assets/app（纯 HTML/CSS/JS），此处只提供原生桥：
 * 震动反馈 / Toast / 导出备份文件 / 打开导出文件夹。
 * 不申请网络权限，数据只存在本机。
 */
public class MainActivity extends Activity {
    private WebView wv;
    private final Handler ui = new Handler(Looper.getMainLooper());
    private ValueCallback<Uri[]> filePathCallback;   // 网页 input[type=file] 选图用
    private static final int REQ_PICK_IMAGE = 2001;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        wv = new WebView(this);
        WebSettings s = wv.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);      // 打开 DOM Storage，localStorage 才能持久化
        s.setAllowFileAccess(true);
        wv.setWebViewClient(new WebViewClient());
        wv.setWebChromeClient(new WebChromeClient() {
            @Override
            public boolean onJsAlert(WebView v, String url, String message, JsResult r) {
                AlertDialog.Builder b = new AlertDialog.Builder(MainActivity.this);
                b.setTitle("提示").setMessage(message);
                b.setPositiveButton("确定", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface d, int w) { r.confirm(); }
                });
                b.setOnCancelListener(new DialogInterface.OnCancelListener() {
                    public void onCancel(DialogInterface d) { r.cancel(); }
                });
                b.show();
                return true;
            }
            @Override
            public boolean onJsConfirm(WebView v, String url, String message, JsResult r) {
                AlertDialog.Builder b = new AlertDialog.Builder(MainActivity.this);
                b.setTitle("请确认").setMessage(message);
                b.setPositiveButton("确定", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface d, int w) { r.confirm(); }
                });
                b.setNegativeButton("取消", new DialogInterface.OnClickListener() {
                    public void onClick(DialogInterface d, int w) { r.cancel(); }
                });
                b.setOnCancelListener(new DialogInterface.OnCancelListener() {
                    public void onCancel(DialogInterface d) { r.cancel(); }
                });
                b.show();
                return true;
            }
            // 网页里点击 input[type=file] 时，弹出系统「选择图片」
            @Override
            public boolean onShowFileChooser(WebView v, ValueCallback<Uri[]> cb, FileChooserParams params) {
                if (filePathCallback != null) filePathCallback.onReceiveValue(null);
                filePathCallback = cb;
                try {
                    Intent i = new Intent(Intent.ACTION_GET_CONTENT);
                    i.addCategory(Intent.CATEGORY_OPENABLE);
                    i.setType("image/*");
                    startActivityForResult(Intent.createChooser(i, "选择图片"), REQ_PICK_IMAGE);
                    return true;
                } catch (Exception e) {
                    filePathCallback = null;
                    Toast.makeText(MainActivity.this, "无法打开图片选择器", Toast.LENGTH_SHORT).show();
                    return false;
                }
            }
        });
        wv.addJavascriptInterface(new NativeBridge(), "OTNative");
        setContentView(wv);
        wv.loadUrl("file:///android_asset/app/index.html");
    }

    private void requestStoragePermission() {
        if (Build.VERSION.SDK_INT <= 28 && checkSelfPermission(android.Manifest.permission.WRITE_EXTERNAL_STORAGE) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{android.Manifest.permission.WRITE_EXTERNAL_STORAGE}, 1002);
        }
    }

    /* ================= 原生桥（对应前端 bind/bridge.js） ================= */
    private class NativeBridge {
        @JavascriptInterface
        public String getDeviceInfo() {
            return "{\"platform\":\"android\",\"sdk\":" + Build.VERSION.SDK_INT + ",\"app\":\"加班日历\",\"version\":\"1.0.0\"}";
        }

        @JavascriptInterface
        public void vibrate(final long ms) {
            ui.post(new Runnable() {
                public void run() {
                    Vibrator v = (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
                    if (v == null) return;
                    if (Build.VERSION.SDK_INT >= 26) {
                        v.vibrate(VibrationEffect.createOneShot(Math.max(ms, 20), VibrationEffect.DEFAULT_AMPLITUDE));
                    } else {
                        v.vibrate(Math.max(ms, 20));
                    }
                }
            });
        }

        @JavascriptInterface
        public void toast(final String msg) {
            ui.post(new Runnable() {
                public void run() {
                    Toast.makeText(MainActivity.this, msg == null ? "" : msg, Toast.LENGTH_SHORT).show();
                }
            });
        }

        /** 导出文件到 Download/王忆天/软件/<sub>，返回落地路径或失败原因 */
        @JavascriptInterface
        public String exportFile(final String name, final String content, final String sub) {
            requestStoragePermission();
            String subPath = (sub == null || sub.length() == 0) ? "" : ("/" + sub);
            try {
                byte[] data = (content == null ? "" : content).getBytes("UTF-8");
                if (Build.VERSION.SDK_INT >= 29) {
                    ContentValues cv = new ContentValues();
                    cv.put(MediaStore.MediaColumns.DISPLAY_NAME, sanitize(name));
                    cv.put(MediaStore.MediaColumns.MIME_TYPE, "text/plain");
                    cv.put(MediaStore.MediaColumns.RELATIVE_PATH, Environment.DIRECTORY_DOWNLOADS + "/王忆天/软件" + subPath);
                    ContentResolver cr = getContentResolver();
                    Uri uri = cr.insert(MediaStore.Downloads.EXTERNAL_CONTENT_URI, cv);
                    if (uri != null) {
                        OutputStream os = cr.openOutputStream(uri);
                        if (os != null) { os.write(data); os.close(); }
                        return "已导出到 Download/王忆天/软件" + subPath + "/" + name;
                    }
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "王忆天/软件" + subPath);
                    dir.mkdirs();
                    File f = new File(dir, sanitize(name));
                    FileOutputStream fos = new FileOutputStream(f);
                    fos.write(data);
                    fos.close();
                    return "已导出到 " + f.getAbsolutePath();
                }
            } catch (Exception e) {
                e.printStackTrace();
                return "导出失败：" + e.getMessage();
            }
            return "导出失败";
        }

        /** 列出导出目录里的文件名（JSON 数组字符串） */
        @JavascriptInterface
        public String listFiles(final String sub) {
            String subPath = (sub == null || sub.length() == 0) ? "" : ("/" + sub);
            try {
                JSONArray arr = new JSONArray();
                if (Build.VERSION.SDK_INT >= 29) {
                    String baseRel = Environment.DIRECTORY_DOWNLOADS + "/王忆天/软件" + subPath;
                    Cursor cur = getContentResolver().query(
                            MediaStore.Downloads.EXTERNAL_CONTENT_URI,
                            new String[]{MediaStore.MediaColumns.DISPLAY_NAME, MediaStore.MediaColumns.SIZE, MediaStore.MediaColumns.DATE_MODIFIED},
                            MediaStore.MediaColumns.RELATIVE_PATH + " LIKE ?",
                            new String[]{baseRel + "%"},
                            MediaStore.MediaColumns.DATE_MODIFIED + " DESC");
                    if (cur != null) {
                        while (cur.moveToNext()) {
                            JSONObject o = new JSONObject();
                            o.put("name", cur.getString(0));
                            o.put("size", cur.getLong(1));
                            o.put("time", cur.getLong(2) * 1000L);
                            arr.put(o);
                        }
                        cur.close();
                    }
                } else {
                    File dir = new File(Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS), "王忆天/软件" + subPath);
                    File[] fs = dir.listFiles();
                    if (fs != null) {
                        java.util.Arrays.sort(fs, new java.util.Comparator<File>() {
                            public int compare(File a, File b) { return Long.compare(b.lastModified(), a.lastModified()); }
                        });
                        for (File f : fs) {
                            if (!f.isFile()) continue;
                            JSONObject o = new JSONObject();
                            o.put("name", f.getName());
                            o.put("size", f.length());
                            o.put("time", f.lastModified());
                            arr.put(o);
                        }
                    }
                }
                return arr.toString();
            } catch (Exception e) {
                e.printStackTrace();
                return "[]";
            }
        }

        /** 打开导出文件夹 */
        @JavascriptInterface
        public void openFolder(final String sub) {
            final String subPath = (sub == null || sub.length() == 0) ? "" : ("/" + sub);
            ui.post(new Runnable() {
                public void run() {
                    try {
                        String docId = "primary:Download/王忆天/软件" + subPath;
                        Uri uri = android.provider.DocumentsContract.buildDocumentUri("com.android.externalstorage.documents", docId);
                        Intent i = new Intent(Intent.ACTION_VIEW);
                        i.setDataAndType(uri, "vnd.android.document/directory");
                        i.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION);
                        startActivity(i);
                        return;
                    } catch (Exception ignored) {
                    }
                    try {
                        Uri uri = Uri.parse("content://com.android.externalstorage.documents/root/primary");
                        startActivity(new Intent(Intent.ACTION_VIEW).setData(uri));
                        return;
                    } catch (Exception ignored) {
                    }
                    Toast.makeText(MainActivity.this, "文件夹：Download/王忆天/软件" + subPath, Toast.LENGTH_LONG).show();
                }
            });
        }

        private String sanitize(String n) {
            String s = (n == null) ? "backup.txt" : n.replaceAll("[\\\\/:*?\"<>|\\n\\r]", "_");
            return s.isEmpty() ? "backup.txt" : s;
        }
    }

    // 选图结果回传给网页
    @Override
    protected void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (requestCode == REQ_PICK_IMAGE) {
            if (filePathCallback == null) return;
            Uri[] result = null;
            if (resultCode == RESULT_OK && data != null && data.getData() != null) {
                result = new Uri[]{ data.getData() };
            }
            filePathCallback.onReceiveValue(result);   // 取消时回传 null，网页侧可正常收尾
            filePathCallback = null;
            return;
        }
        super.onActivityResult(requestCode, resultCode, data);
    }

    @Override
    public void onBackPressed() {
        if (wv != null && wv.canGoBack()) wv.goBack();
        else super.onBackPressed();
    }
}
