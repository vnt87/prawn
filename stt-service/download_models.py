import os
from huggingface_hub import hf_hub_download

def download_models():
    # Correct repository and filenames as found in the user's HF space
    # The INT8 version is used for efficiency
    repo_id = "hynt/k2-automatic-speech-recognition-demo"
    files = {
        "encoder": "encoder-epoch-20-avg-10.int8.onnx",
        "decoder": "decoder-epoch-20-avg-10.onnx",
        "joiner": "joiner-epoch-20-avg-10.int8.onnx",
        "tokens": "config.json"
    }
    
    os.makedirs("models", exist_ok=True)
    
    for key, filename in files.items():
        print(f"Downloading {filename}...")
        hf_hub_download(
            repo_id=repo_id,
            filename=filename,
            repo_type="space",
            local_dir="models",
            local_dir_use_symlinks=False
        )

if __name__ == "__main__":
    download_models()
