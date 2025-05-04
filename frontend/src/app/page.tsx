"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

// Define the expected API response structures
interface CrawlResponse {
  markdown: string;
}

interface ChatResponse {
  answer: string;
}

interface ErrorResponse {
  detail: string;
}

export default function Home() {
  const [url, setUrl] = useState<string>("");
  const [markdownContent, setMarkdownContent] = useState<string>("");
  const [chatQuery, setChatQuery] = useState<string>("");
  const [chatAnswer, setChatAnswer] = useState<string>("");
  const [isLoadingCrawl, setIsLoadingCrawl] = useState<boolean>(false);
  const [isLoadingChat, setIsLoadingChat] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const backendUrl =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000"; // Use env var or default

  const handleCrawl = async () => {
    setIsLoadingCrawl(true);
    setError(null);
    setMarkdownContent(""); // Clear previous content
    setChatAnswer(""); // Clear previous answer
    try {
      const response = await fetch(`${backendUrl}/crawl`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ url }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data: CrawlResponse = await response.json();
      setMarkdownContent(data.markdown);
    } catch (e: any) {
      setError(e.message || "Failed to crawl URL.");
      console.error(e);
    } finally {
      setIsLoadingCrawl(false);
    }
  };

  const handleChat = async () => {
    if (!markdownContent) {
      setError("Please crawl a URL first to provide context.");
      return;
    }
    setIsLoadingChat(true);
    setError(null);
    setChatAnswer("");
    try {
      const response = await fetch(`${backendUrl}/chat`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: chatQuery, context: markdownContent }),
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(
          errorData.detail || `HTTP error! status: ${response.status}`
        );
      }

      const data: ChatResponse = await response.json();
      setChatAnswer(data.answer);
    } catch (e: any) {
      setError(e.message || "Failed to get chat response.");
      console.error(e);
    } finally {
      setIsLoadingChat(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-start p-8 md:p-12 lg:p-24 space-y-6">
      <h1 className="text-3xl font-bold mb-6">Wiki Chat</h1>

      {/* Crawl Section */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>1. Crawl a Web Page</CardTitle>
          <CardDescription>
            Enter the URL of the page you want to chat with.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="url">URL</Label>
            <Input
              id="url"
              type="url"
              placeholder="https://en.wikipedia.org/wiki/..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              disabled={isLoadingCrawl}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={handleCrawl} disabled={isLoadingCrawl || !url}>
            {isLoadingCrawl ? "Crawling..." : "Crawl Page"}
          </Button>
        </CardFooter>
      </Card>

      {/* Display Error */}
      {error && (
        <Card className="w-full max-w-2xl border-destructive">
          <CardHeader>
            <CardTitle className="text-destructive">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-destructive-foreground">{error}</p>
          </CardContent>
        </Card>
      )}

      {/* Crawled Content Display */}
      {markdownContent && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Crawled Content (Markdown)</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              readOnly
              value={markdownContent}
              className="h-48 resize-none"
              placeholder="Crawled content will appear here..."
            />
          </CardContent>
        </Card>
      )}

      {/* Chat Section */}
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <CardTitle>2. Chat with the Content</CardTitle>
          <CardDescription>
            Ask a question based on the crawled content above.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2">
          <div className="space-y-1">
            <Label htmlFor="chatQuery">Your Question</Label>
            <Input
              id="chatQuery"
              placeholder="What is the main topic?"
              value={chatQuery}
              onChange={(e) => setChatQuery(e.target.value)}
              disabled={!markdownContent || isLoadingChat}
            />
          </div>
        </CardContent>
        <CardFooter>
          <Button
            onClick={handleChat}
            disabled={!markdownContent || isLoadingChat || !chatQuery}
          >
            {isLoadingChat ? "Thinking..." : "Ask Question"}
          </Button>
        </CardFooter>
      </Card>

      {/* Chat Answer Display */}
      {chatAnswer && (
        <Card className="w-full max-w-2xl">
          <CardHeader>
            <CardTitle>Answer</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm">{chatAnswer}</p>
          </CardContent>
        </Card>
      )}
    </main>
  );
}
