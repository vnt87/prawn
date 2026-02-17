import modal
import os
import shutil

# Define the image with system and python dependencies
image = (
    modal.Image.debian_slim()
    .apt_install("libsndfile1")
    .pip_install(
        "sherpa-onnx==1.10.45",
        "fastapi==0.115.11",
        "uvicorn[standard]==0.34.0",
        "python-multipart==0.0.9",
        "numpy==2.2.3",
        "soundfile==0.13.1",
        "huggingface_hub==0.29.1"
    )
)

app = modal.App("prawn-stt")

def download_model_files():
    # Import here to use the installed dependencies in the container
    import os
    from download_models import download_models
    
    # Ensure we are in the right directory or manage paths
    # Modal functions run in /root by default or similar.
    # We'll just run the function which writes to ./models
    print("Downloading models...")
    download_models()
    
    # Verify they exist
    if os.path.exists("models"):
        print("Models downloaded successfully to ./models")
        # List files
        print(os.listdir("models"))
    else:
        print("Error: models directory not found after download")

# Create a version of the image that includes the downloaded models
# This runs initialization at build time
image_with_models = (
    image
    .add_local_file("download_models.py", "/root/download_models.py", copy=True)
    .run_function(download_model_files)
    .add_local_file("main.py", "/root/main.py", copy=True)
)

@app.function(image=image_with_models)
@modal.asgi_app()
def web():
    from main import app as fastapi_app
    return fastapi_app
