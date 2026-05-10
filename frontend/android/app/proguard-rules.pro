# Add project specific ProGuard rules here.

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep JavaScript interop
-keep class androidx.** { *; }
-keep interface androidx.** { *; }

# Keep React Native native modules
-keep class * extends com.facebook.react.ReactPackage { *; }
-keep class * implements com.facebook.react.bridge.NativeModule { *; }
-keep class * extends com.facebook.react.uimanager.ViewManager { *; }

# AsyncStorage
-keep class com.reactnativecommunity.asyncstorage.** { *; }

# OkHttp (used by fetch)
-dontwarn okhttp3.**
-dontwarn okio.**
-keep class okhttp3.** { *; }
-keep class okio.** { *; }

# Keep annotations
-keepattributes *Annotation*

# Keep source file names and line numbers for crash reporting
-keepattributes SourceFile,LineNumberTable
-renamesourcefileattribute SourceFile

# Remove logging in release
-assumenosideeffects class android.util.Log {
    public static boolean isLoggable(java.lang.String, int);
    public static int v(...);
    public static int d(...);
    public static int i(...);
}
