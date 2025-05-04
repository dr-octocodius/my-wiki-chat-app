from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from crawl4ai import AsyncWebCrawler
from langchain_ollama import ChatOllama, OllamaEmbeddings
from langchain_community.vectorstores import FAISS
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain.chains import RetrievalQA
from langchain_core.prompts import PromptTemplate
import asyncio
import hashlib

app = FastAPI()

# Initialize Ollama LLM (Gemma3:4b) and embeddings (mxbai-embed-large)
llm = ChatOllama(model="gemma3:4b", temperature=0)
embeddings = OllamaEmbeddings(model="mxbai-embed-large")

# Text splitter for chunking
text_splitter = RecursiveCharacterTextSplitter(chunk_size=1000, chunk_overlap=200)

# Prompt template for RAG
prompt_template = """Use the following pieces of context to answer the question. If you don't know the answer, say so.

Context: {context}

Question: {question}

Answer: """
prompt = PromptTemplate(
    template=prompt_template, input_variables=["context", "question"]
)

# In-memory cache for vector stores
vector_store_cache = {}


class CrawlRequest(BaseModel):
    url: str


class ChatRequest(BaseModel):
    query: str
    context: str  # Crawled Markdown content


@app.post("/crawl")
async def crawl_page(request: CrawlRequest):
    try:
        async with AsyncWebCrawler() as crawler:
            result = await crawler.arun(url=request.url, output_format="markdown")
            if not result.success:
                raise HTTPException(status_code=500, detail="Crawling failed")
            return {"markdown": result.markdown}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/chat")
async def chat_with_page(request: ChatRequest):
    try:
        # Create a hash of the context to use as a cache key
        context_hash = hashlib.sha256(request.context.encode()).hexdigest()

        # Check if vector store is in cache
        if context_hash in vector_store_cache:
            vector_store = vector_store_cache[context_hash]
        else:
            # Cache miss: Create and cache the vector store
            documents = text_splitter.split_text(request.context)
            vector_store = FAISS.from_texts(documents, embeddings)
            vector_store_cache[context_hash] = vector_store

        # Create retrieval chain using the (potentially cached) vector store
        qa_chain = RetrievalQA.from_chain_type(
            llm=llm,
            chain_type="stuff",
            retriever=vector_store.as_retriever(),
            chain_type_kwargs={"prompt": prompt},
        )

        # Get response
        response = qa_chain.invoke({"query": request.query})
        return {"answer": response["result"]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(app, host="0.0.0.0", port=8000)
