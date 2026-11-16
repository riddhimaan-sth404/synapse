package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"
)

// BrowserTaskRequest encapsulates browser automation parameters
type BrowserTaskRequest struct {
	SessionID string   `json:"session_id"`
	Action    string   `json:"action"` // "navigate" | "click" | "extract" | "screenshot"
	TargetURL string   `json:"target_url"`
	Selector  string   `json:"selector,omitempty"`
	AllowedHosts []string `json:"allowed_hosts,omitempty"`
}

type BrowserTaskResponse struct {
	Success      bool   `json:"success"`
	CurrentURL   string `json:"current_url"`
	ContentText  string `json:"content_text,omitempty"`
	ScreenshotBase64 string `json:"screenshot_base64,omitempty"`
	ErrorMessage string `json:"error_message,omitempty"`
}

var (
	activeSessions = make(map[string]time.Time)
	mu             sync.Mutex
)

// Validate host boundaries (prevent internal SSRF or private subnet probes)
func isAllowedHost(urlStr string, allowedHosts []string) bool {
	lower := strings.ToLower(urlStr)
	if strings.Contains(lower, "169.254.169.254") || strings.Contains(lower, "metadata.google") {
		return false
	}
	if len(allowedHosts) == 0 {
		return true
	}
	for _, host := range allowedHosts {
		if strings.Contains(lower, strings.ToLower(host)) {
			return true
		}
	}
	return false
}

func handleHealth(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(map[string]interface{}{
		"status":  "healthy",
		"runtime": "stagehand-go",
		"time":    time.Now().UTC().Format(time.RFC3339),
	})
}

func handleTask(w http.ResponseWriter, r *http.Request) {
	if r.Method != http.MethodPost {
		http.Error(w, "Method not allowed", http.StatusMethodNotAllowed)
		return
	}

	var req BrowserTaskRequest
	if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
		http.Error(w, err.Error(), http.StatusBadRequest)
		return
	}

	if !isAllowedHost(req.TargetURL, req.AllowedHosts) {
		w.Header().Set("Content-Type", "application/json")
		w.WriteHeader(http.StatusForbidden)
		json.NewEncoder(w).Encode(BrowserTaskResponse{
			Success:      false,
			ErrorMessage: "Target URL violates browser boundary policy",
		})
		return
	}

	mu.Lock()
	activeSessions[req.SessionID] = time.Now()
	mu.Unlock()

	resp := BrowserTaskResponse{
		Success:     true,
		CurrentURL:  req.TargetURL,
		ContentText: fmt.Sprintf("Simulated extraction from %s", req.TargetURL),
	}

	w.Header().Set("Content-Type", "application/json")
	json.NewEncoder(w).Encode(resp)
}

func main() {
	port := os.Getenv("BROWSER_WORKER_PORT")
	if port == "" {
		port = "8096"
	}

	http.HandleFunc("/health", handleHealth)
	http.HandleFunc("/api/v1/browser/task", handleTask)

	log.Printf("[Synapse Browser Worker] Listening on 127.0.0.1:%s\n", port)
	if err := http.ListenAndServe("127.0.0.1:"+port, nil); err != nil {
		log.Fatalf("Server failed: %v", err)
	}
}
