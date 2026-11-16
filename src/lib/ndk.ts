import JSZip from "jszip";

/** Builds a ready-to-compile NDK project. Pushing it to GitHub produces real .so files via Actions. */
export async function makeNdkProject(libName: string, cpp: string, abis: string[]) {
  const zip = new JSZip();
  const name = libName.replace(/^lib/, "").replace(/\.so$/, "").replace(/[^\w]/g, "_") || "native";
  zip.file("src/main.cpp", cpp);
  zip.file(
    "CMakeLists.txt",
    `cmake_minimum_required(VERSION 3.18)
project(${name} CXX)
set(CMAKE_CXX_STANDARD 17)
add_library(${name} SHARED src/main.cpp)
find_library(log-lib log)
target_link_libraries(${name} \${log-lib} android)
`,
  );
  zip.file(
    "build.sh",
    `#!/usr/bin/env bash
# Usage: ANDROID_NDK_HOME=/path/to/ndk ./build.sh
set -e
for ABI in ${abis.join(" ")}; do
  echo "[mestro_ac] building lib${name}.so for $ABI"
  cmake -B build/$ABI -DCMAKE_TOOLCHAIN_FILE=$ANDROID_NDK_HOME/build/cmake/android.toolchain.cmake \\
    -DANDROID_ABI=$ABI -DANDROID_PLATFORM=android-24 -DCMAKE_BUILD_TYPE=Release
  cmake --build build/$ABI
  mkdir -p out/lib/$ABI && cp build/$ABI/lib${name}.so out/lib/$ABI/
done
echo "[mestro_ac] done -> out/lib"
`,
    { unixPermissions: "755" },
  );
  zip.file(
    ".github/workflows/build-so.yml",
    `name: Build .so
on: [push, workflow_dispatch]
jobs:
  build:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: nttld/setup-ndk@v1
        id: ndk
        with: { ndk-version: r26d }
      - run: chmod +x build.sh && ./build.sh
        env: { ANDROID_NDK_HOME: \${{ steps.ndk.outputs.ndk-path }} }
      - uses: actions/upload-artifact@v4
        with: { name: lib${name}-so, path: out/lib }
`,
  );
  zip.file(
    "README.md",
    `# lib${name}.so — made with mestro_ac

Two ways to get a working .so:

1. **GitHub (no install):** create a repo, upload these files, open the Actions tab -> "Build .so" ->
   download the \`lib${name}-so\` artifact. It contains lib/<abi>/lib${name}.so.
2. **Your PC:** install the Android NDK and run \`ANDROID_NDK_HOME=/path/to/ndk ./build.sh\`.

Then drop the .so into the APK with the Libs section of mestro_ac and load it with
\`System.loadLibrary("${name}")\` (or inject via smali / Frida).
`,
  );
  return { blob: await zip.generateAsync({ type: "blob" }), name };
}

export const CPP_TEMPLATE = `#include <jni.h>
#include <android/log.h>
#include <pthread.h>
#include <unistd.h>

#define TAG "mestro_ac"
#define LOGI(...) __android_log_print(ANDROID_LOG_INFO, TAG, __VA_ARGS__)

static void* main_thread(void*) {
    LOGI("native lib loaded, waiting for game...");
    sleep(3);
    // TODO: hook functions here (e.g. with Dobby / And64InlineHook)
    LOGI("hooks ready");
    return nullptr;
}

extern "C" JNIEXPORT jint JNICALL JNI_OnLoad(JavaVM* vm, void*) {
    pthread_t t;
    pthread_create(&t, nullptr, main_thread, nullptr);
    return JNI_VERSION_1_6;
}
`;
