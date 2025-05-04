# My Wiki Chat App

This project is a web application that allows users to chat with the content of a specific web page. It consists of a backend API built with FastAPI and potentially a frontend (not described in the provided backend code).

## Backend (`backend/main.py`)

The backend is responsible for fetching web page content and answering user questions based on that content using a Large Language Model (LLM).

### Features

*   **Web Page Crawling:** Fetches the content of a given URL and converts it to Markdown format.
*   **Contextual Chat:** Answers user queries based *only* on the provided Markdown content of a specific web page.

### Technologies Used

*   **Framework:** FastAPI
*   **Web Crawling:** `crawl4ai`
*   **LLM Interaction:** Langchain
*   **LLM:** Ollama (`gemma3:4b` model)
*   **Embeddings:** Ollama (`mxbai-embed-large` model)
*   **Vector Store:** FAISS
*   **Web Server:** Uvicorn

### API Endpoints

*   **`POST /crawl`**:
    *   **Request Body:** `{"url": "string"}`
    *   **Response:** `{"markdown": "string"}` (The crawled content in Markdown)
    *   **Description:** Takes a URL, crawls the page, and returns its content as Markdown.
*   **`POST /chat`**:
    *   **Request Body:** `{"query": "string", "context": "string"}` (Where `context` is the Markdown from `/crawl`)
    *   **Response:** `{"answer": "string"}`
    *   **Description:** Takes a user query and the Markdown context of a page. Uses Retrieval-Augmented Generation (RAG) to generate an answer based *only* on the provided context.

### Running the Backend

(Instructions on how to set up and run the backend would typically go here, e.g., installing dependencies and running uvicorn).
