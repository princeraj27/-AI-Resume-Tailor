from sentence_transformers import SentenceTransformer

class EmbeddingService:
    def __init__(self):
        # Load the model - this might take a moment on first run
        self.model = SentenceTransformer('all-MiniLM-L6-v2')

    def embed_text(self, text):
        # Generate embeddings
        embeddings = self.model.encode(text)
        return embeddings
