import json
import sys
import os

# Đảm bảo import được app từ main.py
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import app

def export_openapi():
    # Lấy lược đồ OpenAPI từ ứng dụng FastAPI
    openapi_schema = app.openapi()
    
    # Ghi ra file openapi.json
    output_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "openapi.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(openapi_schema, f, indent=2, ensure_ascii=False)
    
    print(f"✅ Đã xuất thành công file openapi.json tại: {output_path}")

if __name__ == "__main__":
    export_openapi()
