# Android build on Windows – AAPT2 / Universal C Runtime

If you see:

```text
AAPT2 aapt2-...-windows Daemon: Daemon startup failed
Please check if you installed the Windows Universal C Runtime.
```

do the following.

## 1. Install Visual C++ Redistributable (fixes “Universal C Runtime”)

1. Download **Visual C++ 2015–2022 Redistributable (x64)** from Microsoft:
   - https://aka.ms/vs/17/release/vc_redist.x64.exe  
   - Or: https://learn.microsoft.com/en-us/cpp/windows/latest-supported-vc-redist → choose **x64**.
2. Run the installer and complete the setup.
3. Restart the PC (recommended) or at least close all terminals and Android Studio, then try building again.

## 2. Clean Gradle and rebuild

After installing the runtime, clean and rebuild so AAPT2 runs with a fresh state:

```powershell
cd D:\Gitproject\TrackSpend\android
.\gradlew clean
cd ..
npm run android
```

Optional: clear Gradle transform caches if the error persists:

```powershell
# Optional: clear transform cache
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches\transforms-*" -ErrorAction SilentlyContinue
Remove-Item -Recurse -Force "$env:USERPROFILE\.gradle\caches\8.*\transforms" -ErrorAction SilentlyContinue
```

Then run `npm run android` again.

## 3. Make sure `adb` is in PATH (for device/emulator)

If you use a real device or emulator, ensure `adb` is available:

- Set **ANDROID_HOME** to your Android SDK path (e.g. `C:\Users\admin\AppData\Local\Android\Sdk`).
- Add **%ANDROID_HOME%\platform-tools** to your system **Path**.

Or run once per terminal session: `.\scripts\set-android-env.ps1`
