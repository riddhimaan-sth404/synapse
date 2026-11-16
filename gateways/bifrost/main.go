package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"time"
)

// CompletionRequest represents a unified chat completion payload
type CompletionRequest struct {
	Model       string    `json:"model"`
	Messages    []Message `json:"messages"`
	Temperature float32   `json:"temperature,omitempty"`
	MaxTokens   int       `json:"max_tokens,omitempty"`
	Stream      bool      `json:"stream,omitempty"`
}

type Message struct {
	Role    string `json:"role"`
	Content string `json:"content"`
}

type CompletionResponse struct {
	ID        string   `json:"id"`
	Model     string   `json:"model"`
	Provider  string   `json:"provider"`
	Choices   []Choice `json:"choices"`
	Usage     Usage    `json:"usage"`
	LatencyMs int64    `json:"latency_ms"`
}

type Choice struct {
	Index   int     `json:"index"`
	Message Message `json:"message"`
}

type Usage struct {
	PromptTokens     int `json:"prompt_tokens"`
	CompletionTokens int `json:"completion_tokens"`
	TotalTokens      int `json:"total_tokens"`
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":   "healthy",
		"service":  "bifrost-gateway",
		"routing":  "unified",
		"providers": []string{"anthropic", "openai", "gemini", "openrouter", "local-llamacpp"},
	})
}

func handleCompletions(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	start := time.Now()
	var req CompletionRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	provider := "cloud"
	if req.Model == "local" || req.Model == "llama.cpp" {
		provider = "local-llamacpp"
	}

	resp := CompletionResponse{
		ID:       fmt.Sprintf("bifrost-%d", time.Now().UnixNano()),
		Model:    req.Model,
		Provider: provider,
		Choices: []Choice{
			{
				Index: 0,
				Message: Message{
					Role:    "assistant",
					Content: fmt.Sprintf("[Bifrost routed through %s] Processed completion successfully.", provider),
				},
			},
		},
		Usage: Usage{
			PromptTokens:     35,
			CompletionTokens: 15,
			TotalTokens:      50,
		},
		LatencyMs: time.Since(start).Milliseconds(),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	port := os.Getenv("BIFROST_PORT")
	if port == "" {
		port = "8098"
	}

	http.HandleFunc("/health", handleHealth)
	http.HandleFunc("/v1/chat/completions", handleCompletions)

	log.Printf("[Synapse Bifrost Gateway] Listening on 127.0.0.1:%s\n", port)
	if err := http.ListenAndServe("127.0.0.1:"+port, nil); err != nil {
		log.Fatalf("Server error: %v", err)
	}
}
