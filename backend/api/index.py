import os
import sys

# Serverless Environment Config
# Vercel FS is read-only except for /tmp
os.environ['HF_HOME'] = '/tmp/huggingface'
os.environ['TRANSFORMERS_CACHE'] = '/tmp/huggingface'

# Add the parent directory (backend) to sys.path so we can import main
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from main import app
