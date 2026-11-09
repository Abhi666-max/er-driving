import os
import zipfile
import json
from typing import Dict, Any, List

class APKInspector:
    """
    Deconstructs Android APK packages to extract asset manifests, 
    detect runtime engines (Unity, Godot, React Native, Flutter, Native),
    and recover high-level game logic for code synthesis.
    """

    @staticmethod
    def inspect(apk_path: str) -> Dict[str, Any]:
        if not os.path.exists(apk_path):
            return {"error": f"File not found: {apk_path}"}

        findings: Dict[str, Any] = {
            "file": apk_path,
            "engine": "Unknown",
            "is_unity": False,
            "unity_backend": None,
            "assets_found": {
                "audio": [],
                "images": [],
                "models": [],
                "data_files": []
            },
            "libraries": [],
            "extracted_meta": {}
        }

        try:
            with zipfile.ZipFile(apk_path, 'r') as z:
                file_list = z.namelist()

                # 1. Engine Detection
                is_unity_mono = any("Assembly-CSharp.dll" in f for f in file_list)
                is_unity_il2cpp = any("libil2cpp.so" in f for f in file_list)

                if is_unity_mono:
                    findings["engine"] = "Unity 3D"
                    findings["is_unity"] = True
                    findings["unity_backend"] = "Mono (.NET Assembly)"
                elif is_unity_il2cpp:
                    findings["engine"] = "Unity 3D"
                    findings["is_unity"] = True
                    findings["unity_backend"] = "IL2CPP (Native AOT)"
                elif any("libflutter.so" in f for f in file_list):
                    findings["engine"] = "Flutter"
                elif any("index.android.bundle" in f for f in file_list):
                    findings["engine"] = "React Native"
                elif any("libgodot_android.so" in f for f in file_list):
                    findings["engine"] = "Godot Engine"
                else:
                    findings["engine"] = "Native Android (Java/Kotlin)"

                # 2. Asset Cataloging
                for f in file_list:
                    lower = f.lower()
                    if lower.endswith(('.ogg', '.mp3', '.wav', '.aac')):
                        findings["assets_found"]["audio"].append(f)
                    elif lower.endswith(('.png', '.jpg', '.jpeg', '.webp', '.tga')):
                        findings["assets_found"]["images"].append(f)
                    elif lower.endswith(('.obj', '.fbx', '.gltf', '.glb')):
                        findings["assets_found"]["models"].append(f)
                    elif lower.startswith("lib/"):
                        findings["libraries"].append(f)
                    elif "assets/bin/data" in lower:
                        findings["assets_found"]["data_files"].append(f)

                findings["total_files_in_package"] = len(file_list)

        except Exception as e:
            findings["error"] = str(e)

        return findings

