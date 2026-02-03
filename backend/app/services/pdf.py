from pypdf import PdfReader
from fastapi import UploadFile
import io

class PDFService:
    @staticmethod
    async def extract_text(file: UploadFile) -> str:
        content = await file.read()
        reader = PdfReader(io.BytesIO(content))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text
